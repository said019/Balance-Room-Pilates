FROM node:22-bookworm-slim AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci --include=dev
COPY . .
ARG VITE_API_URL=/api
ENV NODE_ENV=production VITE_API_URL=$VITE_API_URL
RUN npm run build

FROM node:22-bookworm-slim
WORKDIR /app
ENV NODE_ENV=production HOST=0.0.0.0 PORT=8080
COPY --from=build /app/dist ./dist
COPY --from=build /app/server.mjs ./server.mjs
USER node
EXPOSE 8080
CMD ["node", "server.mjs"]
