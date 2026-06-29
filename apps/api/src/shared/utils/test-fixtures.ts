import bcrypt from 'bcryptjs'
import { v4 as uuid } from 'uuid'

export function buildUser(overrides: Partial<{
  id: string
  email: string
  passwordHash: string
  displayName: string
  role: 'creator' | 'fan'
}> = {}) {
  const id = overrides.id || uuid()
  return {
    id,
    email: overrides.email || `user-${id.slice(0, 8)}@test.chordially.app`,
    passwordHash: overrides.passwordHash || bcrypt.hashSync('password123', 10),
    displayName: overrides.displayName || 'Test User',
    role: overrides.role || 'fan',
    createdAt: new Date(),
    updatedAt: new Date(),
  }
}

export function buildCreatorProfile(overrides: Partial<{
  id: string
  userId: string
  displayName: string
  slug: string
  bio: string
  genre: string
  location: string
  tags: string
  activityScore: number
  isVerified: boolean
}> = {}) {
  const userId = overrides.userId || uuid()
  return {
    id: overrides.id || uuid(),
    userId,
    displayName: overrides.displayName || 'Test Creator',
    slug: overrides.slug || `creator-${userId.slice(0, 8)}`,
    bio: overrides.bio || 'Test bio',
    genre: overrides.genre || 'electronic',
    location: overrides.location || 'Lagos',
    tags: overrides.tags || JSON.stringify(['test']),
    activityScore: overrides.activityScore ?? 50,
    isVerified: overrides.isVerified ?? false,
    createdAt: new Date(),
    updatedAt: new Date(),
  }
}

export function buildWalletIdentity(overrides: Partial<{
  id: string
  userId: string
  publicKey: string
  network: string
  verified: boolean
}> = {}) {
  return {
    id: overrides.id || uuid(),
    userId: overrides.userId || uuid(),
    publicKey: overrides.publicKey || 'G' + Array.from({ length: 55 }, () => 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'[Math.floor(Math.random() * 32)]).join(''),
    network: overrides.network || 'testnet',
    verified: overrides.verified ?? false,
    createdAt: new Date(),
  }
}
