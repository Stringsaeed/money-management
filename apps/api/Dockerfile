# Multi-stage build for the trove-api service.
#
# Build context is the repository root (see apps/api/README.md:
# docker build -f apps/api/Dockerfile .)
# so pnpm can resolve workspace manifests.
#
# NOTE: once the command pipeline lands (#83), add "@trove/domain": "workspace:*"
# to apps/api and re-add its build/copy steps here.

FROM node:22-alpine AS base
RUN corepack enable

FROM base AS build
WORKDIR /repo
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/api/package.json apps/api/
# Ignore lifecycle scripts: the hoisted workspace tree includes native deps
# (e.g. tree-sitter via the mobile app) that need toolchains absent here.
RUN pnpm install --filter @trove/api --frozen-lockfile --ignore-scripts

COPY apps/api apps/api
RUN pnpm --filter @trove/api build

FROM base AS runtime
WORKDIR /repo
ENV NODE_ENV=production
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/api/package.json apps/api/
RUN pnpm install --filter @trove/api --frozen-lockfile --prod --ignore-scripts

COPY --from=build /repo/apps/api/dist apps/api/dist

EXPOSE 3000
CMD ["node", "apps/api/dist/index.js"]
