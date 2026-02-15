"use client";

import PageLayout from "@/components/layout/PageLayout";
import Sidebar from "@/components/layout/Sidebar";
import RankingsHeader from "@/components/rankings/RankingsHeader";
import { browserClient as supabase } from "@/lib/supabase/client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { format } from "date-fns";

interface Guild {
    id: string;
    name: string;
    description: string;
    level: number;
    members_count: number;
    created_at: string;
    // Guilds usually have an avatar/banner, but migration didn't show it explicitly in my quick check?
    // Let's assume there might be an avatar_url or I'll use a placeholder.
    // Checking types/supabase.ts again... I don't see avatar_url in the RPC return.
    // I will add avatar_url to the RPC later if needed, or just use placeholder for now.
}

export default function TopGuildsPage() {
    const [guilds, setGuilds] = useState<Guild[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchGuilds = async () => {
            try {
                const { data, error } = await (supabase.rpc as any)('get_top_guilds', { limit_count: 50 });
                if (error) throw error;
                setGuilds(data || []);
            } catch (err) {
                console.error("Error fetching top guilds:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchGuilds();
    }, []);

    const RightSidebarContent = (
        <aside className="hidden lg:flex flex-col w-80 shrink-0 space-y-6 sticky top-24 self-start h-[calc(100vh-6rem)] overflow-y-auto no-scrollbar pb-10">
            <div className="glass-panel border border-white/5 rounded-2xl overflow-hidden p-1 shadow-lg bg-[#121217]/80">
                <div className="p-4">
                    <h3 className="text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-4 px-1 flex items-center gap-2">
                        <span className="material-symbols-outlined text-[14px]">filter_list</span>
                        Фильтр периода
                    </h3>
                    <div className="grid grid-cols-2 gap-2">
                        <button className="col-span-2 w-full flex items-center justify-between px-4 py-2.5 rounded-lg bg-primary/20 text-primary text-sm font-bold border border-primary/30 shadow-[0_0_10px_rgba(168,85,247,0.1)]">
                            <span>За всё время</span>
                            <span className="material-symbols-outlined text-[18px]">check_circle</span>
                        </button>
                        <button className="w-full flex items-center justify-center px-4 py-2.5 rounded-lg bg-surface-highlight-dark/50 hover:bg-white/5 text-gray-400 hover:text-white text-sm font-medium transition-all border border-white/5 hover:border-white/10">
                            <span>Месяц</span>
                        </button>
                        <button className="w-full flex items-center justify-center px-4 py-2.5 rounded-lg bg-surface-highlight-dark/50 hover:bg-white/5 text-gray-400 hover:text-white text-sm font-medium transition-all border border-white/5 hover:border-white/10">
                            <span>Неделя</span>
                        </button>
                        <button className="col-span-2 w-full flex items-center justify-center px-4 py-2.5 rounded-lg bg-surface-highlight-dark/50 hover:bg-white/5 text-gray-400 hover:text-white text-sm font-medium transition-all border border-white/5 hover:border-white/10">
                            <span>За день</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Create Guild CTA */}
            <div className="rounded-2xl p-6 relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-primary/5 to-transparent"></div>
                <div className="relative z-10">
                    <h3 className="text-lg font-bold text-white mb-2">Создай свою гильдию</h3>
                    <p className="text-sm text-gray-400 mb-4">Объединяйся с друзьями, выполняй задания и получай уникальные награды!</p>
                    <button className="w-full py-3 rounded-lg bg-primary text-white font-bold shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-all active:scale-95">
                        Создать гильдию
                    </button>
                </div>
            </div>

        </aside>
    );

    return (
        <PageLayout leftSidebar={<Sidebar />} rightSidebar={RightSidebarContent}>
            <div className="space-y-8">
                <RankingsHeader />

                <div className="flex flex-col gap-4">
                    {loading ? (
                        [...Array(6)].map((_, i) => (
                            <div key={i} className="h-24 bg-[#121217] rounded-2xl animate-pulse"></div>
                        ))
                    ) : (
                        guilds.map((guild, index) => {
                            const rank = index + 1;
                            const isTop3 = rank <= 3;

                            return (
                                <Link href={`/guilds/${guild.id}`} key={guild.id}>
                                    <div className={`group relative bg-surface-highlight-dark/40 hover:bg-surface-highlight-dark/80 rounded-2xl p-4 border transition-all duration-300 hover:border-white/10 overflow-hidden flex items-center gap-6 ${isTop3 ? 'border-primary/20 shadow-[0_0_20px_rgba(168,85,247,0.05)]' : 'border-white/5'}`}>

                                        {/* Rank Badge */}
                                        <div className={`w-12 h-12 shrink-0 flex items-center justify-center text-xl font-black rounded-xl border ${rank === 1 ? 'bg-gradient-to-br from-yellow-500/20 to-amber-500/20 text-yellow-500 border-yellow-500/30' :
                                            rank === 2 ? 'bg-gradient-to-br from-gray-300/20 to-gray-400/20 text-gray-300 border-gray-400/30' :
                                                rank === 3 ? 'bg-gradient-to-br from-orange-500/20 to-orange-600/20 text-orange-500 border-orange-500/30' :
                                                    'bg-white/5 text-gray-500 border-white/5'
                                            }`}>
                                            {rank}
                                        </div>

                                        {/* Avatar Placeholder */}
                                        <div className="w-16 h-16 rounded-xl bg-surface-dark overflow-hidden relative shrink-0">
                                            <div className="absolute inset-0 flex items-center justify-center text-2xl font-black text-white/10 uppercase">
                                                {guild.name.substring(0, 2)}
                                            </div>
                                            {/* <img src={guild.avatar_url} ... /> */}
                                        </div>

                                        {/* Info */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-3 mb-1">
                                                <h3 className="text-lg font-bold text-white group-hover:text-primary transition-colors truncate">
                                                    {guild.name}
                                                </h3>
                                                {isTop3 && (
                                                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-primary/20 text-primary border border-primary/20 uppercase tracking-wide">Top {rank}</span>
                                                )}
                                            </div>
                                            <p className="text-sm text-gray-400 line-clamp-1">
                                                {guild.description || "Нет описания"}
                                            </p>
                                        </div>

                                        {/* Stats */}
                                        <div className="flex items-center gap-8 pr-4">
                                            <div className="text-center">
                                                <div className="text-[10px] font-bold text-gray-500 uppercase mb-0.5">уровень</div>
                                                <div className="text-lg font-black text-white">{guild.level}</div>
                                            </div>
                                            <div className="text-center">
                                                <div className="text-[10px] font-bold text-gray-500 uppercase mb-0.5">участники</div>
                                                <div className="text-lg font-black text-white flex items-center gap-1 group-hover:text-primary transition-colors">
                                                    {guild.members_count}
                                                    <span className="text-sm text-gray-500 font-medium">/ 50</span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Hover Effect arrow */}
                                        <div className="w-8 h-8 rounded-full border border-white/10 flex items-center justify-center text-gray-400 opacity-0 group-hover:opacity-100 -translate-x-4 group-hover:translate-x-0 transition-all duration-300">
                                            <span className="material-symbols-outlined text-sm">arrow_forward</span>
                                        </div>
                                    </div>
                                </Link>
                            );
                        })
                    )}
                </div>
            </div>
        </PageLayout>
    );
}
