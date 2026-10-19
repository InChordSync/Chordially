#![no_std]
//! Campaign (crowdfunding) contract core: C-027 specification, C-028 `create`,
//! C-029 `contribute`, C-026 split-math property test (bottom of file).
//!
//! # C-027 specification
//! Model: all-or-nothing. A campaign has a `goal` in one token and a `deadline`. Contributors
//! lock funds in the contract. After the deadline: goal met -> creator claims once (C-030);
//! goal missed -> each contributor pulls their own refund (C-031). Milestone release (C-032),
//! cancellation (C-033) and arbitration (C-034) extend this state in `campaign-settlement` and
//! `campaign-ops`.
//!
//! | Off-chain (Postgres campaign model, `docs/creator-campaign-wizard-domain-guide.md`) | On-chain |
//! | --- | --- |
//! | title, description, images, rewards copy | `metadata_hash` only (SHA-256 of the canonical JSON) |
//! | goal amount, currency | `goal` (base units) and `token` |
//! | end date | `deadline` (ledger timestamp, seconds) |
//! | owner profile | `creator` address |
//! | status shown in the UI | derived from `raised`, `deadline`, claim/refund events |
//! | contributor list and receipts | per-contributor amount (needed for refunds); history is indexed |
//!
//! Only money-relevant rules live on-chain; everything presentational stays in Postgres.

use soroban_sdk::{
    contract, contracterror, contractimpl, contracttype, symbol_short, token, Address, BytesN, Env,
};

pub const MAX_DURATION_SECS: u64 = 90 * 24 * 60 * 60;
const TTL: u32 = 3_110_400;

#[contracttype]
enum Key {
    NextId,
    Campaign(u32),
    Contribution(u32, Address),
}

#[contracttype]
#[derive(Clone)]
pub struct Campaign {
    pub creator: Address,
    pub token: Address,
    pub goal: i128,
    pub deadline: u64,
    pub metadata_hash: BytesN<32>,
    pub raised: i128,
}

#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq)]
#[repr(u32)]
pub enum Error {
    InvalidGoal = 1,
    InvalidDeadline = 2,
    CampaignNotFound = 3,
    CampaignEnded = 4,
    InvalidAmount = 5,
}

#[contract]
pub struct CampaignCore;

#[contractimpl]
impl CampaignCore {
    pub fn create(env: Env, creator: Address, token: Address, goal: i128, deadline: u64, metadata_hash: BytesN<32>) -> Result<u32, Error> {
        creator.require_auth();
        if goal <= 0 {
            return Err(Error::InvalidGoal);
        }
        let now = env.ledger().timestamp();
        if deadline <= now || deadline - now > MAX_DURATION_SECS {
            return Err(Error::InvalidDeadline);
        }
        let id: u32 = env.storage().instance().get(&Key::NextId).unwrap_or(0) + 1;
        env.storage().instance().set(&Key::NextId, &id);
        let c = Campaign { creator: creator.clone(), token, goal, deadline, metadata_hash: metadata_hash.clone(), raised: 0 };
        Self::save(&env, id, &c);
        env.events().publish((symbol_short!("created"), creator, id), (goal, deadline, metadata_hash));
        Ok(id)
    }

    /// Funds stay in this contract until the outcome is known.
    pub fn contribute(env: Env, from: Address, campaign_id: u32, amount: i128) -> Result<(), Error> {
        from.require_auth();
        if amount <= 0 {
            return Err(Error::InvalidAmount);
        }
        let mut c = Self::get_campaign(env.clone(), campaign_id)?;
        if env.ledger().timestamp() > c.deadline {
            return Err(Error::CampaignEnded);
        }
        token::Client::new(&env, &c.token).transfer(&from, &env.current_contract_address(), &amount);

        let key = Key::Contribution(campaign_id, from.clone());
        let prev: i128 = env.storage().persistent().get(&key).unwrap_or(0);
        env.storage().persistent().set(&key, &(prev + amount));
        env.storage().persistent().extend_ttl(&key, TTL, TTL);

        c.raised += amount;
        Self::save(&env, campaign_id, &c);
        env.events().publish((symbol_short!("contrib"), campaign_id, from), amount);
        Ok(())
    }

    pub fn total_raised(env: Env, campaign_id: u32) -> Result<i128, Error> {
        Ok(Self::get_campaign(env, campaign_id)?.raised)
    }

    pub fn get_contribution(env: Env, campaign_id: u32, contributor: Address) -> i128 {
        env.storage().persistent().get(&Key::Contribution(campaign_id, contributor)).unwrap_or(0)
    }

    pub fn get_campaign(env: Env, campaign_id: u32) -> Result<Campaign, Error> {
        env.storage().persistent().get(&Key::Campaign(campaign_id)).ok_or(Error::CampaignNotFound)
    }
}

impl CampaignCore {
    fn save(env: &Env, id: u32, c: &Campaign) {
        let key = Key::Campaign(id);
        env.storage().persistent().set(&key, c);
        env.storage().persistent().extend_ttl(&key, TTL, TTL);
    }
}

#[cfg(test)]
mod split_math_properties {
    //! C-026: property tests for the split distribution rule used by the split contracts
    //! (floor per share, remainder to the first recipient). The rule is copied here as a pure
    //! function so it can be exercised with many random inputs without a Soroban environment.

    fn distribute(amount: i128, shares: &[u32]) -> [i128; 10] {
        let mut out = [0i128; 10];
        let mut paid = 0i128;
        for (i, bps) in shares.iter().enumerate() {
            out[i] = amount * (*bps as i128) / 10_000;
            paid += out[i];
        }
        out[0] += amount - paid;
        out
    }

    /// xorshift64: deterministic pseudo-randomness without extra dependencies.
    struct Rng(u64);
    impl Rng {
        fn next(&mut self) -> u64 {
            self.0 ^= self.0 << 13;
            self.0 ^= self.0 >> 7;
            self.0 ^= self.0 << 17;
            self.0
        }
    }

    #[test]
    fn payouts_sum_to_input_and_are_never_negative_or_overflowed() {
        let mut rng = Rng(0x9E37_79B9_7F4A_7C15);
        for _ in 0..20_000 {
            let n = (rng.next() % 10 + 1) as usize;
            // Random composition of 10_000 bps into n positive parts.
            let mut shares = [0u32; 10];
            let mut left = 10_000u32;
            for i in 0..n - 1 {
                let max = left - (n - 1 - i) as u32;
                shares[i] = (rng.next() % max as u64) as u32 + 1;
                left -= shares[i];
            }
            shares[n - 1] = left;
            // Amounts up to i64::MAX stay far from i128 overflow when multiplied by 10_000.
            let amount = (rng.next() >> 1) as i128 + 1;

            let out = distribute(amount, &shares[..n]);
            assert_eq!(out.iter().sum::<i128>(), amount);
            assert!(out.iter().all(|v| *v >= 0));
        }
    }
}
