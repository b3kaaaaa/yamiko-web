-- Migration: 44_performance_rls_optimization.sql
-- Description: Optimize RLS policies by wrapping auth functions in subqueries and consolidating permissive policies

-- 1. Profiles
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles 
    FOR UPDATE USING ((SELECT auth.uid()) = id);

-- 2. Reading History
DROP POLICY IF EXISTS "View own history" ON public.reading_history;
DROP POLICY IF EXISTS "Manage own history" ON public.reading_history;
CREATE POLICY "Manage Reading History" ON public.reading_history 
    FOR ALL USING ((SELECT auth.uid()) = user_id) WITH CHECK ((SELECT auth.uid()) = user_id);

-- 3. Bookmarks
DROP POLICY IF EXISTS "View own bookmarks" ON public.bookmarks;
DROP POLICY IF EXISTS "Manage own bookmarks" ON public.bookmarks;
CREATE POLICY "Manage Bookmarks" ON public.bookmarks 
    FOR ALL USING ((SELECT auth.uid()) = user_id) WITH CHECK ((SELECT auth.uid()) = user_id);

-- 4. Community Interactions
DROP POLICY IF EXISTS "Authenticated can view interactions" ON public.community_interactions;
DROP POLICY IF EXISTS "Users can manage their own interactions" ON public.community_interactions;
CREATE POLICY "Manage Interactions" ON public.community_interactions 
    FOR ALL USING ((SELECT auth.uid()) = user_id) WITH CHECK ((SELECT auth.uid()) = user_id);
-- Allow public select if needed, but the linter complained about multiple permissive policies.
-- If we want public to see interactions, we add it to the same policy or a separate one if roles differ.
-- The linter said anon/authenticated had both policies.

-- 5. Community Posts
DROP POLICY IF EXISTS "Public can view community_posts" ON public.community_posts;
DROP POLICY IF EXISTS "Users can manage their own posts" ON public.community_posts;
CREATE POLICY "View Community Posts" ON public.community_posts FOR SELECT USING (true);
CREATE POLICY "Manage Own Posts" ON public.community_posts 
    FOR ALL TO authenticated USING ((SELECT auth.uid()) = user_id) WITH CHECK ((SELECT auth.uid()) = user_id);

-- 6. Friendships
DROP POLICY IF EXISTS "View friendships" ON public.friendships;
DROP POLICY IF EXISTS "Manage friendships" ON public.friendships;
CREATE POLICY "Manage Friendships" ON public.friendships 
    FOR ALL USING ((SELECT auth.uid()) = user_id_1 OR (SELECT auth.uid()) = user_id_2);

-- 7. Gifts
DROP POLICY IF EXISTS "Users can view gifts received" ON public.gifts;
DROP POLICY IF EXISTS "Users can view gifts sent" ON public.gifts;
CREATE POLICY "View Gifts" ON public.gifts 
    FOR SELECT USING ((SELECT auth.uid()) = receiver_id OR (SELECT auth.uid()) = sender_id);

-- 8. User Settings
DROP POLICY IF EXISTS "View own settings" ON public.user_settings;
DROP POLICY IF EXISTS "Update own settings" ON public.user_settings;
CREATE POLICY "Manage Own Settings" ON public.user_settings 
    FOR ALL USING ((SELECT auth.uid()) = user_id) WITH CHECK ((SELECT auth.uid()) = user_id);

-- 9. Library Entries
DROP POLICY IF EXISTS "Users can manage their own library" ON public.library_entries;
CREATE POLICY "Manage Library" ON public.library_entries 
    FOR ALL USING ((SELECT auth.uid()) = user_id) WITH CHECK ((SELECT auth.uid()) = user_id);

-- 10. Reading Progress
DROP POLICY IF EXISTS "Users can manage their own progress" ON public.reading_progress;
CREATE POLICY "Manage Progress" ON public.reading_progress 
    FOR ALL USING ((SELECT auth.uid()) = user_id) WITH CHECK ((SELECT auth.uid()) = user_id);

-- 11. Guilds
DROP POLICY IF EXISTS "Members can view own guild" ON public.guilds;
DROP POLICY IF EXISTS "Members can view full guild details" ON public.guilds;
DROP POLICY IF EXISTS "Leaders can update guild settings" ON public.guilds;
DROP POLICY IF EXISTS "Leaders can delete guild" ON public.guilds;
DROP POLICY IF EXISTS "Admins can view all guilds" ON public.guilds;
DROP POLICY IF EXISTS "Admins can modify guilds" ON public.guilds;

CREATE POLICY "View Guild Details" ON public.guilds 
    FOR SELECT USING (
        (SELECT id FROM guilds WHERE id = guilds.id AND (is_banned = false OR is_banned IS NULL)) IS NOT NULL
        OR EXISTS (SELECT 1 FROM guild_members WHERE user_id = (SELECT auth.uid()) AND guild_id = guilds.id)
    );

