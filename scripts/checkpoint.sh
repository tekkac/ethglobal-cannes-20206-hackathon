#!/usr/bin/env bash
set -euo pipefail

if [ $# -lt 1 ]; then
  echo "usage: scripts/checkpoint.sh \"commit message\" [--push]"
  exit 1
fi

MESSAGE="$1"
PUSH_FLAG="${2:-}"

echo "==> lint"
pnpm --filter web lint

echo "==> build"
pnpm --filter web build

echo "==> contract tests"
forge test --root contracts

echo "==> git status"
git status --short

echo "==> commit"
git add -A
git commit -m "$MESSAGE"

if [ "$PUSH_FLAG" = "--push" ]; then
  echo "==> push"
  git push
fi
