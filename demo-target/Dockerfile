FROM node:20-slim

WORKDIR /app

COPY demo-target/package.json ./
RUN npm install --legacy-peer-deps

COPY demo-target/server.js ./

EXPOSE 3001

ENV NODE_ENV=production

CMD ["node", "server.js"]
