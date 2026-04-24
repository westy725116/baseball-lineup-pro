# Lineup Pro — Setup

## One-time Supabase setup

You need to do these two things in your Supabase dashboard before the app will work:

### 1. Create the `games` table

1. Go to [Supabase Dashboard](https://supabase.com/dashboard) → your project → **SQL Editor**.
2. Click **New query**.
3. Copy the entire contents of [`supabase/schema.sql`](supabase/schema.sql) and paste it in.
4. Click **Run**.

You should see "Success. No rows returned." That created the `games` table with row-level security so each user only sees their own games.

### 2. (Dev only) Disable email confirmation

For faster testing, disable email confirmation:

1. Supabase Dashboard → **Authentication** → **Providers** → **Email**.
2. Turn **off** "Confirm email".
3. Save.

You can re-enable this when you're ready to ship to real users.

### 3. (Production only) Add your live URL to redirect URLs

Once you deploy to Vercel:

1. Supabase Dashboard → **Authentication** → **URL Configuration**.
2. Add your Vercel URL (e.g., `https://lineup-pro.vercel.app`) to **Site URL** and to **Redirect URLs**.

## Run locally

```bash
npm run dev
```

Then open http://localhost:3000.
