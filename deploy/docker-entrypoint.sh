#!/bin/sh
set -e
pnpm exec prisma migrate deploy
if [ -f dist/main.js ]; then
  exec node dist/main.js
fi
if [ -f dist/src/main.js ]; then
  exec node dist/src/main.js
fi
echo "Cannot find compiled Nest entry (dist/main.js or dist/src/main.js)"
ls -la dist dist/src 2>/dev/null || true
exit 1
