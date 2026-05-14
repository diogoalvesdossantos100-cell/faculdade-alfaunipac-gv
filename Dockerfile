# Stage 1 — build
# node:22 (Debian/GNU libc) ensures esbuild uses linux-x64-gnu,
# which is not excluded in pnpm-workspace.yaml overrides.
# Alpine (musl) would require linux-x64-musl which IS excluded.
FROM node:22 AS builder

WORKDIR /app

RUN npm install -g pnpm@11

COPY . .

# --no-frozen-lockfile: lockfile was generated on Windows; Linux skips
# win32 optional binaries (rollup, lightningcss, tailwind oxide).
RUN pnpm install --no-frozen-lockfile

RUN pnpm --filter @workspace/api-server run build

# Stage 2 — runtime
# Only the compiled dist/ files are copied — no node_modules, no sources.
# esbuild bundles all dependencies into dist/index.mjs at build time.
FROM node:22-alpine AS runtime

WORKDIR /app

COPY --from=builder /app/artifacts/api-server/dist ./dist

ENV NODE_ENV=production

EXPOSE 3000

CMD ["node", "--enable-source-maps", "dist/index.mjs"]
