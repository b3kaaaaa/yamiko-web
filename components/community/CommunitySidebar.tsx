"use client";

import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useEffect, useState } from "react";

interface SidebarData {
    spotlight: {
        reason_text: string;
        stat_1: string;
        stat_2: string;
        user: {
            username: string;
            avatar_url: string | null;
            rank_tier: string;
        };
    } | null;
    trending: {
        id: string;
        title: string;
        metrics: { likes: number; comments: number; shares: number };
        created_at: string;
        tags: string[];
    }[];
    guilds: {
        id: string;
        name: string;
        member_count: number;
        level: number;
        initials: string;
    }[];
}

export default function CommunitySidebar() {
    const [data, setData] = useState<SidebarData | null>(null);
    const [loading, setLoading] = useState(true);
    const supabase = createClient();

    useEffect(() => {
        const fetchWidgets = async () => {
            try {
                const { data, error } = await supabase.rpc('get_sidebar_widgets');
                if (error) console.error("Error fetching widgets:", error);
                else setData(data as any);
            } catch (err) {
                console.error("Error fetching widgets:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchWidgets();
    }, []);

    // Helper to format time relative (simple version)
    const timeAgo = (dateStr: string) => {
        const diff = Date.now() - new Date(dateStr).getTime();
        const mins = Math.floor(diff / 60000);
        if (mins < 60) return `${mins} мин назад`;
        const hours = Math.floor(mins / 60);
        if (hours < 24) return `${hours} ч назад`;
        return 'Недавно';
    };

    return (
        <aside className="hidden lg:block w-80 shrink-0 space-y-6 sticky top-24 self-start h-[calc(100vh-6rem)] overflow-y-auto no-scrollbar pb-10">
            {/* Search */}
            <div className="relative w-full">
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 text-lg peer-focus:text-primary transition-colors">search</span>
                <input
                    className="w-full bg-surface-dark border border-white/5 rounded-xl py-3 pl-11 pr-4 text-sm text-gray-200 focus:ring-1 focus:ring-primary focus:border-primary placeholder-gray-600 shadow-sm transition-all peer"
                    placeholder="Поиск в комьюнити..."
                    type="text"
                />
            </div>

            {/* Trending Discussions */}
            <div className="bg-surface-dark border border-white/5 rounded-2xl overflow-hidden shadow-lg">
                <div className="p-5 border-b border-white/5 bg-surface-highlight-dark/30">
                    <h3 className="text-base font-bold text-white flex items-center gap-2">
                        <span className="material-symbols-outlined text-primary text-xl">forum</span>
                        Актуальные обсуждения
                    </h3>
                </div>
                <div className="divide-y divide-white/5">
                    {loading ? (
                        [1, 2, 3].map(i => <div key={i} className="p-4 h-20 animate-pulse bg-white/5"></div>)
                    ) : (data?.trending?.length === 0 ? <div className="p-4 text-center text-gray-500 text-sm">Нет обсуждений</div> :
                        data?.trending?.map(post => (
                            <div key={post.id} className="p-4 hover:bg-white/5 transition-colors cursor-pointer group">
                                <div className="flex items-center gap-2 mb-1">
                                    {post.tags?.[0] && (
                                        <span className="text-[10px] font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded truncate max-w-[100px]">{post.tags[0]}</span>
                                    )}
                                    <span className="text-[10px] text-gray-500">{timeAgo(post.created_at)}</span>
                                </div>
                                <h4 className="text-sm font-bold text-gray-200 group-hover:text-primary transition-colors mb-2 line-clamp-2">
                                    {post.title}
                                </h4>
                                <div className="flex items-center gap-3 text-[11px] text-gray-500">
                                    <span className="flex items-center gap-1"><span className="material-symbols-outlined text-[14px]">chat_bubble</span> {post.metrics.comments}</span>
                                    <span className="flex items-center gap-1"><span className="material-symbols-outlined text-[14px]">favorite</span> {post.metrics.likes}</span>
                                </div>
                            </div>
                        ))
                    )}
                </div>
                {!loading && data?.trending?.length! > 0 && (
                    <div className="p-3 text-center border-t border-white/5">
                        <Link className="text-xs font-bold text-primary hover:text-white transition-colors uppercase tracking-wider" href="#">Показать больше</Link>
                    </div>
                )}
            </div>

            {/* Active Guilds */}
            <div className="bg-surface-dark border border-white/5 rounded-2xl overflow-hidden shadow-lg">
                <div className="p-5 border-b border-white/5 bg-surface-highlight-dark/30 flex justify-between items-center">
                    <h3 className="text-base font-bold text-white flex items-center gap-2">
                        <span className="material-symbols-outlined text-yellow-400 text-xl">diversity_3</span>
                        Активные Гильдии
                    </h3>
                </div>
                <div className="p-2 space-y-1">
                    {loading ? (
                        [1, 2, 3].map(i => <div key={i} className="p-3 h-16 animate-pulse bg-white/5 rounded-xl"></div>)
                    ) : (data?.guilds?.length === 0 ? <div className="p-4 text-center text-gray-500 text-sm">Нет гильдий</div> :
                        data?.guilds?.map((guild, i) => {
                            const colors = [
                                { bg: 'bg-red-900/30', border: 'border-red-500/30', text: 'text-red-500' },
                                { bg: 'bg-blue-900/30', border: 'border-blue-500/30', text: 'text-blue-500' },
                                { bg: 'bg-purple-900/30', border: 'border-purple-500/30', text: 'text-purple-500' },
                            ];
                            const style = colors[i % colors.length];

                            return (
                                <Link href={`/guilds/${guild.id}`} key={guild.id}>
                                    <div className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 transition-colors cursor-pointer group">
                                        <div className={`w-10 h-10 rounded-lg ${style.bg} border ${style.border} flex items-center justify-center text-lg font-black ${style.text}`}>
                                            {guild.initials || guild.name.substring(0, 2).toUpperCase()}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h4 className="text-sm font-bold text-white group-hover:text-primary transition-colors truncate">{guild.name}</h4>
                                            <p className="text-[10px] text-gray-500">Участников: {guild.member_count} • Рейтинг: #{i + 1}</p>
                                        </div>
                                        <button className="w-8 h-8 rounded-full bg-white/5 hover:bg-primary hover:text-white text-gray-400 flex items-center justify-center transition-all">
                                            <span className="material-symbols-outlined text-[18px]">add</span>
                                        </button>
                                    </div>
                                </Link>
                            );
                        })
                    )}
                </div>
            </div>

            {/* Footer Links */}
            <div className="flex flex-wrap gap-x-4 gap-y-2 px-2">
                <a className="text-[10px] font-medium text-gray-600 hover:text-gray-400" href="#">Правила</a>
                <a className="text-[10px] font-medium text-gray-600 hover:text-gray-400" href="#">Модерация</a>
                <a className="text-[10px] font-medium text-gray-600 hover:text-gray-400" href="#">Поддержка</a>
                <span className="text-[10px] text-gray-700 w-full mt-1">© 2024 Yamiko Community</span>
            </div>
        </aside>
    );
}
