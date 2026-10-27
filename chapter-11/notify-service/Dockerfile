# syntax=docker/dockerfile:1
# Source image: tests run during the build, and the final stage holds
# one bundled file on Bun's distroless image (no shell, no npm).

FROM oven/bun:1.4.4-slim AS build
WORKDIR /app
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile
COPY tsconfig.json ./
COPY src ./src
COPY test ./test
RUN bun check && bun test
RUN bun build src/main.ts --target=bun --minify --outfile=dist/main.js

FROM oven/bun:1.4.4-distroless
WORKDIR /app
COPY --from=build /app/dist/main.js ./main.js
ENV NODE_ENV=production HOST=0.0.0.0 PORT=3000
# The base image runs as root (user 0); 65532 is distroless "nonroot".
USER 65532:65532
EXPOSE 3000
ENTRYPOINT ["/usr/local/bin/bun", "/app/main.js"]
