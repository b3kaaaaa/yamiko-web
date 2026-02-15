'use client';

import { useState, useEffect } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { motion, AnimatePresence } from 'framer-motion';
import { useUserStore } from '@/lib/store/userStore';
import { logSupabaseError } from '@/lib/errorLogger';
import GuildCard from '@/components/guilds/GuildCard';
import CreateGuildModal from '@/components/guilds/CreateGuildModal';
import PageLayout from '@/components/layout/PageLayout';
import RightSidebar from '@/components/layout/RightSidebar';

// Type matching the RPC return
interface GuildPublic {
    id: string;
    name: string;
    tag: string;
    avatar_url: string | null;
    banner_url: string | null;
    level: number;
    member_count: number;
    is_recruiting: boolean;
    total_xp: number;
}

export default function GuildsPage() {
    const { currentUser } = useUserStore();
    const [guilds, setGuilds] = useState<GuildPublic[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [isRecruitingOnly, setIsRecruitingOnly] = useState(false);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [fetchError, setFetchError] = useState<string | null>(null);

    // Filter type state for the buttons
    const [filterType, setFilterType] = useState<'members' | 'level' | 'activity'>('activity');

    // Pagination state
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);

    const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const fetchGuilds = async (pageVal: number, reset = false) => {
        if (reset) {
            setLoading(true);
            setFetchError(null);
        }

        try {
            // Build filter object
            const filters: any = {};
            if (isRecruitingOnly) filters.is_recruiting = true;

            // Map filterType to RPC sort_by param
            let sortBy = 'xp'; // activity/default
            if (filterType === 'members') sortBy = 'members';
            if (filterType === 'level') sortBy = 'level';

            const { data, error } = await supabase.rpc('get_public_guilds', {
                p_filter: filters,
                p_sort_by: sortBy,
                p_page: pageVal,
                p_limit: 20
            });

            if (error) {
                logSupabaseError('guilds', error, 'get_public_guilds');
                console.error('Guilds RPC Error:', error.message, error.code, error.details, error.hint);
                throw new Error(error.message || 'Error fetching guilds');
            }

            if (data) {
                let filteredData = data;
                if (searchTerm) {
                    const lowerTerm = searchTerm.toLowerCase();
                    filteredData = data.filter((g: GuildPublic) =>
                        g.name.toLowerCase().includes(lowerTerm) ||
                        g.tag.toLowerCase().includes(lowerTerm)
                    );
                }

                if (reset) {
                    setGuilds(filteredData);
                } else {
                    setGuilds(prev => [...prev, ...filteredData]);
                }

                setHasMore(data.length === 20);
            }
        } catch (err: any) {
            console.error('Failed to fetch guilds:', err);
            setFetchError(err.message || 'Unknown error');
        } finally {
            setLoading(false);
        }
    };

    const [isSortDropdownOpen, setIsSortDropdownOpen] = useState(false);

    // Initial fetch and filter change
    useEffect(() => {
        setPage(1);
        fetchGuilds(1, true);
    }, [isRecruitingOnly, filterType]);

    const displayedGuilds = guilds.filter(g =>
        g.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        g.tag.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // RightSidebar Data State
    const [popular, setPopular] = useState<any[]>([]);
    const [activeUsers, setActiveUsers] = useState<any[]>([]);

    useEffect(() => {
        const fetchRightSidebarData = async () => {
            // Fetch Widgets for RightSidebar - Sync with Home Page Logic
            const { data: popData } = await supabase.from('manga')
                .select('id, title, cover_url, rating, status, description, views, slug')
                .order('views', { ascending: false })
                .limit(4);

            if (popData) {
                setPopular(popData.map((m: any) => ({
                    ...m,
                    views: m.views || 0,
                    rating: m.rating || 0
                })));
            }

            const { data: userData } = await supabase.from('profiles')
                .select('id, username, avatar_url, level, exp, energy, display_id')
                .eq('is_online', true)
                .limit(10);

            if (userData) {
                setActiveUsers(userData.map((u: any) => ({
                    ...u,
                    id: u.id,
                    display_id: u.display_id || u.id
                })));
            }
        };
        fetchRightSidebarData();
    }, []);

    const getFilterLabel = (type: string) => {
        switch (type) {
            case 'activity': return 'По активности';
            case 'members': return 'По участникам';
            case 'level': return 'По уровню';
            default: return 'Сортировка';
        }
    };

    return (
        <PageLayout rightSidebar={
            <RightSidebar popular={popular} activeUsers={activeUsers} />
        }>
            <div className="flex flex-col gap-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-black text-white tracking-tight flex items-center gap-3">
                            <span className="material-symbols-outlined text-purple-500 text-4xl">diversity_3</span>
                            Все гильдии
                        </h1>
                        <p className="text-gray-400 text-sm mt-1">Найдите свое сообщество и покоряйте вершины вместе</p>
                    </div>
                    <button
                        onClick={() => setIsCreateModalOpen(true)}
                        className="px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white text-sm font-bold rounded-xl transition-all shadow-lg shadow-purple-500/20 flex items-center gap-2"
                    >
                        <span className="material-symbols-outlined text-[18px]">add</span>
                        Создать гильдию
                    </button>
                </div>

                {/* Search and Filters */}
                <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1 relative">
                        <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 text-lg">search</span>
                        <input
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-[#1C1C22] border border-white/5 rounded-xl py-3 pl-11 pr-4 text-sm text-gray-200 focus:ring-1 focus:ring-purple-500 focus:border-purple-500 placeholder-gray-500 transition-all outline-none"
                            placeholder="Поиск гильдий..."
                            type="text"
                        />
                    </div>
                    <div className="relative">
                        <button
                            onClick={() => setIsSortDropdownOpen(!isSortDropdownOpen)}
                            className="h-full px-4 py-3 bg-[#1C1C22] border border-white/5 rounded-xl text-sm font-bold text-gray-300 hover:text-white hover:bg-white/5 transition-all flex items-center gap-2 min-w-[160px] justify-between"
                        >
                            <span className="flex items-center gap-2">
                                <span className="material-symbols-outlined text-[20px] text-purple-500">sort</span>
                                {getFilterLabel(filterType)}
                            </span>
                            <span className={`material-symbols-outlined text-[20px] transition-transform ${isSortDropdownOpen ? 'rotate-180' : ''}`}>expand_more</span>
                        </button>

                        <AnimatePresence>
                            {isSortDropdownOpen && (
                                <>
                                    <div
                                        className="fixed inset-0 z-10"
                                        onClick={() => setIsSortDropdownOpen(false)}
                                    />
                                    <motion.div
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: 10 }}
                                        className="absolute right-0 top-full mt-2 w-48 bg-[#1C1C22] border border-white/10 rounded-xl shadow-xl z-20 overflow-hidden py-1"
                                    >
                                        <button
                                            onClick={() => { setFilterType('activity'); setIsSortDropdownOpen(false); }}
                                            className={`w-full px-4 py-3 text-left text-sm font-bold transition-colors flex items-center gap-3 ${filterType === 'activity' ? 'bg-purple-500/10 text-purple-400' : 'text-gray-400 hover:bg-white/5 hover:text-white'}`}
                                        >
                                            <span className="material-symbols-outlined text-[18px]">trending_up</span>
                                            По активности
                                        </button>
                                        <button
                                            onClick={() => { setFilterType('members'); setIsSortDropdownOpen(false); }}
                                            className={`w-full px-4 py-3 text-left text-sm font-bold transition-colors flex items-center gap-3 ${filterType === 'members' ? 'bg-purple-500/10 text-purple-400' : 'text-gray-400 hover:bg-white/5 hover:text-white'}`}
                                        >
                                            <span className="material-symbols-outlined text-[18px]">group</span>
                                            По участникам
                                        </button>
                                        <button
                                            onClick={() => { setFilterType('level'); setIsSortDropdownOpen(false); }}
                                            className={`w-full px-4 py-3 text-left text-sm font-bold transition-colors flex items-center gap-3 ${filterType === 'level' ? 'bg-purple-500/10 text-purple-400' : 'text-gray-400 hover:bg-white/5 hover:text-white'}`}
                                        >
                                            <span className="material-symbols-outlined text-[18px]">military_tech</span>
                                            По уровню
                                        </button>
                                    </motion.div>
                                </>
                            )}
                        </AnimatePresence>
                    </div>
                </div>

                {/* Guild Grid */}
                {loading ? (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {[1, 2, 3, 4].map(i => (
                            <div key={i} className="h-[300px] bg-[#121217] rounded-2xl animate-pulse border border-white/5" />
                        ))}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <AnimatePresence>
                            {displayedGuilds.map((guild, idx) => (
                                <motion.div
                                    key={guild.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: idx * 0.05 }}
                                >
                                    <GuildCard guild={guild} index={idx} />
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>
                )}

                {!loading && displayedGuilds.length === 0 && (
                    <div className="text-center py-20 bg-[#121217] rounded-2xl border border-white/5">
                        <span className="material-symbols-outlined text-6xl text-gray-600 mb-4">search_off</span>
                        <h3 className="text-xl font-bold text-white">Гильдии не найдены</h3>
                        <p className="text-gray-500">Попробуйте изменить фильтры.</p>
                    </div>
                )}

                {/* Load More */}
                {hasMore && displayedGuilds.length > 0 && !loading && (
                    <div className="pt-8 pb-4 flex flex-col items-center justify-center gap-4 opacity-60">
                        <button
                            onClick={() => {
                                const nextPage = page + 1;
                                setPage(nextPage);
                                fetchGuilds(nextPage);
                            }}
                            className="px-6 py-2 bg-[#1C1C22] hover:bg-white/10 rounded-full text-sm font-bold text-gray-400 hover:text-white transition-colors border border-white/5"
                        >
                            Загрузить еще
                        </button>
                    </div>
                )}
            </div>

            <CreateGuildModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
            />
        </PageLayout>
    );
}
