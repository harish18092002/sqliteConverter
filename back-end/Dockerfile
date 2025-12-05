# Use official Bun image
FROM oven/bun:1 AS base
WORKDIR /app

# Install dependencies
FROM base AS install
COPY package.json bun.lock* ./
RUN bun install --production || bun install --production || bun install --production

# Copy source and build
FROM base AS build
COPY --from=install /app/node_modules ./node_modules
COPY . .
RUN bun build --compile --target=bun index.ts --outfile=dist/index

# Production image - minimal
FROM gcr.io/distroless/base-debian12
WORKDIR /app
COPY --from=build /app/dist/index ./index

# Cloud Run uses PORT env variable
ENV PORT=8080
EXPOSE 8080

# Run the compiled binary
CMD ["./index"]
