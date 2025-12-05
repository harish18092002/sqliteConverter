# Use official Bun image (latest stable)
FROM oven/bun:1 AS base
WORKDIR /app

# Install dependencies (only prod deps for slim image)
FROM base AS install
# If context is root, use: COPY back-end/package.json back-end/bun.lock* ./
COPY package.json bun.lock* ./
# Add frozen-lockfile to match bun.lock exactly; retry not needed (transient 500s)
RUN bun install --frozen-lockfile --production

# Build the app
FROM base AS build
COPY --from=install /app/node_modules ./node_modules
# If context is root, use: COPY back-end/ ./
COPY . .
# Compile to standalone binary (Bun target for runtime efficiency)
RUN bun build --compile --target=bun index.ts --outfile=dist/index

# Production image: Minimal, non-root, secure (no shell)
FROM gcr.io/distroless/base-debian12
WORKDIR /app
COPY --from=build /app/dist/index ./index

# Cloud Run expects PORT env
ENV PORT=8080
EXPOSE 8080

# Healthcheck (optional: ping your API endpoint)
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:${PORT}/health || exit 1

# Run compiled binary (non-root by default in distroless)
CMD ["./index"]
USER 65532  # Non-root user for security