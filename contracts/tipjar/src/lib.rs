#![no_std]
//! Tip Jar core: C-010 `tip`, C-011 platform fee, C-012 two-step admin, C-013 pause.

use soroban_sdk::{
    contract, contracterror, contractimpl, contracttype, symbol_short, token, Address, Bytes, BytesN, Env,
};

const MAX_MEMO_BYTES: u32 = 64;
const MAX_FEE_BPS: u32 = 1_000;

#[contracttype]
enum Key {
    Admin,
    PendingAdmin,
    Paused,
    FeeBps,
    FeeRecipient,
}

#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq)]
#[repr(u32)]
pub enum Error {
    AlreadyInitialized = 1,
    NotInitialized = 2,
    InvalidAmount = 3,
    MemoTooLong = 4,
    Paused = 5,
    FeeTooHigh = 6,
    NoPendingAdmin = 7,
}

#[contract]
pub struct TipJar;

#[contractimpl]
impl TipJar {
    pub fn init(env: Env, admin: Address, fee_recipient: Address, fee_bps: u32) -> Result<(), Error> {
        if env.storage().instance().has(&Key::Admin) {
            return Err(Error::AlreadyInitialized);
        }
        if fee_bps > MAX_FEE_BPS {
            return Err(Error::FeeTooHigh);
        }
        let s = env.storage().instance();
        s.set(&Key::Admin, &admin);
        s.set(&Key::Paused, &false);
        s.set(&Key::FeeBps, &fee_bps);
        s.set(&Key::FeeRecipient, &fee_recipient);
        Ok(())
    }

    /// C-010 + C-011: pass-through transfer; the fee is split off in the same invocation.
    pub fn tip(env: Env, from: Address, creator: Address, token: Address, amount: i128, memo: Bytes) -> Result<(), Error> {
        from.require_auth();
        if Self::is_paused(env.clone()) {
            return Err(Error::Paused);
        }
        if amount <= 0 {
            return Err(Error::InvalidAmount);
        }
        if memo.len() > MAX_MEMO_BYTES {
            return Err(Error::MemoTooLong);
        }
        let bps: u32 = env.storage().instance().get(&Key::FeeBps).ok_or(Error::NotInitialized)?;
        // Floor division on the fee means rounding favours the creator; parts always sum to `amount`.
        let fee = amount.checked_mul(bps as i128).ok_or(Error::InvalidAmount)? / 10_000;
        let creator_amount = amount - fee;

        let client = token::Client::new(&env, &token);
        client.transfer(&from, &creator, &creator_amount);
        if fee > 0 {
            let recipient: Address = env.storage().instance().get(&Key::FeeRecipient).ok_or(Error::NotInitialized)?;
            client.transfer(&from, &recipient, &fee);
        }

        let memo_hash: BytesN<32> = env.crypto().sha256(&memo).to_bytes();
        env.events().publish((symbol_short!("tip"), from, creator), (token, amount, memo_hash));
        Ok(())
    }

    /// Splits `amount` into (creator, fee) using the current fee, for UIs and property tests.
    pub fn quote_fee(env: Env, amount: i128) -> Result<(i128, i128), Error> {
        let bps: u32 = env.storage().instance().get(&Key::FeeBps).ok_or(Error::NotInitialized)?;
        let fee = amount.checked_mul(bps as i128).ok_or(Error::InvalidAmount)? / 10_000;
        Ok((amount - fee, fee))
    }

    // ---- C-011 fee configuration (admin only) ----
    pub fn set_fee_bps(env: Env, fee_bps: u32) -> Result<(), Error> {
        Self::require_admin(&env)?;
        if fee_bps > MAX_FEE_BPS {
            return Err(Error::FeeTooHigh);
        }
        env.storage().instance().set(&Key::FeeBps, &fee_bps);
        env.events().publish((symbol_short!("fee_bps"),), fee_bps);
        Ok(())
    }

    pub fn set_fee_recipient(env: Env, recipient: Address) -> Result<(), Error> {
        Self::require_admin(&env)?;
        env.storage().instance().set(&Key::FeeRecipient, &recipient);
        env.events().publish((symbol_short!("fee_rcpt"),), recipient);
        Ok(())
    }

    // ---- C-012 two-step ownership transfer; there is no single-call transfer ----
    pub fn propose_admin(env: Env, new_admin: Address) -> Result<(), Error> {
        Self::require_admin(&env)?;
        env.storage().instance().set(&Key::PendingAdmin, &new_admin);
        env.events().publish((symbol_short!("adm_prop"),), new_admin);
        Ok(())
    }

    pub fn accept_admin(env: Env) -> Result<(), Error> {
        let pending: Address = env.storage().instance().get(&Key::PendingAdmin).ok_or(Error::NoPendingAdmin)?;
        pending.require_auth();
        env.storage().instance().set(&Key::Admin, &pending);
        env.storage().instance().remove(&Key::PendingAdmin);
        env.events().publish((symbol_short!("adm_acc"),), pending);
        Ok(())
    }

    // ---- C-013 circuit breaker; admin functions keep working while paused ----
    pub fn pause(env: Env) -> Result<(), Error> {
        Self::require_admin(&env)?;
        env.storage().instance().set(&Key::Paused, &true);
        env.events().publish((symbol_short!("paused"),), true);
        Ok(())
    }

    pub fn unpause(env: Env) -> Result<(), Error> {
        Self::require_admin(&env)?;
        env.storage().instance().set(&Key::Paused, &false);
        env.events().publish((symbol_short!("paused"),), false);
        Ok(())
    }

    pub fn is_paused(env: Env) -> bool {
        env.storage().instance().get(&Key::Paused).unwrap_or(false)
    }

    pub fn admin(env: Env) -> Result<Address, Error> {
        env.storage().instance().get(&Key::Admin).ok_or(Error::NotInitialized)
    }

    fn require_admin(env: &Env) -> Result<(), Error> {
        let admin: Address = env.storage().instance().get(&Key::Admin).ok_or(Error::NotInitialized)?;
        admin.require_auth();
        Ok(())
    }
}
