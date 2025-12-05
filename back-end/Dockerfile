# Pinned Bun for stability
FROM oven/bun:1.1 AS base
WORKDIR /app

# Install deps (prod, frozen—ensure bun.lockb committed & not ignored)
FROM base AS install
# Verbose COPY for debug (remove after fix)
COPY -v package.json bun.lockb ./
# Fallback if using text lock: COPY package.json bun.lock* ./
RUN bun install --frozen-lockfile --production --ignore-scripts

# Build app
FROM base AS build
COPY --from=install /app/node_modules ./node_modules
COPY . .
RUN bun build --compile --target=bun index.ts --outfile=dist/index

# Prod image: Minimal & secure
FROM gcr.io/distroless/base-debian12
WORKDIR /app
COPY --from=build /app/dist/index ./index

ENV PORT=8080
EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:${PORT}/health || exit 1

USER 65532
CMD ["./index"]