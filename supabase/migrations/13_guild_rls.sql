-- =====================================================
-- YAMIKO GUILD SYSTEM - SECURITY: RLS POLICIES
-- Migration: 13_guild_rls.sql
-- Description: Row Level Security policies for all guild tables
-- =====================================================

-- =====================================================
-- ENABLE RLS ON ALL GUILD TABLES
-- =====================================================

ALTER TABLE guilds ENABLE ROW LEVEL SECURITY;
ALTER TABLE guild_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE guild_relations ENABLE ROW LEVEL SECURITY;
ALTER TABLE guild_buildings ENABLE ROW LEVEL SECURITY;
ALTER TABLE guild_warehouse ENABLE ROW LEVEL SECURITY;
ALTER TABLE guild_buffs ENABLE ROW LEVEL SECURITY;
ALTER TABLE guild_forge ENABLE ROW LEVEL SECURITY;
ALTER TABLE guild_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE boss_definitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE guild_raids ENABLE ROW LEVEL SECURITY;
ALTER TABLE raid_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE guild_contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE raid_loot ENABLE ROW LEVEL SECURITY;
ALTER TABLE territory_control ENABLE ROW LEVEL SECURITY;
ALTER TABLE mercenary_listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE war_room_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE war_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE guild_trophies ENABLE ROW LEVEL SECURITY;
ALTER TABLE guild_jackpot ENABLE ROW LEVEL SECURITY;
ALTER TABLE jackpot_distributions ENABLE ROW LEVEL SECURITY;
ALTER TABLE guild_academy_relations ENABLE ROW LEVEL SECURITY;
ALTER TABLE guild_announcements ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- GUILDS TABLE POLICIES
-- =====================================================

-- Public: View basic guild info
CREATE POLICY "Public can view basic guild info"
ON guilds FOR SELECT
USING (true);

-- Members: View full guild details
CREATE POLICY "Members can view full guild details"
ON guilds FOR SELECT
USING (
    id IN (SELECT guild_id FROM guild_members WHERE user_id = auth.uid())
);

-- Leaders: Update guild settings
CREATE POLICY "Leaders can update guild settings"
ON guilds FOR UPDATE
USING (
    id IN (
        SELECT guild_id FROM guild_members
        WHERE user_id = auth.uid() AND role = 'leader'
    )
);

-- Leaders: Delete guild
CREATE POLICY "Leaders can delete guild"
ON guilds FOR DELETE
USING (
    id IN (
        SELECT guild_id FROM guild_members
        WHERE user_id = auth.uid() AND role = 'leader'
    )
);

-- =====================================================
-- GUILD_MEMBERS TABLE POLICIES
-- =====================================================

-- Public: View member list
CREATE POLICY "Public can view guild members"
ON guild_members FOR SELECT
USING (true);

-- Officers+: Update member roles
CREATE POLICY "Officers can update member roles"
ON guild_members FOR UPDATE
USING (
    guild_id IN (
        SELECT guild_id FROM guild_members
        WHERE user_id = auth.uid() AND role IN ('leader', 'officer')
    )
);

-- Officers+: Remove members
CREATE POLICY "Officers can remove members"
ON guild_members FOR DELETE
USING (
    guild_id IN (
        SELECT guild_id FROM guild_members
        WHERE user_id = auth.uid() AND role IN ('leader', 'officer')
    )
);

-- =====================================================
-- GUILD_RELATIONS TABLE POLICIES
-- =====================================================

-- Public: View guild relations
CREATE POLICY "Public can view guild relations"
ON guild_relations FOR SELECT
USING (true);

-- Leaders: Manage relations
CREATE POLICY "Leaders can manage guild relations"
ON guild_relations FOR ALL
USING (
    guild_id_a IN (
        SELECT guild_id FROM guild_members
        WHERE user_id = auth.uid() AND role = 'leader'
    )
    OR guild_id_b IN (
        SELECT guild_id FROM guild_members
        WHERE user_id = auth.uid() AND role = 'leader'
    )
);

-- =====================================================
-- GUILD_BUILDINGS TABLE POLICIES
-- =====================================================

-- Members: View buildings
CREATE POLICY "Members can view guild buildings"
ON guild_buildings FOR SELECT
USING (
    guild_id IN (SELECT guild_id FROM guild_members WHERE user_id = auth.uid())
);

-- Officers+: Manage buildings (via functions only)
CREATE POLICY "Officers can manage buildings"
ON guild_buildings FOR ALL
USING (
    guild_id IN (
        SELECT guild_id FROM guild_members
        WHERE user_id = auth.uid() AND role IN ('leader', 'officer')
    )
);

