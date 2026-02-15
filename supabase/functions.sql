-- YAMIKO Economy Functions for Supabase
-- Run this AFTER schema.sql

-- ============================================================
-- LEVEL CALCULATION FUNCTION
-- ============================================================

CREATE OR REPLACE FUNCTION calculate_level(exp_amount INTEGER)
RETURNS INTEGER AS $$
DECLARE
  level_thresholds INTEGER[] := ARRAY[
    0, 100, 250, 450, 700, 1000, 1400, 1900, 2500, 3200,
    4000, 5000, 6200, 7600, 9200, 11000, 13000, 15200, 17600, 20200
  ];
  i INTEGER;
BEGIN
  FOR i IN REVERSE array_length(level_thresholds, 1)..1 LOOP
    IF exp_amount >= level_thresholds[i] THEN
      RETURN i;
    END IF;
  END LOOP;
  RETURN 1;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ============================================================
-- ADD EXP FUNCTION (with auto level-up and Energy rewards)
-- ============================================================

CREATE OR REPLACE FUNCTION add_exp(
  target_user_id UUID,
  exp_amount INTEGER,
  reason TEXT DEFAULT 'Admin grant'
)
RETURNS JSONB AS $$
DECLARE
  user_stats RECORD;
  old_level INTEGER;
  new_level INTEGER;
  new_exp INTEGER;
  levels_gained INTEGER;
  energy_reward INTEGER;
  result JSONB;
BEGIN
  -- Get current user stats
  SELECT level, exp, energy INTO user_stats
  FROM profiles
  WHERE id = target_user_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'User not found';
  END IF;
  
  -- Calculate new values
  old_level := user_stats.level;
  new_exp := user_stats.exp + exp_amount;
  new_level := calculate_level(new_exp);
  levels_gained := new_level - old_level;
  
  -- Calculate Energy reward (50 per level)
  energy_reward := CASE 
    WHEN levels_gained > 0 THEN levels_gained * 50
    ELSE 0
  END;
  
  -- Update user
  UPDATE profiles
  SET 
    exp = new_exp,
    level = new_level,
    energy = LEAST(energy + energy_reward, 100) -- Cap at 100
  WHERE id = target_user_id;
  
  -- Log transaction
  INSERT INTO transactions (user_id, type, amount, description)
  VALUES (
    target_user_id,
    'ADMIN_GRANT',
    exp_amount,
    format('Admin granted %s EXP - %s', exp_amount, reason)
  );
  
  -- Build result
  result := jsonb_build_object(
    'success', true,
    'old_level', old_level,
    'new_level', new_level,
    'new_exp', new_exp,
    'leveled_up', levels_gained > 0,
    'levels_gained', levels_gained,
    'energy_reward', energy_reward,
    'message', CASE
      WHEN levels_gained > 0 THEN
        format('✅ Granted %s EXP! User leveled up %s time(s) and received %s ⚡ Energy!', 
          exp_amount, levels_gained, energy_reward)
      ELSE
        format('✅ Granted %s EXP!', exp_amount)
    END
  );
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- GRANT RUBIES FUNCTION (Admin only, requires reason)
-- ============================================================

CREATE OR REPLACE FUNCTION grant_rubies(
  target_user_id UUID,
  ruby_amount INTEGER,
  reason TEXT
)
RETURNS JSONB AS $$
DECLARE
  current_rubies INTEGER;
  new_rubies INTEGER;
  result JSONB;
BEGIN
  -- Validate reason
  IF reason IS NULL OR trim(reason) = '' THEN
    RAISE EXCEPTION 'Reason is required for granting Rubies (premium currency)';
  END IF;
  
  -- Get current rubies
  SELECT rubies INTO current_rubies
  FROM profiles
  WHERE id = target_user_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'User not found';
  END IF;
  
  -- Calculate new rubies
  new_rubies := current_rubies + ruby_amount;
  
  -- Update user
  UPDATE profiles
  SET rubies = new_rubies
  WHERE id = target_user_id;
  
  -- Log transaction with reason
  INSERT INTO transactions (user_id, type, amount, description)
  VALUES (
    target_user_id,
    'ADMIN_GRANT',
    ruby_amount,
    format('Admin granted %s 💎 Rubies - Reason: %s', ruby_amount, reason)
  );
  
  -- Build result
  result := jsonb_build_object(
    'success', true,
    'old_rubies', current_rubies,
    'new_rubies', new_rubies,
    'rubies_granted', ruby_amount,
    'reason', reason,
    'message', format('✅ Granted %s 💎 Rubies!', ruby_amount)
  );
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- GET USER STATS FUNCTION
-- ============================================================

CREATE OR REPLACE FUNCTION get_user_stats(target_user_id UUID)
RETURNS JSONB AS $$
DECLARE
  user_data RECORD;
  result JSONB;
BEGIN
  SELECT 
    id, username, avatar_url, level, exp, energy, rubies, role,
    created_at, last_login
  INTO user_data
  FROM profiles
  WHERE id = target_user_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'User not found';
  END IF;
  
  result := to_jsonb(user_data);
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- GRANT PERMISSIONS
-- ============================================================

-- Allow authenticated users to call get_user_stats
GRANT EXECUTE ON FUNCTION get_user_stats TO authenticated;

-- Only service_role can call add_exp and grant_rubies
GRANT EXECUTE ON FUNCTION add_exp TO service_role;
GRANT EXECUTE ON FUNCTION grant_rubies TO service_role;
GRANT EXECUTE ON FUNCTION calculate_level TO authenticated;
