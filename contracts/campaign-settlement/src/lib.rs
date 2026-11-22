#![no_std]
//! Campaign settlement: C-030 successful payout, C-031 refunds, C-032 milestone release,
//! C-033 cancellation. State types mirror `campaign-core` (`Campaign` plus per-contributor
//! amounts) and add settlement flags; the crates are merged with the contracts workspace.
//!
//! Fee semantics follow the Tip Jar: `fee = amount * fee_bps / 10_000` (floor, so rounding
//! favours the creator), capped at 1000 bps.
//!
//! Milestones: the creator sets N percentages summing to 100; each release pays that share of
//! the raised total (less fee) and needs the campaign arbiter's authorisation. If the campaign
//! is cancelled mid-way, contributors can refund `contribution * unreleased / raised`.

use soroban_sdk::{
    contract, contracterror, contractimpl, contracttype, symbol_short, token, Address, Env, Vec,
};

const MAX_FEE_BPS: u32 = 1_000;

#[contracttype]
enum Key {
    FeeBps,
    FeeRecipient,
    Campaign(u32),
    Contribution(u32, Address),
    Refunded(u32, Address),
}

#[contracttype]
#[derive(Clone)]
pub struct State {
    pub creator: Address,
    pub arbiter: Address,
    pub token: Address,
    pub goal: i128,
    pub deadline: u64,
    pub raised: i128,
    pub claimed: bool,
    pub cancelled: bool,
    pub milestones: Vec<u32>,
    pub released: u32,
    pub released_amount: i128,
}

#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq)]
#[repr(u32)]
pub enum Error {
    NotFound = 1,
    InvalidAmount = 2,
    CampaignEnded = 3,
    NotEnded = 4,
    GoalNotMet = 5,
    GoalMet = 6,
    AlreadyClaimed = 7,
    NothingToRefund = 8,
    AlreadyRefunded = 9,
    InvalidMilestones = 10,
    AllReleased = 11,
    Cancelled = 12,
    CannotCancel = 13,
    FeeTooHigh = 14,
}

#[contract]
pub struct CampaignSettlement;

#[contractimpl]
impl CampaignSettlement {
    pub fn init(env: Env, fee_bps: u32, fee_recipient: Address) -> Result<(), Error> {
        if fee_bps > MAX_FEE_BPS {
            return Err(Error::FeeTooHigh);
        }
        env.storage().instance().set(&Key::FeeBps, &fee_bps);
        env.storage().instance().set(&Key::FeeRecipient, &fee_recipient);
        Ok(())
    }

    pub fn open(env: Env, id: u32, creator: Address, arbiter: Address, token: Address, goal: i128, deadline: u64) -> Result<(), Error> {
        creator.require_auth();
        if goal <= 0 {
            return Err(Error::InvalidAmount);
        }
        let s = State { creator, arbiter, token, goal, deadline, raised: 0, claimed: false, cancelled: false,
            milestones: Vec::new(&env), released: 0, released_amount: 0 };
        env.storage().persistent().set(&Key::Campaign(id), &s);
        Ok(())
    }

    pub fn contribute(env: Env, from: Address, id: u32, amount: i128) -> Result<(), Error> {
        from.require_auth();
        let mut s = Self::load(&env, id)?;
        if amount <= 0 {
            return Err(Error::InvalidAmount);
        }
        if s.cancelled || env.ledger().timestamp() > s.deadline {
            return Err(if s.cancelled { Error::Cancelled } else { Error::CampaignEnded });
        }
        token::Client::new(&env, &s.token).transfer(&from, &env.current_contract_address(), &amount);
        let key = Key::Contribution(id, from);
        let prev: i128 = env.storage().persistent().get(&key).unwrap_or(0);
        env.storage().persistent().set(&key, &(prev + amount));
        s.raised += amount;
        env.storage().persistent().set(&Key::Campaign(id), &s);
        Ok(())
    }

    /// C-030: one-shot payout after the deadline when the goal was met.
    pub fn claim(env: Env, id: u32) -> Result<i128, Error> {
        let mut s = Self::load(&env, id)?;
        s.creator.require_auth();
        if s.cancelled {
            return Err(Error::Cancelled);
        }
        if env.ledger().timestamp() <= s.deadline {
            return Err(Error::NotEnded);
        }
        if s.raised < s.goal {
            return Err(Error::GoalNotMet);
        }
        if s.claimed {
            return Err(Error::AlreadyClaimed);
        }
        let payout = Self::pay_out(&env, &s, s.raised - s.released_amount)?;
        s.claimed = true;
        s.released_amount = s.raised;
        env.storage().persistent().set(&Key::Campaign(id), &s);
        env.events().publish((symbol_short!("claimed"), id), payout);
        Ok(payout)
    }

