#![no_std]
//! Soulbound badge contract: C-038 role-gated mint, C-039 soulbound enforcement,
//! C-040 badge type registry with supply caps, C-041 eligibility-by-proof minting.
//! Design basis: `docs/onchain-rewards-badges-spec.md`.
//!
//! C-041 note: the Tip Jar keeps stats per (creator, token) (C-015), so the thresholds here are
//! checked against the *claiming account's received totals*. Badges for tipping fans need a
//! per-fan counter in the Tip Jar, which C-015 explicitly leaves out of scope.

use soroban_sdk::{
    contract, contractclient, contracterror, contractimpl, contracttype, symbol_short, Address, BytesN, Env, String, Vec,
};

/// Subset of the Tip Jar policy contract used for eligibility proofs.
#[contractclient(name = "TipStatsClient")]
pub trait TipStats {
    fn get_creator_stats(env: Env, creator: Address, token: Address) -> TipStatsValue;
}

#[contracttype]
#[derive(Clone)]
pub struct TipStatsValue {
    pub total_received: i128,
    pub tip_count: u32,
}

#[contracttype]
enum Key {
    Admin,
    Minter(Address),
    TipJar,
    NextType,
    Type(u32),
    TypeIds,
    Badge(Address, u32),
    Threshold(u32, Address),
}

#[contracttype]
#[derive(Clone)]
pub struct BadgeType {
    pub name: String,
    pub supply_cap: u32,
    pub minted: u32,
    pub metadata_hash: BytesN<32>,
}

#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq)]
#[repr(u32)]
pub enum Error {
    AlreadyInitialized = 1,
    NotInitialized = 2,
    NotMinter = 3,
    UnknownType = 4,
    AlreadyOwned = 5,
    SupplyExhausted = 6,
    /// Badges are soulbound; there is no transfer.
    Soulbound = 7,
    NotOwner = 8,
    BelowThreshold = 9,
    NoThreshold = 10,
}

#[contract]
pub struct Badges;

#[contractimpl]
impl Badges {
    pub fn init(env: Env, admin: Address, tip_jar: Address) -> Result<(), Error> {
        if env.storage().instance().has(&Key::Admin) {
            return Err(Error::AlreadyInitialized);
        }
        env.storage().instance().set(&Key::Admin, &admin);
        env.storage().instance().set(&Key::TipJar, &tip_jar);
        Ok(())
    }

    pub fn set_minter(env: Env, minter: Address, enabled: bool) -> Result<(), Error> {
        Self::require_admin(&env)?;
        env.storage().persistent().set(&Key::Minter(minter), &enabled);
        Ok(())
    }

    // ---- C-040 registry ----
    pub fn register_type(env: Env, name: String, supply_cap: u32, metadata_hash: BytesN<32>) -> Result<u32, Error> {
        Self::require_admin(&env)?;
        let id: u32 = env.storage().instance().get(&Key::NextType).unwrap_or(0) + 1;
        env.storage().instance().set(&Key::NextType, &id);
        env.storage().persistent().set(&Key::Type(id), &BadgeType { name, supply_cap, minted: 0, metadata_hash });
        let mut ids: Vec<u32> = env.storage().persistent().get(&Key::TypeIds).unwrap_or(Vec::new(&env));
        ids.push_back(id);
        env.storage().persistent().set(&Key::TypeIds, &ids);
        env.events().publish((symbol_short!("type"), id), supply_cap);
        Ok(id)
    }

    pub fn list_types(env: Env) -> Vec<u32> {
        env.storage().persistent().get(&Key::TypeIds).unwrap_or(Vec::new(&env))
    }

    pub fn get_type(env: Env, badge_type: u32) -> Result<BadgeType, Error> {
        env.storage().persistent().get(&Key::Type(badge_type)).ok_or(Error::UnknownType)
    }

    pub fn remaining_supply(env: Env, badge_type: u32) -> Result<u32, Error> {
        let t = Self::get_type(env, badge_type)?;
        Ok(t.supply_cap - t.minted)
    }

    // ---- C-038 mint (minter role only) ----
    pub fn mint(env: Env, minter: Address, to: Address, badge_type: u32) -> Result<(), Error> {
        minter.require_auth();
        if !env.storage().persistent().get(&Key::Minter(minter)).unwrap_or(false) {
            return Err(Error::NotMinter);
        }
        Self::issue(&env, &to, badge_type)
    }

    pub fn has_badge(env: Env, owner: Address, badge_type: u32) -> bool {
        env.storage().persistent().has(&Key::Badge(owner, badge_type))
    }

    // ---- C-039 soulbound: transfer exists only to fail loudly; owners may burn ----
    pub fn transfer(_env: Env, _from: Address, _to: Address, _badge_type: u32) -> Result<(), Error> {
        Err(Error::Soulbound)
    }

    pub fn burn(env: Env, owner: Address, badge_type: u32) -> Result<(), Error> {
        owner.require_auth();
        let key = Key::Badge(owner.clone(), badge_type);
        if !env.storage().persistent().has(&key) {
            return Err(Error::NotOwner);
        }
        env.storage().persistent().remove(&key);
        env.events().publish((symbol_short!("burn"), owner, badge_type), ());
        Ok(())
    }

    // ---- C-041 eligibility by on-chain proof ----
    pub fn set_threshold(env: Env, badge_type: u32, token: Address, min_total: i128) -> Result<(), Error> {
        Self::require_admin(&env)?;
        Self::get_type(env.clone(), badge_type)?;
        env.storage().persistent().set(&Key::Threshold(badge_type, token), &min_total);
        Ok(())
    }

    /// The account claims for itself; eligibility is read from the Tip Jar, no signer involved.
    /// Each (account, badge type) can be claimed once because `issue` rejects duplicates.
    pub fn claim(env: Env, account: Address, badge_type: u32, token: Address) -> Result<(), Error> {
        account.require_auth();
        let min: i128 = env.storage().persistent().get(&Key::Threshold(badge_type, token.clone())).ok_or(Error::NoThreshold)?;
        let jar: Address = env.storage().instance().get(&Key::TipJar).ok_or(Error::NotInitialized)?;
        let stats = TipStatsClient::new(&env, &jar).get_creator_stats(&account, &token);
        if stats.total_received < min {
            return Err(Error::BelowThreshold);
        }
        Self::issue(&env, &account, badge_type)
    }
}

impl Badges {
    fn require_admin(env: &Env) -> Result<(), Error> {
        let admin: Address = env.storage().instance().get(&Key::Admin).ok_or(Error::NotInitialized)?;
        admin.require_auth();
        Ok(())
    }

    fn issue(env: &Env, to: &Address, badge_type: u32) -> Result<(), Error> {
        let mut t: BadgeType = env.storage().persistent().get(&Key::Type(badge_type)).ok_or(Error::UnknownType)?;
        let key = Key::Badge(to.clone(), badge_type);
        if env.storage().persistent().has(&key) {
            return Err(Error::AlreadyOwned);
        }
        if t.minted >= t.supply_cap {
            return Err(Error::SupplyExhausted);
        }
        t.minted += 1;
        env.storage().persistent().set(&Key::Type(badge_type), &t);
        env.storage().persistent().set(&key, &t.metadata_hash);
        env.events().publish((symbol_short!("mint"), to.clone(), badge_type), t.metadata_hash);
        Ok(())
    }
}
