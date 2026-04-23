# Table Stars

Kids table manners tracker — earn stars for eating nicely, win prizes every 10 stars.

## Stack
- Next.js 16 + TypeScript + Tailwind CSS
- **Neon** (serverless Postgres, `@neondatabase/serverless`) — `DATABASE_URL` env var
- canvas-confetti for animations
- PWA (manifest.json, standalone mode)

## Auth
- Email whitelist: `elulrif@gmail.com`, `schwartzliron@gmail.com`
- Unauthenticated users see read-only kids view
- Parent dashboard at `/parent` requires auth

## Database (Neon)
- `children` — name + emoji avatar
- `stars` — one per child per day (unique constraint)
- `prizes` — redeemed every 10 stars
- Migration history (Apr 2026): Migrated from Supabase to Neon. Old Supabase project (`ejpobggnluzgzdgsubzb`) deleted. Auth via Supabase removed; use simple email-allowlist in app code.

## Deploy
- Vercel → `tablestars.erapps.xyz`
- GitHub: `ER-builder/table-stars`
