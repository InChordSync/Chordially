#![no_std]
//! Split configuration lifecycle: C-022 delayed owner updates, C-023 disable/re-enable,
//! C-024 nested-split decision, C-025 views and pagination.
//!
//! Storage layout mirrors the `splits` crate (`Split { owner, recipients }`) and adds `active`
//! and a pending update; the two crates are merged when the contracts workspace is introduced.
//!
//! # C-024 decision: nested splits are NOT allowed
//! A recipient that is itself a split would make `pay` recursive: CPU/memory cost grows with
//! depth, flows become hard to audit, and a cycle (A pays B pays A) could only be stopped by
//! the budget. Recipients must be plain accounts or external contracts. This crate rejects the
//! split contract itself as a recipient; other deployed split instances are rejected by the
//! admin-maintained deny list (`block_recipient`), because a contract cannot reliably tell
//! another contract's type on-chain.

use soroban_sdk::{
    contract, contracterror, contractimpl, contracttype, symbol_short, Address, Env, Vec,
};

const MAX_RECIPIENTS: u32 = 10;
const BPS_TOTAL: u32 = 10_000;
const MAX_PAGE: u32 = 50;

#[contracttype]
enum Key {
    Admin,
    UpdateDelay,
    NextId,
    Split(u32),
    Pending(u32),
    ByOwner(Address),
    Blocked(Address),
}

#[contracttype]
#[derive(Clone)]
pub struct Split {
    pub owner: Address,
    pub recipients: Vec<(Address, u32)>,
    pub active: bool,
}

#[contracttype]
#[derive(Clone)]
pub struct PendingUpdate {
    pub recipients: Vec<(Address, u32)>,
    pub effective_at: u64,
}

#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq)]
#[repr(u32)]
pub enum Error {
    NotInitialized = 1,
    SplitNotFound = 2,
    NotOwner = 3,
    InvalidRecipients = 4,
    SplitInactive = 5,
    NestedSplitNotAllowed = 6,
    AlreadyInitialized = 7,
}

#[contract]
pub struct SplitConfig;

#[contractimpl]
impl SplitConfig {
    pub fn init(env: Env, admin: Address, update_delay_secs: u64) -> Result<(), Error> {
        if env.storage().instance().has(&Key::Admin) {
            return Err(Error::AlreadyInitialized);
        }
        env.storage().instance().set(&Key::Admin, &admin);
        env.storage().instance().set(&Key::UpdateDelay, &update_delay_secs);
        Ok(())
    }

    pub fn block_recipient(env: Env, addr: Address) -> Result<(), Error> {
        let admin: Address = env.storage().instance().get(&Key::Admin).ok_or(Error::NotInitialized)?;
        admin.require_auth();
        env.storage().persistent().set(&Key::Blocked(addr), &true);
        Ok(())
    }

    pub fn register(env: Env, owner: Address, recipients: Vec<(Address, u32)>) -> Result<u32, Error> {
        owner.require_auth();
        Self::validate(&env, &recipients)?;
        let id: u32 = env.storage().instance().get(&Key::NextId).unwrap_or(0) + 1;
        env.storage().instance().set(&Key::NextId, &id);
        env.storage().persistent().set(&Key::Split(id), &Split { owner: owner.clone(), recipients, active: true });
        let mut ids: Vec<u32> = env.storage().persistent().get(&Key::ByOwner(owner.clone())).unwrap_or(Vec::new(&env));
        ids.push_back(id);
        env.storage().persistent().set(&Key::ByOwner(owner), &ids);
        Ok(id)
    }

    /// C-022: the new recipients take effect after the configured delay; until then the old
    /// config stays in force (see `get_effective_recipients`).
    pub fn propose_update(env: Env, split_id: u32, recipients: Vec<(Address, u32)>) -> Result<u64, Error> {
        let split = Self::load(&env, split_id)?;
        split.owner.require_auth();
        Self::validate(&env, &recipients)?;
        let delay: u64 = env.storage().instance().get(&Key::UpdateDelay).unwrap_or(0);
        let effective_at = env.ledger().timestamp() + delay;
        env.storage().persistent().set(&Key::Pending(split_id), &PendingUpdate { recipients, effective_at });
        env.events().publish((symbol_short!("upd_prop"), split_id), effective_at);
        Ok(effective_at)
    }

    pub fn get_pending_update(env: Env, split_id: u32) -> Option<PendingUpdate> {
        env.storage().persistent().get(&Key::Pending(split_id))
    }

