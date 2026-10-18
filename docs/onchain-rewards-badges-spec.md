# On-chain rewards and badges (C-037)

Specifies which parts of `docs/reward-entitlement-model-badges-guide.md` move on-chain.

## Decisions

1. **Badges are soulbound.** Reputation badges lose meaning if they can be sold, so the badge
   contract has no transfer; the owner may burn. Transferable collectibles are out of scope.
2. **Entitlement is hybrid.**
   - Entitlements derivable from on-chain facts (tip totals) are claimed on-chain by the account
     with no trusted signer (C-041).
   - Entitlements that depend on off-chain activity are claimed with a backend-signed,
     replay-protected voucher (C-042).
   - Presentation (copy, artwork, ordering) and the catalogue of what is *offered* stay off-chain.

## Mapping from entitlement concepts to state

The model guide's concepts are mapped by how they can be proven. Where the guide's exact
type names differ, the mapping follows the concept, not the name.

| Entitlement concept | Proven by | Where it lives |
| --- | --- | --- |
| Tip-threshold reward | Tip Jar stats (C-015) read by cross-contract call | On-chain claim |
| Campaign participation / backer reward | Campaign contribution records or a voucher | On-chain claim (voucher until a campaign-participation proof exists) |
| Streaming, listening, engagement rewards | Backend analytics | Voucher-signed claim; no on-chain proof |
| Reward copy, images, tiers shown in the UI | n/a | Off-chain (Postgres), referenced by `metadata_hash` |
| Whether a reward was granted | Mint event and (owner, type) record | On-chain |
| Revocation | Owner burn only; no admin revoke | On-chain |

## Cost estimate per mint

Not measured yet. A mint writes one persistent entry per (owner, badge type) and one counter
update, and emits one event. Measure with the Soroban test environment's budget
(`env.cost_estimate()`) in the badge contract tests and record the number here before launch;
this document intentionally contains no invented figure.
