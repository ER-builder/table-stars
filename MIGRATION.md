# Table Stars — Neon Migration Handoff

## Why
Table Stars is on Supabase "ER-Commercial" Pro org, costing $35/month ($25 Pro + $10 for 2nd project). Free tier is maxed (2 projects: Personal OS + Coin Quest). Migrating to Neon (free, no project limits, no auto-pause) eliminates the entire Supabase bill.

## What's Already Done — Committed & Pushed

**Code migration is complete.** Commit `56634b0` on `main`, pushed to GitHub. Build passes.

### Changes in commit:
- `package.json` — removed `@supabase/ssr` + `@supabase/supabase-js`, added `@neondatabase/serverless` + `next-auth@beta`
- `src/lib/supabase.ts` — **deleted**
- `src/lib/db.ts` — **new**, Neon client (same pattern as GLP-1 landing page)
- `src/lib/auth.ts` — **new**, NextAuth.js v5 with Google OAuth + email whitelist (`elulrif@gmail.com`, `schwartzliron@gmail.com`)
- `src/app/api/auth/[...nextauth]/route.ts` — **new**, NextAuth handler
- `src/app/api/stars/route.ts` — **new**, POST toggle star (insert/delete + auto-prize at 10 unredeemed)
- `src/app/page.tsx` — converted from client component (Supabase SDK) to server component (Neon SQL). Keeps prize history section.
- `src/app/parent/page.tsx` — rewritten: server-side auth via NextAuth, server actions for sign-in/sign-out, data fetching via SQL
- `src/app/parent/ParentDashboard.tsx` — **new**, client component with 28-day interactive history grid, star toggling, auto-prize confetti

### Build output:
```
ƒ /                          (server-rendered)
ƒ /api/auth/[...nextauth]   (NextAuth)
ƒ /api/stars                (star toggle + auto-prize)
ƒ /parent                   (parent dashboard)
```

## What Needs To Be Done (on Pi)

### 1. Pull the code
```bash
cd ~/table-stars  # or clone if not on Pi yet
git pull origin main
npm install
```

### 2. Create Neon Database

Option A — via CLI:
```bash
npm install -g neonctl
neonctl auth  # browser-based login
neonctl projects create --name table-stars --region-id aws-eu-central-1
# Copy the connection string from output
```

Option B — via browser at console.neon.tech → New Project → name "table-stars", EU region.

### 3. Run Schema SQL

Connect to Neon and run:
```sql
CREATE TABLE children (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  avatar_emoji TEXT NOT NULL DEFAULT '😊',
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE TABLE stars (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id UUID REFERENCES children(id),
  date DATE NOT NULL,
  awarded_by TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(child_id, date)
);
CREATE TABLE prizes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id UUID REFERENCES children(id),
  stars_redeemed INT DEFAULT 10,
  prize_name TEXT,
  redeemed_at TIMESTAMPTZ DEFAULT now()
);
```

Via CLI: `neonctl connection-string` to get the URL, then `psql <url> -f schema.sql`
Or via Neon SQL Editor in browser.

### 4. Migrate Data from Supabase

The existing Supabase project has data in 3 tables (children: Eitan + Tamar, plus their stars and prizes).

**Option A — pg_dump/psql (if psql is available on Pi):**
```bash
# Install psql if needed: sudo apt install postgresql-client
# Get Supabase connection string from: Supabase dashboard → ER-Commercial → Table Stars → Settings → Database → Connection string
pg_dump "postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres" \
  --data-only --table=public.children --table=public.stars --table=public.prizes > data.sql
psql "[NEON_CONNECTION_STRING]" < data.sql
```

**Option B — manual CSV export/import:**
- Supabase Table Editor → each table → Export CSV
- Neon SQL Editor → Import or write INSERT statements

### 5. Configure Google OAuth

Table Stars already has a Google OAuth client (used with Supabase). In Google Cloud Console:
1. Go to APIs & Services → Credentials → find the existing OAuth client
2. **Add** this redirect URI: `https://tablestars.erapps.xyz/api/auth/callback/google`
3. You can remove the old Supabase redirect URI after cutover
4. Copy the **Client ID** and **Client Secret**

### 6. Set Vercel Env Vars (Pi has Vercel CLI)

```bash
cd ~/table-stars  # must be in the linked project directory

# Generate auth secret
AUTH_SECRET=$(openssl rand -base64 32)
echo "$AUTH_SECRET"  # save this

# Set env vars
vercel env add DATABASE_URL production        # paste Neon connection string
vercel env add AUTH_SECRET production          # paste generated secret
vercel env add AUTH_GOOGLE_ID production       # Google OAuth client ID
vercel env add AUTH_GOOGLE_SECRET production   # Google OAuth client secret

# Also add AUTH_URL for NextAuth
vercel env add AUTH_URL production             # https://tablestars.erapps.xyz

# Remove old Supabase env vars
vercel env rm NEXT_PUBLIC_SUPABASE_URL production
vercel env rm NEXT_PUBLIC_SUPABASE_ANON_KEY production
```

### 7. Trigger Vercel Redeploy

```bash
vercel --prod
# Or push an empty commit to trigger auto-deploy:
# git commit --allow-empty -m "chore: trigger redeploy" && git push
```

### 8. Verify at tablestars.erapps.xyz

- [ ] Homepage loads with children + stars (no auth)
- [ ] Prize history section shows past prizes
- [ ] `/parent` → shows Google sign-in
- [ ] Sign in works (whitelisted emails only)
- [ ] Toggle star on today → confetti fires
- [ ] 28-day history grid → tap past day to add/remove star
- [ ] Auto-prize fires confetti when 10th unredeemed star is added
- [ ] "Given today" muted state shows when today's star exists
- [ ] Sign out works
- [ ] PWA still works (manifest.json untouched)

### 9. Kill Supabase Pro Org (saves $35/month)

Once verified:
1. Supabase dashboard → ER-Commercial → Table Stars → Settings → **Delete project**
2. ER-Commercial → commercial-os → Settings → **Delete project** (unused placeholder)
3. ER-Commercial → Billing → **Downgrade to Free** or **delete org**

**Result: $35/month → $0/month**

## Key Context
- **Repo:** `ER-builder/table-stars`, deployed at `tablestars.erapps.xyz` via Vercel
- **Stack:** Next.js 16 + TypeScript + Tailwind v4 + Neon + NextAuth.js v5
- **GLP-1 project** uses same Neon pattern — reference its `src/lib/db.ts` if needed
- **ER-Apps-Home** uses same NextAuth.js v5 — reference if needed
- The `commercial-os` project on ER-Commercial is an unused placeholder — safe to delete
- Pi path for Vercel CLI work: ensure the repo is cloned and `vercel link` has been run
