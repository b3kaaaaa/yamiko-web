// Zod Validation Schemas for API Requests
// Ensures runtime type safety and input validation

import { z } from 'zod';

// ============================================================
// AUTH SCHEMAS
// ============================================================

export const signupSchema = z.object({
    username: z.string()
        .min(3, 'Username must be at least 3 characters')
        .max(20, 'Username must be at most 20 characters')
        .regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers and underscores'),
    email: z.string().email('Invalid email address'),
    password: z.string()
        .min(8, 'Password must be at least 8 characters')
        .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
        .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
        .regex(/[0-9]/, 'Password must contain at least one number'),
});

export const loginSchema = z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(1, 'Password is required'),
});

// ============================================================
// MANGA SCHEMAS
// ============================================================

export const mangaListQuerySchema = z.object({
    page: z.number().int().positive().optional().default(1),
    limit: z.number().int().positive().max(100).optional().default(20),
    status: z.enum(['ONGOING', 'COMPLETED', 'FROZEN', 'HIATUS']).optional(),
    genres: z.array(z.string()).optional(),
    tags: z.array(z.string()).optional(),
    sortBy: z.enum(['rating', 'views', 'updated', 'created']).optional().default('updated'),
    order: z.enum(['asc', 'desc']).optional().default('desc'),
});

export const addToLibrarySchema = z.object({
    mangaId: z.string().cuid(),
    status: z.enum(['READING', 'COMPLETED', 'PLAN_TO_READ', 'DROPPED']).optional(),
    isFavorite: z.boolean().optional(),
});

// ============================================================
// GACHA SCHEMAS
// ============================================================

export const openPackSchema = z.object({
    packType: z.enum(['STANDARD', 'PREMIUM', 'FEATURED']),
});

export const createListingSchema = z.object({
    cardId: z.string().cuid(),
    price: z.number().int().positive().min(1).max(999999),
});

export const purchaseListingSchema = z.object({
    listingId: z.string().cuid(),
});

// ============================================================
// GUILD SCHEMAS
// ============================================================

export const createGuildSchema = z.object({
    name: z.string()
        .min(3, 'Guild name must be at least 3 characters')
        .max(30, 'Guild name must be at most 30 characters'),
    description: z.string().max(500).optional(),
});

export const joinGuildSchema = z.object({
    guildId: z.string().cuid(),
});

export const donateToGuildSchema = z.object({
    amount: z.number().int().positive().min(1),
});

// ============================================================
// FORUM SCHEMAS
// ============================================================

export const createThreadSchema = z.object({
    title: z.string()
        .min(5, 'Title must be at least 5 characters')
        .max(200, 'Title must be at most 200 characters'),
    content: z.string()
        .min(10, 'Content must be at least 10 characters')
        .max(10000, 'Content must be at most 10000 characters'),
    mangaId: z.string().cuid().optional(),
});

export const createCommentSchema = z.object({
    threadId: z.string().cuid().optional(),
    parentId: z.string().cuid().optional(),
    content: z.string()
        .min(1, 'Comment cannot be empty')
        .max(2000, 'Comment must be at most 2000 characters'),
});

// ============================================================
// PROFILE SCHEMAS
// ============================================================

export const updateProfileSchema = z.object({
    bio: z.string().max(500).optional(),
    avatarUrl: z.string().url().optional(),
    bannerUrl: z.string().url().optional(),
});

// ============================================================
// ADMIN SCHEMAS
// ============================================================

export const createMangaSchema = z.object({
    title: z.string().min(1).max(200),
    slug: z.string().min(1).max(200).regex(/^[a-z0-9-]+$/),
    description: z.string().min(10),
    coverImage: z.string().url(),
    backgroundVideo: z.string().url().optional(),
    status: z.enum(['ONGOING', 'COMPLETED', 'FROZEN', 'HIATUS']),
    author: z.string().optional(),
    artist: z.string().optional(),
    releaseYear: z.number().int().min(1900).max(2100).optional(),
    genreIds: z.array(z.string().cuid()),
    tagIds: z.array(z.string().cuid()),
});

export const createChapterSchema = z.object({
    mangaId: z.string().cuid(),
    title: z.string().min(1).max(200),
    number: z.number().positive(),
    images: z.array(z.string().url()).min(1),
    isLocked: z.boolean().optional().default(false),
});

export const createCardTemplateSchema = z.object({
    name: z.string().min(1).max(100),
    image: z.string().url(),
    rarity: z.enum(['COMMON', 'RARE', 'SR', 'SSR', 'UR']),
    stats: z.object({
        atk: z.number().int().positive(),
        def: z.number().int().positive(),
        hp: z.number().int().positive(),
    }),
    description: z.string().max(500).optional(),
    collectionId: z.string().cuid().optional(),
});

// ============================================================
// HELPER SCHEMAS
// ============================================================

export const paginationSchema = z.object({
    page: z.number().int().positive().optional().default(1),
    limit: z.number().int().positive().max(100).optional().default(20),
});

export const idParamSchema = z.object({
    id: z.string().cuid(),
});

export const slugParamSchema = z.object({
    slug: z.string().min(1),
});

// ============================================================
// TYPE INFERENCE
// ============================================================

export type SignupInput = z.infer<typeof signupSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type MangaListQuery = z.infer<typeof mangaListQuerySchema>;
export type AddToLibraryInput = z.infer<typeof addToLibrarySchema>;
export type OpenPackInput = z.infer<typeof openPackSchema>;
export type CreateListingInput = z.infer<typeof createListingSchema>;
export type PurchaseListingInput = z.infer<typeof purchaseListingSchema>;
export type CreateGuildInput = z.infer<typeof createGuildSchema>;
export type JoinGuildInput = z.infer<typeof joinGuildSchema>;
export type DonateToGuildInput = z.infer<typeof donateToGuildSchema>;
export type CreateThreadInput = z.infer<typeof createThreadSchema>;
export type CreateCommentInput = z.infer<typeof createCommentSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type CreateMangaInput = z.infer<typeof createMangaSchema>;
export type CreateChapterInput = z.infer<typeof createChapterSchema>;
export type CreateCardTemplateInput = z.infer<typeof createCardTemplateSchema>;
