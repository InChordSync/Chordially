FROM node:18-alpine AS builder
WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/api/package.json ./apps/api/
RUN npm i -g pnpm && pnpm install --frozen-lockfile
COPY . .
RUN pnpm --filter @chordially/api build

FROM node:18-alpine
WORKDIR /app
COPY --from=builder /app/apps/api/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
# The API workspace keeps the Prisma CLI and the versioned schema/migrations:
# the entrypoint runs `prisma migrate deploy` before the server starts.
COPY --from=builder /app/apps/api/node_modules ./apps/api/node_modules
COPY --from=builder /app/apps/api/prisma ./apps/api/prisma
COPY --from=builder /app/apps/api/package.json ./apps/api/package.json
COPY apps/api/docker-entrypoint.sh ./docker-entrypoint.sh
RUN chmod +x ./docker-entrypoint.sh
ENTRYPOINT ["./docker-entrypoint.sh"]
