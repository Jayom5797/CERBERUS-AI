# Stage 1: Build
FROM node:20-slim AS builder

WORKDIR /app

COPY shared/ ./shared/
COPY scripts/ ./scripts/
COPY frontend/package.json frontend/tsconfig.json frontend/tsconfig.node.json ./frontend/
COPY frontend/vite.config.ts frontend/tailwind.config.js frontend/postcss.config.js frontend/index.html ./frontend/
COPY frontend/src ./frontend/src/

WORKDIR /app/frontend
RUN node ../scripts/patch-shared.js
RUN npm install --legacy-peer-deps

ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL

RUN npm run build

# Stage 2: Serve
FROM nginx:alpine
COPY --from=builder /app/frontend/dist /usr/share/nginx/html
COPY frontend/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 8080
CMD ["nginx", "-g", "daemon off;"]
