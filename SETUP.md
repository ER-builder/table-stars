# Table Stars — Setup Instructions

## What's Built
- **Kids view** (`/`) — Read-only star progress cards for Eitan (🦁) and Tamar (🦋)
- **Parent dashboard** (`/parent`) — Google OAuth login, give/remove stars, redeem prizes
- **Animations** — Star sparkle on award, confetti burst on prize redemption
- **PWA** — Installable on iOS home screen, standalone mode, warm yellow theme
- **Auth** — Email whitelist: only `elulrif@gmail.com` and `schwartzliron@gmail.com` can edit
- **Database schema** — Ready in `supabase/schema.sql` with RLS policies

## Supabase Project
- **Project:** Table Stars
- **Ref:** `ejpobggnluzgzdgsubzb`
- **Org:** ER-Commercial (Pro plan)
- **Region:** West EU (Ireland)
- **Dashboard:** https://supabase.com/dashboard/project/ejpobggnluzgzdgsubzb

## Remaining Steps

### Step 1: Run the SQL Schema
1. Open https://supabase.com/dashboard/project/ejpobggnluzgzdgsubzb/sql
2. Paste the entire contents of `supabase/schema.sql`
3. Click **Run**
4. Verify: go to Table Editor — you should see `children` (2 rows), `stars`, `prizes`

### Step 2: Enable Google OAuth
1. Open https://supabase.com/dashboard/project/ejpobggnluzgzdgsubzb/auth/providers
2. Find **Google** and enable it
3. You need a Google OAuth Client ID + Secret. If you don't have one:
   - Go to https://console.cloud.google.com/apis/credentials
   - Create **OAuth 2.0 Client ID** → Web application
   - Authorized redirect URI: `https://ejpobggnluzgzdgsubzb.supabase.co/auth/v1/callback`
   - Copy **Client ID** and **Client Secret** into the Supabase Google provider config
4. Save

### Step 3: Deploy to Vercel (from Pi)
Run these commands from the Pi (`ssh pi`):

```bash
cd /tmp
git clone https://github.com/ER-builder/table-stars.git
cd table-stars
vercel --yes
vercel env add NEXT_PUBLIC_SUPABASE_URL production <<< "https://ejpobggnluzgzdgsubzb.supabase.co"
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production <<< "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVqcG9iZ2dubHV6Z3pkZ3N1YnpiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU3NjYzODQsImV4cCI6MjA5MTM0MjM4NH0.ja_ddBArcpjpJn1AOshiOE-yt0NH-uE06mkpEDzwreY"
vercel domains add tablestars.erapps.xyz
vercel --prod
```

### Step 4: DNS (if not already configured)
Add a CNAME record for `tablestars.erapps.xyz` pointing to `cname.vercel-dns.com` in your DNS provider.

## Verification Checklist
- [ ] Open `tablestars.erapps.xyz` — see Eitan and Tamar cards (empty stars)
- [ ] Tap "Parent Login" → sign in with Google → see action buttons
- [ ] Tap "Give Star ⭐" → star appears with sparkle animation
- [ ] Add 10 stars → "Award Prize 🎁" button appears → tap → confetti
- [ ] Try signing in with a non-whitelisted email → should be rejected
- [ ] Add to iOS home screen (Share → Add to Home Screen) → opens as standalone app

## Local Development
```bash
cd /Users/elul/Projects/apps/table-stars
npm run dev
# Open http://localhost:3000
```

Env vars are in `.env.local` (already created, gitignored).
