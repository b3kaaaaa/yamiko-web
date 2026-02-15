'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { createBrowserClient } from '@supabase/ssr';

interface SidebarGuild {
    id: string;
    name: string;
    tag: string;
    avatar_url: string | null;
    total_xp?: number;
    created_at?: string;
}

export default function GuildRightSidebar() {
    const [topGuilds, setTopGuilds] = useState<SidebarGuild[]>([]);
    const [newGuilds, setNewGuilds] = useState<SidebarGuild[]>([]);
    const [loading, setLoading] = useState(true);

    const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    useEffect(() => {
        const fetchSidebarData = async () => {
            try {
                // Fetch Top 3 by XP
                const { data: topData } = await supabase.rpc('get_public_guilds', {
                    p_limit: 3,
                    p_sort_by: 'xp'
                });
                if (topData) setTopGuilds(topData);

                // Fetch Newest 3
                const { data: newData } = await supabase.rpc('get_public_guilds', {
                    p_limit: 3,
                    p_sort_by: 'created_at'
                });
                if (newData) setNewGuilds(newData);
            } catch (err) {
                console.error("Sidebar fetch error:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchSidebarData();
    }, []);

    const formatPoints = (xp: number) => {
        if (!xp) return '0';
        if (xp >= 1000000) return (xp / 1000000).toFixed(1) + 'M';
        if (xp >= 1000) return (xp / 1000).toFixed(1) + 'k';
        return xp.toString();
    };

    return (
        <aside className="hidden lg:block w-72 shrink-0 space-y-6 sticky top-24 self-start h-[calc(100vh-6rem)] overflow-y-auto no-scrollbar pb-10">

            {/* Top of Week Widget */}
            <div className="bg-[#121217] border border-white/5 rounded-2xl overflow-hidden shadow-lg">
                <div className="p-5 border-b border-white/5 bg-[#1C1C22]/30 flex justify-between items-center">
                    <h3 className="text-base font-bold text-white flex items-center gap-2">
                        <span className="material-symbols-outlined text-yellow-400 text-xl">emoji_events</span>
                        Топ гильдии
                    </h3>
                </div>
                <div className="p-2">
                    {loading ? (
                        <div className="p-4 text-center text-xs text-gray-500 animate-pulse">Загрузка...</div>
                    ) : topGuilds.length > 0 ? (
                        topGuilds.map((guild, index) => (
                            <Link href={`/guilds/${guild.tag}`} key={guild.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 transition-colors cursor-pointer group">
                                <div className={`text-lg font-black w-6 text-center ${index === 0 ? 'text-yellow-500' : index === 1 ? 'text-gray-400' : 'text-orange-700'}`}>
                                    {index + 1}
                                </div>
                                <div className="w-10 h-10 rounded-lg bg-[#1C1C22] border border-white/10 flex items-center justify-center text-white font-bold text-xs shadow-md shrink-0 overflow-hidden">
                                    {guild.avatar_url ? (
                                        <img src={guild.avatar_url} className="w-full h-full object-cover" alt={guild.tag} />
                                    ) : (
                                        guild.tag
                                    )}
                                </div>
                                <div className="min-w-0 flex-1">
                                    <h4 className="text-sm font-bold text-gray-200 truncate group-hover:text-purple-500 transition-colors">{guild.name}</h4>
                                    <div className="flex items-center gap-1 text-[10px] text-gray-500 font-medium">
                                        <span className="text-green-400">{formatPoints(guild.total_xp || 0)}</span> XP
                                    </div>
                                </div>
                            </Link>
                        ))
                    ) : (
                        <div className="p-4 text-center text-xs text-gray-500">Нет данных</div>
                    )}
                </div>
            </div>

            {/* New Guilds Widget */}
            <div className="bg-[#121217] border border-white/5 rounded-2xl overflow-hidden shadow-lg">
                <div className="p-5 border-b border-white/5 bg-[#1C1C22]/30">
                    <h3 className="text-base font-bold text-white flex items-center gap-2">
                        <span className="material-symbols-outlined text-green-400 text-xl">new_releases</span>
                        Новые гильдии
                    </h3>
                </div>
                <div className="divide-y divide-white/5">
                    {loading ? (
                        <div className="p-4 text-center text-xs text-gray-500 animate-pulse">Загрузка...</div>
                    ) : newGuilds.length > 0 ? (
                        newGuilds.map((guild) => (
                            <Link href={`/guilds/${guild.tag}`} key={guild.id} className="flex items-center gap-3 p-4 hover:bg-white/5 transition-colors group relative cursor-pointer">
                                <div className="w-10 h-10 rounded-lg bg-[#1C1C22] border border-white/10 flex items-center justify-center text-gray-400 font-bold text-xs shrink-0 overflow-hidden">
                                    {guild.avatar_url ? (
                                        <img src={guild.avatar_url} className="w-full h-full object-cover" alt={guild.tag} />
                                    ) : (
                                        guild.tag
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex justify-between items-center mb-0.5">
                                        <span className="text-sm font-bold text-white group-hover:text-purple-500 transition-colors">{guild.name}</span>
                                    </div>
                                    <div className="text-[10px] text-gray-400">XP: <span className="text-white">{formatPoints(guild.total_xp || 0)}</span></div>
                                </div>
                            </Link>
                        ))
                    ) : (
                        <div className="p-4 text-center text-xs text-gray-500">Нет новых гильдий</div>
                    )}
                </div>
            </div>

            {/* Footer Links */}
            <div className="flex flex-wrap gap-x-4 gap-y-2 px-2 pb-4">
                <a href="#" className="text-[10px] font-medium text-gray-600 hover:text-gray-400">Правила</a>
                <a href="#" className="text-[10px] font-medium text-gray-600 hover:text-gray-400">Поддержка</a>
                <a href="#" className="text-[10px] font-medium text-gray-600 hover:text-gray-400">Wiki</a>
                <span className="text-[10px] text-gray-700 w-full mt-2">© 2024 Yamiko Guilds</span>
            </div>
        </aside>
    );
}
