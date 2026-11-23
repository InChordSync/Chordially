#!/bin/sh
# Apply the versioned schema before accepting traffic. `prisma db push` stays
# confined to the ephemeral test database; every real deployment uses the
# checked-in migration history so drift is caught instead of silently applied.
set -e

cd /app/apps/api
./node_modules/.bin/prisma migrate deploy --schema prisma/schema.prisma

cd /app
exec node dist/server.js
