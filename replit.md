# AlfaUnipac GV — Sistema de Gestão Acadêmica

Full-stack SaaS academic management system for Faculdade AlfaUnipac (Governador Valadares/MG), covering student management, attendance, retention tracking, documents, BAP billing, reports, and a dashboard. All UI is in Portuguese BR.

## Run & Operate

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env vars: `DATABASE_URL`, `SESSION_SECRET`
- Seed credentials: `admin@alfaunipac.com / admin123`, `coordenador@alfaunipac.com / coord123`, `secretaria@alfaunipac.com / sec123`

## Stack

- **Monorepo**: pnpm workspaces
- **Node.js**: 24 | **TypeScript**: 5.9
- **Frontend**: React + Vite (artifact `artifacts/alfa-unipac`, path `/`)
- **Backend**: Express 5 (artifact `artifacts/api-server`, path `/api`)
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (contract-first from OpenAPI spec)
- **Build**: esbuild (CJS bundle for api-server)
- **Auth**: JWT via `jsonwebtoken` + `bcryptjs`, token in `localStorage("alfa_token")`

## Where things live

- `lib/api-spec/openapi.yaml` — OpenAPI spec (source of truth for API contract)
- `lib/api-client-react/src/generated/api.ts` — generated React Query hooks (do not edit)
- `lib/api-zod/src/generated/api.ts` — generated Zod schemas (do not edit)
- `lib/db/src/schema.ts` — Drizzle ORM schema (source of truth for DB)
- `artifacts/api-server/src/routes/` — all Express route handlers
- `artifacts/alfa-unipac/src/pages/` — all React page components
- `artifacts/alfa-unipac/src/contexts/auth.tsx` — AuthProvider + RequireAuth guard
- `artifacts/alfa-unipac/src/components/Layout.tsx` — sidebar navigation
- `scripts/src/seed.ts` — database seed script

## Architecture decisions

- Contract-first API: OpenAPI spec drives code generation for both client hooks and Zod validators; backend and frontend stay in sync automatically
- JWT stored in localStorage (not HttpOnly cookie) — acceptable for internal university tool; API uses `Authorization: Bearer` header via custom-fetch.ts
- Business rule: >25% absences → auto-flag retention on chamada save; approving a document auto-justifies chamadas in the document's date range
- All routes prefixed `/api` and routed through the shared reverse proxy; frontend uses relative URLs

## Product

- **Dashboard**: KPI cards (total alunos, turmas, retention flags, recent attendance)
- **Alunos**: list/search/filter students; detail view with frequency % and documents
- **Frequência**: take daily attendance per turma; pre-fills from existing chamadas; auto-flags retention >25%
- **Retenção**: list students at risk; notify, regularize, or approve for failure; audit timeline per student
- **Documentos**: upload/approve/reject academic documents; auto-justifies absences on approval
- **BAP**: generate monthly billing list per course; view history
- **Relatórios**: five report tabs — absences by student, absences by discipline, retention, documents, monthly summary

## User preferences

- All UI text in Brazilian Portuguese
- Dark navy color scheme with cyan (#00E5FF) as accent

## Gotchas

- After `pnpm --filter @workspace/api-spec run codegen`, restart the frontend workflow so Vite picks up new generated files
- `UseQueryOptions` in React Query v5 requires `queryKey` — always pass the corresponding `get*QueryKey()` function when using `{ query: { enabled: ... } }` options
- Do not add leaf workspace packages to root `tsconfig.json` references

## Pointers

- See `.local/skills/pnpm-workspace` for monorepo conventions
- See `.local/skills/pnpm-workspace/references/openapi.md` for codegen setup
- See `.local/skills/pnpm-workspace/references/db.md` for schema migrations
