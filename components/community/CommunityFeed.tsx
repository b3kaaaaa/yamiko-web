"use client";

import { createClient } from "@/lib/supabase/client";
import { useEffect, useState, useCallback } from "react";
import CreatePostWidget from "./CreatePostWidget";
import { useUserStore } from "@/lib/store/userStore";
import { formatDistanceToNow } from 'date-fns';
import { ru } from 'date-fns/locale';

interface Post {
    id: string;
    content: string;
    images: string[];
    type: string;
    tags: string[];
    metrics: { likes: number; comments: number; shares: number };
    is_pinned: boolean;
    is_spoiler: boolean;
    created_at: string;
    author: {
        id: string;
        username: string;
        avatar_url: string | null;
        rank_tier: string;
        badge: string | null;
    };
    is_liked: boolean;
}

export default function CommunityFeed({ spotlight, filter: externalFilter, hideControls }: { spotlight: any, filter?: string, hideControls?: boolean }) {
    const [posts, setPosts] = useState<Post[]>([]);
    const [loading, setLoading] = useState(true);
    const [internalFilter, setInternalFilter] = useState('all');
    const filter = externalFilter || internalFilter;

    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const supabase = createClient();
    const { currentUser } = useUserStore();

    const fetchFeed = useCallback(async (isLoadMore = false) => {
        try {
            if (!isLoadMore) setLoading(true);

            const currentPage = isLoadMore ? page + 1 : 1;

            const { data, error } = await (supabase.rpc as any)('get_community_feed', {
                p_filter_type: filter,
                p_sort: 'new',
                p_page: currentPage,
                p_limit: 10
            });

            if (error) throw error;

            const newPosts = (data as any).data || [];

            if (isLoadMore) {
                setPosts(prev => [...prev, ...newPosts]);
                setPage(currentPage);
            } else {
                setPosts(newPosts);
                setPage(1);
            }

            setHasMore(newPosts.length === 10);

        } catch (err) {
            console.error("Error fetching feed:", err);
        } finally {
            setLoading(false);
        }
    }, [filter, page]);

    useEffect(() => {
        fetchFeed(false);
    }, [filter]);

    const handleLike = async (postId: string) => {
        // Optimistic UI update
        setPosts(prev => prev.map(p => {
            if (p.id === postId) {
                const isLiked = !p.is_liked;
                return {
                    ...p,
                    is_liked: isLiked,
                    metrics: {
                        ...p.metrics,
                        likes: p.metrics.likes + (isLiked ? 1 : -1)
                    }
                };
            }
            return p;
        }));

        const { error } = await (supabase.rpc as any)('toggle_like', { p_post_id: postId });
        if (error) {
            console.error("Error toggling like:", error);
            // Revert on error (optional implementation)
        }
    };

    return (
        <main className="flex-1 min-w-0 mx-auto space-y-6 max-w-[1000px] pb-20 w-full">
            {/* Create Post - Only show if not hidden */}
            {!hideControls && <CreatePostWidget onPostCreated={() => fetchFeed(false)} />}

            {/* Spotlight Banner (Client-side rendering injected from Layout or Props) */}
            {spotlight && (
                <div className="relative rounded-2xl overflow-hidden border border-white/5 group">
                    <div className="absolute inset-0 bg-gradient-to-r from-purple-900/80 to-background-dark/90 z-0"></div>
                    <img alt="Background" className="absolute inset-0 w-full h-full object-cover -z-10 opacity-30 mix-blend-overlay" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDq8NL_O66GbIObLJB6FJW5Ef7up5YFbzrZUtk9huLNs_TJk_qdTgyzJSZ9lsrC_ulsEOqQzpGpapgqFk_r7hIbQ-l5D2HnigM_moFAkcyQG6Qhry3Tx2MwHI7yfylY9nYaoqQZnPCyDRxRL0aZJGSv6Epi30j5R7nLfW8Buo3NWrijKgwadLvfMkdOqDJOZaWONfn8O7toOHdcVVFutp6RWJz_sijVuXyWOHrhWNUcFe0Wm4wgM2Vlx2Chqr3dfGZljzbN2WSxhcQ" />
                    <div className="relative z-10 p-6 flex items-center gap-6">
                        <div className="relative">
                            <div className="w-20 h-20 rounded-full border-4 border-yellow-500/30 overflow-hidden shadow-[0_0_20px_rgba(234,179,8,0.3)]">
                                <img alt="Member" className="w-full h-full object-cover" src={spotlight.user.avatar_url || "https://placehold.co/200"} />
                            </div>
                            <div className="absolute -bottom-2 -right-2 bg-yellow-500 text-black text-[10px] font-black px-2 py-0.5 rounded-full border-2 border-surface-dark flex items-center gap-1 shadow-lg">
                                <span className="material-symbols-outlined text-[12px] filled">trophy</span> №1
                            </div>
                        </div>
                        <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                                <h3 className="text-xl font-bold text-white">Участник месяца</h3>
                                <span className="px-2 py-0.5 bg-yellow-500/20 text-yellow-400 border border-yellow-500/20 rounded text-[10px] font-bold uppercase tracking-wider">Spotlight</span>
                            </div>
                            <p className="text-sm text-gray-300 mb-3">Поздравляем <span className="text-white font-bold">{spotlight.user.username}</span> {spotlight.reason_text}</p>
                            <div className="flex items-center gap-4 text-xs font-medium text-gray-400">
                                {spotlight.stat_1 && <span className="flex items-center gap-1"><span className="material-symbols-outlined text-[14px] text-primary">edit</span> {spotlight.stat_1}</span>}
                                {spotlight.stat_2 && <span className="flex items-center gap-1"><span className="material-symbols-outlined text-[14px] text-green-400">forum</span> {spotlight.stat_2}</span>}
                            </div>
                        </div>
                        <button className="hidden sm:block px-4 py-2 bg-white/10 hover:bg-white/20 text-white text-xs font-bold rounded-lg transition-colors border border-white/5 backdrop-blur-sm">
                            Поздравить
                        </button>
                    </div>
                </div>
            )}

            {/* Filter Tabs - Only show if not hidden */}
            {!hideControls && (
                <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-2">
                    {[
                        { id: 'all', label: 'Все', color: '' },
                        { id: 'theory', label: 'Теории', color: 'text-primary' },
                        { id: 'discussion', label: 'Обзоры', color: 'text-green-400' }, // Mapping discussion -> reviews for visual logic
                        { id: 'art', label: 'Арт', color: 'text-blue-400' },
                        { id: 'popular', label: 'Популярное', color: '' }
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setInternalFilter(tab.id as any)}
                            className={`px-4 py-2 text-xs font-bold rounded-full border transition-colors whitespace-nowrap ${filter === tab.id ? 'bg-primary text-white border-primary' : 'bg-surface-dark text-gray-400 border-white/5 hover:text-white hover:bg-surface-highlight-dark'}`}
                        >
                            {tab.color && <span className={`${tab.color} mr-1`}>#</span>}
                            {tab.label}
                        </button>
                    ))}
                </div>
            )}

            {/* Posts Feed */}
            {loading && posts.length === 0 ? (
                <div className="py-20 flex flex-col items-center justify-center gap-2 opacity-60">
                    <div className="w-8 h-8 border-2 border-primary/20 border-t-primary rounded-full animate-spin"></div>
                    <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Загрузка постов</span>
                </div>
            ) : (
                posts.map(post => (
                    <article key={post.id} className="bg-surface-dark border border-white/5 rounded-2xl overflow-hidden hover:border-primary/20 transition-all">
                        <div className="p-4">
                            {/* Header */}
                            <div className="flex items-start justify-between mb-3">
                                <div className="flex gap-3">
                                    <div className="relative">
                                        <div className="w-10 h-10 rounded-full overflow-hidden border border-white/10 ring-2 ring-primary/20">
                                            <img alt="Avatar" className="w-full h-full object-cover" src={post.author.avatar_url || "https://placehold.co/100"} />
                                        </div>
                                        {post.author.rank_tier && (
                                            <div className="absolute -bottom-1 -right-1 bg-surface-dark rounded-full p-0.5">
                                                <div className="w-4 h-4 bg-primary flex items-center justify-center rounded-full text-[8px] font-bold text-white" title={`Rank ${post.author.rank_tier}`}>
                                                    {post.author.rank_tier}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <h4 className="text-sm font-bold text-white hover:underline cursor-pointer">{post.author.username}</h4>
                                            {post.author.badge && (
                                                <span className="px-1.5 py-0.5 rounded bg-purple-500/10 border border-purple-500/20 text-[9px] font-bold text-purple-400 uppercase">{post.author.badge}</span>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-2 text-[10px] text-gray-500 mt-0.5">
                                            <span>{formatDistanceToNow(new Date(post.created_at), { addSuffix: true, locale: ru })}</span>
                                            <span>•</span>
                                            <span className="text-primary font-bold">#{post.type.toUpperCase()}</span>
                                        </div>
                                    </div>
                                </div>
                                <button className="text-gray-500 hover:text-white transition-colors">
                                    <span className="material-symbols-outlined text-[20px]">more_horiz</span>
                                </button>
                            </div>

                            {/* Content */}
                            {post.content && (
                                <div>
                                    <p className={`text-sm text-gray-300 leading-relaxed mb-4 whitespace-pre-wrap ${post.is_spoiler ? 'blur-sm hover:blur-none transition-all cursor-pointer select-none' : ''}`} title={post.is_spoiler ? "Спойлер! Нажмите чтобы увидеть." : ""}>
                                        {post.content}
                                    </p>
                                </div>
                            )}

                            {/* Images Grid */}
                            {post.images && post.images.length > 0 && (
                                <div className={`grid gap-2 rounded-xl overflow-hidden mb-4 border border-white/5 ${post.images.length > 1 ? 'grid-cols-2' : 'grid-cols-1'}`}>
                                    {post.images.slice(0, 4).map((img, idx) => (
                                        <div key={idx} className="aspect-video bg-gray-800 relative cursor-pointer group">
                                            <img alt={`Post Image ${idx}`} className={`w-full h-full object-cover group-hover:opacity-90 transition-opacity ${post.is_spoiler ? 'blur-md' : ''}`} src={img} />
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Actions */}
                            <div className="flex items-center justify-between pt-2 border-t border-white/5">
                                <div className="flex gap-1">
                                    <button
                                        onClick={() => handleLike(post.id)}
                                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-white/5 transition-colors group ${post.is_liked ? 'text-pink-500' : 'text-gray-400 hover:text-pink-500'}`}
                                    >
                                        <span className={`material-symbols-outlined text-[18px] group-hover:scale-110 transition-transform ${post.is_liked ? 'filled' : ''}`}>favorite</span>
                                        <span className="text-xs font-bold">{post.metrics.likes}</span>
                                    </button>
                                    <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-white/5 text-gray-400 hover:text-blue-400 transition-colors group">
                                        <span className="material-symbols-outlined text-[18px] group-hover:scale-110 transition-transform">chat_bubble</span>
                                        <span className="text-xs font-bold">{post.metrics.comments}</span>
                                    </button>
                                    <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-white/5 text-gray-400 hover:text-green-400 transition-colors group">
                                        <span className="material-symbols-outlined text-[18px] group-hover:scale-110 transition-transform">share</span>
                                        <span className="text-xs font-bold">Поделиться</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </article>
                ))
            )}

            {hasMore && !loading && (
                <div className="flex justify-center pt-4">
                    <button
                        onClick={() => fetchFeed(true)}
                        className="px-6 py-2 rounded-lg bg-surface-dark/50 border border-white/10 text-gray-400 hover:text-white hover:bg-white/5 transition-all text-sm font-bold"
                    >
                        Загрузить еще
                    </button>
                </div>
            )}
        </main>
    );
}
