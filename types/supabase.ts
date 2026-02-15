export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[]

export interface Database {
    public: {
        Tables: {
            profiles: {
                Row: {
                    id: string
                    username: string
                    nickname: string | null
                    avatar_url: string | null
                    banner_url: string | null
                    bio: string | null
                    status_text: string | null
                    is_online: boolean
                    level: number
                    rank_tier: 'E' | 'D' | 'C' | 'B' | 'A' | 'S' | 'National'
                    xp: number
                    energy: number
                    rubies: number
                    class_id: string | null
                    tower_floor: number
                    referrer_id: string | null
                    is_public: boolean
                    display_id: number
                    role: 'USER' | 'MODERATOR' | 'ADMIN'

                    // New Fields
                    birthday: string | null
                    gender: 'MALE' | 'FEMALE' | 'OTHER' | 'HIDDEN' | null
                    main_guild_id: string | null
                    content_preference: 'SHONEN' | 'SHOJO' | 'SEINEN' | 'JOSEI' | 'ALL' | null
                    social_links: Json
                    deleted_at: string | null

                    created_at: string
                    updated_at: string
                }
                Update: {
                    nickname?: string | null
                    avatar_url?: string | null
                    banner_url?: string | null
                    bio?: string | null
                    status_text?: string | null
                    is_online?: boolean
                    is_public?: boolean
                    birthday?: string | null
                    gender?: 'MALE' | 'FEMALE' | 'OTHER' | 'HIDDEN' | null
                    main_guild_id?: string | null
                    content_preference?: 'SHONEN' | 'SHOJO' | 'SEINEN' | 'JOSEI' | 'ALL' | null
                    social_links?: Json
                    deleted_at?: string | null
                    role?: 'USER' | 'MODERATOR' | 'ADMIN'
                }
                Insert: {
                    id: string
                    username: string
                    nickname?: string | null
                    avatar_url?: string | null
                    banner_url?: string | null
                    bio?: string | null
                    status_text?: string | null
                    is_online?: boolean
                    level?: number
                    rank_tier?: 'E' | 'D' | 'C' | 'B' | 'A' | 'S' | 'National'
                    xp?: number
                    energy?: number
                    rubies?: number
                    class_id?: string | null
                    tower_floor?: number
                    referrer_id?: string | null
                    is_public?: boolean
                    role?: 'USER' | 'MODERATOR' | 'ADMIN'
                    birthday?: string | null
                    gender?: 'MALE' | 'FEMALE' | 'OTHER' | 'HIDDEN' | null
                    main_guild_id?: string | null
                    content_preference?: 'SHONEN' | 'SHOJO' | 'SEINEN' | 'JOSEI' | 'ALL' | null
                    social_links?: Json
                    deleted_at?: string | null
                }
            }
            manga: {
                Row: {
                    id: string
                    title: string
                    slug: string
                    cover_url: string | null
                    description: string | null
                    rating: number
                    views: number
                    status: string
                    type: string
                    created_at: string
                }
                Insert: {
                    id?: string
                    title: string
                    slug: string
                    cover_url?: string | null
                    description?: string | null
                    rating?: number
                    views?: number
                    status?: string
                    type?: string
                    created_at?: string
                }
                Update: {
                    id?: string
                    title?: string
                    slug?: string
                    cover_url?: string | null
                    description?: string | null
                    rating?: number
                    views?: number
                    status?: string
                    type?: string
                    created_at?: string
                }
            }
            chapters: {
                Row: {
                    id: string
                    manga_id: string
                    title: string | null
                    slug: string | null
                    number: number
                    created_at: string
                }
                Insert: {
                    id?: string
                    manga_id: string
                    title?: string | null
                    slug?: string | null
                    number: number
                    created_at?: string
                }
                Update: {
                    id?: string
                    manga_id?: string
                    title?: string | null
                    slug?: string | null
                    number?: number
                    created_at?: string
                }
            }
            tower_levels: {
                Row: {
                    floor_number: number
                    chapters_required: number
                    reward_xp: number
                    reward_rubies: number
                }
            }
            classes: {
                Row: {
                    id: string
                    name: string
                    description: string | null
                    base_stats: Json
                    icon_url: string | null
                }
            }
            items: {
                Row: {
                    id: string
                    name: string
                    description: string | null
                    image_url: string | null
                    type: 'CONSUMABLE' | 'MATERIAL' | 'EQUIPMENT' | 'KEY_ITEM' | 'CARD' | 'ARTIFACT'
                    rarity: 'COMMON' | 'RARE' | 'EPIC' | 'LEGENDARY' | 'ARTIFACT' | 'MYTHIC'
                    effects: Json
                }
            }
            user_inventory: {
                Row: {
                    id: string
                    user_id: string
                    item_id: string
                    quantity: number
                    is_pinned: boolean
                    acquired_at: string
                }
            }
            quest_definitions: {
                Row: {
                    id: string
                    title: string
                    description: string | null
                    frequency: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'ONETIME'
                    task_type: 'READ_CHAPTER' | 'COMMENT' | 'LIKE_MANGA' | 'LOGIN' | 'SHARE' | 'INVITE_FRIEND'
                    target_count: number
                    rewards: Json
                    is_active: boolean
                }
            }
            user_quests: {
                Row: {
                    id: string
                    user_id: string
                    quest_id: string
                    progress: number
                    is_claimed: boolean
                    expires_at: string | null
                    updated_at: string
                }
            }
            achievements: {
                Row: {
                    id: string
                    name: string
                    description: string | null
                    icon_url: string | null
                    condition: string | null
                    rewards: Json
                }
                Insert: {
                    id?: string
                    name: string
                    description?: string | null
                    icon_url?: string | null
                    condition?: string | null
                    rewards?: Json
                }
                Update: {
                    id?: string
                    name?: string
                    description?: string | null
                    icon_url?: string | null
                    condition?: string | null
                    rewards?: Json
                }
            }
            user_achievements: {
                Row: {
                    id: string
                    user_id: string
                    achievement_id: string
                    unlocked_at: string
                }
            }
            friendships: {
                Row: {
                    id: string
                    user_id_1: string
                    user_id_2: string
                    status: 'PENDING' | 'ACCEPTED' | 'BLOCKED'
                    created_at: string
                    updated_at: string
                }
            }
            guilds: {
                Row: {
                    id: string
                    name: string
                    description: string | null
                    level: number
                    owner_id: string
                    created_at: string
                }
            }
            guild_members: {
                Row: {
                    id: string
                    guild_id: string
                    user_id: string
                    rank: 'MEMBER' | 'OFFICER' | 'LEADER'
                    joined_at: string
                }
            }
            bookmarks: {
                Row: {
                    id: string
                    user_id: string
                    manga_id: string
                    status: 'READING' | 'PLANNED' | 'DROPPED' | 'COMPLETED' | 'FAVORITE'
                    updated_at: string
                }
            }
            user_settings: {
                Row: {
                    user_id: string
                    reader_mode: 'VERTICAL' | 'HORIZONTAL' | 'WEBTOON'
                    quality: 'HIGH' | 'SAVER'
                    auto_next_chapter: boolean
                    show_inventory: 'PUBLIC' | 'FRIENDS' | 'PRIVATE'
                    hide_nsfw: boolean

                    // New Fields
                    show_nsfw: boolean
                    allow_gifts: boolean
                    notify_new_chapter: boolean
                    notify_replies: boolean
                    notify_manga_updates: boolean
                    notify_mentions: boolean
                    notify_friend_requests: boolean
                    notify_gifts: boolean
                    notify_system_news: boolean

                    updated_at: string
                }
            }
            moderation_logs: {
                Row: {
                    id: string
                    user_id: string
                    admin_id: string
                    type: 'WARN' | 'MUTE' | 'BAN'
                    reason: string
                    created_at: string
                    expires_at: string | null
                    is_active: boolean
                }
            }
            gifts: {
                Row: {
                    id: string
                    sender_id: string | null
                    receiver_id: string
                    gift_type: 'RUBIES' | 'ITEM' | 'PREMIUM_SUB'
                    content_id: string
                    message: string | null
                    created_at: string
                }
            }
            wall_posts: {
                Row: {
                    id: string
                    user_id: string
                    author_id: string
                    content: string
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    user_id: string
                    author_id: string
                    content: string
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    user_id?: string
                    author_id?: string
                    content?: string
                    created_at?: string
                    updated_at?: string
                }
            }
        }
        Functions: {
            get_shadow_army_count: {
                Args: {
                    recruiter_uuid: string
                }
                Returns: number
            }
            send_gift: {
                Args: {
                    receiver_uuid: string
                    g_type: string
                    content_value: string
                    gift_message?: string
                }
                Returns: Json
            }
            get_top_readers: {
                Args: {
                    limit_count?: number
                }
                Returns: {
                    id: string
                    username: string
                    avatar_url: string
                    level: number
                    xp: number
                    rank_tier: string
                    chapters_read: number
                }[]
            }
            get_top_guilds: {
                Args: {
                    limit_count?: number
                }
                Returns: {
                    id: string
                    name: string
                    description: string
                    level: number
                    members_count: number
                    created_at: string
                }[]
            }
            create_community_post: {
                Args: {
                    p_content: string
                    p_images?: string[]
                    p_type?: 'discussion' | 'theory' | 'art' | 'poll'
                    p_tags?: string[]
                }
                Returns: string // UUID
            }
            toggle_like: {
                Args: {
                    p_post_id: string
                }
                Returns: boolean
            }
            get_community_feed: {
                Args: {
                    p_filter_type?: string
                    p_sort?: string
                    p_page?: number
                    p_limit?: number
                }
                Returns: {
                    data: {
                        id: string
                        content: string
                        images: string[]
                        type: 'discussion' | 'theory' | 'art' | 'poll'
                        tags: string[]
                        metrics: { likes: number; comments: number; shares: number }
                        is_pinned: boolean
                        is_spoiler: boolean
                        created_at: string
                        author: {
                            id: string
                            username: string
                            avatar_url: string | null
                            rank_tier: string
                            badge: string | null
                        }
                        is_liked: boolean
                    }[]
                    meta: {
                        total: number
                        page: number
                        limit: number
                    }
                }
            }
            get_sidebar_widgets: {
                Args: {}
                Returns: {
                    spotlight: {
                        reason_text: string
                        stat_1: string
                        stat_2: string
                        user: {
                            username: string
                            avatar_url: string | null
                            rank_tier: string
                        }
                    } | null
                    trending: {
                        id: string
                        title: string
                        metrics: { likes: number; comments: number; shares: number }
                        created_at: string
                        tags: string[]
                    }[]
                    guilds: {
                        id: string
                        name: string
                        member_count: number
                        level: number
                        initials: string
                    }[]
                }
            }
            sync_reading_progress: {
                Args: {
                    p_manga_id: string
                    p_chapter_id: string
                    p_page_number: number
                    p_total_pages: number
                }
                Returns: void
            }
            get_user_history: {
                Args: {
                    p_page?: number
                    p_limit?: number
                }
                Returns: {
                    data: {
                        manga_id: string
                        chapter_id: string
                        page_number: number
                        total_pages: number
                        is_completed: boolean
                        updated_at: string
                        manga_title: string
                        manga_cover: string | null
                        manga_slug: string
                        chapter_number: number
                        chapter_title: string | null
                        chapter_slug: string | null
                    }[]
                    meta: {
                        total: number
                        page: number
                        limit: number
                    }
                }
            }
            get_popular_today: {
                Args: {}
                Returns: {
                    id: string
                    title: string
                    cover_url: string | null
                    views_count: number
                }[]
            }
            get_weekly_top_readers: {
                Args: {}
                Returns: {
                    user_id: string
                    username: string
                    avatar_url: string | null
                    level: number
                    chapters_read: number
                }[]
            }
        }
    }
}
