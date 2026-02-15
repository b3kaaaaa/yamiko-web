-- Quest System Migration

CREATE TYPE quest_type AS ENUM ('read_chapter', 'comment', 'like', 'share', 'login');
CREATE TYPE quest_frequency AS ENUM ('daily', 'weekly', 'epic');
CREATE TYPE quest_difficulty AS ENUM ('E', 'D', 'C', 'B', 'A', 'S');

-- Drop existing tables to avoid conflicts
DROP TABLE IF EXISTS reward_history CASCADE;
DROP TABLE IF EXISTS quest_streaks CASCADE;
DROP TABLE IF EXISTS user_quests CASCADE;
DROP TABLE IF EXISTS quest_definitions CASCADE;

-- 2. Quest Definitions (Admin Pool)
CREATE TABLE IF NOT EXISTS quest_definitions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    type quest_type NOT NULL,
    frequency quest_frequency NOT NULL DEFAULT 'daily',
    difficulty quest_difficulty NOT NULL DEFAULT 'E',
    target_count INT NOT NULL DEFAULT 1,
    rewards JSONB NOT NULL DEFAULT '{}'::jsonb, -- { "xp": 100, "rubies": 10 }
    is_active BOOLEAN DEFAULT TRUE,
    weight INT DEFAULT 100, -- Higher weight = higher chance to appear
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. User Active Quests
CREATE TABLE IF NOT EXISTS user_quests (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    quest_definition_id UUID REFERENCES quest_definitions(id) ON DELETE CASCADE,
    progress INT DEFAULT 0,
    is_completed BOOLEAN DEFAULT FALSE,
    is_claimed BOOLEAN DEFAULT FALSE,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    uniques JSONB DEFAULT '[]'::jsonb 
    -- 'uniques' tracks specific IDs (e.g., chapter_ids read) to prevent spamming the same action
);

