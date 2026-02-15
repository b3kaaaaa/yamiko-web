-- Shadow Army & Referral System Enhancements

-- 1. Add Referral Code to Profiles (if not exists)
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS referral_code TEXT UNIQUE;

-- Function to generate random referral code (simple 8 chars)
CREATE OR REPLACE FUNCTION generate_referral_code()
RETURNS TEXT LANGUAGE sql AS $$
  SELECT SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 8);
$$;

-- Trigger to auto-assign referral code on insert if null
CREATE OR REPLACE FUNCTION set_referral_code()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.referral_code IS NULL THEN
    -- Loop to ensure uniqueness (rare collision check)
    LOOP
      NEW.referral_code := generate_referral_code();
      BEGIN
        EXIT; -- If successful (checked by unique constraint on commit/insert, but here we can try)
      EXCEPTION WHEN unique_violation THEN
        -- retry
      END;
    END LOOP;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_set_referral_code ON profiles;
CREATE TRIGGER trg_set_referral_code
BEFORE INSERT ON profiles
FOR EACH ROW EXECUTE PROCEDURE set_referral_code();

-- Backfill existing profiles
UPDATE profiles SET referral_code = generate_referral_code() WHERE referral_code IS NULL;


-- 2. Shadow Stats Function
-- Returns: { total: int, today: int, week: int, rank_progress: int }
CREATE OR REPLACE FUNCTION get_shadow_status(target_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  total_count INT;
  today_count INT;
  week_count INT;
  rank_progress INT; -- % to next rank
  current_rank TEXT;
BEGIN
  -- Counts
  SELECT COUNT(*) INTO total_count FROM profiles WHERE referrer_id = target_user_id;
  
  SELECT COUNT(*) INTO today_count FROM profiles 
  WHERE referrer_id = target_user_id 
  AND created_at > CURRENT_DATE;
  
  SELECT COUNT(*) INTO week_count FROM profiles 
  WHERE referrer_id = target_user_id 
  AND created_at > (CURRENT_TIMESTAMP - INTERVAL '7 days');

  -- Rank Calculation (Simple logic for UI)
  -- 0-100: Soldier -> General
  -- 100-150: General -> Marshal
  -- 150-500: Marshal -> Monarch
  
  -- We just return the raw counts, frontend can calc progress bar %
  
  RETURN jsonb_build_object(
    'total', total_count,
    'today', today_count,
    'week', week_count
  );
END;
$$;

-- 3. Rewards Tracking
CREATE TABLE IF NOT EXISTS referral_rewards (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  reward_tier TEXT NOT NULL, -- 'GENERAL', 'MARSHAL', 'MONARCH'
  is_claimed BOOLEAN DEFAULT FALSE,
  claimed_at TIMESTAMPTZ,
  UNIQUE(user_id, reward_tier)
);
ALTER TABLE referral_rewards ENABLE ROW LEVEL SECURITY;
CREATE POLICY "View own rewards" ON referral_rewards FOR SELECT USING (auth.uid() = user_id);
