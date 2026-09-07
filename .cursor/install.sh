#!/usr/bin/env bash
# Idempotent Cloud Agent bootstrap for the Trove Expo monorepo.
# The base image ships Node 22.14.0, but the repo pins Node 24 (.nvmrc) and
# oxlint's TypeScript config requires Node >=22.18.0. We install Node 24 via
# the preinstalled nvm and expose it ahead of the daemon-provided node by
# symlinking into /usr/local/cargo/bin, which is first on PATH.
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_ROOT"

export NVM_DIR="${NVM_DIR:-$HOME/.nvm}"
# shellcheck disable=SC1091
. "$NVM_DIR/nvm.sh"

NODE_VERSION="$(tr -d '[:space:]' < .nvmrc)"
nvm install "$NODE_VERSION"
nvm use "$NODE_VERSION"

NODE_BIN="$(dirname "$(nvm which "$NODE_VERSION")")"

# Activate the pnpm version pinned by package.json's packageManager field.
corepack enable
corepack prepare pnpm@11.24.0 --activate

# Make Node 24 and its tools win over the daemon-provided Node 22 on PATH.
PIN_DIR="/usr/local/cargo/bin"
for bin in node npm npx corepack pnpm; do
  if [ -x "$NODE_BIN/$bin" ]; then
    ln -sf "$NODE_BIN/$bin" "$PIN_DIR/$bin"
  fi
done

echo "Using node $(node --version) / pnpm $(pnpm --version)"

pnpm install --frozen-lockfile
