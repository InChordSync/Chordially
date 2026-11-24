-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "emailVerified" BOOLEAN NOT NULL DEFAULT false,
    "failedLoginAttempts" INTEGER NOT NULL DEFAULT 0,
    "lockedUntil" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "EmailVerificationToken" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" DATETIME NOT NULL,
    "usedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "EmailVerificationToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PasswordResetToken" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" DATETIME NOT NULL,
    "revokedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "PasswordResetToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CreatorProfile" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "bio" TEXT,
    "avatarUrl" TEXT,
    "genre" TEXT,
    "location" TEXT,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "CreatorProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "FanProfile" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "avatarUrl" TEXT,
    "genrePrefs" TEXT NOT NULL DEFAULT '[]',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "FanProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Wallet" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "publicKey" TEXT NOT NULL,
    "walletType" TEXT NOT NULL DEFAULT 'custodial',
    "encryptedSecret" TEXT,
    "encryptedDataKey" TEXT,
    "iv" TEXT,
    "authTag" TEXT,
    "network" TEXT NOT NULL DEFAULT 'testnet',
    "usdcTrustline" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Wallet_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Tip" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "idempotencyKey" TEXT NOT NULL,
    "fanUserId" TEXT NOT NULL,
    "creatorId" TEXT NOT NULL,
    "streamId" TEXT,
    "amount" TEXT NOT NULL,
    "asset" TEXT NOT NULL DEFAULT 'native',
    "status" TEXT NOT NULL DEFAULT 'pending',
    "unsignedTransactionXdr" TEXT,
    "txHash" TEXT,
    "failureReason" TEXT,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "retriedFromTipId" TEXT,
    CONSTRAINT "Tip_fanUserId_fkey" FOREIGN KEY ("fanUserId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Tip_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "CreatorProfile" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Tip_streamId_fkey" FOREIGN KEY ("streamId") REFERENCES "Stream" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Tip_retriedFromTipId_fkey" FOREIGN KEY ("retriedFromTipId") REFERENCES "Tip" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Stream" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "creatorId" TEXT NOT NULL,
    "title" TEXT,
    "startedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endedAt" DATETIME,
    CONSTRAINT "Stream_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "CreatorProfile" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "StreamPayoutConfig" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "streamId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "StreamPayoutConfig_streamId_fkey" FOREIGN KEY ("streamId") REFERENCES "Stream" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "StreamPayoutConfigPayee" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "payoutConfigId" TEXT NOT NULL,
    "creatorId" TEXT NOT NULL,
    "percentage" REAL NOT NULL,
    CONSTRAINT "StreamPayoutConfigPayee_payoutConfigId_fkey" FOREIGN KEY ("payoutConfigId") REFERENCES "StreamPayoutConfig" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "StreamPayoutConfigPayee_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "CreatorProfile" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "TipPayout" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tipId" TEXT NOT NULL,
    "creatorId" TEXT NOT NULL,
    "percentage" REAL NOT NULL,
    "amount" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "txHash" TEXT,
    "failureReason" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "TipPayout_tipId_fkey" FOREIGN KEY ("tipId") REFERENCES "Tip" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "TipPayout_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "CreatorProfile" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CreatorPayout" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "idempotencyKey" TEXT NOT NULL,
    "creatorId" TEXT NOT NULL,
    "assetCode" TEXT NOT NULL,
    "amount" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'awaiting_anchor_details',
    "anchorTransactionId" TEXT NOT NULL,
    "interactiveUrl" TEXT NOT NULL,
    "txHash" TEXT,
    "failureReason" TEXT,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "CreatorPayout_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "CreatorProfile" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "TransactionIdempotencyRecord" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "key" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "requestPath" TEXT NOT NULL,
    "responseBody" TEXT NOT NULL DEFAULT '{}',
    "statusCode" INTEGER NOT NULL DEFAULT 200,
    "expiresAt" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "WalletDeposit" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "assetCode" TEXT NOT NULL,
    "anchorTransactionId" TEXT NOT NULL,
    "interactiveUrl" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'incomplete',
    "amountIn" TEXT,
    "failureReason" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "WalletDeposit_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "recipientId" TEXT NOT NULL,
    "actorId" TEXT,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "metadata" TEXT NOT NULL DEFAULT '{}',
    "read" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Notification_recipientId_fkey" FOREIGN KEY ("recipientId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "RefreshToken" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" DATETIME NOT NULL,
    "revokedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "RefreshToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Bookmark" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "fanId" TEXT NOT NULL,
    "creatorId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Bookmark_fanId_fkey" FOREIGN KEY ("fanId") REFERENCES "FanProfile" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Bookmark_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "CreatorProfile" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "EmailVerificationToken_tokenHash_key" ON "EmailVerificationToken"("tokenHash");

-- CreateIndex
CREATE INDEX "EmailVerificationToken_userId_idx" ON "EmailVerificationToken"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "PasswordResetToken_tokenHash_key" ON "PasswordResetToken"("tokenHash");

-- CreateIndex
CREATE INDEX "PasswordResetToken_userId_idx" ON "PasswordResetToken"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "CreatorProfile_userId_key" ON "CreatorProfile"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "CreatorProfile_slug_key" ON "CreatorProfile"("slug");

-- CreateIndex
CREATE INDEX "CreatorProfile_genre_idx" ON "CreatorProfile"("genre");

-- CreateIndex
CREATE INDEX "CreatorProfile_location_idx" ON "CreatorProfile"("location");

-- CreateIndex
CREATE INDEX "CreatorProfile_isVerified_idx" ON "CreatorProfile"("isVerified");

-- CreateIndex
CREATE UNIQUE INDEX "FanProfile_userId_key" ON "FanProfile"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Wallet_userId_key" ON "Wallet"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Wallet_publicKey_key" ON "Wallet"("publicKey");

-- CreateIndex
CREATE INDEX "Tip_status_updatedAt_idx" ON "Tip"("status", "updatedAt");

-- CreateIndex
CREATE INDEX "Tip_creatorId_createdAt_idx" ON "Tip"("creatorId", "createdAt");

-- CreateIndex
CREATE INDEX "Tip_streamId_createdAt_idx" ON "Tip"("streamId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Tip_fanUserId_idempotencyKey_key" ON "Tip"("fanUserId", "idempotencyKey");

-- CreateIndex
CREATE INDEX "Stream_creatorId_idx" ON "Stream"("creatorId");

-- CreateIndex
CREATE INDEX "Stream_creatorId_endedAt_idx" ON "Stream"("creatorId", "endedAt");

-- CreateIndex
CREATE UNIQUE INDEX "StreamPayoutConfig_streamId_key" ON "StreamPayoutConfig"("streamId");

-- CreateIndex
CREATE INDEX "StreamPayoutConfigPayee_creatorId_idx" ON "StreamPayoutConfigPayee"("creatorId");

-- CreateIndex
CREATE UNIQUE INDEX "StreamPayoutConfigPayee_payoutConfigId_creatorId_key" ON "StreamPayoutConfigPayee"("payoutConfigId", "creatorId");

-- CreateIndex
CREATE INDEX "TipPayout_tipId_idx" ON "TipPayout"("tipId");

-- CreateIndex
CREATE INDEX "TipPayout_creatorId_idx" ON "TipPayout"("creatorId");

-- CreateIndex
CREATE INDEX "CreatorPayout_creatorId_idx" ON "CreatorPayout"("creatorId");

-- CreateIndex
CREATE UNIQUE INDEX "CreatorPayout_creatorId_idempotencyKey_key" ON "CreatorPayout"("creatorId", "idempotencyKey");

-- CreateIndex
CREATE UNIQUE INDEX "CreatorPayout_anchorTransactionId_key" ON "CreatorPayout"("anchorTransactionId");

-- CreateIndex
CREATE INDEX "TransactionIdempotencyRecord_key_idx" ON "TransactionIdempotencyRecord"("key");

-- CreateIndex
CREATE UNIQUE INDEX "TransactionIdempotencyRecord_ownerId_key_key" ON "TransactionIdempotencyRecord"("ownerId", "key");

-- CreateIndex
CREATE UNIQUE INDEX "WalletDeposit_anchorTransactionId_key" ON "WalletDeposit"("anchorTransactionId");

-- CreateIndex
CREATE INDEX "WalletDeposit_userId_idx" ON "WalletDeposit"("userId");

-- CreateIndex
CREATE INDEX "Notification_recipientId_idx" ON "Notification"("recipientId");

-- CreateIndex
CREATE INDEX "Notification_recipientId_read_idx" ON "Notification"("recipientId", "read");

-- CreateIndex
CREATE INDEX "Notification_recipientId_createdAt_idx" ON "Notification"("recipientId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "RefreshToken_tokenHash_key" ON "RefreshToken"("tokenHash");

-- CreateIndex
CREATE INDEX "RefreshToken_userId_idx" ON "RefreshToken"("userId");

-- CreateIndex
CREATE INDEX "Bookmark_fanId_idx" ON "Bookmark"("fanId");

-- CreateIndex
CREATE UNIQUE INDEX "Bookmark_fanId_creatorId_key" ON "Bookmark"("fanId", "creatorId");