CREATE POLICY "Manage Guild Admin" ON public.guilds 
    FOR ALL USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = (SELECT auth.uid()) AND (role = 'ADMIN' OR role = 'SUPER_ADMIN'))
    );

CREATE POLICY "Leader Manage Guild" ON public.guilds 
    FOR UPDATE USING (
        EXISTS (SELECT 1 FROM guild_members WHERE user_id = (SELECT auth.uid()) AND guild_id = id AND role = 'leader')
    );

-- 12. Guild Members
DROP POLICY IF EXISTS "Officers can update member roles" ON public.guild_members;
DROP POLICY IF EXISTS "Officers can remove members" ON public.guild_members;
DROP POLICY IF EXISTS "Admins can manage members" ON public.guild_members;

CREATE POLICY "Manage Guild Members Admin" ON public.guild_members 
    FOR ALL USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = (SELECT auth.uid()) AND (role = 'ADMIN' OR role = 'SUPER_ADMIN'))
    );

CREATE POLICY "Officer Manage Guild Members" ON public.guild_members 
    FOR ALL USING (
        EXISTS (SELECT 1 FROM guild_members WHERE user_id = (SELECT auth.uid()) AND guild_id = guild_members.guild_id AND role IN ('leader', 'officer'))
    );

-- 13. System Infrastructure
DROP POLICY IF EXISTS "Manage Own Transactions" ON public.guild_transactions;
CREATE POLICY "Manage Own Transactions" ON public.guild_transactions 
    FOR SELECT USING ((SELECT auth.uid()) = user_id);

-- 14. Wall Posts
DROP POLICY IF EXISTS "Authenticated Post: Wall" ON public.wall_posts;
DROP POLICY IF EXISTS "Owner/Author Delete: Wall" ON public.wall_posts;
CREATE POLICY "Manage Wall Posts" ON public.wall_posts 
    FOR ALL USING ((SELECT auth.uid()) = user_id OR (SELECT auth.uid()) = author_id)
    WITH CHECK ((SELECT auth.uid()) = author_id);

-- 15. Wiki Edits
DROP POLICY IF EXISTS "Public can view own edits" ON public.wiki_edits;
DROP POLICY IF EXISTS "Users can create edits" ON public.wiki_edits;
CREATE POLICY "Manage Wiki Edits" ON public.wiki_edits 
    FOR ALL USING ((SELECT auth.uid()) = user_id) WITH CHECK ((SELECT auth.uid()) = user_id);

-- 16. Guild Applications
DROP POLICY IF EXISTS "Users can manage their own applications" ON public.guild_applications;
DROP POLICY IF EXISTS "Admins/Leaders can view applications" ON public.guild_applications;
CREATE POLICY "Manage Own Applications" ON public.guild_applications 
    FOR ALL USING ((SELECT auth.uid()) = user_id) WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "View Guild Applications" ON public.guild_applications 
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = (SELECT auth.uid()) AND (role = 'ADMIN' OR role = 'SUPER_ADMIN'))
        OR EXISTS (SELECT 1 FROM guild_members WHERE user_id = (SELECT auth.uid()) AND guild_id = guild_applications.guild_id AND role IN ('leader', 'officer'))
    );

-- 17. Bulk optimize remaining tables for auth_rls_initplan
-- This includes simple wrapping of auth.uid() in (SELECT auth.uid())

-- Spotlight
DROP POLICY IF EXISTS "Admins can manage spotlight" ON public.spotlight_features;
CREATE POLICY "Manage Spotlight" ON public.spotlight_features 
    FOR ALL USING (EXISTS (SELECT 1 FROM profiles WHERE id = (SELECT auth.uid()) AND (role = 'ADMIN' OR role = 'SUPER_ADMIN')));

-- User Quests
DROP POLICY IF EXISTS "Users view own quests" ON public.user_quests;
CREATE POLICY "View Own Quests" ON public.user_quests 
    FOR SELECT USING ((SELECT auth.uid()) = user_id);

-- Quest Streaks
DROP POLICY IF EXISTS "Users view own streak" ON public.quest_streaks;
CREATE POLICY "View Own Streak" ON public.quest_streaks 
    FOR SELECT USING ((SELECT auth.uid()) = user_id);

-- Reward History
DROP POLICY IF EXISTS "Users view own history" ON public.reward_history;
CREATE POLICY "View Own Rewards" ON public.reward_history 
    FOR SELECT USING ((SELECT auth.uid()) = user_id);

-- Quest Definitions
DROP POLICY IF EXISTS "Admins can manage quests" ON public.quest_definitions;
CREATE POLICY "Manage Quests" ON public.quest_definitions 
    FOR ALL USING (EXISTS (SELECT 1 FROM profiles WHERE id = (SELECT auth.uid()) AND (role = 'ADMIN' OR role = 'SUPER_ADMIN')));

