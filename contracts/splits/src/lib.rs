#![no_std]
//! Split Payments contract: C-019 specification, C-020 `create_split`, C-021 `pay`,
//! C-018 test suite (Tip Jar tests live with the `tipjar` crate; split tests are below).
//!
//! # C-019 design: contract splits vs multi-operation Horizon transactions
//!
//! See also `docs/split-payments-design.md`, which describes today's `submitSplitPayment`.
//!
//! | Aspect | Multi-op Horizon tx (today) | Split contract (this crate) |
//! | --- | --- | --- |
//! | Atomicity | All operations succeed or fail together | Same (one invocation) |
//! | Rules reusable and verifiable | No: the payer builds the op list each time | Yes: a stored, owner-controlled config |
//! | Fee | 100 stroops base fee per operation | Soroban resource fee for one invocation plus the token transfers; to be measured on testnet per recipient count (2, 5, 10) before launch, not estimated here |
//! | Flexibility | Any assets/recipients per payment | One token per `pay`; recipients fixed by the config |
//! | Trust | Client builds the distribution | Contract computes it; clients can `preview` |
//!
//! Decisions: shares are basis points summing to exactly 10_000; at most `MAX_RECIPIENTS` (10)
//! recipients; duplicates and zero shares are rejected; the first recipient is the primary
//! recipient and receives the rounding remainder; configs are updated only by their owner
//! (delayed updates are specified by C-022).

use soroban_sdk::{
    contract, contracterror, contractimpl, contracttype, symbol_short, token, xdr::ToXdr, Address, BytesN, Env, Vec,
};

pub const MAX_RECIPIENTS: u32 = 10;
const BPS_TOTAL: u32 = 10_000;

#[contracttype]
enum Key {
    NextId,
    Split(u32),
}

#[contracttype]
#[derive(Clone)]
pub struct Split {
    pub owner: Address,
    pub recipients: Vec<(Address, u32)>,
}

#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq)]
#[repr(u32)]
pub enum Error {
    TooManyRecipients = 1,
    NoRecipients = 2,
    InvalidShares = 3,
    DuplicateRecipient = 4,
    InvalidAmount = 5,
    SplitNotFound = 6,
}

#[contract]
pub struct Splits;

#[contractimpl]
impl Splits {
    pub fn create_split(env: Env, owner: Address, recipients: Vec<(Address, u32)>) -> Result<u32, Error> {
        owner.require_auth();
        if recipients.is_empty() {
            return Err(Error::NoRecipients);
        }
        if recipients.len() > MAX_RECIPIENTS {
            return Err(Error::TooManyRecipients);
        }
        let mut total: u32 = 0;
        for i in 0..recipients.len() {
            let (addr, bps) = recipients.get(i).unwrap();
            if bps == 0 {
                return Err(Error::InvalidShares);
            }
            total += bps;
            for j in (i + 1)..recipients.len() {
                if recipients.get(j).unwrap().0 == addr {
                    return Err(Error::DuplicateRecipient);
                }
            }
        }
        if total != BPS_TOTAL {
            return Err(Error::InvalidShares);
        }

        let id: u32 = env.storage().instance().get(&Key::NextId).unwrap_or(0) + 1;
        env.storage().instance().set(&Key::NextId, &id);
        env.storage().persistent().set(&Key::Split(id), &Split { owner: owner.clone(), recipients: recipients.clone() });

        let hash: BytesN<32> = env.crypto().sha256(&recipients.to_xdr(&env)).to_bytes();
        env.events().publish((symbol_short!("split"), owner, id), hash);
        Ok(id)
    }

    /// Distributes `amount` atomically. Any failing transfer aborts the whole invocation.
    pub fn pay(env: Env, from: Address, split_id: u32, token: Address, amount: i128) -> Result<(), Error> {
        from.require_auth();
        if amount <= 0 {
            return Err(Error::InvalidAmount);
        }
        let split: Split = env.storage().persistent().get(&Key::Split(split_id)).ok_or(Error::SplitNotFound)?;
        let client = token::Client::new(&env, &token);
        for (to, value) in Self::distribution(&split.recipients, amount).iter() {
            if value > 0 {
                client.transfer(&from, &to, &value);
            }
        }
        env.events().publish((symbol_short!("paid"), from, split_id), (token, amount));
        Ok(())
    }

    pub fn get_split(env: Env, split_id: u32) -> Result<Split, Error> {
        env.storage().persistent().get(&Key::Split(split_id)).ok_or(Error::SplitNotFound)
    }
}

impl Splits {
    /// Floor division per recipient; the remainder goes to the first (primary) recipient,
    /// so the parts always sum to `amount`.
    fn distribution(recipients: &Vec<(Address, u32)>, amount: i128) -> Vec<(Address, i128)> {
        let env = recipients.env();
        let mut out = Vec::new(env);
        let mut paid: i128 = 0;
        for (addr, bps) in recipients.iter() {
            let part = amount * (bps as i128) / (BPS_TOTAL as i128);
            paid += part;
            out.push_back((addr, part));
        }
        let (primary, first) = out.get(0).unwrap();
        out.set(0, (primary, first + (amount - paid)));
        out
    }
}

#[cfg(test)]
mod test {
    use super::*;
    use soroban_sdk::{testutils::Address as _, token::StellarAssetClient, vec};

    fn setup() -> (Env, SplitsClient<'static>, Address, Address) {
        let env = Env::default();
        env.mock_all_auths();
        let client = SplitsClient::new(&env, &env.register(Splits, ()));
        let token = env.register_stellar_asset_contract_v2(Address::generate(&env)).address();
        let payer = Address::generate(&env);
        StellarAssetClient::new(&env, &token).mint(&payer, &1_000_000);
        (env, client, token, payer)
    }

    #[test]
    fn pays_everyone_and_sums_to_input() {
        let (env, client, token, payer) = setup();
        let (a, b, c) = (Address::generate(&env), Address::generate(&env), Address::generate(&env));
        let id = client.create_split(&Address::generate(&env), &vec![&env, (a.clone(), 3_333), (b.clone(), 3_333), (c.clone(), 3_334)]);
        client.pay(&payer, &id, &token, &1_001);
        let t = token::Client::new(&env, &token);
        // 333 + 333 + 333 = 999; the 2 stroop remainder goes to the primary recipient.
        assert_eq!(t.balance(&a), 335);
        assert_eq!(t.balance(&b), 333);
        assert_eq!(t.balance(&c), 333);
    }

    #[test]
    fn rejects_invalid_configs() {
        let (env, client, _t, _p) = setup();
        let owner = Address::generate(&env);
        let a = Address::generate(&env);
        let b = Address::generate(&env);
        assert!(client.try_create_split(&owner, &vec![&env, (a.clone(), 5_000), (b.clone(), 4_000)]).is_err());
        assert!(client.try_create_split(&owner, &vec![&env, (a.clone(), 5_000), (a.clone(), 5_000)]).is_err());
        assert!(client.try_create_split(&owner, &Vec::new(&env)).is_err());
    }

    #[test]
    fn rejects_non_positive_amounts_and_unknown_splits() {
        let (env, client, token, payer) = setup();
        let id = client.create_split(&Address::generate(&env), &vec![&env, (Address::generate(&env), 10_000)]);
        assert!(client.try_pay(&payer, &id, &token, &0).is_err());
        assert!(client.try_pay(&payer, &99, &token, &10).is_err());
    }
}
