# ─────────────────────────────────────────────────────────────────────────────
# Stage 1 – Dependencies: install and cache node_modules
# ─────────────────────────────────────────────────────────────────────────────
FROM node:20-alpine AS deps

WORKDIR /app

COPY package*.json ./
RUN npm ci

# ─────────────────────────────────────────────────────────────────────────────
# Stage 2 – Builder: run Next.js build with standalone output
# ─────────────────────────────────────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

# Copy installed deps from previous stage
COPY --from=deps /app/node_modules ./node_modules

# Copy full source
COPY . .

# Build-time env – tell Next.js where the API lives.
# Overrideable at runtime via docker-compose / --build-arg.
ARG NEXT_PUBLIC_API_URL=http://backend:3001
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL

# Enable standalone output mode for minimal image
ENV NEXT_TELEMETRY_DISABLED=1

RUN npm run build

# ─────────────────────────────────────────────────────────────────────────────
# Stage 3 – Runner: minimal production image
# ─────────────────────────────────────────────────────────────────────────────
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Run as non-root user
RUN addgroup --system --gid 1001 nodejs \
 && adduser  --system --uid 1001 nextjs

# Copy only the build artifacts needed at runtime.
# If `output: "standalone"` is set in next.config, use the standalone dir.
# Otherwise fall back to copying the full .next folder.
COPY --from=builder /app/public           ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/static  ./.next/static

# Try standalone first; compose handles both patterns cleanly.
COPY --from=builder --chown=nextjs:nodejs /app/.next         ./.next
COPY --from=builder /app/node_modules                        ./node_modules
COPY --from=builder /app/package.json                        ./package.json
COPY --from=builder /app/next.config.ts                      ./next.config.ts

USER nextjs

EXPOSE 3000

CMD ["npm", "run", "start"]
