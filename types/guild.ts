// =====================================================
// YAMIKO GUILD SYSTEM - TYPESCRIPT TYPES
// Auto-generated from Supabase schema
// =====================================================

// =====================================================
// ENUMS
// =====================================================

export type GuildRole = 'leader' | 'officer' | 'veteran' | 'member' | 'recruit';
export type GuildRelationStatus = 'ally' | 'neutral' | 'war' | 'non_aggression_pact';
export type GuildTheme = 'default' | 'cyberpunk' | 'dark_fantasy' | 'royal' | 'shadow';
export type BuildingType = 'mine' | 'library' | 'altar' | 'barracks';
export type BuffType = 'xp_boost' | 'drop_rate' | 'damage_boost' | 'gold_boost';
export type RaidStatus = 'active' | 'defeated' | 'failed';
export type BossTier = 'common' | 'rare' | 'epic' | 'legendary' | 'mythic';
export type WarPriority = 'low' | 'medium' | 'high' | 'critical';
export type MercenaryStatus = 'available' | 'hired' | 'inactive';
export type TrophyType =
    | 'dragon_head'
    | 'enemy_flag'
    | 'tournament_cup'
    | 'raid_clear_s'
    | 'raid_clear_ss'
    | 'territory_king'
    | 'war_victor'
    | 'contract_master'
    | 'legendary_crafter'
    | 'guild_founder';

// =====================================================
// CORE TABLES
// =====================================================

export interface Guild {
    id: string;
    name: string;
    tag: string;
    description?: string;
    level: number;
    xp: number;
    treasury_gold: number;
    treasury_rubies: number;
    tax_rate: number;
    is_recruiting: boolean;
    min_level_req: number;
    parent_guild_id?: string;
    avatar_url?: string;
    banner_url?: string;
    theme_id: GuildTheme;
    created_at: string;
    updated_at: string;
}

export interface GuildMember {
    guild_id: string;
    user_id: string;
    role: GuildRole;
    contribution_xp: number;
    contribution_gold: number;
    joined_at: string;
}

export interface GuildRelation {
    guild_id_a: string;
    guild_id_b: string;
    status: GuildRelationStatus;
    war_score_a: number;
    war_score_b: number;
    created_at: string;
    updated_at: string;
}

// =====================================================
// ECONOMY TABLES
// =====================================================

export interface GuildBuilding {
    guild_id: string;
    building_type: BuildingType;
    level: number;
    built_at: string;
    upgraded_at: string;
}

export interface GuildWarehouse {
    id: string;
    guild_id: string;
    item_id: string;
    quantity: number;
    donated_by?: string;
    donated_at: string;
}

export interface GuildBuff {
    id: string;
    guild_id: string;
    buff_type: BuffType;
    multiplier: number;
    activated_at: string;
    expires_at: string;
    purchased_by?: string;
    cost_gold: number;
    cost_rubies: number;
}

export interface GuildForge {
    guild_id: string;
    scrap_points: number;
    total_crafted: number;
    next_craft_available_at?: string;
    created_at: string;
    updated_at: string;
}

export interface GuildTransaction {
    id: string;
    guild_id: string;
    transaction_type: string;
    amount_gold: number;
    amount_rubies: number;
    user_id?: string;
    description?: string;
    metadata?: Record<string, any>;
    created_at: string;
}

// =====================================================
// PvE TABLES
// =====================================================

export interface BossDefinition {
    id: string;
    name: string;
    description?: string;
    tier: BossTier;
    base_hp: number;
    hp_scaling_per_level: number;
    avatar_url?: string;
    loot_table: Array<{
        item_id: string;
        quantity: number;
        chance: number;
    }>;
    guaranteed_gold: number;
    guaranteed_xp: number;
    min_guild_level: number;
    created_at: string;
}

export interface GuildRaid {
    id: string;
    guild_id: string;
    boss_id: string;
    current_hp: number;
    max_hp: number;
    status: RaidStatus;
    started_at: string;
    ends_at: string;
    completed_at?: string;
}

