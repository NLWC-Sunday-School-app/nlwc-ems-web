# syntax=docker/dockerfile:1
FROM node:22-slim AS build
# git: the shared @nlwc/ui and @nlwc/domain packages are git dependencies.
RUN apt-get update && apt-get install -y --no-install-recommends git ca-certificates && rm -rf /var/lib/apt/lists/*
RUN corepack enable && corepack prepare pnpm@10.0.0 --activate
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile
COPY . .
# next.config.mjs bakes the rewrite target in at build time.
ARG API_URL=http://api:8080
ENV API_URL=$API_URL
RUN pnpm build

FROM node:22-slim
WORKDIR /app
ENV NODE_ENV=production
ENV API_URL=http://api:8080
RUN corepack enable && corepack prepare pnpm@10.0.0 --activate
COPY --from=build /app ./
EXPOSE 3000
CMD ["pnpm", "exec", "next", "start", "-p", "3000"]