-- 4. Quest Streaks
CREATE TABLE IF NOT EXISTS quest_streaks (
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE PRIMARY KEY,
    current_streak INT DEFAULT 0,
    last_activity_date DATE, -- The last date a daily streak was incremented
    max_streak INT DEFAULT 0,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Reward History (Log)
CREATE TABLE IF NOT EXISTS reward_history (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    source TEXT NOT NULL, -- "Daily Quest: Title", "Streak Reward"
    rewards_snapshot JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS Policies
ALTER TABLE quest_definitions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read active quests" ON quest_definitions FOR SELECT USING (is_active = TRUE);
-- Admin write policies would go here (omitted for simplicity, usually requiring a role check)

ALTER TABLE user_quests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own quests" ON user_quests FOR SELECT USING (auth.uid() = user_id);
-- No direct insert/update for users? Usually managed via functions, but for MVP let's allow users to update progress if client-side logic handles it (insecure but faster to build).
-- BETTER: Only allow SELECT. Updates happen via RPCs.

ALTER TABLE quest_streaks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own streak" ON quest_streaks FOR SELECT USING (auth.uid() = user_id);

ALTER TABLE reward_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own history" ON reward_history FOR SELECT USING (auth.uid() = user_id);

-- 6. Functions (The Brain)

-- A. Generate Daily Quests
CREATE OR REPLACE FUNCTION generate_daily_quests(target_user_id UUID)
RETURNS VOID
LANGUAGE plpgsql security definer
AS $$
DECLARE
    daily_count INT;
    needed INT;
    reset_time TIMESTAMPTZ;
BEGIN
    -- Config: 3 Daily Quests (Hardcoded or select from config table)
    daily_count := 3;
    
    -- Calculate Reset Time: Next Midnight UTC (or local if simpler, sticking to UTC)
    -- Logic: If now is 23:00, expires in 1 hour.
    reset_time := (CURRENT_DATE + 1)::TIMESTAMPTZ; 

    -- Check active daily quests count
    SELECT COUNT(*) INTO needed 
    FROM user_quests uq
    JOIN quest_definitions qd ON uq.quest_definition_id = qd.id
    WHERE uq.user_id = target_user_id 
    AND qd.frequency = 'daily'
    AND uq.expires_at > NOW();

    -- If we have fewer than daily_count active quests
    IF needed < daily_count THEN
        -- Insert random quests
        INSERT INTO user_quests (user_id, quest_definition_id, expires_at)
        SELECT target_user_id, id, reset_time
        FROM quest_definitions
        WHERE frequency = 'daily' AND is_active = TRUE
        -- Avoid quests currently assigned to user (even if expired? No, just active ones)
        AND id NOT IN (
            SELECT quest_definition_id FROM user_quests 
            WHERE user_id = target_user_id AND expires_at > NOW()
        )
        ORDER BY RANDOM() * weight DESC
        LIMIT (daily_count - needed);
    END IF;

    -- Ensure streak record exists
    INSERT INTO quest_streaks (user_id, current_streak, last_activity_date, max_streak)
    VALUES (target_user_id, 0, NULL, 0)
    ON CONFLICT (user_id) DO NOTHING;

END;
$$;

-- B. Check/Update Streak (Called when a quest is Claimed or on Login)
CREATE OR REPLACE FUNCTION check_streak(target_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql security definer
AS $$
DECLARE
    streak_rec RECORD;
    today DATE := CURRENT_DATE;
    yesterday DATE := CURRENT_DATE - 1;
    completed_dailies INT;
    total_dailies INT;
    new_streak INT;
BEGIN
    SELECT * INTO streak_rec FROM quest_streaks WHERE user_id = target_user_id;
    
    -- If no record, create one
    IF streak_rec IS NULL THEN
        INSERT INTO quest_streaks (user_id) VALUES (target_user_id) RETURNING * INTO streak_rec;
    END IF;

    -- Check if streak missing yesterday
    IF streak_rec.last_activity_date < yesterday OR streak_rec.last_activity_date IS NULL THEN
        -- Streak broken
        UPDATE quest_streaks SET current_streak = 0 WHERE user_id = target_user_id;
        streak_rec.current_streak := 0;
    END IF;

    -- Check if ALL daily quests for today are completed
    -- total_dailies for today's active set
    SELECT COUNT(*) INTO total_dailies 
    FROM user_quests uq
    JOIN quest_definitions qd ON uq.quest_definition_id = qd.id
    WHERE uq.user_id = target_user_id 
    AND qd.frequency = 'daily' 
    AND uq.expires_at > NOW();

    -- completed
    SELECT COUNT(*) INTO completed_dailies 
    FROM user_quests uq
    JOIN quest_definitions qd ON uq.quest_definition_id = qd.id
    WHERE uq.user_id = target_user_id 
    AND qd.frequency = 'daily' 
    AND uq.expires_at > NOW()
    AND uq.is_completed = TRUE;

    -- If all done and not yet updated for today
    IF total_dailies > 0 AND completed_dailies = total_dailies AND (streak_rec.last_activity_date IS NULL OR streak_rec.last_activity_date < today) THEN
        new_streak := streak_rec.current_streak + 1;
        UPDATE quest_streaks 
        SET current_streak = new_streak,
            last_activity_date = today,
            max_streak = GREATEST(max_streak, new_streak)
        WHERE user_id = target_user_id;
        
        RETURN jsonb_build_object('streak_updated', true, 'new_streak', new_streak);
    END IF;

    RETURN jsonb_build_object('streak_updated', false, 'current_streak', streak_rec.current_streak);
END;
$$;

-- C. Claim Reward (Atomic)
CREATE OR REPLACE FUNCTION claim_quest_reward(target_quest_id UUID)
RETURNS JSONB
LANGUAGE plpgsql security definer
AS $$
DECLARE
    quest_rec RECORD;
    rewards JSONB;
    p_xp INT;
    p_rubies INT;
    p_energy INT;
BEGIN
    -- Get quest info
    SELECT uq.*, qd.rewards 
    INTO quest_rec
    FROM user_quests uq
    JOIN quest_definitions qd ON uq.quest_definition_id = qd.id
    WHERE uq.id = target_quest_id AND uq.user_id = auth.uid();

    IF quest_rec IS NULL THEN
        RAISE EXCEPTION 'Quest not found or access denied';
    END IF;

    IF NOT quest_rec.is_completed THEN
        RAISE EXCEPTION 'Quest not completed';
    END IF;

    IF quest_rec.is_claimed THEN
         RAISE EXCEPTION 'Reward already claimed';
    END IF;

    rewards := quest_rec.rewards;
    p_xp := COALESCE((rewards->>'xp')::INT, 0);
    p_rubies := COALESCE((rewards->>'rubies')::INT, 0);
    p_energy := COALESCE((rewards->>'energy')::INT, 0);

    -- Grant Rewards
    UPDATE profiles 
    SET 
        exp = exp + p_xp, 
        rubies = rubies + p_rubies,
        energy_current = LEAST(energy_max, energy_current + p_energy) -- Cap energy? or allow overflow? Let's cap for now or use separate cap logic. 
        -- Actually, usually energy can overflow from items/quests. Let's allow overflow for now:
        -- energy_current = energy_current + p_energy
    WHERE id = auth.uid();
    
    -- Mark Claimed
    UPDATE user_quests SET is_claimed = TRUE WHERE id = target_quest_id;

    -- Log History
    INSERT INTO reward_history (user_id, source, rewards_snapshot)
    VALUES (auth.uid(), 'Quest Reward', rewards);

    -- Check Streak (Attempt to update streak if this was the last quest)
    PERFORM check_streak(auth.uid());

    RETURN jsonb_build_object('success', true, 'rewards', rewards);
END;
$$;


-- 7. Seed Data (Initial Quests)
INSERT INTO quest_definitions (title, description, type, frequency, difficulty, target_count, rewards, weight)
VALUES
-- Daily
('Чтец Бездны', 'Прочитайте 5 глав любой манхвы.', 'read_chapter', 'daily', 'D', 5, '{"xp": 100, "energy": 20}'::jsonb, 100),
('Социальная Активность', 'Оставьте комментарий под любой главой.', 'comment', 'daily', 'E', 1, '{"xp": 50, "rubies": 5}'::jsonb, 80),
('Верный Фанат', 'Добавьте 3 тайтла в избранное.', 'like', 'daily', 'E', 3, '{"xp": 50, "energy": 10}'::jsonb, 80),
('Опытный Критик', 'Поставьте оценку 3 тайтлам.', 'like', 'daily', 'D', 3, '{"xp": 75, "rubies": 10}'::jsonb, 60),
('Вход в Систему', 'Зайдите в приложение.', 'login', 'daily', 'E', 1, '{"xp": 25, "energy": 50}'::jsonb, 120),

-- Weekly
('Критик S-Ранга', 'Напишите рецензию (мин. 500 символов).', 'comment', 'weekly', 'S', 1, '{"xp": 500, "rubies": 50}'::jsonb, 50),
('Марафон', 'Прочитайте 50 глав за неделю.', 'read_chapter', 'weekly', 'A', 50, '{"xp": 1000, "rubies": 100, "energy": 100}'::jsonb, 50);

