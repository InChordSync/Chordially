// CHORD-039: Migration framework for schema evolution
// Idempotent, ordered migrations tracked in `_migrations` collection.

export interface MigrationRecord {
  _id: string;       // migration name, e.g. "001_add_reputation_indexes"
  appliedAt: Date;
  durationMs: number;
}

export interface Migration {
  name: string;
  up: (db: MigrationDb) => Promise<void>;
  down?: (db: MigrationDb) => Promise<void>;
}

/** Minimal DB interface — swap in your Mongoose/native driver client. */
export interface MigrationDb {
  collection: (name: string) => {
    createIndex: (spec: object, opts?: object) => Promise<void>;
    dropIndex: (name: string) => Promise<void>;
    insertOne: (doc: object) => Promise<void>;
    findOne: (filter: object) => Promise<object | null>;
  };
}

export async function runMigrations(
  db: MigrationDb,
  migrations: Migration[]
): Promise<void> {
  const col = db.collection("_migrations");

  for (const migration of migrations) {
    const already = await col.findOne({ _id: migration.name });
    if (already) continue;

    const start = Date.now();
    await migration.up(db);
    await col.insertOne({
      _id: migration.name,
      appliedAt: new Date(),
      durationMs: Date.now() - start,
    });

    console.log(`[migration] applied: ${migration.name}`);
  }
}

/** Canonical migrations for sprint-1 data model. */
export const sprint1Migrations: Migration[] = [
  {
    name: "001_supporter_reputation_indexes",
    async up(db) {
      const col = db.collection("supporter_reputations");
      await col.createIndex({ userId: 1, artistId: 1 }, { unique: true });
      await col.createIndex({ artistId: 1, "level.level": -1 });
    },
  },
  {
    name: "002_audit_events_indexes",
    async up(db) {
      const col = db.collection("audit_events");
      await col.createIndex({ createdAt: -1 });
      await col.createIndex({ "target.id": 1, createdAt: -1 });
      await col.createIndex({ "actor.userId": 1, createdAt: -1 });
    },
  },
];
