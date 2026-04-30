# Table Stars

Kids table manners tracker — earn stars for eating nicely, win prizes every 10 stars.

## Stack
- Next.js 16 + TypeScript + Tailwind CSS
- **Neon** (serverless Postgres, `@neondatabase/serverless`) — `DATABASE_URL` env var
- canvas-confetti for animations
- PWA (manifest.json, standalone mode)

## Auth
- **NextAuth.js v5** (`next-auth@beta`) with Google OAuth provider; allowlist enforced in `signIn` callback at `src/lib/auth.ts`
- Email whitelist: `elulrif@gmail.com`, `schwartzliron@gmail.com`
- Google OAuth client lives in **GCP project `erapps`** — shared with ER-Apps-Home and other erapps.xyz subdomains (not `eluls-os`)
- Required env vars: `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET`, `AUTH_SECRET`, `AUTH_URL`
- Unauthenticated users see read-only kids view; `/parent` requires auth

## Database (Neon)
- Neon project: `table-stars` (org `org-holy-recipe-92583493`, EU Frankfurt)
- Connection string in `DATABASE_URL` Vercel env var
- `children` — name + emoji avatar
- `stars` — one per child per day (unique constraint)
- `prizes` — redeemed every 10 stars
- No RLS — auth enforced at app layer via NextAuth
- Migration history (Apr 2026): Migrated from Supabase to Neon. Old Supabase project (`ejpobggnluzgzdgsubzb`) deleted.

## Deploy
- Vercel → `tablestars.erapps.xyz`
- GitHub: `ER-builder/table-stars`

## Gotchas
- Piping values to `vercel env add` via `echo` stores a trailing `\n` in the value — use `printf '%s'` instead
- Google OAuth client for all erapps.xyz apps lives in GCP project `erapps`, not `eluls-os`
- Must add both JS origin AND redirect URI to the GCP OAuth client for each new subdomain
