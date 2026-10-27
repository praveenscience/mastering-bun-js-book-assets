# syntax=docker/dockerfile:1
# Build: install the workspace, type-check and test, then bundle the
# gateway and the key tool into single files (migrations included).
FROM oven/bun:1.4.4-slim AS build
WORKDIR /app
COPY package.json bun.lock tsconfig.json ./
COPY packages ./packages
COPY apps ./apps
COPY tools ./tools
RUN bun install --frozen-lockfile
RUN bun check && bun test packages apps
RUN bun build apps/gateway/src/main.ts apps/gateway/src/create-key.ts \
      apps/gateway/src/forward-worker.ts \
      --target=bun --minify --outdir dist

# Run: distroless, non-root, database on a mounted volume.
FROM oven/bun:1.4.4-distroless
WORKDIR /app
COPY --from=build /app/dist/ ./
ENV NODE_ENV=production HOST=0.0.0.0 PORT=8080 \
    DB_PATH=/data/gateway.db
USER 65532:65532
EXPOSE 8080
ENTRYPOINT ["/usr/local/bin/bun", "/app/main.js"]
