// Content Service - Manga & Chapter Management
// Handles creation and management of manga content

import { prisma } from '@/lib/prisma';
import { createAdminClient } from '@/lib/supabase/admin';
import type { CreateMangaInput, CreateChapterInput } from '@/lib/validations';

/**
 * Create a new manga entry with metadata
 */
export async function createManga(data: CreateMangaInput) {
    try {
        // Check if slug already exists
        const existing = await prisma.manga.findUnique({
            where: { slug: data.slug },
        });

        if (existing) {
            throw new Error('A manga with this slug already exists');
        }

        // Create manga with genre and tag relations
        const manga = await prisma.manga.create({
            data: {
                title: data.title,
                slug: data.slug,
                description: data.description,
                coverImage: data.coverImage,
                backgroundVideo: data.backgroundVideo,
                status: data.status,
                author: data.author,
                artist: data.artist,
                releaseYear: data.releaseYear,
                genres: {
                    create: data.genreIds.map((genreId) => ({
                        genre: { connect: { id: genreId } },
                    })),
                },
                tags: {
                    create: data.tagIds.map((tagId) => ({
                        tag: { connect: { id: tagId } },
                    })),
                },
            },
            include: {
                genres: {
                    include: { genre: true },
                },
                tags: {
                    include: { tag: true },
                },
            },
        });

        return {
            success: true,
            data: manga,
        };
    } catch (error) {
        console.error('Error creating manga:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to create manga',
        };
    }
}

/**
 * Create a new chapter for a manga
 */
export async function createChapter(data: CreateChapterInput) {
    try {
        // Verify manga exists
        const manga = await prisma.manga.findUnique({
            where: { id: data.mangaId },
        });

        if (!manga) {
            throw new Error('Manga not found');
        }

        // Check if chapter number already exists for this manga
        const existing = await prisma.chapter.findUnique({
            where: {
                mangaId_number: {
                    mangaId: data.mangaId,
                    number: data.number,
                },
            },
        });

        if (existing) {
            throw new Error(`Chapter ${data.number} already exists for this manga`);
        }

        // Create chapter
        const chapter = await prisma.chapter.create({
            data: {
                mangaId: data.mangaId,
                title: data.title,
                number: data.number,
                images: data.images,
                isLocked: data.isLocked ?? false,
            },
            include: {
                manga: {
                    select: {
                        id: true,
                        title: true,
                        slug: true,
                    },
                },
            },
        });

        // Update manga's updatedAt timestamp
        await prisma.manga.update({
            where: { id: data.mangaId },
            data: { updatedAt: new Date() },
        });

        return {
            success: true,
            data: chapter,
        };
    } catch (error) {
        console.error('Error creating chapter:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to create chapter',
        };
    }
}

/**
 * Get manga by slug with full details
 */
/**
 * Get manga by slug with full details
 */
export async function getMangaBySlug(slug: string) {
    try {
        const supabase = createAdminClient();

        // 1. Fetch the main manga record
        const { data: manga, error: mangaError } = await supabase
            .from('manga')
            .select('*')
            .eq('slug', slug)
            .single();

        if (mangaError || !manga) {
            return {
                success: false,
                error: mangaError?.message || 'Manga not found',
            };
        }

        const id = manga.id;

        // 2. Fetch genres and tags via junction tables using separate queries (more reliable)
        const [genresRes, tagsRes, chaptersRes, libraryRes] = await Promise.all([
            supabase.from('manga_genres').select('genres(*)').eq('manga_id', id),
            supabase.from('manga_tags').select('tags(*)').eq('manga_id', id),
            supabase.from('chapters').select('*').eq('manga_id', id).order('chapter_number', { ascending: true }),
            supabase.from('library_entries').select('*', { count: 'exact', head: true }).eq('manga_id', id)
        ]);

        // 3. Format chapters
        const chapters = (chaptersRes.data || []).map((ch: any) => ({
            ...ch,
            number: ch.chapter_number,
            createdAt: ch.created_at,
            updatedAt: ch.updated_at,
        }));

        // 4. Format genres and tags
        const genres = (genresRes.data || []).map((g: any) => ({
            genre: g.genres
        })).filter(g => g.genre);

        const tags = (tagsRes.data || []).map((t: any) => ({
            tag: t.tags
        })).filter(t => t.tag);

        // 5. Structure final object
        const formattedManga = {
            ...manga,
            coverImage: manga.cover_url,
            backgroundVideo: manga.background_video,
            releaseYear: manga.release_year,
            createdAt: manga.created_at,
            updatedAt: manga.updated_at,
            chapters,
            genres,
            tags,
            bookmarkCount: libraryRes.count || 0,
        };

        const firstChapter = chapters[0] || null;

        return {
            success: true,
            data: {
                ...formattedManga,
                firstChapterId: firstChapter?.id || null,
            },
        };
    } catch (error) {
        console.error('Error fetching manga:', error);
        return {
            success: false,
            error: 'Failed to fetch manga',
        };
    }
}


/**
 * Get manga by ID with full details
 */
