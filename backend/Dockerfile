# ─────────────────────────────────────────────────────────────────────────────
# Stage 1 – Builder: install ALL deps (including devDeps) and compile TypeScript
# ─────────────────────────────────────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

# Copy manifests first to leverage layer caching
COPY package*.json ./

# Install all deps (dev deps needed for tsc)
RUN npm ci

# Copy source and compile
COPY tsconfig.json ./
COPY src/ ./src/

RUN npm run build

# ─────────────────────────────────────────────────────────────────────────────
# Stage 2 – Production: lean runtime image with only production deps
# ─────────────────────────────────────────────────────────────────────────────
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

# Copy manifests and install only production deps
COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

# Copy compiled output from builder
COPY --from=builder /app/dist ./dist

EXPOSE 3001

# Run as non-root user for security
USER node

CMD ["node", "dist/index.js"]
