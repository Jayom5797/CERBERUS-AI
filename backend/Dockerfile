FROM node:20-slim

WORKDIR /app

COPY shared/ ./shared/
COPY scripts/ ./scripts/
COPY backend/package.json backend/tsconfig.json ./backend/
COPY backend/src ./backend/src/

WORKDIR /app/backend
RUN node ../scripts/patch-shared.js
RUN npm install --legacy-peer-deps

EXPOSE 4000
ENV NODE_ENV=production
CMD ["npx", "tsx", "src/index.ts"]
