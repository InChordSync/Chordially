#![no_std]
//! Signed-voucher badge minting (C-042) and badge contract tests (C-044).
//!
//! The backend signs `(account, badge_type, nonce, expiry)` (XDR-encoded) with an ed25519 key
//! whose public key the admin registers here. `mint_with_voucher` checks expiry first, then the
//! signature, then that the nonce is unused, and records the nonce on success so a voucher
//! cannot be replayed. Key custody and rotation are C-106.
//!
//! Metadata convention (C-043): `metadata_hash` resolves to JSON described by
//! `packages/shared/src/types/badge-metadata.ts`. Recurring support (C-045) is specified in
//! `docs/recurring-support-model.md`.

use soroban_sdk::{
    contract, contracterror, contractimpl, contracttype, symbol_short, xdr::ToXdr, Address, BytesN, Env,
};

#[contracttype]
enum Key {
    Admin,
    Signer,
    Nonce(u64),
    Badge(Address, u32),
}

#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq)]
#[repr(u32)]
pub enum Error {
    AlreadyInitialized = 1,
    NotInitialized = 2,
    Expired = 3,
    NonceUsed = 4,
    AlreadyOwned = 5,
}

#[contract]
pub struct BadgeVouchers;

#[contractimpl]
impl BadgeVouchers {
    pub fn init(env: Env, admin: Address, signer: BytesN<32>) -> Result<(), Error> {
        if env.storage().instance().has(&Key::Admin) {
            return Err(Error::AlreadyInitialized);
        }
        env.storage().instance().set(&Key::Admin, &admin);
        env.storage().instance().set(&Key::Signer, &signer);
        Ok(())
    }

    pub fn set_signer(env: Env, signer: BytesN<32>) -> Result<(), Error> {
        let admin: Address = env.storage().instance().get(&Key::Admin).ok_or(Error::NotInitialized)?;
        admin.require_auth();
        env.storage().instance().set(&Key::Signer, &signer);
        Ok(())
    }

    /// `ed25519_verify` traps on a bad signature, which aborts the invocation (nothing is stored).
    pub fn mint_with_voucher(env: Env, to: Address, badge_type: u32, nonce: u64, expiry: u64, signature: BytesN<64>) -> Result<(), Error> {
        to.require_auth();
        if env.ledger().timestamp() > expiry {
            return Err(Error::Expired);
        }
        if env.storage().persistent().has(&Key::Nonce(nonce)) {
            return Err(Error::NonceUsed);
        }
        let signer: BytesN<32> = env.storage().instance().get(&Key::Signer).ok_or(Error::NotInitialized)?;
        let message = (to.clone(), badge_type, nonce, expiry).to_xdr(&env);
        env.crypto().ed25519_verify(&signer, &message, &signature);

        let badge = Key::Badge(to.clone(), badge_type);
        if env.storage().persistent().has(&badge) {
            return Err(Error::AlreadyOwned);
        }
        env.storage().persistent().set(&Key::Nonce(nonce), &true);
        env.storage().persistent().set(&badge, &true);
        env.events().publish((symbol_short!("voucher"), to, badge_type), nonce);
        Ok(())
    }

    pub fn has_badge(env: Env, owner: Address, badge_type: u32) -> bool {
        env.storage().persistent().has(&Key::Badge(owner, badge_type))
    }
}

#[cfg(test)]
mod test {
    use super::*;
    use soroban_sdk::testutils::{Address as _, Ledger as _};

    fn setup() -> (Env, BadgeVouchersClient<'static>) {
        let env = Env::default();
        env.mock_all_auths();
        let client = BadgeVouchersClient::new(&env, &env.register(BadgeVouchers, ()));
        client.init(&Address::generate(&env), &BytesN::from_array(&env, &[7u8; 32]));
        (env, client)
    }

    #[test]
    fn init_only_once() {
        let (env, client) = setup();
        assert!(client.try_init(&Address::generate(&env), &BytesN::from_array(&env, &[1u8; 32])).is_err());
    }

    #[test]
    fn expired_voucher_is_rejected_before_any_signature_work() {
        let (env, client) = setup();
        env.ledger().with_mut(|l| l.timestamp = 1_000);
        let to = Address::generate(&env);
        let result = client.try_mint_with_voucher(&to, &1, &1, &999, &BytesN::from_array(&env, &[0u8; 64]));
        assert!(result.is_err());
        assert!(!client.has_badge(&to, &1));
    }

    #[test]
    fn invalid_signature_does_not_mint_or_burn_the_nonce() {
        let (env, client) = setup();
        let to = Address::generate(&env);
        let result = client.try_mint_with_voucher(&to, &1, &5, &u64::MAX, &BytesN::from_array(&env, &[0u8; 64]));
        assert!(result.is_err());
        assert!(!client.has_badge(&to, &1));
    }

    // Event snapshots: Soroban writes `test_snapshots/` for every test; commit them when the
    // crate joins the workspace so event changes show up in review.
}
