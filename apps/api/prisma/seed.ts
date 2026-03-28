import { PrismaClient, TipAssetCode, TipStatus, UserRole, WalletStatus, SessionStatus, AdminScope } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  await prisma.auditLog.deleteMany();
  await prisma.tip.deleteMany();
  await prisma.session.deleteMany();
  await prisma.adminRole.deleteMany();
  await prisma.wallet.deleteMany();
  await prisma.artistProfile.deleteMany();
  await prisma.user.deleteMany();

  const admin = await prisma.user.create({
    data: {
      email: "admin@chordially.local",
      username: "admin-console",
      displayName: "Operations Admin",
      role: UserRole.ADMIN,
      consentedAt: new Date("2026-03-23T08:00:00.000Z"),
      adminRoles: {
        create: [
          { scope: AdminScope.SUPER_ADMIN, notes: "Hackathon demo owner" },
          { scope: AdminScope.OPERATIONS, notes: "Can monitor sessions and tips" }
        ]
      }
    }
  });

  const fan = await prisma.user.create({
    data: {
      email: "fan@chordially.local",
      username: "chordfan",
      displayName: "Ada Rhythm",
      role: UserRole.FAN,
      bio: "Micro-tip enthusiast",
      consentedAt: new Date("2026-03-24T11:00:00.000Z")
    }
  });

  const artistOwner = await prisma.user.create({
    data: {
      email: "artist@chordially.local",
      username: "novachords",
      displayName: "Nova Chords",
      role: UserRole.ARTIST,
      bio: "Late-night live loop sessions",
      consentedAt: new Date("2026-03-24T12:00:00.000Z")
    }
  });

  const wallet = await prisma.wallet.create({
    data: {
      userId: artistOwner.id,
      network: "stellar-testnet",
      assetCode: TipAssetCode.XLM,
      publicKey: "GCFX3GM2V4N2O5NFEZ5XGUV3VZL57BC4Q43SGV5WW6H2I6J53GVL5W7W",
      status: WalletStatus.VERIFIED,
      isDefaultForTips: true,
      verifiedAt: new Date("2026-03-24T12:15:00.000Z")
    }
  });

  const artist = await prisma.artistProfile.create({
    data: {
      userId: artistOwner.id,
      stageName: "Nova Chords",
      slug: "nova-chords",
      city: "Lagos",
      country: "Nigeria",
      genres: ["Afrobeats", "Indie Soul"],
      tagline: "Loop pedals, midnight chords, instant tips.",
      tippingEnabled: true,
      onboardingStep: 4,
      currentWalletId: wallet.id
    }
  });

  await prisma.wallet.update({
    where: { id: wallet.id },
    data: { artistProfileId: artist.id }
  });

  const liveSession = await prisma.session.create({
    data: {
      artistProfileId: artist.id,
      title: "Rooftop Rehearsal",
      description: "Live loop set with audience-requested riffs.",
      streamUrl: "https://example.com/live/nova-chords",
      status: SessionStatus.LIVE,
      startedAt: new Date("2026-03-26T18:00:00.000Z"),
      totalTipsCount: 2,
      totalTipsAmount: "8.5000000"
    }
  });

  await prisma.tip.createMany({
    data: [
      {
        fanId: fan.id,
        artistProfileId: artist.id,
        sessionId: liveSession.id,
        walletId: wallet.id,
        amount: "5.0000000",
        assetCode: TipAssetCode.XLM,
        status: TipStatus.CONFIRMED,
        txHash: "seed-tip-1",
        ledgerSequence: 512340,
        note: "For the encore",
        confirmedAt: new Date("2026-03-26T18:12:00.000Z")
      },
      {
        fanId: fan.id,
        artistProfileId: artist.id,
        sessionId: liveSession.id,
        walletId: wallet.id,
        amount: "3.5000000",
        assetCode: TipAssetCode.XLM,
        status: TipStatus.PENDING,
        txHash: "seed-tip-2",
        ledgerSequence: 512344,
        note: "Warm-up set"
      }
    ]
  });

  await prisma.auditLog.createMany({
    data: [
      {
        actorUserId: admin.id,
        targetUserId: artistOwner.id,
        action: "artist.seeded",
        entityType: "ArtistProfile",
        entityId: artist.id,
        metadata: { seededBy: "prisma/seed.ts" }
      },
      {
        actorUserId: artistOwner.id,
        targetUserId: artistOwner.id,
        action: "session.started",
        entityType: "Session",
        entityId: liveSession.id,
        metadata: { source: "seed" }
      }
    ]
  });
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
