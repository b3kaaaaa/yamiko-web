// TypeScript Type Definitions for Yamiko Platform
// Auto-generated interfaces based on Prisma schema
// These types ensure type safety across frontend components

import { Prisma } from '@prisma/client';

// ============================================================
// USER & RPG SYSTEM
// ============================================================

export type UserRole = 'USER' | 'ADMIN' | 'MODERATOR';

export interface UserProfile {
    id: string;
    username: string;
    email: string;
    role: UserRole;
    level: number;
    exp: number;
    rubies: number;
    energy: number;
    bio?: string;
    avatarUrl?: string;
    bannerUrl?: string;
    createdAt: Date;
    lastLogin?: Date;
}

export interface UserStats {
    level: number;
    exp: number;
    expToNextLevel: number;
    rubies: number;
    energy: number;
    maxEnergy: number;
}

// ============================================================
// MANGA & CONTENT
// ============================================================

export type MangaStatus = 'ONGOING' | 'COMPLETED' | 'FROZEN' | 'HIATUS';

export interface MangaCard {
    id: string;
    title: string;
    slug: string;
    coverImage: string;
    rating: number;
    views: number;
    status: MangaStatus;
    genres: string[];
}

export interface MangaDetail extends MangaCard {
    description: string;
    backgroundVideo?: string;
    author?: string;
    artist?: string;
    releaseYear?: number;
    tags: string[];
    chapterCount: number;
    lastChapterDate?: Date;
}

export interface ChapterInfo {
    id: string;
    mangaId: string;
    title: string;
    number: number;
    likes: number;
    isLocked: boolean;
    createdAt: Date;
}

export interface ChapterImages {
    id: string;
    title: string;
    number: number;
    images: string[];
    nextChapter?: string;
    prevChapter?: string;
}

export interface ReadingProgress {
    mangaId: string;
    mangaTitle: string;
    mangaCover: string;
    chapterId: string;
    chapterNumber: number;
    progress: number;
    lastReadAt: Date;
}

export type LibraryStatus = 'READING' | 'COMPLETED' | 'PLAN_TO_READ' | 'DROPPED';

export interface LibraryEntry {
    id: string;
    manga: MangaCard;
    isFavorite: boolean;
    status: LibraryStatus;
    addedAt: Date;
}

// ============================================================
// GACHA & CARD SYSTEM
// ============================================================

export type CardRarity = 'COMMON' | 'RARE' | 'SR' | 'SSR' | 'UR';

export interface CardStats {
    atk: number;
    def: number;
    hp: number;
}

export interface CardTemplate {
    id: string;
    name: string;
    image: string;
    rarity: CardRarity;
    stats: CardStats;
    description?: string;
    collectionName?: string;
}

export interface UserCard {
    id: string;
    template: CardTemplate;
    isLocked: boolean;
    obtainedAt: Date;
}

export interface MarketListing {
    id: string;
    card: UserCard;
    seller: {
        id: string;
        username: string;
        avatarUrl?: string;
    };
    price: number;
    createdAt: Date;
}

export type ListingStatus = 'ACTIVE' | 'SOLD' | 'CANCELLED';

export interface CardPackResult {
    cards: UserCard[];
    totalValue: number;
    hasRare: boolean;
}

// ============================================================
// GUILD SYSTEM
// ============================================================

export type GuildRank = 'LEADER' | 'OFFICER' | 'MEMBER';

export interface GuildInfo {
    id: string;
    name: string;
    description?: string;
    level: number;
    exp: number;
    treasury: number;
    memberCount: number;
    createdAt: Date;
}

export interface GuildMember {
    id: string;
    user: {
        id: string;
        username: string;
        avatarUrl?: string;
        level: number;
    };
    rank: GuildRank;
    joinedAt: Date;
}

export interface GuildDetail extends GuildInfo {
    members: GuildMember[];
    leader: {
        id: string;
        username: string;
        avatarUrl?: string;
    };
}

// ============================================================
// SOCIAL & FORUM
// ============================================================

export interface ForumThread {
    id: string;
    title: string;
    content: string;
    author: {
        id: string;
        username: string;
        avatarUrl?: string;
        level: number;
    };
    manga?: {
        id: string;
        title: string;
        slug: string;
    };
    isPinned: boolean;
    isLocked: boolean;
    views: number;
    commentCount: number;
    createdAt: Date;
    updatedAt: Date;
}

export interface Comment {
    id: string;
    content: string;
    author: {
        id: string;
        username: string;
        avatarUrl?: string;
        level: number;
    };
    likes: number;
    replies: Comment[];
    createdAt: Date;
    updatedAt: Date;
}

