'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { FullGuildData } from '@/types/guild';
import { useUserStore } from '@/lib/store/userStore';

interface GuildDashboardLeftSidebarProps {
    guildId: string;
    isMember: boolean;
    treasuryGold: number;
    onDonate: () => void;
}

export default function GuildDashboardLeftSidebar({
    guildId,
    isMember,
    treasuryGold,
    onDonate
}: GuildDashboardLeftSidebarProps) {
    const router = useRouter();
    const { isSidebarCollapsed: isCollapsed } = useUserStore();

    return (
        <aside className={`hidden xl:flex flex-col shrink-0 sticky top-24 self-start h-[calc(100vh-6rem)] transition-[width] duration-300 ease-in-out ${isCollapsed ? "w-20" : "w-64"}`}>
            <nav className="space-y-8 w-full overflow-hidden">
                <div>
                    <div className="h-4 mb-3 px-3 overflow-hidden whitespace-nowrap">
                        <h3 className={`text-[10px] font-bold text-gray-500 uppercase tracking-widest transition-opacity duration-300 ${isCollapsed ? "opacity-0" : "opacity-100"}`}>
                            Главное
                        </h3>
                    </div>
                    <div className="space-y-1">
                        <button className={`w-full flex items-center rounded-xl font-medium border border-primary/20 bg-primary/10 text-white transition-all duration-300 group overflow-hidden ${isCollapsed ? "justify-center w-12 h-12 mx-auto px-0" : "px-3 py-2.5 gap-3"}`}>
                            <span className="material-symbols-outlined text-[20px] text-primary shrink-0">feed</span>
                            <span className={`transition-[opacity,width,transform] duration-300 ease-in-out whitespace-nowrap overflow-hidden ${isCollapsed ? "w-0 opacity-0 translate-x-4" : "w-auto opacity-100 translate-x-0"}`}>
                                Стена
                            </span>
                        </button>
                        <button onClick={() => router.push(`/guilds/${guildId}/members`)} className={`w-full flex items-center rounded-xl text-gray-400 hover:bg-white/5 hover:text-white transition-all duration-300 font-medium group overflow-hidden ${isCollapsed ? "justify-center w-12 h-12 mx-auto px-0" : "px-3 py-2.5 gap-3"}`}>
                            <span className="material-symbols-outlined text-[20px] shrink-0">groups</span>
                            <span className={`transition-[opacity,width,transform] duration-300 ease-in-out whitespace-nowrap overflow-hidden ${isCollapsed ? "w-0 opacity-0 translate-x-4" : "w-auto opacity-100 translate-x-0"}`}>
                                Участники
                            </span>
                        </button>
                        <button className={`w-full flex items-center rounded-xl text-gray-400 hover:bg-white/5 hover:text-white transition-all duration-300 font-medium group overflow-hidden ${isCollapsed ? "justify-center w-12 h-12 mx-auto px-0" : "px-3 py-2.5 gap-3"}`}>
                            <span className="material-symbols-outlined text-[20px] shrink-0">chat</span>
                            <span className={`transition-[opacity,width,transform] duration-300 ease-in-out whitespace-nowrap overflow-hidden ${isCollapsed ? "w-0 opacity-0 translate-x-4" : "w-auto opacity-100 translate-x-0"}`}>
                                Чат
                            </span>
                        </button>
                    </div>
                </div>
                <div>
                    <div className="h-4 mb-3 px-3 overflow-hidden whitespace-nowrap">
                        <h3 className={`text-[10px] font-bold text-gray-500 uppercase tracking-widest transition-opacity duration-300 ${isCollapsed ? "opacity-0" : "opacity-100"}`}>
                            Гильдия
                        </h3>
                    </div>
                    <div className="space-y-1">
                        {isMember && (
                            <button onClick={onDonate} className={`w-full flex items-center rounded-xl text-gray-400 hover:bg-white/5 hover:text-white transition-all duration-300 font-medium group overflow-hidden ${isCollapsed ? "justify-center w-12 h-12 mx-auto px-0" : "px-3 py-2.5 gap-3"}`}>
                                <span className="material-symbols-outlined text-[20px] shrink-0">account_balance</span>
                                <span className={`flex-1 flex items-center justify-between transition-[opacity,width,transform] duration-300 ease-in-out whitespace-nowrap overflow-hidden ${isCollapsed ? "w-0 opacity-0 translate-x-4" : "w-full opacity-100 translate-x-0"}`}>
                                    <span>Казна</span>
                                    <span className="text-[10px] text-yellow-500">{treasuryGold.toLocaleString()}</span>
                                </span>
                            </button>
                        )}
                        <button className={`w-full flex items-center rounded-xl text-gray-400 hover:bg-white/5 hover:text-white transition-all duration-300 font-medium group overflow-hidden ${isCollapsed ? "justify-center w-12 h-12 mx-auto px-0" : "px-3 py-2.5 gap-3"}`}>
                            <span className="material-symbols-outlined text-[20px] shrink-0">swords</span>
                            <span className={`transition-[opacity,width,transform] duration-300 ease-in-out whitespace-nowrap overflow-hidden ${isCollapsed ? "w-0 opacity-0 translate-x-4" : "w-auto opacity-100 translate-x-0"}`}>
                                Артефакты
                            </span>
                        </button>
                        <button className={`w-full flex items-center rounded-xl text-gray-400 hover:bg-white/5 hover:text-white transition-all duration-300 font-medium group overflow-hidden ${isCollapsed ? "justify-center w-12 h-12 mx-auto px-0" : "px-3 py-2.5 gap-3"}`}>
                            <span className="material-symbols-outlined text-[20px] shrink-0">assignment_turned_in</span>
                            <span className={`transition-[opacity,width,transform] duration-300 ease-in-out whitespace-nowrap overflow-hidden ${isCollapsed ? "w-0 opacity-0 translate-x-4" : "w-auto opacity-100 translate-x-0"}`}>
                                Задания
                            </span>
                        </button>
                    </div>
                </div>
            </nav>
        </aside>
    );
}
