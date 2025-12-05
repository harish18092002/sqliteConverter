# Pinned Bun for stability
FROM oven/bun:1 AS base
WORKDIR /app

# Install deps
FROM base AS install
COPY back-end/package.json back-end/bun.lock ./
RUN bun install --production --no-frozen-lockfile

# Build app
FROM base AS build
COPY --from=install /app/node_modules ./node_modules
COPY back-end ./
RUN bun build --compile --target=bun index.ts --outfile=dist/index

# Production image
FROM gcr.io/distroless/base-debian12
WORKDIR /app
COPY --from=build /app/dist/index ./index

ENV PORT=8080
EXPOSE 8080
CMD ["./index"]