    /// C-031: pull-based refund of exactly the caller's share; no loops over contributors.
    pub fn refund(env: Env, id: u32, contributor: Address) -> Result<i128, Error> {
        contributor.require_auth();
        let s = Self::load(&env, id)?;
        let failed = env.ledger().timestamp() > s.deadline && s.raised < s.goal;
        if !(failed || s.cancelled) {
            return Err(Error::GoalMet);
        }
        let done = Key::Refunded(id, contributor.clone());
        if env.storage().persistent().has(&done) {
            return Err(Error::AlreadyRefunded);
        }
        let paid: i128 = env.storage().persistent().get(&Key::Contribution(id, contributor.clone())).unwrap_or(0);
        if paid == 0 || s.raised == 0 {
            return Err(Error::NothingToRefund);
        }
        // Full amount for failed campaigns; proportional to what is still unreleased otherwise.
        let amount = paid * (s.raised - s.released_amount) / s.raised;
        env.storage().persistent().set(&done, &true);
        token::Client::new(&env, &s.token).transfer(&env.current_contract_address(), &contributor, &amount);
        env.events().publish((symbol_short!("refund"), id, contributor), amount);
        Ok(amount)
    }

    /// C-032: creator defines the stages once, before any release.
    pub fn set_milestones(env: Env, id: u32, percentages: Vec<u32>) -> Result<(), Error> {
        let mut s = Self::load(&env, id)?;
        s.creator.require_auth();
        let total: u32 = percentages.iter().sum();
        if percentages.is_empty() || total != 100 || s.released > 0 || percentages.iter().any(|p| p == 0) {
            return Err(Error::InvalidMilestones);
        }
        s.milestones = percentages;
        env.storage().persistent().set(&Key::Campaign(id), &s);
        Ok(())
    }

    /// Releases the next milestone in order; needs the arbiter. Early stages are rounded down
    /// and the last stage pays whatever is left so the total is exact.
    pub fn release_milestone(env: Env, id: u32) -> Result<i128, Error> {
        let mut s = Self::load(&env, id)?;
        s.arbiter.require_auth();
        if s.cancelled {
            return Err(Error::Cancelled);
        }
        if env.ledger().timestamp() <= s.deadline || s.raised < s.goal {
            return Err(Error::GoalNotMet);
        }
        if s.released >= s.milestones.len() {
            return Err(Error::AllReleased);
        }
        let last = s.released + 1 == s.milestones.len();
        let gross = if last { s.raised - s.released_amount } else { s.raised * s.milestones.get(s.released).unwrap() as i128 / 100 };
        let payout = Self::pay_out(&env, &s, gross)?;
        s.released += 1;
        s.released_amount += gross;
        s.claimed = last;
        env.storage().persistent().set(&Key::Campaign(id), &s);
        env.events().publish((symbol_short!("release"), id), (s.released, payout));
        Ok(payout)
    }

    /// C-033: allowed only before the first claim or release; everything becomes refundable.
    pub fn cancel(env: Env, id: u32) -> Result<(), Error> {
        let mut s = Self::load(&env, id)?;
        s.creator.require_auth();
        if s.claimed || s.released > 0 {
            return Err(Error::CannotCancel);
        }
        s.cancelled = true;
        env.storage().persistent().set(&Key::Campaign(id), &s);
        env.events().publish((symbol_short!("cancel"), id), ());
        Ok(())
    }

    pub fn get_state(env: Env, id: u32) -> Result<State, Error> {
        Self::load(&env, id)
    }
}

impl CampaignSettlement {
    fn load(env: &Env, id: u32) -> Result<State, Error> {
        env.storage().persistent().get(&Key::Campaign(id)).ok_or(Error::NotFound)
    }

    /// Sends `gross` to the creator minus the platform fee; returns the creator's part.
    fn pay_out(env: &Env, s: &State, gross: i128) -> Result<i128, Error> {
        let bps: u32 = env.storage().instance().get(&Key::FeeBps).unwrap_or(0);
        let fee = gross * bps as i128 / 10_000;
        let client = token::Client::new(env, &s.token);
        let me = env.current_contract_address();
        if fee > 0 {
            let to: Address = env.storage().instance().get(&Key::FeeRecipient).ok_or(Error::NotFound)?;
            client.transfer(&me, &to, &fee);
        }
        client.transfer(&me, &s.creator, &(gross - fee));
        Ok(gross - fee)
    }
}
