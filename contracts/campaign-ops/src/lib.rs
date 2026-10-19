#![no_std]
//! Campaign operations: C-034 arbiter/dispute role, C-035 TTL management, C-036 test suite.
//! (C-037, the rewards/badges specification, is in `docs/onchain-rewards-badges-spec.md`.)
//!
//! The arbiter can freeze a campaign and resolve it to a refund or a release. It never
//! receives funds: resolution only records an outcome that the settlement contract executes
//! (`Resolution::Refund` makes every contribution refundable, `Resolution::Release` allows the
//! creator to be paid). Every arbiter action needs the arbiter's auth and emits an event.
//!
//! TTL policy (C-035): campaign entries and per-contributor entries are bumped to `TTL_EXTEND`
//! ledgers whenever they are written or read through this contract. Long-running campaigns can
//! be kept alive by anyone calling `extend_ttl`, which is public on purpose because it only
//! pays for storage. Entries that are not touched for `TTL_THRESHOLD`/`TTL_EXTEND` ledgers
//! (~180 days) would expire and lock refunds, so the keeper job (C-123) must call it.

use soroban_sdk::{
    contract, contracterror, contractimpl, contracttype, symbol_short, Address, Env,
};

const TTL_THRESHOLD: u32 = 1_555_200; // ~90 days
const TTL_EXTEND: u32 = 3_110_400; // ~180 days

#[contracttype]
enum Key {
    Campaign(u32),
    Contribution(u32, Address),
}

#[contracttype]
#[derive(Clone, Copy, PartialEq, Eq, Debug)]
pub enum Resolution {
    None,
    Refund,
    Release,
}

#[contracttype]
#[derive(Clone)]
pub struct Ops {
    pub creator: Address,
    pub arbiter: Address,
    pub frozen: bool,
    pub resolution: Resolution,
}

#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq)]
#[repr(u32)]
pub enum Error {
    NotFound = 1,
    AlreadyResolved = 2,
    NotFrozen = 3,
    ArbiterIsBeneficiary = 4,
    AlreadyRegistered = 5,
}

#[contract]
pub struct CampaignOps;

#[contractimpl]
impl CampaignOps {
    pub fn register(env: Env, id: u32, creator: Address, arbiter: Address) -> Result<(), Error> {
        creator.require_auth();
        if env.storage().persistent().has(&Key::Campaign(id)) {
            return Err(Error::AlreadyRegistered);
        }
        if arbiter == creator {
            return Err(Error::ArbiterIsBeneficiary);
        }
        Self::save(&env, id, &Ops { creator, arbiter, frozen: false, resolution: Resolution::None });
        Ok(())
    }

    pub fn freeze(env: Env, id: u32) -> Result<(), Error> {
        let mut o = Self::load(&env, id)?;
        o.arbiter.require_auth();
        if o.resolution != Resolution::None {
            return Err(Error::AlreadyResolved);
        }
        o.frozen = true;
        Self::save(&env, id, &o);
        env.events().publish((symbol_short!("freeze"), id), o.arbiter);
        Ok(())
    }

    pub fn resolve(env: Env, id: u32, resolution: Resolution) -> Result<(), Error> {
        let mut o = Self::load(&env, id)?;
        o.arbiter.require_auth();
        if !o.frozen {
            return Err(Error::NotFrozen);
        }
        if o.resolution != Resolution::None {
            return Err(Error::AlreadyResolved);
        }
        o.resolution = resolution;
        o.frozen = false;
        Self::save(&env, id, &o);
        env.events().publish((symbol_short!("resolve"), id), (o.arbiter, resolution));
        Ok(())
    }

    pub fn get_ops(env: Env, id: u32) -> Result<Ops, Error> {
        Self::load(&env, id)
    }

    /// Public on purpose: it only pays for storage.
    pub fn extend_ttl(env: Env, id: u32, contributor: Option<Address>) -> Result<(), Error> {
        Self::load(&env, id)?;
        if let Some(c) = contributor {
            let key = Key::Contribution(id, c);
            if env.storage().persistent().has(&key) {
                env.storage().persistent().extend_ttl(&key, TTL_THRESHOLD, TTL_EXTEND);
            }
        }
        Ok(())
    }
}

impl CampaignOps {
    fn load(env: &Env, id: u32) -> Result<Ops, Error> {
        let key = Key::Campaign(id);
        let ops: Ops = env.storage().persistent().get(&key).ok_or(Error::NotFound)?;
        env.storage().persistent().extend_ttl(&key, TTL_THRESHOLD, TTL_EXTEND);
        Ok(ops)
    }

    fn save(env: &Env, id: u32, ops: &Ops) {
        let key = Key::Campaign(id);
        env.storage().persistent().set(&key, ops);
        env.storage().persistent().extend_ttl(&key, TTL_THRESHOLD, TTL_EXTEND);
    }
}

#[cfg(test)]
mod test {
    use super::*;
    use soroban_sdk::testutils::{Address as _, Ledger as _};

    fn setup() -> (Env, CampaignOpsClient<'static>, Address, Address) {
        let env = Env::default();
        env.mock_all_auths();
        let client = CampaignOpsClient::new(&env, &env.register(CampaignOps, ()));
        let (creator, arbiter) = (Address::generate(&env), Address::generate(&env));
        client.register(&1, &creator, &arbiter);
        (env, client, creator, arbiter)
    }

    #[test]
    fn freeze_then_resolve_to_refund() {
        let (_e, client, _c, _a) = setup();
        client.freeze(&1);
        client.resolve(&1, &Resolution::Refund);
        let ops = client.get_ops(&1);
        assert_eq!(ops.resolution, Resolution::Refund);
        assert!(!ops.frozen);
    }

    #[test]
    fn freeze_then_resolve_to_release() {
        let (_e, client, _c, _a) = setup();
        client.freeze(&1);
        client.resolve(&1, &Resolution::Release);
        assert_eq!(client.get_ops(&1).resolution, Resolution::Release);
    }

    #[test]
    fn resolving_requires_a_freeze_and_happens_once() {
        let (_e, client, _c, _a) = setup();
        assert!(client.try_resolve(&1, &Resolution::Refund).is_err());
        client.freeze(&1);
        client.resolve(&1, &Resolution::Refund);
        assert!(client.try_resolve(&1, &Resolution::Release).is_err());
        assert!(client.try_freeze(&1).is_err());
    }

    #[test]
    fn arbiter_cannot_be_the_creator() {
        let (env, client, creator, _a) = setup();
        assert!(client.try_register(&2, &creator, &creator).is_err());
        let _ = env;
    }

    #[test]
    fn entries_survive_past_the_default_ttl_when_bumped() {
        let (env, client, _c, _a) = setup();
        for _ in 0..4 {
            env.ledger().with_mut(|l| l.sequence_number += TTL_THRESHOLD);
            client.get_ops(&1); // reads bump the TTL
        }
        assert!(client.try_get_ops(&1).is_ok());
    }
}
