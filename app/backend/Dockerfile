FROM node:20-alpine AS base
WORKDIR /app

FROM base AS production-deps
COPY package*.json ./
RUN npm install --omit=dev && npm cache clean --force

FROM base AS builder
COPY package*.json ./
RUN npm install
COPY . .

FROM base AS production
LABEL maintainer="Alexander"
LABEL description="GovTech Cloud Migration Backend"

ENV NODE_ENV=production

USER node

COPY --from=production-deps --chown=node:node /app/node_modules ./node_modules
COPY --from=builder --chown=node:node /app .

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost:3000/api/health || exit 1

CMD ["node", "server.js"]
