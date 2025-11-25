FROM node:20-alpine AS base

WORKDIR /app

COPY package*.json ./

# Production dependencies
FROM base AS production-deps
RUN npm ci --only=production

# Build stage
FROM base AS build
RUN npm ci
COPY . .
RUN npm run build

# Production image
FROM node:20-alpine AS production
WORKDIR /app

ENV NODE_ENV=production

COPY --from=production-deps /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY package*.json ./

EXPOSE 4000

CMD ["node", "dist/main"]