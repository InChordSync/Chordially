#![no_std]
//! Tip Jar policy: C-014 token allowlist, C-015 per-creator stats, C-016 idempotency,
//! C-017 min/max bounds. The Tip Jar calls `check_and_record` from `tip` after authorising
//! itself; all state lives here so the tip path stays small.
//!
//! Storage cost (C-015): one persistent `Stats` entry per (creator, token) holding an i128 and a
//! u32 (~ 48 bytes of value plus the key). Entries are bumped to `STATS_TTL` on every write; if a
//! creator is inactive past the TTL the entry expires and counters restart from zero, which is
//! acceptable for dashboards but means badge eligibility must be claimed before expiry.
//! Replay window (C-016): ids live in temporary storage for `TIP_ID_TTL` ledgers (~1 day at 5s).

use soroban_sdk::{
    contract, contracterror, contractimpl, contracttype, symbol_short, Address, BytesN, Env, Vec,
};

const STATS_TTL: u32 = 3_110_400; // ~180 days of ledgers
const TIP_ID_TTL: u32 = 17_280; // ~1 day

#[contracttype]
enum Key {
    Admin,
    Jar,
    Allowed,
    Bounds(Address),
    Stats(Address, Address),
    TipId(BytesN<32>),
}

#[contracttype]
#[derive(Clone)]
pub struct Stats {
    pub total_received: i128,
    pub tip_count: u32,
}

#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq)]
#[repr(u32)]
pub enum Error {
    AlreadyInitialized = 1,
    NotInitialized = 2,
    TokenNotAllowed = 3,
    BelowMin = 4,
    AboveMax = 5,
    AlreadyProcessed = 6,
    InvalidBounds = 7,
}

#[contract]
pub struct TipJarPolicy;

#[contractimpl]
impl TipJarPolicy {
    pub fn init(env: Env, admin: Address, jar: Address) -> Result<(), Error> {
        if env.storage().instance().has(&Key::Admin) {
            return Err(Error::AlreadyInitialized);
        }
        env.storage().instance().set(&Key::Admin, &admin);
        env.storage().instance().set(&Key::Jar, &jar);
        env.storage().instance().set(&Key::Allowed, &Vec::<Address>::new(&env));
        Ok(())
    }

    pub fn add_token(env: Env, token: Address) -> Result<(), Error> {
        Self::require_admin(&env)?;
        let mut list = Self::get_allowed_tokens(env.clone());
        if !list.contains(&token) {
            list.push_back(token.clone());
            env.storage().instance().set(&Key::Allowed, &list);
        }
        env.events().publish((symbol_short!("tok_add"),), token);
        Ok(())
    }

    pub fn remove_token(env: Env, token: Address) -> Result<(), Error> {
        Self::require_admin(&env)?;
        let mut list = Self::get_allowed_tokens(env.clone());
        if let Some(i) = list.first_index_of(&token) {
            list.remove(i);
            env.storage().instance().set(&Key::Allowed, &list);
        }
        env.events().publish((symbol_short!("tok_rem"),), token);
        Ok(())
    }

    pub fn get_allowed_tokens(env: Env) -> Vec<Address> {
        env.storage().instance().get(&Key::Allowed).unwrap_or(Vec::new(&env))
    }

    /// Bounds are in token base units. `max == 0` means "no upper bound".
    pub fn set_bounds(env: Env, token: Address, min: i128, max: i128) -> Result<(), Error> {
        Self::require_admin(&env)?;
        if min < 0 || max < 0 || (max != 0 && max < min) {
            return Err(Error::InvalidBounds);
        }
        env.storage().persistent().set(&Key::Bounds(token), &(min, max));
        Ok(())
    }

    /// Called by the Tip Jar for every tip. Validates, then records the tip atomically.
    pub fn check_and_record(
        env: Env,
        creator: Address,
        token: Address,
        amount: i128,
        tip_id: Option<BytesN<32>>,
    ) -> Result<(), Error> {
        let jar: Address = env.storage().instance().get(&Key::Jar).ok_or(Error::NotInitialized)?;
        jar.require_auth();

        if !Self::get_allowed_tokens(env.clone()).contains(&token) {
            return Err(Error::TokenNotAllowed);
        }
        let (min, max): (i128, i128) = env.storage().persistent().get(&Key::Bounds(token.clone())).unwrap_or((1, 0));
        if amount < min {
            return Err(Error::BelowMin);
        }
        if max != 0 && amount > max {
            return Err(Error::AboveMax);
        }

        if let Some(id) = tip_id {
            let key = Key::TipId(id);
            if env.storage().temporary().has(&key) {
                return Err(Error::AlreadyProcessed);
            }
            env.storage().temporary().set(&key, &true);
            env.storage().temporary().extend_ttl(&key, TIP_ID_TTL, TIP_ID_TTL);
        }

        let key = Key::Stats(creator, token);
        let mut stats = env
            .storage()
            .persistent()
            .get(&key)
            .unwrap_or(Stats { total_received: 0, tip_count: 0 });
        stats.total_received += amount;
        stats.tip_count += 1;
        env.storage().persistent().set(&key, &stats);
        env.storage().persistent().extend_ttl(&key, STATS_TTL, STATS_TTL);
        Ok(())
    }

    pub fn get_creator_stats(env: Env, creator: Address, token: Address) -> Stats {
        env.storage()
            .persistent()
            .get(&Key::Stats(creator, token))
            .unwrap_or(Stats { total_received: 0, tip_count: 0 })
    }

    fn require_admin(env: &Env) -> Result<(), Error> {
        let admin: Address = env.storage().instance().get(&Key::Admin).ok_or(Error::NotInitialized)?;
        admin.require_auth();
        Ok(())
    }
}
