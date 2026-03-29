/**
 * Issue #80 – Add user and artist status management for admins
 *
 * File destination: apps/api/src/modules/admin/admin-status.store.ts
 *
 * What this does:
 *  - In-memory status store for users and artist profiles
 *  - Supports ACTIVE | SUSPENDED | DEACTIVATED states (mirrors Prisma User.status)
 *  - All status changes appended to an in-memory audit log
 *  - Exports query helpers used by admin.routes.ts
 */

import crypto from "node:crypto";

// ─── Types ────────────────────────────────────────────────────────────────────

export type UserStatus = "ACTIVE" | "SUSPENDED" | "DEACTIVATED";
export type EntityType = "USER" | "ARTIST_PROFILE";

export interface StoredUserRecord {
  id: string;
  name: string;
  email: string;
  role: "fan" | "artist" | "admin";
  status: UserStatus;
  createdAt: string;
}

export interface StoredArtistRecord {
  id: string;
  stageName: string;
  slug: string;
  city: string;
  genres: string[];
  status: UserStatus;
  userId: string;
  createdAt: string;
}

export interface StatusAuditEntry {
  id: string;
  entityType: EntityType;
  entityId: string;
  previousStatus: UserStatus;
  newStatus: UserStatus;
  changedById: string;
  changedAt: string;
}

// ─── In-memory stores ─────────────────────────────────────────────────────────

const userRecords = new Map<string, StoredUserRecord>();
const artistRecords = new Map<string, StoredArtistRecord>();
const statusAuditLog: StatusAuditEntry[] = [];

// ─── Seed data ────────────────────────────────────────────────────────────────

function seed() {
  const users: StoredUserRecord[] = [
    {
      id: "fan-1",
      name: "Ada Listener",
      email: "ada@demo.local",
      role: "fan",
      status: "ACTIVE",
      createdAt: "2026-03-01T10:00:00.000Z",
    },
    {
      id: "fan-2",
      name: "Kwame Beats",
      email: "kwame@demo.local",
      role: "fan",
      status: "ACTIVE",
      createdAt: "2026-03-05T11:00:00.000Z",
    },
    {
      id: "fan-3",
      name: "Zara M.",
      email: "zara@demo.local",
      role: "fan",
      status: "SUSPENDED",
      createdAt: "2026-03-10T09:00:00.000Z",
    },
    {
      id: "artist-1",
      name: "Nova Chords",
      email: "nova@demo.local",
      role: "artist",
      status: "ACTIVE",
      createdAt: "2026-02-15T08:00:00.000Z",
    },
    {
      id: "artist-2",
      name: "Street Tempo",
      email: "street@demo.local",
      role: "artist",
      status: "ACTIVE",
      createdAt: "2026-02-20T08:00:00.000Z",
    },
    {
      id: "artist-3",
      name: "Midnight Strings",
      email: "midnight@demo.local",
      role: "artist",
      status: "DEACTIVATED",
      createdAt: "2026-02-25T08:00:00.000Z",
    },
  ];

  const artists: StoredArtistRecord[] = [
    {
      id: "ap-1",
      stageName: "Nova Chords",
      slug: "nova-chords",
      city: "Lagos",
      genres: ["Afrobeats", "Indie Soul"],
      status: "ACTIVE",
      userId: "artist-1",
      createdAt: "2026-02-15T08:00:00.000Z",
    },
    {
      id: "ap-2",
      stageName: "Street Tempo",
      slug: "street-tempo",
      city: "Accra",
      genres: ["Jazz", "Highlife"],
      status: "ACTIVE",
      userId: "artist-2",
      createdAt: "2026-02-20T08:00:00.000Z",
    },
    {
      id: "ap-3",
      stageName: "Midnight Strings",
      slug: "midnight-strings",
      city: "Nairobi",
      genres: ["Folk", "Indie"],
      status: "DEACTIVATED",
      userId: "artist-3",
      createdAt: "2026-02-25T08:00:00.000Z",
    },
  ];

  for (const u of users) userRecords.set(u.id, u);
  for (const a of artists) artistRecords.set(a.id, a);
}

seed();

// ─── Query helpers ────────────────────────────────────────────────────────────

export interface GetUsersQuery {
  role?: "fan" | "artist" | "admin";
  status?: UserStatus;
}

export function getUsers(query: GetUsersQuery = {}): StoredUserRecord[] {
  return [...userRecords.values()]
    .filter((u) => {
      if (query.role && u.role !== query.role) return false;
      if (query.status && u.status !== query.status) return false;
      return true;
    })
    .sort((a, b) => a.name.localeCompare(b.name));
}

export function setUserStatus(
  userId: string,
  newStatus: UserStatus,
  changedById: string
): StoredUserRecord | null {
  const user = userRecords.get(userId);
  if (!user) return null;

  const entry: StatusAuditEntry = {
    id: crypto.randomUUID(),
    entityType: "USER",
    entityId: userId,
    previousStatus: user.status,
    newStatus,
    changedById,
    changedAt: new Date().toISOString(),
  };

  user.status = newStatus;
  statusAuditLog.push(entry);
  return user;
}

export interface GetArtistsQuery {
  status?: UserStatus;
  city?: string;
}

export function getArtists(query: GetArtistsQuery = {}): StoredArtistRecord[] {
  return [...artistRecords.values()]
    .filter((a) => {
      if (query.status && a.status !== query.status) return false;
      if (query.city && a.city.toLowerCase() !== query.city.toLowerCase()) return false;
      return true;
    })
    .sort((a, b) => a.stageName.localeCompare(b.stageName));
}

export function setArtistStatus(
  artistId: string,
  newStatus: UserStatus,
  changedById: string
): StoredArtistRecord | null {
  const artist = artistRecords.get(artistId);
  if (!artist) return null;

  const entry: StatusAuditEntry = {
    id: crypto.randomUUID(),
    entityType: "ARTIST_PROFILE",
    entityId: artistId,
    previousStatus: artist.status,
    newStatus,
    changedById,
    changedAt: new Date().toISOString(),
  };

  artist.status = newStatus;
  statusAuditLog.push(entry);
  return artist;
}

export function getStatusAuditLog(): StatusAuditEntry[] {
  return [...statusAuditLog].reverse();
}
