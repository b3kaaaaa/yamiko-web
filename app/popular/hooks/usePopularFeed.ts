import { useState, useEffect, useCallback } from 'react';
import { browserClient as supabase } from '@/lib/supabase/client';

export type FilterType = 'trending' | 'views' | 'rating';
export type TimePeriod = '7_days' | '30_days' | 'all_time';
export type FeedMode = 'general' | 'for_you' | 'for_him' | 'for_her';

interface PopularFeedParams {
    filterType: FilterType;
    timePeriod: TimePeriod;
    searchQuery: string;
    feedMode: FeedMode;
}

interface Manga {
    id: string;
    title: string;
    slug: string;
    cover_url: string;
    rating: number;
    status: string;
    type: string;
    trend_score: number;
    views_7_days: number;
    genres: string[];
}

interface Meta {
    total: number;
    page: number;
    limit: number;
    feed_mode: FeedMode;
    debug_tags?: string[];
}

export function usePopularFeed() {
    const [mangaList, setMangaList] = useState<Manga[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [meta, setMeta] = useState<Meta | null>(null);

    const [params, setParams] = useState<PopularFeedParams>({
        filterType: 'trending',
        timePeriod: '7_days',
        searchQuery: '',
        feedMode: 'general',
    });

    const fetchFeed = useCallback(async (isLoadMore = false) => {
        try {
            setLoading(true);
            setError(null);

            const currentPage = isLoadMore ? page + 1 : 1;

            const { data: { user } } = await supabase.auth.getUser();

            const { data, error } = await (supabase.rpc as any)('get_popular_feed', {
                filter_type: params.filterType,
                time_period: params.timePeriod,
                search_query: params.searchQuery || null,
                feed_mode: params.feedMode,
                page: currentPage,
                limit_count: 20,
                p_user_id: user?.id || null
            });

            if (error) throw error;

            const result = data as { data: Manga[], meta: Meta };

            if (isLoadMore) {
                setMangaList(prev => [...prev, ...result.data]);
                setPage(currentPage);
            } else {
                setMangaList(result.data);
                setPage(1);
            }

            setMeta(result.meta);
            setHasMore(result.data.length === 20); // Simple check

        } catch (err: any) {
            console.error('Error fetching popular feed:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [params, page, supabase]);

    // Reset and fetch when params change
    useEffect(() => {
        fetchFeed(false);
    }, [params]);

    const loadMore = () => {
        if (!loading && hasMore) {
            fetchFeed(true);
        }
    };

    const updateParams = (newParams: Partial<PopularFeedParams>) => {
        setParams(prev => ({ ...prev, ...newParams }));
    };

    return {
        mangaList,
        loading,
        error,
        hasMore,
        meta,
        params,
        updateParams,
        loadMore
    };
}
