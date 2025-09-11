# 8-14-Chakrai-App

## Quick Start (Dev)
```bash
npm install --include=dev
npm run dev
Client: http://localhost:5173

API: http://localhost:5000

Dev runs two processes via concurrently. Always start from the repo root.

Production (Smoke Test)

npm run build
npm run start
Visit http://localhost:5000

In prod, Express serves the built client from dist/public.

Scripts (root)
dev — runs API + Vite dev server

build — vite build (client) + esbuild (server) → dist/

start — NODE_ENV=production node dist/index.js

Project Conventions
Single Vite config: only /<root>/vite.config.ts. No client-side Vite config.

Single source of truth: only run scripts from root package.json.

Client /package.json scripts are guards that error on purpose.

Troubleshooting
“Cannot find @vitejs/plugin-react(-swc)” → npm install --include=dev; ensure it’s in root devDependencies.

“cross-env / tsx not recognized” → dev deps missing; npm ci --include=dev.

React dev/prod mismatch → don’t mutate process.env; use import.meta.env.DEV.

Useful Flags
import.meta.env.DEV — true in dev

import.meta.env.MODE — "development" | "production"