#![no_std]
//! Shared money math for Chordially contracts.
//!
//! Rules:
//! - Rounding is always **down** for fees and shares; the remainder goes to the creator or
//!   primary recipient, so a platform fee can never exceed its stated percentage.
//! - Amounts are `i128` in the token's smallest unit (stroops for XLM). `amount <= 0` is
//!   invalid for [`split_fee`] and [`distribute`]; callers get `None`, never a panic.
//! - Only checked arithmetic is used; there are no integer-width `as` casts.

extern crate alloc;

use alloc::vec::Vec;

/// Basis points in 100%.
pub const BPS_DENOMINATOR: i128 = 10_000;

/// Reserved error-code ranges (see README): contracts keep their own `#[contracterror]` enums
/// but must number them inside their range.
pub mod error_ranges {
    pub const COMMON: (u32, u32) = (1, 99);
    pub const TIP_JAR: (u32, u32) = (100, 199);
    pub const SPLITS: (u32, u32) = (200, 299);
    pub const CAMPAIGNS: (u32, u32) = (300, 399);
    pub const SUBSCRIPTIONS: (u32, u32) = (400, 499);
}

/// `floor(amount * bps / 10_000)`.
///
/// Returns `None` if `amount` is negative, `bps` exceeds 10_000, or the multiplication overflows.
pub fn bps_of(amount: i128, bps: u32) -> Option<i128> {
    if amount < 0 || i128::from(bps) > BPS_DENOMINATOR {
        return None;
    }
    amount
        .checked_mul(i128::from(bps))?
        .checked_div(BPS_DENOMINATOR)
}

/// Splits `amount` into `(fee, remainder)` where `fee = bps_of(amount, fee_bps)` (rounded down).
///
/// Invariant: `fee + remainder == amount`. Returns `None` if `amount <= 0` or [`bps_of`] fails.
pub fn split_fee(amount: i128, fee_bps: u32) -> Option<(i128, i128)> {
    if amount <= 0 {
        return None;
    }
    let fee = bps_of(amount, fee_bps)?;
    Some((fee, amount.checked_sub(fee)?))
}

/// Distributes `amount` over `shares_bps`, rounding each share down; the dust goes to the share
/// at `dust_index`.
///
/// Invariant: the outputs sum to `amount`. Returns `None` if `amount <= 0`, the list is empty,
/// `dust_index` is out of range, the shares do not sum to 10_000, or arithmetic overflows.
pub fn distribute(amount: i128, shares_bps: &[u32], dust_index: usize) -> Option<Vec<i128>> {
    if amount <= 0 || shares_bps.is_empty() || dust_index >= shares_bps.len() {
        return None;
    }
    let total_bps = shares_bps
        .iter()
        .try_fold(0u64, |acc, s| acc.checked_add(u64::from(*s)))?;
    if i128::from(total_bps) != BPS_DENOMINATOR {
        return None;
    }
    let mut out = Vec::with_capacity(shares_bps.len());
    let mut distributed: i128 = 0;
    for s in shares_bps {
        let part = bps_of(amount, *s)?;
        distributed = distributed.checked_add(part)?;
        out.push(part);
    }
    let dust = amount.checked_sub(distributed)?;
    let slot = out.get_mut(dust_index)?;
    *slot = slot.checked_add(dust)?;
    Some(out)
}

#[cfg(test)]
#[allow(
    clippy::unwrap_used,
    clippy::expect_used,
    clippy::panic,
    clippy::arithmetic_side_effects
)]
mod tests {
    use super::*;
    use alloc::vec;

    #[test]
    fn one_stroop() {
        assert_eq!(bps_of(1, 250), Some(0));
        assert_eq!(split_fee(1, 250), Some((0, 1)));
        assert_eq!(distribute(1, &[7000, 2000, 1000], 0), Some(vec![1, 0, 0]));
    }

    #[test]
    fn extremes() {
        assert_eq!(bps_of(i128::MAX, 0), Some(0));
        assert_eq!(bps_of(i128::MAX, 10_000), None);
        assert_eq!(split_fee(i128::MAX, 10_000), None);
        assert_eq!(split_fee(100, 0), Some((0, 100)));
        assert_eq!(split_fee(100, 10_000), Some((100, 0)));
        assert_eq!(distribute(i128::MAX, &[5000, 5000], 0), None);
    }

    #[test]
    fn invalid_inputs() {
        assert_eq!(bps_of(-1, 100), None);
        assert_eq!(bps_of(100, 10_001), None);
        assert_eq!(split_fee(0, 100), None);
        assert_eq!(split_fee(-5, 100), None);
        assert_eq!(distribute(0, &[10_000], 0), None);
        assert_eq!(distribute(-1, &[10_000], 0), None);
        assert_eq!(distribute(100, &[], 0), None);
        assert_eq!(distribute(100, &[5000, 4000], 0), None);
        assert_eq!(distribute(100, &[5000, 5000, 1], 0), None);
        assert_eq!(distribute(100, &[5000, 5000], 2), None);
        assert_eq!(distribute(100, &[u32::MAX, u32::MAX], 0), None);
    }

    #[test]
    fn worked_example() {
        // 1,000.0000001 XLM with a 2.5% fee, remainder split 70/20/10; dust to the creator.
        let amount: i128 = 10_000_000_001;
        let (fee, rest) = split_fee(amount, 250).unwrap();
        assert_eq!((fee, rest), (250_000_000, 9_750_000_001));
        let parts = distribute(rest, &[7000, 2000, 1000], 0).unwrap();
        assert_eq!(parts, vec![6_825_000_001, 1_950_000_000, 975_000_000]);
    }

    #[test]
    fn fee_plus_remainder_equals_amount() {
        for amount in 1..=300i128 {
            for bps in (0..=10_000u32).step_by(37).chain([10_000]) {
                let (fee, rest) = split_fee(amount, bps).unwrap();
                assert_eq!(fee + rest, amount);
                assert!(fee <= amount * i128::from(bps) / BPS_DENOMINATOR);
            }
        }
    }

    #[test]
    fn distribute_sums_to_amount() {
        let mut seed: u64 = 0x2545_F491_4F6C_DD1D;
        let mut next = || {
            seed ^= seed << 13;
            seed ^= seed >> 7;
            seed ^= seed << 17;
            seed
        };
        for _ in 0..2_000 {
            let amount = i128::from(next() % 1_000_000_000_000) + 1;
            let a = u32::try_from(next() % 10_001).unwrap();
            let b = u32::try_from(next() % (10_001 - u64::from(a))).unwrap();
            let shares = [a, b, 10_000 - a - b];
            let idx = usize::try_from(next() % 3).unwrap();
            let out = distribute(amount, &shares, idx).unwrap();
            assert_eq!(out.iter().sum::<i128>(), amount);
        }
    }
}
