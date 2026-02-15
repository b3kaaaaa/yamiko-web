export type WikiEntityType = 'character' | 'location' | 'artifact' | 'faction' | 'world';
export type WikiEditStatus = 'pending' | 'approved' | 'rejected';

export interface WikiEntity {
    id: string;
    manga_id: string;
    type: WikiEntityType;
    slug: string;
    title: string;
    cover_image: string | null;
    content: any; // JSONB
    attributes: any; // JSONB
    is_spoiler: boolean;
    created_at: string;
    updated_at: string;
}

export interface WikiEdit {
    id: string;
    entity_id: string | null;
    manga_id: string;
    user_id: string;
    type: WikiEntityType | null;
    title: string | null;
    slug: string | null;
    proposed_content: any;
    proposed_attributes: any;
    cover_image: string | null;
    status: WikiEditStatus;
    admin_comment: string | null;
    created_at: string;
}

export interface WikiStats {
    user_id: string;
    approved_edits_count: number;
    last_edit_date: string;
}

// RPC Response Types
export interface FandomHubData {
    popular_worlds: PopularWorld[];
    top_keepers: TopKeeper[];
    recent_activity: RecentActivityItem[];
}

export interface PopularWorld {
    id: string;
    title: string;
    cover_url: string;
    slug: string;
    entity_count: number;
    views: number;
}

export interface TopKeeper {
    id: string;
    username: string;
    avatar_url: string | null;
    display_id: number;
    approved_edits_count: number;
    last_edit_date: string;
}

export interface RecentActivityItem {
    id: string;
    title: string;
    type: WikiEntityType;
    manga_title: string;
    manga_slug: string;
    username: string;
    avatar_url: string | null;
    created_at: string;
}