export interface RaidLog {
    raid_id: string;
    user_id: string;
    damage_dealt: number;
    attacks_count: number;
    first_attack_at: string;
    last_attack_at: string;
}

export interface GuildContract {
    id: string;
    guild_id: string;
    week_number: number;
    year: number;
    grid_state: Record<string, {
        task: string;
        progress: number;
        target: number;
        completed: boolean;
    }>;
    is_completed: boolean;
    completed_at?: string;
    reward_claimed: boolean;
    created_at: string;
    updated_at: string;
}

export interface RaidLoot {
    id: string;
    raid_id: string;
    user_id: string;
    item_id?: string;
    quantity: number;
    gold_reward: number;
    xp_reward: number;
    awarded_at: string;
}

// =====================================================
// PvP TABLES
// =====================================================

export interface TerritoryControl {
    id: string;
    manga_id: string;
    guild_id: string;
    weekly_upkeep_cost: number;
    total_invested: number;
    bonus_xp_percent: number;
    bonus_gold_percent: number;
    controlled_since: string;
    last_upkeep_paid: string;
}

export interface MercenaryListing {
    id: string;
    user_id: string;
    min_price_per_day: number;
    status: MercenaryStatus;
    hired_by_guild_id?: string;
    hired_until?: string;
    total_contracts: number;
    total_earnings: number;
    created_at: string;
    updated_at: string;
}

export interface WarRoomOrder {
    id: string;
    guild_id: string;
    target_type: string;
    target_id: string;
    priority: WarPriority;
    title: string;
    description?: string;
    is_completed: boolean;
    completed_at?: string;
    created_by?: string;
    created_at: string;
    updated_at: string;
}

export interface WarHistory {
    id: string;
    guild_id_a: string;
    guild_id_b: string;
    declared_by?: string;
    war_score_a: number;
    war_score_b: number;
    winner_guild_id?: string;
    started_at: string;
    ended_at?: string;
}

// =====================================================
// SOCIAL TABLES
// =====================================================

export interface GuildTrophy {
    id: string;
    guild_id: string;
    trophy_type: TrophyType;
    display_name: string;
    description?: string;
    display_slot?: number;
    icon_url?: string;
    obtained_at: string;
    obtained_by?: string;
    context?: Record<string, any>;
}

export interface GuildJackpot {
    guild_id: string;
    progress_percent: number;
    total_pool_gold: number;
    total_pool_rubies: number;
    total_distributions: number;
    last_distributed_at?: string;
    created_at: string;
    updated_at: string;
}

export interface JackpotDistribution {
    id: string;
    guild_id: string;
    total_gold: number;
    total_rubies: number;
    distribution_data: Array<{
        user_id: string;
        gold: number;
        rubies: number;
        reason: string;
    }>;
    distributed_at: string;
}

export interface GuildAcademyRelation {
    parent_guild_id: string;
    academy_guild_id: string;
    established_at: string;
}

export interface GuildAnnouncement {
    id: string;
    guild_id: string;
    title: string;
    message: string;
    is_pinned: boolean;
    created_by?: string;
    created_at: string;
    updated_at: string;
}

// =====================================================
// FUNCTION RETURN TYPES
// =====================================================

export interface TaxResult {
    user_receives_gold: number;
    user_receives_rubies: number;
    guild_receives_gold: number;
    guild_receives_rubies: number;
}

export interface WeekInfo {
    week_number: number;
    year: number;
}

// =====================================================
// EXTENDED TYPES (WITH RELATIONS)
// =====================================================

export interface GuildWithMembers extends Guild {
    members?: GuildMember[];
    member_count?: number;
}

export interface GuildWithBuildings extends Guild {
    buildings?: GuildBuilding[];
}

export interface GuildRaidWithBoss extends GuildRaid {
    boss?: BossDefinition;
    participants?: RaidLog[];
}

