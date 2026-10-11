# ---- Base Stage ----
FROM node:20-alpine AS base

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY src/ ./src/

# ---- Test Stage (Used by Jenkins Pipeline Quality Gate) ----
FROM base AS test

COPY tests/ ./tests/
RUN npm test

# ---- Production Stage (Small, secure image) ----
FROM node:20-alpine AS production

WORKDIR /app
ENV NODE_ENV=production

COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

COPY --from=base /app/src ./src

EXPOSE 3000

HEALTHCHECK --interval=15s --timeout=3s --retries=5 \
  CMD wget -qO- http://localhost:3000/health || exit 1

USER node
CMD ["node", "src/server.js"]
