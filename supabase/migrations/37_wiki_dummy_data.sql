DO $$
DECLARE
    v_solo_id UUID;
    v_omni_id UUID;
    v_tbate_id UUID;
    v_user1_id UUID;
    v_user2_id UUID;
    v_user3_id UUID;
BEGIN
    -- Get some manga IDs (adjust titles to match real data if possible, or pick any)
    SELECT id INTO v_solo_id FROM manga ORDER BY views DESC LIMIT 1;
    SELECT id INTO v_omni_id FROM manga ORDER BY views DESC OFFSET 1 LIMIT 1;
    SELECT id INTO v_tbate_id FROM manga ORDER BY views DESC OFFSET 2 LIMIT 1;

    -- Get some user IDs (assuming auth.users has entries, otherwise we skip user-related stats)
    SELECT id INTO v_user1_id FROM auth.users ORDER BY created_at LIMIT 1;
    SELECT id INTO v_user2_id FROM auth.users ORDER BY created_at OFFSET 1 LIMIT 1;
    SELECT id INTO v_user3_id FROM auth.users ORDER BY created_at OFFSET 2 LIMIT 1;

    -- If no manga, we can't do much, but we can try inserting if we have IDs.
    -- If v_solo_id is null, we just return.
    IF v_solo_id IS NULL THEN
        RAISE NOTICE 'No manga found, skipping wiki seed';
        RETURN;
    END IF;

    -- Insert Entities (Use upsert logic where possible, or just ignore if exists)
    INSERT INTO wiki_entities (manga_id, type, slug, title, content, cover_image) VALUES
    (v_solo_id, 'character', 'sung-jin-woo', 'Sung Jin-Woo', '{"blocks": [{"type": "paragraph", "data": {"text": "The main protagonist of Solo Leveling."}}]}', 'https://static.wikia.nocookie.net/solo-leveling/images/e/e8/Sung_Jin-Woo.jpg'),
    (v_solo_id, 'location', 'jeju-island', 'Jeju Island', '{"blocks": []}', NULL),
    (v_omni_id, 'character', 'kim-dokja', 'Kim Dokja', '{"blocks": []}', 'https://static.wikia.nocookie.net/omniscient_reader/images/6/65/Kim_Dokja.jpg'),
    (v_solo_id, 'artifact', 'kamish-wrath', 'Kamish Wrath', '{"blocks": []}', NULL),
    (v_tbate_id, 'character', 'arthur-leywin', 'Arthur Leywin', '{"blocks": []}', 'https://static.wikia.nocookie.net/tbate/images/5/53/Arthur_Leywin_Vol_10.jpg')
    ON CONFLICT (manga_id, slug) DO NOTHING;

    -- Insert Stats (Only if users exist)
    IF v_user1_id IS NOT NULL THEN
        INSERT INTO wiki_stats (user_id, approved_edits_count, last_edit_date) VALUES
        (v_user1_id, 420, NOW())
        ON CONFLICT (user_id) DO NOTHING;
    END IF;

    IF v_user2_id IS NOT NULL THEN
        INSERT INTO wiki_stats (user_id, approved_edits_count, last_edit_date) VALUES
        (v_user2_id, 315, NOW() - INTERVAL '2 hours')
        ON CONFLICT (user_id) DO NOTHING;
    END IF;

     IF v_user3_id IS NOT NULL THEN
        INSERT INTO wiki_stats (user_id, approved_edits_count, last_edit_date) VALUES
        (v_user3_id, 150, NOW() - INTERVAL '1 day')
        ON CONFLICT (user_id) DO NOTHING;
    END IF;

    -- Insert Edits
    IF v_user1_id IS NOT NULL AND v_solo_id IS NOT NULL THEN
        INSERT INTO wiki_edits (manga_id, user_id, type, title, slug, status, created_at) VALUES
        (v_solo_id, v_user1_id, 'character', 'Sung Jin-Woo', 'sung-jin-woo', 'approved', NOW() - INTERVAL '5 minutes'),
        (v_solo_id, v_user1_id, 'location', 'Jeju Island', 'jeju-island', 'approved', NOW() - INTERVAL '1 hour')
        ON CONFLICT DO NOTHING; -- stats table doesn't enforce uniqueness on edits, but just in case
    END IF;
    
    IF v_user2_id IS NOT NULL AND v_omni_id IS NOT NULL THEN
        INSERT INTO wiki_edits (manga_id, user_id, type, title, slug, status, created_at) VALUES
        (v_omni_id, v_user2_id, 'character', 'Kim Dokja', 'kim-dokja', 'approved', NOW() - INTERVAL '30 minutes')
        ON CONFLICT DO NOTHING;
    END IF;

    IF v_user3_id IS NOT NULL AND v_tbate_id IS NOT NULL THEN
        INSERT INTO wiki_edits (manga_id, user_id, type, title, slug, status, created_at) VALUES
        (v_tbate_id, v_user3_id, 'character', 'Arthur Leywin', 'arthur-leywin', 'pending', NOW() - INTERVAL '10 minutes')
        ON CONFLICT DO NOTHING;
    END IF;

END $$;
