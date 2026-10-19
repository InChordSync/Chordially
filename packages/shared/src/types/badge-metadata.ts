import { z } from 'zod';

/**
 * Badge metadata convention (C-043). A badge's on-chain `metadata_hash` is the SHA-256 of the
 * canonical JSON of this document, stored on IPFS or HTTPS. Web and mobile galleries read it.
 */
export const badgeMetadataSchema = z.object({
  schemaVersion: z.literal(1),
  name: z.string().min(1).max(80),
  description: z.string().max(500),
  /** ipfs://… or https://… */
  image: z.string().regex(/^(ipfs|https):\/\/.+/),
  /** Stable key matching the on-chain badge type registry. */
  badgeType: z.string().min(1).max(64),
  tier: z.enum(['bronze', 'silver', 'gold', 'platinum']).optional(),
  attributes: z
    .array(z.object({ trait: z.string().min(1), value: z.union([z.string(), z.number()]) }))
    .max(20)
    .default([]),
  soulbound: z.literal(true),
});

export type BadgeMetadata = z.infer<typeof badgeMetadataSchema>;

export const badgeMetadataFixtures: BadgeMetadata[] = [
  {
    schemaVersion: 1,
    name: 'First Tip',
    description: 'Received a first tip on Chordially.',
    image: 'ipfs://bafybeigdyrzt5sfp7udm7hu76uh7y26nf3efuylqabf3oclgtqy55fbzdi/first-tip.png',
    badgeType: 'first-tip',
    attributes: [],
    soulbound: true,
  },
  {
    schemaVersion: 1,
    name: 'Gold Supporter',
    description: 'Backed three campaigns.',
    image: 'https://assets.chordially.example/badges/gold-supporter.png',
    badgeType: 'gold-supporter',
    tier: 'gold',
    attributes: [{ trait: 'campaigns', value: 3 }],
    soulbound: true,
  },
];