    /// Recipients a payment made right now must use: the old config until the pending
    /// update's effective time has passed, the new one afterwards.
    pub fn get_effective_recipients(env: Env, split_id: u32) -> Result<Vec<(Address, u32)>, Error> {
        let split = Self::load(&env, split_id)?;
        if let Some(p) = Self::get_pending_update(env.clone(), split_id) {
            if env.ledger().timestamp() >= p.effective_at {
                return Ok(p.recipients);
            }
        }
        Ok(split.recipients)
    }

    /// Persists a matured pending update; anyone may call it.
    pub fn apply_update(env: Env, split_id: u32) -> Result<(), Error> {
        let mut split = Self::load(&env, split_id)?;
        if let Some(p) = Self::get_pending_update(env.clone(), split_id) {
            if env.ledger().timestamp() >= p.effective_at {
                split.recipients = p.recipients;
                env.storage().persistent().set(&Key::Split(split_id), &split);
                env.storage().persistent().remove(&Key::Pending(split_id));
                env.events().publish((symbol_short!("upd_done"), split_id), ());
            }
        }
        Ok(())
    }

    /// C-023: deactivate/reactivate keeps the configuration and history intact.
    pub fn set_active(env: Env, split_id: u32, active: bool) -> Result<(), Error> {
        let mut split = Self::load(&env, split_id)?;
        split.owner.require_auth();
        split.active = active;
        env.storage().persistent().set(&Key::Split(split_id), &split);
        env.events().publish((symbol_short!("active"), split_id), active);
        Ok(())
    }

    /// Payment-path guard: `pay` implementations call this and revert with `SplitInactive`.
    pub fn assert_active(env: Env, split_id: u32) -> Result<(), Error> {
        if Self::load(&env, split_id)?.active {
            Ok(())
        } else {
            Err(Error::SplitInactive)
        }
    }

    // ---- C-025 views ----
    pub fn get_split(env: Env, split_id: u32) -> Result<Split, Error> {
        Self::load(&env, split_id)
    }

    pub fn get_splits_by_owner(env: Env, owner: Address, start: u32, limit: u32) -> Vec<u32> {
        let ids: Vec<u32> = env.storage().persistent().get(&Key::ByOwner(owner)).unwrap_or(Vec::new(&env));
        let end = core::cmp::min(ids.len(), start.saturating_add(core::cmp::min(limit, MAX_PAGE)));
        let mut page = Vec::new(&env);
        for i in start..end {
            page.push_back(ids.get(i).unwrap());
        }
        page
    }

    /// Same math as the `splits` crate's `pay`: floor per recipient, remainder to the first.
    pub fn preview_distribution(env: Env, split_id: u32, amount: i128) -> Result<Vec<(Address, i128)>, Error> {
        let recipients = Self::get_effective_recipients(env.clone(), split_id)?;
        let mut out = Vec::new(&env);
        let mut paid: i128 = 0;
        for (addr, bps) in recipients.iter() {
            let part = amount * (bps as i128) / (BPS_TOTAL as i128);
            paid += part;
            out.push_back((addr, part));
        }
        let (primary, first) = out.get(0).ok_or(Error::InvalidRecipients)?;
        out.set(0, (primary, first + (amount - paid)));
        Ok(out)
    }
}

impl SplitConfig {
    fn load(env: &Env, id: u32) -> Result<Split, Error> {
        env.storage().persistent().get(&Key::Split(id)).ok_or(Error::SplitNotFound)
    }

    fn validate(env: &Env, recipients: &Vec<(Address, u32)>) -> Result<(), Error> {
        if recipients.is_empty() || recipients.len() > MAX_RECIPIENTS {
            return Err(Error::InvalidRecipients);
        }
        let me = env.current_contract_address();
        let mut total = 0u32;
        for i in 0..recipients.len() {
            let (addr, bps) = recipients.get(i).unwrap();
            if bps == 0 {
                return Err(Error::InvalidRecipients);
            }
            if addr == me || env.storage().persistent().has(&Key::Blocked(addr.clone())) {
                return Err(Error::NestedSplitNotAllowed);
            }
            for j in (i + 1)..recipients.len() {
                if recipients.get(j).unwrap().0 == addr {
                    return Err(Error::InvalidRecipients);
                }
            }
            total += bps;
        }
        if total != BPS_TOTAL {
            return Err(Error::InvalidRecipients);
        }
        Ok(())
    }
}