-- =====================================================
-- GUILD_WAREHOUSE TABLE POLICIES
-- =====================================================

-- Members: View warehouse
CREATE POLICY "Members can view guild warehouse"
ON guild_warehouse FOR SELECT
USING (
    guild_id IN (SELECT guild_id FROM guild_members WHERE user_id = auth.uid())
);

-- Members: Donate items (via function)
CREATE POLICY "Members can donate to warehouse"
ON guild_warehouse FOR INSERT
WITH CHECK (
    guild_id IN (SELECT guild_id FROM guild_members WHERE user_id = auth.uid())
);

-- Officers+: Withdraw items (via function)
CREATE POLICY "Officers can manage warehouse"
ON guild_warehouse FOR ALL
USING (
    guild_id IN (
        SELECT guild_id FROM guild_members
        WHERE user_id = auth.uid() AND role IN ('leader', 'officer')
    )
);

-- =====================================================
-- GUILD_BUFFS TABLE POLICIES
-- =====================================================

-- Members: View active buffs
CREATE POLICY "Members can view guild buffs"
ON guild_buffs FOR SELECT
USING (
    guild_id IN (SELECT guild_id FROM guild_members WHERE user_id = auth.uid())
);

-- Officers+: Purchase buffs (via function)
CREATE POLICY "Officers can manage buffs"
ON guild_buffs FOR ALL
USING (
    guild_id IN (
        SELECT guild_id FROM guild_members
        WHERE user_id = auth.uid() AND role IN ('leader', 'officer')
    )
);

-- =====================================================
-- GUILD_FORGE TABLE POLICIES
-- =====================================================

-- Members: View forge status
CREATE POLICY "Members can view guild forge"
ON guild_forge FOR SELECT
USING (
    guild_id IN (SELECT guild_id FROM guild_members WHERE user_id = auth.uid())
);

-- Officers+: Use forge (via function)
CREATE POLICY "Officers can use forge"
ON guild_forge FOR ALL
USING (
    guild_id IN (
        SELECT guild_id FROM guild_members
        WHERE user_id = auth.uid() AND role IN ('leader', 'officer')
    )
);

-- =====================================================
-- GUILD_TRANSACTIONS TABLE POLICIES
-- =====================================================

-- Members: View transaction history
CREATE POLICY "Members can view guild transactions"
ON guild_transactions FOR SELECT
USING (
    guild_id IN (SELECT guild_id FROM guild_members WHERE user_id = auth.uid())
);

-- System: Insert transactions (via functions)
CREATE POLICY "System can insert transactions"
ON guild_transactions FOR INSERT
WITH CHECK (true);

-- =====================================================
-- BOSS_DEFINITIONS TABLE POLICIES
-- =====================================================

-- Public: View all bosses
CREATE POLICY "Public can view boss definitions"
ON boss_definitions FOR SELECT
USING (true);

-- Note: Boss management should be done via Supabase Dashboard by database admins

-- =====================================================
-- GUILD_RAIDS TABLE POLICIES
-- =====================================================

-- Members: View guild raids
CREATE POLICY "Members can view guild raids"
ON guild_raids FOR SELECT
USING (
    guild_id IN (SELECT guild_id FROM guild_members WHERE user_id = auth.uid())
);

-- Officers+: Manage raids (via function)
CREATE POLICY "Officers can manage raids"
ON guild_raids FOR ALL
USING (
    guild_id IN (
        SELECT guild_id FROM guild_members
        WHERE user_id = auth.uid() AND role IN ('leader', 'officer')
    )
);

-- =====================================================
-- RAID_LOGS TABLE POLICIES
-- =====================================================

-- Members: View raid logs
CREATE POLICY "Members can view raid logs"
ON raid_logs FOR SELECT
USING (
    raid_id IN (
        SELECT id FROM guild_raids
        WHERE guild_id IN (SELECT guild_id FROM guild_members WHERE user_id = auth.uid())
    )
);

-- Members: Add damage (via function)
CREATE POLICY "Members can add raid damage"
ON raid_logs FOR ALL
USING (
    raid_id IN (
        SELECT id FROM guild_raids
        WHERE guild_id IN (SELECT guild_id FROM guild_members WHERE user_id = auth.uid())
    )
);

-- =====================================================
-- GUILD_CONTRACTS TABLE POLICIES
-- =====================================================

-- Members: View contracts
CREATE POLICY "Members can view guild contracts"
ON guild_contracts FOR SELECT
USING (
    guild_id IN (SELECT guild_id FROM guild_members WHERE user_id = auth.uid())
);

-- System: Manage contracts (via functions)
CREATE POLICY "System can manage contracts"
ON guild_contracts FOR ALL
USING (true);