export interface GuildMemberWithProfile extends GuildMember {
    profile?: {
        id: string;
        username: string;
        avatar_url?: string;
        level: number;
    };
}

// =====================================================
// API REQUEST/RESPONSE TYPES
// =====================================================

export interface CreateGuildRequest {
    name: string;
    tag: string;
    description?: string;
}

export interface UpdateGuildSettingsRequest {
    description?: string;
    is_recruiting?: boolean;
    min_level_req?: number;
    tax_rate?: number;
}

export interface UpgradeBuildingRequest {
    building_type: BuildingType;
}

export interface DonateWarehouseRequest {
    item_id: string;
    quantity: number;
}

export interface PurchaseBuffRequest {
    buff_type: BuffType;
    duration_hours: number;
}

export interface StartRaidRequest {
    boss_id: string;
}

export interface DeclareWarRequest {
    target_guild_id: string;
}

export interface ClaimTerritoryRequest {
    manga_id: string;
}

export interface HireMercenaryRequest {
    user_id: string;
    duration_days: number;
}

export interface CreateWarOrderRequest {
    target_type: string;
    target_id: string;
    priority: WarPriority;
    title: string;
    description?: string;
}

export interface CreateAnnouncementRequest {
    title: string;
    message: string;
    is_pinned: boolean;
}

// =====================================================
// UTILITY TYPES
// =====================================================

export type GuildPermissionLevel = 'public' | 'member' | 'officer' | 'leader';

export interface GuildStats {
    total_members: number;
    total_xp: number;
    total_gold: number;
    total_rubies: number;
    active_raids: number;
    territories_controlled: number;
    trophies_earned: number;
}

export interface GuildLeaderboard {
    guild_id: string;
    guild_name: string;
    guild_tag: string;
    level: number;
    member_count: number;
    total_xp: number;
    rank: number;
}

// =====================================================
// BACKEND API TYPES (NEW)
// =====================================================

export type GuildApplicationStatus = 'pending' | 'approved' | 'rejected';
export type AdminActionType =
    | 'guild_created'
    | 'guild_edited'
    | 'guild_banned'
    | 'guild_unbanned'
    | 'treasury_adjusted'
    | 'raid_forced'
    | 'level_forced'
    | 'leadership_transferred';

export interface GuildApplication {
    id: string;
    guild_id: string;
    user_id: string;
    status: GuildApplicationStatus;
    message: string | null;
    reviewed_by: string | null;
    created_at: string;
    reviewed_at: string | null;
}

export interface AdminLog {
    id: string;
    action_type: AdminActionType;
    guild_id: string | null;
    admin_id: string | null;
    reason: string | null;
    metadata: Record<string, any>;
    created_at: string;
}

// =====================================================
// PUBLIC API RESPONSE TYPES
// =====================================================

export interface PublicGuild {
    id: string;
    name: string;
    tag: string;
    avatar_url: string | null;
    level: number;
    member_count: number;
    is_recruiting: boolean;
    total_xp: number;
}

export interface GetPublicGuildsParams {
    filter?: {
        min_level?: number;
        is_recruiting?: boolean;
    };
    sort_by?: 'xp' | 'level' | 'member_count' | 'created_at';
    page?: number;
    limit?: number;
}

// =====================================================
// SINGLE GUILD DASHBOARD TYPES
// =====================================================

export interface GuildRaidInfo {
    raid_id: string;
    boss_name: string;
    current_hp: number;
    max_hp: number;
    participants: number;
}

export interface GuildWarInfo {
    opponent_guild_id: string;
    opponent_name: string;
    our_score: number;
    their_score: number;
}

export interface GuildTopMemberInfo {
    user_id: string;
    username: string;
    avatar_url: string | null;
    role: GuildRole;
    contribution_xp: number;
}

export interface GuildMembersData {
    total_count: number;
    max_count: number;
    top_5: GuildTopMemberInfo[];
}

export interface GuildUserStatus {
    is_member: boolean;
    role: GuildRole | null;
    can_donate: boolean;
    can_manage: boolean;
}