export async function getMangaById(id: string) {
    try {
        console.log(`DEBUG: Fetching manga with ID: "${id}"`);
        const supabase = createAdminClient();

        // 1. Fetch the main manga record
        const { data: manga, error: mangaError } = await supabase
            .from('manga')
            .select('*')
            .eq('id', id)
            .single();

        if (mangaError || !manga) {
            console.error('Error fetching manga. Code:', mangaError?.code);
            console.error('Message:', mangaError?.message);
            return {
                success: false,
                error: mangaError?.message || 'Manga not found',
            };
        }

        // 2. Fetch genres and tags via junction tables using separate queries (more reliable)
        const [genresRes, tagsRes, chaptersRes, libraryRes] = await Promise.all([
            supabase.from('manga_genres').select('genres(*)').eq('manga_id', id),
            supabase.from('manga_tags').select('tags(*)').eq('manga_id', id),
            supabase.from('chapters').select('*').eq('manga_id', id).order('chapter_number', { ascending: true }),
            supabase.from('library_entries').select('*', { count: 'exact', head: true }).eq('manga_id', id)
        ]);

        // 3. Format chapters
        const chapters = (chaptersRes.data || []).map((ch: any) => ({
            ...ch,
            number: ch.chapter_number,
            createdAt: ch.created_at,
            updatedAt: ch.updated_at,
        }));

        // 4. Format genres and tags
        const genres = (genresRes.data || []).map((g: any) => ({
            genre: g.genres
        })).filter(g => g.genre);

        const tags = (tagsRes.data || []).map((t: any) => ({
            tag: t.tags
        })).filter(t => t.tag);

        // 5. Structure final object
        const formattedManga = {
            ...manga,
            coverImage: manga.cover_url,
            backgroundVideo: manga.background_video,
            releaseYear: manga.release_year,
            createdAt: manga.created_at,
            updatedAt: manga.updated_at,
            chapters,
            genres,
            tags,
            bookmarkCount: libraryRes.count || 0,
        };

        const firstChapter = chapters[0] || null;

        return {
            success: true,
            data: {
                ...formattedManga,
                firstChapterId: firstChapter?.id || null,
            },
        };
    } catch (error) {
        console.error('Critical error in getMangaById:', error);
        return {
            success: false,
            error: 'Failed to fetch manga data',
        };
    }
}

/**
 * List all mangas with optional filters
 */
export async function listMangas(params: {
    page?: number;
    limit?: number;
    status?: string;
    genreIds?: string[];
    sortBy?: 'rating' | 'views' | 'created' | 'updated';
}) {
    const page = params.page ?? 1;
    const limit = params.limit ?? 20;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (params.status) {
        where.status = params.status;
    }

    if (params.genreIds && params.genreIds.length > 0) {
        where.genres = {
            some: {
                genreId: { in: params.genreIds },
            },
        };
    }

    const orderBy: any = {};
    switch (params.sortBy) {
        case 'rating':
            orderBy.rating = 'desc';
            break;
        case 'views':
            orderBy.views = 'desc';
            break;
        case 'created':
            orderBy.createdAt = 'desc';
            break;
        case 'updated':
        default:
            orderBy.updatedAt = 'desc';
    }

    try {
        const [mangas, total] = await Promise.all([
            prisma.manga.findMany({
                where,
                skip,
                take: limit,
                orderBy,
                include: {
                    genres: {
                        include: { genre: true },
                    },
                },
            }),
            prisma.manga.count({ where }),
        ]);

        return {
            success: true,
            data: {
                items: mangas,
                total,
                page,
                totalPages: Math.ceil(total / limit),
            },
        };
    } catch (error) {
        console.error('Error listing mangas:', error);
        return {
            success: false,
            error: 'Failed to list mangas',
        };
    }
}

/**
 * Get full chapter content with navigation context
 */
export async function getChapterContent(chapterId: string) {
    try {
        const supabase = createAdminClient();

        // 1. Fetch Chapter
        const { data: chapter, error: chapterError } = await supabase
            .from('chapters')
            .select('*')
            .eq('id', chapterId)
            .single();

        if (chapterError || !chapter) {
            return { success: false, error: 'Chapter not found' };
        }

        // 2. Fetch Manga
        const { data: manga, error: mangaError } = await supabase
            .from('manga')
            .select('id, title, slug')
            .eq('id', chapter.manga_id)
            .single();

        if (mangaError) {
            return { success: false, error: 'Manga not found' };
        }

        // 3. Fetch all chapters for navigation (lightweight)
        const { data: allChapters } = await supabase
            .from('chapters')
            .select('id, chapter_number, title')
            .eq('manga_id', chapter.manga_id)
            .order('chapter_number', { ascending: true });

        // Calculate Next/Prev
        const sorted = (allChapters || []).sort((a, b) => a.chapter_number - b.chapter_number);
        const currentIndex = sorted.findIndex(ch => ch.id === chapterId);

        const prevChapter = currentIndex > 0 ? sorted[currentIndex - 1] : null;
        const nextChapter = currentIndex < sorted.length - 1 ? sorted[currentIndex + 1] : null;

        return {
            success: true,
            data: {
                chapter: {
                    ...chapter,
                    pages: chapter.pages || [], // Ensure pages array exists
                },
                manga,
                navigation: {
                    prev: prevChapter,
                    next: nextChapter,
                    all: sorted
                }
            }
        };

    } catch (error) {
        console.error('Error fetching chapter content:', error);
        return {
            success: false,
            error: 'Failed to fetch chapter content',
        };
    }
}
