# Aislely → MkSaaS migration — status & how to finish

Working dir: `aislely-mksaas` (built from the MkSaaS template). Old `projectH0` is untouched (safe fallback + still deployed at aislely-stores.vercel.app).
Dev server: `cd aislely-mksaas && PORT=3001 pnpm dev` → http://localhost:3001
DB: **shares the existing Aurora DB** (no split). MkSaaS tables added additively (no name clash with Aislely's).

## ✅ Done & verified

| Area | How verified |
|---|---|
| DB connected (Aurora, shared) | drizzle migrate applied; live queries return demo data |
| **Email** register/login | `POST /api/auth/sign-up/email` + `/sign-in/email` → 200, real user in Aurora |
| **Phone** register/login | `POST /api/auth/phone-number/send-otp` → 200; OTP logged to server console (dev) |
| **Google** login | wired per Better Auth docs (UI buttons + `account` table); **needs real client ID/secret** |
| Organization multi-tenancy | `organization`/`member`/`invitation` tables created |
| Signup → store bridge | new signup auto-creates Aislely tenant+store (`aisleyTenantId`/`storeSlug` on user) — verified |
| Customer search (RLS+pgvector+tsvector+RRF+Bedrock) | UI at `/s/demo` + `POST /api/store/[slug]/search` — EN/中文 hits + miss→restock, verified |
| Restock signals | `GET /api/restock-signals` (authed) → real demo misses; UI `/restock` |
| Owner dashboard stats | `GET /api/dashboard` (authed) → 90 products, 61% hit rate, top terms; UI `/insights` |

**Key config changes from the stock template:**
- `src/lib/auth.ts`: added `organization()` + `phoneNumber()` plugins, `aisleyTenantId`/`storeSlug` additional fields, `databaseHooks.user.create.before` → `provisionStore`, `requireEmailVerification:false`.
- `src/lib/auth-client.ts`: added `organizationClient()` + `phoneNumberClient()`.
- `src/db/index.ts`: `ssl:{rejectUnauthorized:false}` for Aurora.
- `.env`: `DATABASE_URL` (Aurora, `sslmode=no-verify`), `BETTER_AUTH_SECRET`, `PG*` (app role for RLS), `AWS_*` (Bedrock), OAuth placeholders.
- `src/config/website.tsx`: `autoSubscribeAfterSignUp:false` (no Resend dependency).
- Ported libs (verbatim, no `@/` deps): `src/lib/{bedrock,store-search,aurora,sse,aislely-types,aislely-credits}.ts`.
- New routes: `src/app/api/store/[slug]/search`, `/api/restock-signals`, `/api/dashboard`.
- New pages: `src/app/[locale]/s/[slug]` (customer), `(protected)/restock`, `(protected)/insights`.

## ⏳ Remaining (to finish the full migration)

1. **Capture pipeline (heaviest)** — port `lib/bedrock.detectShelfProducts` + `/api/identify` (photo→Nova vision) + `/api/shelves/[id]/save` (Titan embed + alias + upsert) + the capture review UI. Image upload → keep Vercel Blob (`BLOB_READ_WRITE_TOKEN` already copied) or template S3.
2. **Floor-plan builder** — port `components/FloorPlan` (SVG) + the drag-drop editor; the customer page can then show the shelf map.
3. **Wire console into template nav** — add `/insights`, `/restock`, capture, floor-plan to the template's dashboard sidebar (`src/components/dashboard/*`).
4. **Credits/billing** — map recognition/search usage onto the template's built-in `src/credits/` + pricing tiers; Stripe test mode.
5. **i18n** — move customer/console strings into next-intl `messages/`.
6. **Deploy** — Vercel project, set env (Aurora `DATABASE_URL`, `PG*`, `AWS_*`, `BETTER_AUTH_SECRET`, `NEXT_PUBLIC_BASE_URL`), `vercel --prod`.
7. **Google OAuth credentials** — the ONE item needing the owner's Google Cloud account: create an OAuth client, set `GOOGLE_CLIENT_ID`/`GOOGLE_CLIENT_SECRET` in `.env` + Vercel. Everything else is wired.

## Demo notes
- A registered user `owner2@demo.aislely.app` / `Demo12345!` is linked to the demo store (`store_slug=demo`) so the console shows the real 90-product store's data.
- New signups get their own (empty) store via the provisioning bridge.
