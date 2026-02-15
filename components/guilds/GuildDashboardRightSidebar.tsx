'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { createBrowserClient } from '@supabase/ssr';
import { FullGuildData } from '@/types/guild';

interface GuildDashboardRightSidebarProps {
    info: FullGuildData['info'];
    members: FullGuildData['members'];
}

export default function GuildDashboardRightSidebar({ info, members }: GuildDashboardRightSidebarProps) {
    const [isDonateOpen, setIsDonateOpen] = useState(false);
    const [donationAmount, setDonationAmount] = useState('');
    const [donationCurrency, setDonationCurrency] = useState<'gold' | 'rubies'>('gold');

    // Need supabase for donation specific logic if we keep it here, 
    // or we can move donation modal out to main page. 
    // For now, let's keep donation modal logic in the page and just have the button here?
    // Wait, the donation button was in the left sidebar in the original code. 
    // The right sidebar had Stats and Online members.
    // The original code had Donate Modal at the bottom of the page.

    // Let's just implement the visual part of the sidebar here.

    return (
        <aside className="hidden lg:block w-80 shrink-0 space-y-6 sticky top-24 self-start h-[calc(100vh-6rem)] overflow-y-auto no-scrollbar pb-10">
            {/* Stats Widget */}
            <div className="bg-surface-dark border border-white/5 rounded-2xl overflow-hidden shadow-lg">
                <div className="p-5 border-b border-white/5 bg-surface-highlight-dark/30 flex justify-between items-center">
                    <h3 className="text-base font-bold text-white flex items-center gap-2">
                        <span className="material-symbols-outlined text-primary text-xl">monitoring</span>
                        Статистика
                    </h3>
                </div>
                <div className="p-4 grid grid-cols-1 gap-4">
                    <div className="bg-[#1C1C22] rounded-xl p-4 border border-white/5">
                        <div className="text-2xl font-black text-white mb-1">{(info.xp / 1000000).toFixed(2)}M</div>
                        <div className="text-[10px] text-gray-500 font-bold uppercase">Всего опыта (EXP)</div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div className="bg-[#1C1C22] rounded-xl p-3 border border-white/5">
                            <div className="text-lg font-bold text-blue-400 mb-1">{info.member_count}</div>
                            <div className="text-[10px] text-gray-500 font-bold uppercase">Участников</div>
                        </div>
                        <div className="bg-[#1C1C22] rounded-xl p-3 border border-white/5">
                            <div className="text-lg font-bold text-yellow-400 mb-1">#{Math.floor(Math.random() * 100) + 1}</div>
                            <div className="text-[10px] text-gray-500 font-bold uppercase">Ранг</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Online Members (Using Top 5 as placeholder for now) */}
            <div className="bg-surface-dark border border-white/5 rounded-2xl overflow-hidden shadow-lg">
                <div className="p-5 border-b border-white/5 bg-surface-highlight-dark/30 flex justify-between items-center">
                    <h3 className="text-base font-bold text-white flex items-center gap-2">
                        <span className="material-symbols-outlined text-green-500 text-xl">fiber_manual_record</span>
                        В сети
                    </h3>
                </div>
                <div className="max-h-[500px] overflow-y-auto no-scrollbar">
                    <div className="divide-y divide-white/5">
                        {members.top_5.map((member, index) => (
                            <Link href={`/profile/${member.username}`} key={member.user_id} className="flex items-center gap-3 p-4 hover:bg-white/5 transition-colors group relative cursor-pointer">
                                <div className="relative w-10 h-10">
                                    <div className="w-10 h-10 rounded-full bg-gray-700 overflow-hidden border border-white/10">
                                        {member.avatar_url ? (
                                            <img src={member.avatar_url} className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-xs font-bold text-white bg-primary/50">
                                                {member.username?.[0]?.toUpperCase()}
                                            </div>
                                        )}
                                    </div>
                                    <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-[#121217] rounded-full"></div>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="text-sm font-bold text-white group-hover:text-primary transition-colors truncate">{member.username}</div>
                                    <div className="text-xs text-green-500 truncate font-medium">В сети</div>
                                </div>
                            </Link>
                        ))}
                        {members.top_5.length === 0 && (
                            <div className="p-4 text-center text-gray-500 text-xs text-text-muted">Никого нет в сети</div>
                        )}
                    </div>
                </div>
            </div>

            {/* Footer */}
            <div className="flex flex-wrap gap-x-4 gap-y-2 px-2 pb-4 opacity-50">
                <span className="text-[10px] text-gray-700 w-full mt-2">© 2024 Yamiko Guilds</span>
            </div>
        </aside>
    );
}
