# Supabase Setup Guide for YAMIKO

## Step 1: Create Supabase Project

1. Go to https://supabase.com
2. Sign up or log in
3. Click "New Project"
4. Fill in:
   - **Name:** yamiko-db
   - **Database Password:** (save this!)
   - **Region:** Choose closest to you
5. Click "Create new project" (takes ~2 minutes)

## Step 2: Get API Keys

1. In your Supabase dashboard, go to **Settings** → **API**
2. Copy these values:
   - **Project URL** (e.g., `https://xxxxx.supabase.co`)
   - **anon public** key
   - **service_role** key (⚠️ Keep this secret!)

## Step 3: Update Environment Variables

Open `yamiko-web/.env` and update:

```env
NEXT_PUBLIC_SUPABASE_URL="https://your-project.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-key-here"
SUPABASE_SERVICE_ROLE_KEY="your-service-role-key-here"
```

## Step 4: Run SQL Scripts

In Supabase dashboard, go to **SQL Editor** and run these files **in order**:

### 1. Schema (Tables)
Copy and paste contents of `supabase/schema.sql` and click **Run**

### 2. Functions (Economy Logic)
Copy and paste contents of `supabase/functions.sql` and click **Run**

### 3. Policies (Security)
Copy and paste contents of `supabase/policies.sql` and click **Run**

## Step 5: Seed Test Data (Optional)

Run this in SQL Editor to create test users:

```sql
-- Insert test user profiles
INSERT INTO profiles (id, username, avatar_url, level, exp, rubies, energy, role)
VALUES 
  (gen_random_uuid(), 'DarkSlayer', 'https://i.pravatar.cc/150?img=1', 42, 8450, 1250, 85, 'USER'),
  (gen_random_uuid(), 'MikaChan', 'https://i.pravatar.cc/150?img=2', 38, 5200, 580, 45, 'USER'),
  (gen_random_uuid(), 'K1r1to', 'https://i.pravatar.cc/150?img=3', 55, 14200, 3400, 100, 'USER'),
  (gen_random_uuid(), 'AdminUser', 'https://i.pravatar.cc/150?img=4', 99, 99999, 50000, 100, 'ADMIN');

-- Insert test manga
INSERT INTO manga (title, slug, description, cover_url, status, rating, views, author, release_year)
VALUES 
  ('Demon Slayer Chronicles', 'demon-slayer-chronicles', 'An epic tale of demons and warriors', 'https://via.placeholder.com/300x400', 'ONGOING', 4.8, 125000, 'Koyoharu Gotouge', 2023),
  ('Tokyo Ghoul Reborn', 'tokyo-ghoul-reborn', 'Dark fantasy in modern Tokyo', 'https://via.placeholder.com/300x400', 'COMPLETED', 4.9, 250000, 'Sui Ishida', 2022);
```

## Step 6: Test Connection

1. Start your dev server:
   ```bash
   cd yamiko-web
   npm run dev
   ```

2. Visit: http://localhost:3000/api/test-supabase

3. You should see:
   ```json
   {
     "success": true,
     "message": "Supabase connection successful! ✅",
     "database": {
       "connected": true,
       "provider": "Supabase",
       "counts": {
         "users": 4,
         "manga": 2,
         "chapters": 0,
         "guilds": 0
       }
     }
   }
   ```

## Step 7: Test Admin Panel

1. Go to http://localhost:3000/admin/users
2. You should see the test users
3. Select a user and grant 500 EXP
4. Verify level-up message and Energy reward

## Troubleshooting

### Error: "Invalid API key"
- Double-check your `.env` file
- Make sure you copied the correct keys from Supabase dashboard
- Restart dev server after changing `.env`

### Error: "relation does not exist"
- Make sure you ran all SQL scripts in order
- Check SQL Editor for any errors

### Error: "permission denied"
- Make sure you're using the **service_role** key for admin operations
- Check that RLS policies are set up correctly

## Next Steps

✅ Supabase project created
✅ SQL schema deployed
✅ Environment variables configured
✅ Test data seeded
✅ Connection verified

**Your admin panel is now connected to Supabase!**

All data changes in the admin panel will be saved to Supabase and visible across the entire application.