export interface FullGuildData {
    info: {
        id: string;
        name: string;
        tag: string;
        level: number;
        xp: number;
        description: string | null;
        avatar_url: string | null;
        banner_url: string | null;
        treasury_gold: number;
        treasury_rubies: number;
        member_count: number;
        is_recruiting: boolean;
    };
    state: {
        active_raids: GuildRaidInfo[];
        active_wars: GuildWarInfo[];
    };
    members: GuildMembersData;
    user_status: GuildUserStatus;
}

export interface MangaTerritoryInfo {
    guild_id: string;
    guild_name: string;
    guild_tag: string;
    guild_avatar: string | null;
    guild_level: number;
    controlled_since: string;
    influence: number;
}

// =====================================================
// DASHBOARD ACTION PARAMS
// =====================================================

export interface RequestJoinGuildParams {
    guild_id: string;
    message?: string;
}

export interface DonateToTreasuryParams {
    guild_id: string;
    amount: number;
    currency_type: 'gold' | 'rubies';
}

// =====================================================
// ADMIN PANEL TYPES
// =====================================================

export interface AdminEditGuildData {
    name?: string;
    tag?: string;
    description?: string;
    avatar_url?: string;
    banner_url?: string;
    level?: number;
    xp?: number;
}

export interface AdminBanGuildParams {
    guild_id: string;
    reason: string;
}

export interface AdminTransferLeadershipParams {
    guild_id: string;
    new_leader_id: string;
}

export interface AdminAdjustTreasuryParams {
    guild_id: string;
    gold_amount?: number;
    ruby_amount?: number;
    reason?: string;
}

export interface AdminForceStartRaidParams {
    guild_id: string;
    boss_id: string;
}

export interface AdminForceLevelUpParams {
    guild_id: string;
    levels?: number;
}

export interface AdminGuildAuditLogEntry {
    id: string;
    action_type: AdminActionType;
    guild_id: string | null;
    guild_name: string | null;
    admin_id: string | null;
    admin_username: string | null;
    reason: string | null;
    metadata: Record<string, any>;
    created_at: string;
}

// =====================================================
// API CLIENT FUNCTION TYPES
// =====================================================

export type GetPublicGuildsFn = (
    params?: GetPublicGuildsParams
) => Promise<PublicGuild[]>;

export type CreateGuildFn = (
    params: CreateGuildRequest
) => Promise<string>; // Returns guild_id

export type GetFullGuildDataFn = (
    guildId: string
) => Promise<FullGuildData>;

export type RequestJoinGuildFn = (
    params: RequestJoinGuildParams
) => Promise<string>; // Returns application_id

export type LeaveGuildFn = () => Promise<void>;

export type DonateToTreasuryFn = (
    params: DonateToTreasuryParams
) => Promise<void>;

// Admin functions
export type AdminEditGuildFn = (
    guildId: string,
    data: AdminEditGuildData
) => Promise<void>;

export type AdminBanGuildFn = (
    params: AdminBanGuildParams
) => Promise<void>;

export type AdminUnbanGuildFn = (
    guildId: string,
    reason?: string
) => Promise<void>;

export type AdminTransferLeadershipFn = (
    params: AdminTransferLeadershipParams
) => Promise<void>;

export type AdminAdjustTreasuryFn = (
    params: AdminAdjustTreasuryParams
) => Promise<void>;

export type AdminForceStartRaidFn = (
    params: AdminForceStartRaidParams
) => Promise<string>; // Returns raid_id

export type AdminForceLevelUpFn = (
    params: AdminForceLevelUpParams
) => Promise<void>;

// =====================================================
// TYPE GUARDS
// =====================================================

export function isAdminActionType(value: string): value is AdminActionType {
    return [
        'guild_created',
        'guild_edited',
        'guild_banned',
        'guild_unbanned',
        'treasury_adjusted',
        'raid_forced',
        'level_forced',
        'leadership_transferred',
    ].includes(value);
}