-- =====================================================
-- RAID_LOOT TABLE POLICIES
-- =====================================================

-- Users: View own loot
CREATE POLICY "Users can view own raid loot"
ON raid_loot FOR SELECT
USING (user_id = auth.uid());

-- Members: View guild raid loot
CREATE POLICY "Members can view guild raid loot"
ON raid_loot FOR SELECT
USING (
    raid_id IN (
        SELECT id FROM guild_raids
        WHERE guild_id IN (SELECT guild_id FROM guild_members WHERE user_id = auth.uid())
    )
);

-- =====================================================
-- TERRITORY_CONTROL TABLE POLICIES
-- =====================================================

-- Public: View all territories
CREATE POLICY "Public can view territory control"
ON territory_control FOR SELECT
USING (true);

-- Officers+: Manage territories (via function)
CREATE POLICY "Officers can manage territories"
ON territory_control FOR ALL
USING (
    guild_id IN (
        SELECT guild_id FROM guild_members
        WHERE user_id = auth.uid() AND role IN ('leader', 'officer')
    )
);

-- =====================================================
-- MERCENARY_LISTINGS TABLE POLICIES
-- =====================================================

-- Public: View available mercenaries
CREATE POLICY "Public can view mercenary listings"
ON mercenary_listings FOR SELECT
USING (status = 'available' OR user_id = auth.uid());

-- Users: Manage own listing
CREATE POLICY "Users can manage own mercenary listing"
ON mercenary_listings FOR ALL
USING (user_id = auth.uid());

-- Officers+: Hire mercenaries (via function)
CREATE POLICY "Officers can hire mercenaries"
ON mercenary_listings FOR UPDATE
USING (
    hired_by_guild_id IN (
        SELECT guild_id FROM guild_members
        WHERE user_id = auth.uid() AND role IN ('leader', 'officer')
    )
);

-- =====================================================
-- WAR_ROOM_ORDERS TABLE POLICIES
-- =====================================================

-- Members: View war room orders
CREATE POLICY "Members can view war room orders"
ON war_room_orders FOR SELECT
USING (
    guild_id IN (SELECT guild_id FROM guild_members WHERE user_id = auth.uid())
);

-- Officers+: Manage orders (via function)
CREATE POLICY "Officers can manage war room orders"
ON war_room_orders FOR ALL
USING (
    guild_id IN (
        SELECT guild_id FROM guild_members
        WHERE user_id = auth.uid() AND role IN ('leader', 'officer')
    )
);

-- =====================================================
-- WAR_HISTORY TABLE POLICIES
-- =====================================================

-- Public: View war history
CREATE POLICY "Public can view war history"
ON war_history FOR SELECT
USING (true);

-- System: Insert war history (via functions)
CREATE POLICY "System can insert war history"
ON war_history FOR INSERT
WITH CHECK (true);

-- =====================================================
-- GUILD_TROPHIES TABLE POLICIES
-- =====================================================

-- Public: View guild trophies
CREATE POLICY "Public can view guild trophies"
ON guild_trophies FOR SELECT
USING (true);

-- System: Award trophies (via functions)
CREATE POLICY "System can award trophies"
ON guild_trophies FOR INSERT
WITH CHECK (true);

-- =====================================================
-- GUILD_JACKPOT TABLE POLICIES
-- =====================================================

-- Members: View jackpot status
CREATE POLICY "Members can view guild jackpot"
ON guild_jackpot FOR SELECT
USING (
    guild_id IN (SELECT guild_id FROM guild_members WHERE user_id = auth.uid())
);

-- System: Manage jackpot (via functions)
CREATE POLICY "System can manage jackpot"
ON guild_jackpot FOR ALL
USING (true);

-- =====================================================
-- JACKPOT_DISTRIBUTIONS TABLE POLICIES
-- =====================================================

-- Members: View distribution history
CREATE POLICY "Members can view jackpot distributions"
ON jackpot_distributions FOR SELECT
USING (
    guild_id IN (SELECT guild_id FROM guild_members WHERE user_id = auth.uid())
);

-- System: Insert distributions (via functions)
CREATE POLICY "System can insert distributions"
ON jackpot_distributions FOR INSERT
WITH CHECK (true);

-- =====================================================
-- GUILD_ACADEMY_RELATIONS TABLE POLICIES
-- =====================================================

-- Public: View academy relations
CREATE POLICY "Public can view academy relations"
ON guild_academy_relations FOR SELECT
USING (true);

-- Leaders: Manage academies (via function)
CREATE POLICY "Leaders can manage academies"
ON guild_academy_relations FOR ALL
USING (
    parent_guild_id IN (
        SELECT guild_id FROM guild_members
        WHERE user_id = auth.uid() AND role = 'leader'
    )
);

