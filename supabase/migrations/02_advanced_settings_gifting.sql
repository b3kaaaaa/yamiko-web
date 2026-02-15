-- Yamiko Advanced Features & Economy Migration
-- RUN THIS IN SUPABASE SQL EDITOR AFTER 01_profile_ecosystem.sql

-- ==========================================
-- 1. PROFILE EXPANSION
-- ==========================================
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS birthday DATE,
ADD COLUMN IF NOT EXISTS gender TEXT CHECK (gender IN ('MALE', 'FEMALE', 'OTHER', 'HIDDEN')),
ADD COLUMN IF NOT EXISTS main_guild_id UUID REFERENCES guilds(id),
ADD COLUMN IF NOT EXISTS content_preference TEXT DEFAULT 'ALL' CHECK (content_preference IN ('SHONEN', 'SHOJO', 'SEINEN', 'JOSEI', 'ALL')),
ADD COLUMN IF NOT EXISTS social_links JSONB DEFAULT '{}'::jsonb, -- { discord: "tag", vk: "link" }
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

-- Soft Delete Policy Update (applied to all queries if RLS is enabled)
-- Note: Standard RLS often focuses on user access. For soft delete, we usually filter in the application query 
-- or add a policy like "Users can view active profiles".
-- Let's add a policy for Soft Delete on Profiles specifically.
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON profiles;
CREATE POLICY "Profiles are viewable by everyone" ON profiles 
FOR SELECT USING (deleted_at IS NULL);

-- ==========================================
-- 2. SETTINGS EXPANSION
-- ==========================================
ALTER TABLE user_settings
ADD COLUMN IF NOT EXISTS show_nsfw BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS allow_gifts BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS notify_manga_updates BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS notify_mentions BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS notify_friend_requests BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS notify_gifts BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS notify_system_news BOOLEAN DEFAULT TRUE;

-- ==========================================
-- 3. MODERATION SYSTEM
-- ==========================================
CREATE TABLE IF NOT EXISTS moderation_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL, -- The Offender
  admin_id UUID REFERENCES profiles(id) NOT NULL, -- The Enforcer
  type TEXT NOT NULL CHECK (type IN ('WARN', 'MUTE', 'BAN')),
  reason TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ, -- Null = Permanent
  is_active BOOLEAN DEFAULT TRUE
);

-- RLS for Moderation
ALTER TABLE moderation_logs ENABLE ROW LEVEL SECURITY;
-- Users can view their OWN logs (History)
CREATE POLICY "Users can view their own moderation logs" ON moderation_logs 
FOR SELECT USING (auth.uid() = user_id);
-- Note: Admin access to moderation logs should be handled via a dedicated admin system or by database admins via Dashboard.
-- (Removed invalid role check until admin system is fully implemented)

-- ==========================================
-- 4. GIFTING SYSTEM (Secure Economy)
-- ==========================================
CREATE TABLE IF NOT EXISTS gifts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  sender_id UUID REFERENCES profiles(id), -- Nullable for System Gifts
  receiver_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  gift_type TEXT NOT NULL CHECK (gift_type IN ('RUBIES', 'ITEM', 'PREMIUM_SUB')),
  content_id TEXT NOT NULL, -- Item UUID or Rubies Amount (as string)
  message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE gifts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view gifts received" ON gifts FOR SELECT USING (auth.uid() = receiver_id);
CREATE POLICY "Users can view gifts sent" ON gifts FOR SELECT USING (auth.uid() = sender_id);

-- SECURE TRANSACTION FUNCTION
-- Usage: SELECT send_gift(receiver_uuid, 'RUBIES', '100', 'Happy Birthday!');
CREATE OR REPLACE FUNCTION send_gift(
  receiver_uuid UUID,
  g_type TEXT,
  content_value TEXT,
  gift_message TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER -- Runs with Superuser privileges to update protected columns
SET search_path = public
AS $$
DECLARE
  sender_uuid UUID;
  sender_rubies INT;
  amount INT;
  item_uuid UUID;
  item_count INT;
BEGIN
  sender_uuid := auth.uid();

  -- 1. Validate Sender (unless system gift logic is added later, assuming user-to-user here)
  IF sender_uuid IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Unauthorized');
  END IF;

  IF sender_uuid = receiver_uuid AND g_type != 'RUBIES' THEN 
    -- Allow self-purchase of items/sub, but rubies transfer to self is pointless
    -- Actually, usually you BUY rubies with real money, you don't 'gift' them to self via this function.
    -- Let's allow strictly User-to-User for now.
    RETURN jsonb_build_object('success', false, 'error', 'Cannot gift to self');
  END IF;

  -- 2. Handle RUBIES Gift
  IF g_type = 'RUBIES' THEN
    amount := content_value::INT;
    
    -- Check Balance
    SELECT rubies INTO sender_rubies FROM profiles WHERE id = sender_uuid;
    IF sender_rubies < amount THEN
      RETURN jsonb_build_object('success', false, 'error', 'Insufficient funds');
    END IF;

    -- Transaction
    UPDATE profiles SET rubies = rubies - amount WHERE id = sender_uuid;
    UPDATE profiles SET rubies = rubies + amount WHERE id = receiver_uuid;
    
    -- Log
    INSERT INTO gifts (sender_id, receiver_id, gift_type, content_id, message)
    VALUES (sender_uuid, receiver_uuid, 'RUBIES', content_value, gift_message);
    
    RETURN jsonb_build_object('success', true, 'message', 'Rubies sent successfully');
  END IF;

  -- 3. Handle ITEM Gift (Card/Artifact)
  IF g_type = 'ITEM' THEN
    item_uuid := content_value::UUID;

    -- Check Ownership
    SELECT quantity INTO item_count FROM user_inventory 
    WHERE user_id = sender_uuid AND item_id = item_uuid;

    IF item_count IS NULL OR item_count < 1 THEN
      RETURN jsonb_build_object('success', false, 'error', 'Item not owned');
    END IF;

    -- Transaction: Remove 1 from Sender
    IF item_count = 1 THEN
      DELETE FROM user_inventory WHERE user_id = sender_uuid AND item_id = item_uuid;
    ELSE
      UPDATE user_inventory SET quantity = quantity - 1 
      WHERE user_id = sender_uuid AND item_id = item_uuid;
    END IF;

    -- Transaction: Add 1 to Receiver
    INSERT INTO user_inventory (user_id, item_id, quantity)
    VALUES (receiver_uuid, item_uuid, 1)
    ON CONFLICT (user_id, item_id) 
    DO UPDATE SET quantity = user_inventory.quantity + 1;

    -- Log
    INSERT INTO gifts (sender_id, receiver_id, gift_type, content_id, message)
    VALUES (sender_uuid, receiver_uuid, 'ITEM', content_value, gift_message);

    RETURN jsonb_build_object('success', true, 'message', 'Item sent successfully');
  END IF;

  RETURN jsonb_build_object('success', false, 'error', 'Invalid gift type');
END;
$$;
