# Use pinned Bun image for stability
FROM oven/bun:1.1 AS base
WORKDIR /app

# Install dependencies (prod only, frozen for reproducibility)
FROM base AS install
# If build context is repo root: COPY back-end/package.json back-end/bun.lockb ./
COPY package.json bun.lockb ./
# --frozen-lockfile requires up-to-date lockfile; run `bun install` locally & commit if mismatch
RUN bun install --frozen-lockfile --production --ignore-scripts

# Build the app
FROM base AS build
COPY --from=install /app/node_modules ./node_modules
# If build context is repo root: COPY back-end/ ./
COPY . .
# Compile to standalone binary
RUN bun build --compile --target=bun index.ts --outfile=dist/index

# Production image: Minimal & secure
FROM gcr.io/distroless/base-debian12
WORKDIR /app
COPY --from=build /app/dist/index ./index

# Cloud Run PORT
ENV PORT=8080
EXPOSE 8080

# Optional healthcheck (adjust /health to your endpoint)
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:${PORT}/health || exit 1

# Run as non-root
USER 65532
CMD ["./index"]