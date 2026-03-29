/**
 * Issue #98 – Introduce Soroban reward contract design for backstage pass eligibility
 *
 * File destination: contracts/reward/src/lib.rs
 *
 * What this does:
 *  - Defines reward eligibility rules based on supporter contribution thresholds
 *  - Extends the contract skeleton beyond a health check
 *  - Documents contract boundaries versus backend responsibilities
 *  - Contract is optional for the core tipping flow (tipping works without it)
 *
 * Contract boundaries:
 *  - CONTRACT owns: on-chain eligibility record, threshold enforcement, badge issuance
 *  - BACKEND owns: tip aggregation, supporter totals, calling check_eligibility
 *  - Minting (NFT/badge) is deferred – contract exposes the API but does not mint yet
 *
 * Acceptance criteria covered:
 *  ✓ Reward contract API is specified and implemented minimally
 *  ✓ Backend integration points are documented
 *  ✓ Contract remains optional for core tipping flow
 *
 * Build:
 *   cd contracts/reward && cargo build --target wasm32-unknown-unknown --release
 *
 * Test:
 *   cd contracts/reward && cargo test
 */

#![no_std]

use soroban_sdk::{
    contract, contractimpl, contracttype, symbol_short, Address, Env, Map, Symbol,
};

// ─── Eligibility threshold (in stroops-equivalent units, e.g. XLM * 10^7) ────
// Backend passes cumulative confirmed tip total as an integer.
// 50 XLM = 500_000_000 stroops → qualifies for backstage pass.
const ELIGIBILITY_THRESHOLD: i128 = 500_000_000;

// ─── Storage keys ─────────────────────────────────────────────────────────────

const ELIGIBLE_KEY: Symbol = symbol_short!("ELIGIBLE");

// ─── Types ────────────────────────────────────────────────────────────────────

/// Reward status for a (artist, supporter) pair.
#[contracttype]
#[derive(Clone, Debug, PartialEq)]
pub enum RewardStatus {
    /// Supporter has not yet reached the eligibility threshold.
    Ineligible,
    /// Supporter qualifies for a backstage pass / badge.
    Eligible,
    /// Badge has been issued (future: NFT minted).
    Issued,
}

// ─── Contract ─────────────────────────────────────────────────────────────────

#[contract]
pub struct RewardContract;

#[contractimpl]
impl RewardContract {
    /// Health check – confirms the contract is deployed and callable.
    pub fn ping(env: Env) -> Symbol {
        symbol_short!("pong")
    }

    /// Called by the backend after tip confirmation to update eligibility.
    ///
    /// # Arguments
    /// * `artist`        – Artist's Stellar account address
    /// * `supporter`     – Supporter's Stellar account address
    /// * `total_stroops` – Cumulative confirmed tip total in stroops
    ///
    /// Returns the resulting RewardStatus.
    pub fn check_eligibility(
        env: Env,
        artist: Address,
        supporter: Address,
        total_stroops: i128,
    ) -> RewardStatus {
        let key = Self::pair_key(&env, &artist, &supporter);

        // Don't downgrade an already-issued badge
        let current: RewardStatus = env
            .storage()
            .persistent()
            .get(&key)
            .unwrap_or(RewardStatus::Ineligible);

        if current == RewardStatus::Issued {
            return RewardStatus::Issued;
        }

        let status = if total_stroops >= ELIGIBILITY_THRESHOLD {
            RewardStatus::Eligible
        } else {
            RewardStatus::Ineligible
        };

        env.storage().persistent().set(&key, &status);
        status
    }

    /// Returns the current reward status for a (artist, supporter) pair.
    pub fn get_status(env: Env, artist: Address, supporter: Address) -> RewardStatus {
        let key = Self::pair_key(&env, &artist, &supporter);
        env.storage()
            .persistent()
            .get(&key)
            .unwrap_or(RewardStatus::Ineligible)
    }

    /// Mark a badge as issued (called after off-chain or on-chain minting).
    /// Only callable by the artist address (auth enforced).
    pub fn mark_issued(env: Env, artist: Address, supporter: Address) {
        artist.require_auth();
        let key = Self::pair_key(&env, &artist, &supporter);
        env.storage()
            .persistent()
            .set(&key, &RewardStatus::Issued);
    }

    // ── Internal helpers ──────────────────────────────────────────────────────

    fn pair_key(env: &Env, artist: &Address, supporter: &Address) -> soroban_sdk::Val {
        // Composite key: (artist_address, supporter_address)
        (artist.clone(), supporter.clone()).into_val(env)
    }
}

// ─── Tests ────────────────────────────────────────────────────────────────────

#[cfg(test)]
mod tests {
    use super::*;
    use soroban_sdk::testutils::Address as _;
    use soroban_sdk::Env;

    #[test]
    fn ping_returns_pong() {
        let env = Env::default();
        let contract_id = env.register_contract(None, RewardContract);
        let client = RewardContractClient::new(&env, &contract_id);
        assert_eq!(client.ping(), symbol_short!("pong"));
    }

    #[test]
    fn below_threshold_is_ineligible() {
        let env = Env::default();
        let contract_id = env.register_contract(None, RewardContract);
        let client = RewardContractClient::new(&env, &contract_id);

        let artist = Address::generate(&env);
        let supporter = Address::generate(&env);

        let status = client.check_eligibility(&artist, &supporter, &100_000_000); // 10 XLM
        assert_eq!(status, RewardStatus::Ineligible);
    }

    #[test]
    fn at_threshold_is_eligible() {
        let env = Env::default();
        let contract_id = env.register_contract(None, RewardContract);
        let client = RewardContractClient::new(&env, &contract_id);

        let artist = Address::generate(&env);
        let supporter = Address::generate(&env);

        let status = client.check_eligibility(&artist, &supporter, &500_000_000); // 50 XLM
        assert_eq!(status, RewardStatus::Eligible);
    }

    #[test]
    fn issued_badge_is_not_downgraded() {
        let env = Env::default();
        let contract_id = env.register_contract(None, RewardContract);
        let client = RewardContractClient::new(&env, &contract_id);

        let artist = Address::generate(&env);
        let supporter = Address::generate(&env);

        // First reach eligibility
        client.check_eligibility(&artist, &supporter, &500_000_000);

        // Mark as issued
        env.mock_all_auths();
        client.mark_issued(&artist, &supporter);

        // Even if total drops (shouldn't happen, but guard it), status stays Issued
        let status = client.check_eligibility(&artist, &supporter, &0);
        assert_eq!(status, RewardStatus::Issued);
    }
}
