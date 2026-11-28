FROM node:22-bookworm-slim

RUN apt-get update && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package.json package-lock.json ./
COPY packages/shared/package.json packages/shared/package.json
COPY apps/server/package.json apps/server/package.json
COPY apps/web/package.json apps/web/package.json
COPY apps/studio-3d/package.json apps/studio-3d/package.json
COPY apps/mobile/package.json apps/mobile/package.json

RUN npm install --workspace=packages/shared --workspace=apps/server --no-audit --no-fund

COPY packages/shared packages/shared
COPY apps/server apps/server

RUN npm run build:shared && npm run prisma:generate && npm run build:server

ENV NODE_ENV=production
ENV PORT=4000

EXPOSE 4000

CMD ["node", "apps/server/dist/index.js"]
