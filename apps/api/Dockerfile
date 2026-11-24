FROM node:26-alpine AS base
RUN corepack enable && corepack prepare pnpm@10.6.5 --activate
WORKDIR /workspace

# Install from all workspace manifests first so dependency layers cache well.
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY apps/api/package.json apps/api/package.json
COPY packages/database/package.json packages/database/package.json
COPY packages/shared/package.json packages/shared/package.json
COPY packages/stellar/package.json packages/stellar/package.json
RUN pnpm install --frozen-lockfile

FROM base AS build
COPY . .
RUN pnpm --filter @chordially/shared build \
 && pnpm --filter @chordially/stellar build \
 && pnpm --filter @chordially/api build

FROM base AS deploy
COPY --from=build /workspace /workspace
RUN pnpm --filter @chordially/api deploy --prod --legacy /app

# The deployed workspace packages still point at their TypeScript sources;
# replace those entry points with the compiled JavaScript produced above.
RUN node -e "const fs=require('node:fs'); for (const name of ['shared','stellar']) { const p='/app/node_modules/@chordially/'+name+'/package.json'; const j=JSON.parse(fs.readFileSync(p,'utf8')); j.main='./dist/index.js'; j.types='./dist/index.d.ts'; fs.writeFileSync(p, JSON.stringify(j,null,2)+'\n'); }" \
 && cp -R /workspace/packages/shared/dist /app/node_modules/@chordially/shared/dist \
 && cp -R /workspace/packages/stellar/dist /app/node_modules/@chordially/stellar/dist \
 && cp -R /workspace/apps/api/dist /app/dist \
 && /workspace/node_modules/.bin/prisma generate --schema=/app/prisma/schema.prisma

FROM node:26-alpine AS runtime
ENV NODE_ENV=production
WORKDIR /app
COPY --from=deploy --chown=node:node /app ./

USER node
EXPOSE 4000

HEALTHCHECK --interval=30s --timeout=3s --start-period=20s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:4000/api/health/live').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["node", "dist/main.js"]
