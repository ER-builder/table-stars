# Table Stars

Kids table manners tracker — earn stars for eating nicely, win prizes every 10 stars.

## Stack
- Next.js 16 + TypeScript + Tailwind CSS
- Supabase (DB + Google OAuth)
- canvas-confetti for animations
- PWA (manifest.json, standalone mode)

## Auth
- Google OAuth via Supabase
- Email whitelist: `elulrif@gmail.com`, `schwartzliron@gmail.com`
- Unauthenticated users see read-only kids view
- Parent dashboard at `/parent` requires auth

## Database
- `children` — name + emoji avatar
- `stars` — one per child per day (unique constraint)
- `prizes` — redeemed every 10 stars
- RLS: public read, parent-only write

## Deploy
- Vercel → `tablestars.erapps.xyz`
- GitHub: `ER-builder/table-stars`

@AGENTS.md