export interface WikiCharacter {
    id: string;
    name: string;
    slug: string;
    description: string;
    image?: string;
    manga: {
        id: string;
        title: string;
        slug: string;
    };
    createdAt: Date;
}

// ============================================================
// NOTIFICATIONS
// ============================================================

export type NotificationType =
    | 'SYSTEM'
    | 'REPLY'
    | 'GIFT'
    | 'GUILD_INVITE'
    | 'CHAPTER_UPDATE'
    | 'LEVEL_UP';

export interface Notification {
    id: string;
    type: NotificationType;
    title: string;
    message: string;
    data?: Record<string, any>;
    isRead: boolean;
    createdAt: Date;
}

// ============================================================
// ACHIEVEMENTS
// ============================================================

export interface Achievement {
    id: string;
    name: string;
    description: string;
    icon: string;
    expReward: number;
    rubiesReward: number;
    isUnlocked: boolean;
    unlockedAt?: Date;
}

// ============================================================
// TRANSACTIONS
// ============================================================

export type TransactionType =
    | 'PURCHASE_RUBIES'
    | 'PURCHASE_CARD_PACK'
    | 'MARKET_SALE'
    | 'MARKET_PURCHASE'
    | 'GUILD_DONATION'
    | 'DAILY_REWARD'
    | 'ACHIEVEMENT_REWARD';

export interface Transaction {
    id: string;
    type: TransactionType;
    amount: number;
    description: string;
    createdAt: Date;
}

// ============================================================
// API REQUEST/RESPONSE DTOs
// ============================================================

// Auth DTOs
export interface SignupRequest {
    username: string;
    email: string;
    password: string;
}

export interface LoginRequest {
    email: string;
    password: string;
}

export interface AuthResponse {
    user: UserProfile;
    token: string;
}

// Manga DTOs
export interface MangaListQuery {
    page?: number;
    limit?: number;
    status?: MangaStatus;
    genres?: string[];
    tags?: string[];
    sortBy?: 'rating' | 'views' | 'updated' | 'created';
    order?: 'asc' | 'desc';
}

export interface MangaListResponse {
    data: MangaCard[];
    total: number;
    page: number;
    totalPages: number;
}

// Library DTOs
export interface AddToLibraryRequest {
    mangaId: string;
    status?: LibraryStatus;
    isFavorite?: boolean;
}

// Gacha DTOs
export interface OpenPackRequest {
    packType: string;
}

export interface OpenPackResponse extends CardPackResult {
    newRubiesBalance: number;
}

// Market DTOs
export interface CreateListingRequest {
    cardId: string;
    price: number;
}

export interface PurchaseListingRequest {
    listingId: string;
}

// Guild DTOs
export interface CreateGuildRequest {
    name: string;
    description?: string;
}

export interface JoinGuildRequest {
    guildId: string;
}

export interface DonateToGuildRequest {
    amount: number;
}

// Forum DTOs
export interface CreateThreadRequest {
    title: string;
    content: string;
    mangaId?: string;
}

export interface CreateCommentRequest {
    threadId?: string;
    parentId?: string;
    content: string;
}

// Profile DTOs
export interface UpdateProfileRequest {
    bio?: string;
    avatarUrl?: string;
    bannerUrl?: string;
}

// ============================================================
// HELPER TYPES
// ============================================================

export interface PaginationParams {
    page: number;
    limit: number;
}

export interface PaginatedResponse<T> {
    data: T[];
    total: number;
    page: number;
    totalPages: number;
    hasMore: boolean;
}

export interface ApiResponse<T> {
    success: boolean;
    data?: T;
    error?: string;
    message?: string;
}

// ============================================================
// ZUSTAND STORE TYPES
// ============================================================

export interface UserStore {
    user: UserProfile | null;
    stats: UserStats | null;
    isLoading: boolean;

    setUser: (user: UserProfile) => void;
    updateStats: (stats: Partial<UserStats>) => void;
    logout: () => void;
    refreshUser: () => Promise<void>;
}

export interface NotificationStore {
    notifications: Notification[];
    unreadCount: number;

    addNotification: (notification: Notification) => void;
    markAsRead: (id: string) => void;
    markAllAsRead: () => void;
    fetchNotifications: () => Promise<void>;
}

// ============================================================
// UTILITY TYPES
// ============================================================

export type DeepPartial<T> = {
    [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export type Nullable<T> = T | null;

export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;