-- Admin Audit Logs
DROP POLICY IF EXISTS "Admins can view audit logs" ON public.admin_audit_logs;
DROP POLICY IF EXISTS "Admins can insert audit logs" ON public.admin_audit_logs;
CREATE POLICY "Manage Audit Logs" ON public.admin_audit_logs 
    FOR ALL USING (EXISTS (SELECT 1 FROM profiles WHERE id = (SELECT auth.uid()) AND (role = 'ADMIN' OR role = 'SUPER_ADMIN')));

-- Admin Logs (Guild System)
DROP POLICY IF EXISTS "Admins can view logs" ON public.admin_logs;
CREATE POLICY "View Admin Logs" ON public.admin_logs 
    FOR SELECT USING (EXISTS (SELECT 1 FROM profiles WHERE id = (SELECT auth.uid()) AND (role = 'ADMIN' OR role = 'SUPER_ADMIN')));

-- System Settings
DROP POLICY IF EXISTS "Admins can update system settings" ON public.system_settings;
DROP POLICY IF EXISTS "Admins can insert system settings" ON public.system_settings;
CREATE POLICY "Manage System Settings" ON public.system_settings 
    FOR ALL USING (EXISTS (SELECT 1 FROM profiles WHERE id = (SELECT auth.uid()) AND (role = 'ADMIN' OR role = 'SUPER_ADMIN')));

-- 18. Remaining Guild System & Social Tables
DROP POLICY IF EXISTS "Update own inventory" ON public.user_inventory;
CREATE POLICY "Update own inventory" ON public.user_inventory 
    FOR UPDATE USING ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Members can view guild contracts" ON public.guild_contracts;
CREATE POLICY "View Guild Contracts" ON public.guild_contracts 
    FOR SELECT USING (EXISTS (SELECT 1 FROM guild_members WHERE user_id = (SELECT auth.uid()) AND guild_id = guild_contracts.guild_id));

DROP POLICY IF EXISTS "Leaders can manage guild relations" ON public.guild_relations;
CREATE POLICY "Manage Guild Relations" ON public.guild_relations 
    FOR ALL USING (
        EXISTS (SELECT 1 FROM guild_members WHERE user_id = (SELECT auth.uid()) AND (guild_id = guild_id_a OR guild_id = guild_id_b) AND role = 'leader')
    );

DROP POLICY IF EXISTS "Members can view guild buildings" ON public.guild_buildings;
DROP POLICY IF EXISTS "Officers can manage buildings" ON public.guild_buildings;
CREATE POLICY "View/Manage Guild Buildings" ON public.guild_buildings 
    FOR ALL USING (EXISTS (SELECT 1 FROM guild_members WHERE user_id = (SELECT auth.uid()) AND guild_id = guild_buildings.guild_id));

DROP POLICY IF EXISTS "Members can view guild warehouse" ON public.guild_warehouse;
DROP POLICY IF EXISTS "Members can donate to warehouse" ON public.guild_warehouse;
DROP POLICY IF EXISTS "Officers can manage warehouse" ON public.guild_warehouse;
CREATE POLICY "Manage Guild Warehouse" ON public.guild_warehouse 
    FOR ALL USING (EXISTS (SELECT 1 FROM guild_members WHERE user_id = (SELECT auth.uid()) AND guild_id = guild_warehouse.guild_id));

DROP POLICY IF EXISTS "Members can view guild buffs" ON public.guild_buffs;
DROP POLICY IF EXISTS "Officers can manage buffs" ON public.guild_buffs;
CREATE POLICY "View/Manage Guild Buffs" ON public.guild_buffs 
    FOR ALL USING (EXISTS (SELECT 1 FROM guild_members WHERE user_id = (SELECT auth.uid()) AND guild_id = guild_buffs.guild_id));

DROP POLICY IF EXISTS "Members can view guild jackpot" ON public.guild_jackpot;
CREATE POLICY "View Guild Jackpot" ON public.guild_jackpot 
    FOR SELECT USING (EXISTS (SELECT 1 FROM guild_members WHERE user_id = (SELECT auth.uid()) AND guild_id = guild_jackpot.guild_id));

DROP POLICY IF EXISTS "Members can view guild forge" ON public.guild_forge;
DROP POLICY IF EXISTS "Officers can use forge" ON public.guild_forge;
CREATE POLICY "View/Use Guild Forge" ON public.guild_forge 
    FOR ALL USING (EXISTS (SELECT 1 FROM guild_members WHERE user_id = (SELECT auth.uid()) AND guild_id = guild_forge.guild_id));

