#!/usr/bin/env bash
set -Eeuo pipefail

# 기존 husimcolor Vercel 프로젝트에만 배포합니다.
# 정적 Expo 웹 번들(dist)과 tRPC 서버리스 함수(api/trpc)를 함께 포함하여,
# API가 정적 index.html로 대체되는 배포 문제를 방지합니다.
# 이 스크립트는 DB 마이그레이션·시드·초기화 명령을 실행하지 않습니다.

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
STAGE_DIR="$(mktemp -d)"

cleanup() {
  rm -rf "$STAGE_DIR"
}
trap cleanup EXIT

cd "$PROJECT_ROOT"
rm -rf dist
npx expo export --platform web --output-dir dist

mkdir -p "$STAGE_DIR"
cp -a \
  dist \
  api \
  server \
  drizzle \
  shared \
  scripts \
  package.json \
  pnpm-lock.yaml \
  tsconfig.json \
  vercel.json \
  .vercel \
  "$STAGE_DIR/"

cd "$STAGE_DIR"

if [[ -n "${VERCEL_TOKEN:-}" ]]; then
  npx vercel deploy --prod --yes --token "$VERCEL_TOKEN"
else
  npx vercel deploy --prod --yes
fi
