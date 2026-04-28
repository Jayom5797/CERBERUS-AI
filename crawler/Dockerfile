FROM mcr.microsoft.com/playwright:v1.59.1-jammy

WORKDIR /app

COPY shared/ ./shared/
COPY scripts/ ./scripts/
COPY crawler/package.json crawler/tsconfig.json ./crawler/
COPY crawler/src ./crawler/src/

WORKDIR /app/crawler
RUN node ../scripts/patch-shared.js
RUN npm install --legacy-peer-deps

EXPOSE 4001
ENV NODE_ENV=production
ENV PLAYWRIGHT_BROWSERS_PATH=/ms-playwright
CMD ["npx", "tsx", "src/index.ts"]