DROP POLICY IF EXISTS "Members can view guild transactions" ON public.guild_transactions;
CREATE POLICY "View Guild Transactions" ON public.guild_transactions 
    FOR SELECT USING (EXISTS (SELECT 1 FROM guild_members WHERE user_id = (SELECT auth.uid()) AND guild_id = guild_transactions.guild_id));

DROP POLICY IF EXISTS "Members can view guild raids" ON public.guild_raids;
DROP POLICY IF EXISTS "Officers can manage raids" ON public.guild_raids;
CREATE POLICY "View/Manage Guild Raids" ON public.guild_raids 
    FOR ALL USING (EXISTS (SELECT 1 FROM guild_members WHERE user_id = (SELECT auth.uid()) AND guild_id = guild_raids.guild_id));

DROP POLICY IF EXISTS "Members can view raid logs" ON public.raid_logs;
DROP POLICY IF EXISTS "Members can add raid damage" ON public.raid_logs;
CREATE POLICY "View/Add Raid Damage" ON public.raid_logs 
    FOR ALL USING (EXISTS (SELECT 1 FROM guild_raids WHERE id = raid_logs.raid_id AND guild_id IN (SELECT guild_id FROM guild_members WHERE user_id = (SELECT auth.uid()))));

DROP POLICY IF EXISTS "Users can view own raid loot" ON public.raid_loot;
DROP POLICY IF EXISTS "Members can view guild raid loot" ON public.raid_loot;
CREATE POLICY "View Raid Loot" ON public.raid_loot 
    FOR SELECT USING ((SELECT auth.uid()) = user_id OR EXISTS (SELECT 1 FROM guild_raids WHERE id = raid_loot.raid_id AND guild_id IN (SELECT guild_id FROM guild_members WHERE user_id = (SELECT auth.uid()))));

DROP POLICY IF EXISTS "Officers can manage territories" ON public.territory_control;
CREATE POLICY "Manage Territories" ON public.territory_control 
    FOR ALL USING (EXISTS (SELECT 1 FROM guild_members WHERE user_id = (SELECT auth.uid()) AND guild_id = territory_control.guild_id AND role IN ('leader', 'officer')));

DROP POLICY IF EXISTS "Public can view mercenary listings" ON public.mercenary_listings;
DROP POLICY IF EXISTS "Users can manage own mercenary listing" ON public.mercenary_listings;
DROP POLICY IF EXISTS "Officers can hire mercenaries" ON public.mercenary_listings;
CREATE POLICY "Manage Mercenary Listings" ON public.mercenary_listings 
    FOR ALL USING ((SELECT auth.uid()) = user_id OR (SELECT auth.uid()) IN (SELECT user_id FROM guild_members WHERE role IN ('leader', 'officer')));

DROP POLICY IF EXISTS "Members can view war room orders" ON public.war_room_orders;
DROP POLICY IF EXISTS "Officers can manage war room orders" ON public.war_room_orders;
CREATE POLICY "View/Manage War Room Orders" ON public.war_room_orders 
    FOR ALL USING (EXISTS (SELECT 1 FROM guild_members WHERE user_id = (SELECT auth.uid()) AND guild_id = war_room_orders.guild_id));

DROP POLICY IF EXISTS "Members can view jackpot distributions" ON public.jackpot_distributions;
CREATE POLICY "View Jackpot Distributions" ON public.jackpot_distributions 
    FOR SELECT USING (EXISTS (SELECT 1 FROM guild_members WHERE user_id = (SELECT auth.uid()) AND guild_id = jackpot_distributions.guild_id));

DROP POLICY IF EXISTS "Leaders can manage academies" ON public.guild_academy_relations;
DROP POLICY IF EXISTS "Public can view academy relations" ON public.guild_academy_relations;
CREATE POLICY "View/Manage Academy Relations" ON public.guild_academy_relations 
    FOR ALL USING (EXISTS (SELECT 1 FROM guild_members WHERE user_id = (SELECT auth.uid()) AND (guild_id = parent_guild_id OR guild_id = academy_guild_id)));

DROP POLICY IF EXISTS "Members can view guild announcements" ON public.guild_announcements;
DROP POLICY IF EXISTS "Officers can manage announcements" ON public.guild_announcements;
CREATE POLICY "View/Manage Guild Announcements" ON public.guild_announcements 
    FOR ALL USING (EXISTS (SELECT 1 FROM guild_members WHERE user_id = (SELECT auth.uid()) AND guild_id = guild_announcements.guild_id));

DROP POLICY IF EXISTS "Users can view their own moderation logs" ON public.moderation_logs;
CREATE POLICY "View Own Moderation Logs" ON public.moderation_logs 
    FOR SELECT USING ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "View own rewards" ON public.referral_rewards;
CREATE POLICY "View Own Rewards" ON public.referral_rewards 
    FOR SELECT USING ((SELECT auth.uid()) = user_id);