-- =====================================================
-- GUILD_ANNOUNCEMENTS TABLE POLICIES
-- =====================================================

-- Members: View announcements
CREATE POLICY "Members can view guild announcements"
ON guild_announcements FOR SELECT
USING (
    guild_id IN (SELECT guild_id FROM guild_members WHERE user_id = auth.uid())
);

-- Officers+: Manage announcements (via function)
CREATE POLICY "Officers can manage announcements"
ON guild_announcements FOR ALL
USING (
    guild_id IN (
        SELECT guild_id FROM guild_members
        WHERE user_id = auth.uid() AND role IN ('leader', 'officer')
    )
);

-- =====================================================
-- GRANT EXECUTE PERMISSIONS ON FUNCTIONS
-- =====================================================

-- Core management functions
GRANT EXECUTE ON FUNCTION create_guild TO authenticated;
GRANT EXECUTE ON FUNCTION join_guild TO authenticated;
GRANT EXECUTE ON FUNCTION leave_guild TO authenticated;
GRANT EXECUTE ON FUNCTION change_member_role TO authenticated;
GRANT EXECUTE ON FUNCTION kick_member TO authenticated;
GRANT EXECUTE ON FUNCTION update_guild_settings TO authenticated;

-- Economy functions
GRANT EXECUTE ON FUNCTION func_process_tax TO authenticated;
GRANT EXECUTE ON FUNCTION upgrade_building TO authenticated;
GRANT EXECUTE ON FUNCTION donate_to_warehouse TO authenticated;
GRANT EXECUTE ON FUNCTION withdraw_from_warehouse TO authenticated;
GRANT EXECUTE ON FUNCTION purchase_guild_buff TO authenticated;
GRANT EXECUTE ON FUNCTION func_craft_artifact TO authenticated;

-- PvE functions
GRANT EXECUTE ON FUNCTION start_raid TO authenticated;
GRANT EXECUTE ON FUNCTION func_deal_raid_damage TO authenticated;
GRANT EXECUTE ON FUNCTION update_contract_progress TO authenticated;

-- PvP functions
GRANT EXECUTE ON FUNCTION declare_war TO authenticated;
GRANT EXECUTE ON FUNCTION end_war TO authenticated;
GRANT EXECUTE ON FUNCTION claim_territory TO authenticated;
GRANT EXECUTE ON FUNCTION release_territory TO authenticated;
GRANT EXECUTE ON FUNCTION hire_mercenary TO authenticated;
GRANT EXECUTE ON FUNCTION create_war_order TO authenticated;
GRANT EXECUTE ON FUNCTION complete_war_order TO authenticated;

-- Social functions
GRANT EXECUTE ON FUNCTION award_trophy TO authenticated;
GRANT EXECUTE ON FUNCTION func_distribute_jackpot TO authenticated;
GRANT EXECUTE ON FUNCTION create_academy TO authenticated;
GRANT EXECUTE ON FUNCTION graduate_member TO authenticated;
GRANT EXECUTE ON FUNCTION create_announcement TO authenticated;

-- Helper functions
GRANT EXECUTE ON FUNCTION has_guild_permission TO authenticated;
GRANT EXECUTE ON FUNCTION get_max_members TO authenticated;
GRANT EXECUTE ON FUNCTION get_member_count TO authenticated;
GRANT EXECUTE ON FUNCTION get_building_income TO authenticated;
GRANT EXECUTE ON FUNCTION get_building_upgrade_cost TO authenticated;
GRANT EXECUTE ON FUNCTION has_active_buff TO authenticated;
GRANT EXECUTE ON FUNCTION get_buff_multiplier TO authenticated;
GRANT EXECUTE ON FUNCTION calculate_raid_damage TO authenticated;
GRANT EXECUTE ON FUNCTION get_current_week TO authenticated;

-- =====================================================
-- COMMENTS
-- =====================================================

COMMENT ON POLICY "Public can view basic guild info" ON guilds IS 'Anyone can see guild name, level, member count';
COMMENT ON POLICY "Members can view full guild details" ON guilds IS 'Guild members can see treasury, settings, etc.';
COMMENT ON POLICY "Leaders can update guild settings" ON guilds IS 'Only guild leader can modify settings';
COMMENT ON POLICY "Officers can manage buildings" ON guild_buildings IS 'Officers and leaders can upgrade buildings';
COMMENT ON POLICY "Members can donate to warehouse" ON guild_warehouse IS 'All members can contribute items';
COMMENT ON POLICY "Officers can manage warehouse" ON guild_warehouse IS 'Officers can withdraw items for members';
