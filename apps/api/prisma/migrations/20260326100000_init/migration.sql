CREATE TYPE "UserRole" AS ENUM ('FAN', 'ARTIST', 'ADMIN');
CREATE TYPE "UserStatus" AS ENUM ('ACTIVE', 'SUSPENDED', 'DEACTIVATED');
CREATE TYPE "WalletStatus" AS ENUM ('UNVERIFIED', 'VERIFIED', 'DISABLED');
CREATE TYPE "SessionStatus" AS ENUM ('DRAFT', 'LIVE', 'ENDED', 'CANCELLED');
CREATE TYPE "TipStatus" AS ENUM ('DRAFT', 'PENDING', 'CONFIRMED', 'FAILED', 'REFUNDED');
CREATE TYPE "TipAssetCode" AS ENUM ('XLM', 'USDC');
CREATE TYPE "AdminScope" AS ENUM ('SUPPORT', 'MODERATION', 'OPERATIONS', 'SUPER_ADMIN');

CREATE TABLE "User" (
  "id" TEXT NOT NULL,
  "email" TEXT,
  "publicKey" TEXT,
  "username" TEXT NOT NULL,
  "displayName" TEXT,
  "bio" TEXT,
  "avatarUrl" TEXT,
  "role" "UserRole" NOT NULL DEFAULT 'FAN',
  "status" "UserStatus" NOT NULL DEFAULT 'ACTIVE',
  "consentedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ArtistProfile" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "stageName" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "city" TEXT,
  "country" TEXT,
  "genres" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "tagline" TEXT,
  "bannerUrl" TEXT,
  "isFeatured" BOOLEAN NOT NULL DEFAULT false,
  "tippingEnabled" BOOLEAN NOT NULL DEFAULT false,
  "onboardingStep" INTEGER NOT NULL DEFAULT 1,
  "currentWalletId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ArtistProfile_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Wallet" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "artistProfileId" TEXT,
  "network" TEXT NOT NULL DEFAULT 'stellar-testnet',
  "assetCode" "TipAssetCode" NOT NULL DEFAULT 'XLM',
  "publicKey" TEXT NOT NULL,
  "status" "WalletStatus" NOT NULL DEFAULT 'UNVERIFIED',
  "isDefaultForTips" BOOLEAN NOT NULL DEFAULT false,
  "verifiedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Wallet_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Session" (
  "id" TEXT NOT NULL,
  "artistProfileId" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT,
  "streamUrl" TEXT,
  "coverImageUrl" TEXT,
  "status" "SessionStatus" NOT NULL DEFAULT 'DRAFT',
  "scheduledFor" TIMESTAMP(3),
  "startedAt" TIMESTAMP(3),
  "endedAt" TIMESTAMP(3),
  "totalTipsCount" INTEGER NOT NULL DEFAULT 0,
  "totalTipsAmount" DECIMAL(18,7) NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Tip" (
  "id" TEXT NOT NULL,
  "fanId" TEXT NOT NULL,
  "artistProfileId" TEXT NOT NULL,
  "sessionId" TEXT,
  "walletId" TEXT,
  "amount" DECIMAL(18,7) NOT NULL,
  "assetCode" "TipAssetCode" NOT NULL,
  "status" "TipStatus" NOT NULL DEFAULT 'DRAFT',
  "txHash" TEXT,
  "ledgerSequence" INTEGER,
  "note" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "confirmedAt" TIMESTAMP(3),
  CONSTRAINT "Tip_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AdminRole" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "scope" "AdminScope" NOT NULL,
  "assignedById" TEXT,
  "notes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "AdminRole_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AuditLog" (
  "id" TEXT NOT NULL,
  "actorUserId" TEXT,
  "targetUserId" TEXT,
  "action" TEXT NOT NULL,
  "entityType" TEXT NOT NULL,
  "entityId" TEXT NOT NULL,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE UNIQUE INDEX "User_publicKey_key" ON "User"("publicKey");
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");
CREATE UNIQUE INDEX "ArtistProfile_userId_key" ON "ArtistProfile"("userId");
CREATE UNIQUE INDEX "ArtistProfile_slug_key" ON "ArtistProfile"("slug");
CREATE UNIQUE INDEX "Wallet_publicKey_key" ON "Wallet"("publicKey");
CREATE UNIQUE INDEX "Tip_txHash_key" ON "Tip"("txHash");
CREATE UNIQUE INDEX "AdminRole_userId_scope_key" ON "AdminRole"("userId", "scope");

CREATE INDEX "User_role_status_idx" ON "User"("role", "status");
CREATE INDEX "ArtistProfile_isFeatured_stageName_idx" ON "ArtistProfile"("isFeatured", "stageName");
CREATE INDEX "Wallet_userId_status_idx" ON "Wallet"("userId", "status");
CREATE INDEX "Session_status_scheduledFor_idx" ON "Session"("status", "scheduledFor");
CREATE INDEX "Session_artistProfileId_status_idx" ON "Session"("artistProfileId", "status");
CREATE INDEX "Tip_sessionId_status_createdAt_idx" ON "Tip"("sessionId", "status", "createdAt");
CREATE INDEX "Tip_fanId_createdAt_idx" ON "Tip"("fanId", "createdAt");
CREATE INDEX "Tip_artistProfileId_status_idx" ON "Tip"("artistProfileId", "status");
CREATE INDEX "AdminRole_scope_idx" ON "AdminRole"("scope");
CREATE INDEX "AuditLog_entityType_entityId_idx" ON "AuditLog"("entityType", "entityId");
CREATE INDEX "AuditLog_actorUserId_createdAt_idx" ON "AuditLog"("actorUserId", "createdAt");
CREATE INDEX "AuditLog_action_createdAt_idx" ON "AuditLog"("action", "createdAt");

ALTER TABLE "ArtistProfile"
  ADD CONSTRAINT "ArtistProfile_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ArtistProfile"
  ADD CONSTRAINT "ArtistProfile_currentWalletId_fkey"
  FOREIGN KEY ("currentWalletId") REFERENCES "Wallet"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Wallet"
  ADD CONSTRAINT "Wallet_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Wallet"
  ADD CONSTRAINT "Wallet_artistProfileId_fkey"
  FOREIGN KEY ("artistProfileId") REFERENCES "ArtistProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Session"
  ADD CONSTRAINT "Session_artistProfileId_fkey"
  FOREIGN KEY ("artistProfileId") REFERENCES "ArtistProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Tip"
  ADD CONSTRAINT "Tip_fanId_fkey"
  FOREIGN KEY ("fanId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "Tip"
  ADD CONSTRAINT "Tip_artistProfileId_fkey"
  FOREIGN KEY ("artistProfileId") REFERENCES "ArtistProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "Tip"
  ADD CONSTRAINT "Tip_sessionId_fkey"
  FOREIGN KEY ("sessionId") REFERENCES "Session"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Tip"
  ADD CONSTRAINT "Tip_walletId_fkey"
  FOREIGN KEY ("walletId") REFERENCES "Wallet"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "AdminRole"
  ADD CONSTRAINT "AdminRole_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "AuditLog"
  ADD CONSTRAINT "AuditLog_actorUserId_fkey"
  FOREIGN KEY ("actorUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "AuditLog"
  ADD CONSTRAINT "AuditLog_targetUserId_fkey"
  FOREIGN KEY ("targetUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
