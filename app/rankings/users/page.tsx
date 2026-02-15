"use client";

import PageLayout from "@/components/layout/PageLayout";
import Sidebar from "@/components/layout/Sidebar";
import RankingsHeader from "@/components/rankings/RankingsHeader";
import { browserClient as supabase } from "@/lib/supabase/client";
import { useEffect, useState } from "react";
import Link from "next/link";

interface MetricUser {
    id: string;
    username: string;
    avatar_url: string | null;
    level: number;
    xp: number;
    rank_tier: string;
    chapters_read: number;
}

export default function TopUsersPage() {
    const [users, setUsers] = useState<MetricUser[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const { data, error } = await supabase.rpc('get_top_readers', { limit_count: 50 });
                if (error) throw error;
                setUsers(data || []);
            } catch (err) {
                console.error("Error fetching top readers:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchUsers();
    }, []);

    const topThree = users.slice(0, 3);
    const restUsers = users.slice(3);

    // Reordering for Podium: 2, 1, 3
    const podiumUsers = [topThree[1], topThree[0], topThree[2]].filter(Boolean);

    const RightSidebarContent = (
        <aside className="hidden lg:flex flex-col w-80 shrink-0 space-y-6 sticky top-24 self-start h-[calc(100vh-6rem)] overflow-y-auto no-scrollbar pb-10">
            <div className="glass-panel border border-white/5 rounded-2xl overflow-hidden p-1 bg-[#121217]/80">
                <div className="p-4">
                    <h3 className="text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-4 px-1 flex items-center gap-2">
                        <span className="material-symbols-outlined text-[14px]">filter_list</span>
                        Фильтр периода
                    </h3>
                    <div className="grid grid-cols-2 gap-2">
                        <button className="col-span-2 w-full flex items-center justify-between px-4 py-3 rounded-xl bg-primary/20 text-primary text-sm font-bold border border-primary/30 shadow-[0_0_10px_rgba(168,85,247,0.1)]">
                            <span>За всё время</span>
                            <span className="material-symbols-outlined text-[18px]">check_circle</span>
                        </button>
                        <button className="w-full flex items-center justify-center px-4 py-3 rounded-xl bg-surface-highlight-dark/50 hover:bg-white/5 text-gray-400 hover:text-white text-sm font-medium transition-all border border-white/5 hover:border-white/10">
                            <span>Месяц</span>
                        </button>
                        <button className="w-full flex items-center justify-center px-4 py-3 rounded-xl bg-surface-highlight-dark/50 hover:bg-white/5 text-gray-400 hover:text-white text-sm font-medium transition-all border border-white/5 hover:border-white/10">
                            <span>Неделя</span>
                        </button>
                        <button className="col-span-2 w-full flex items-center justify-center px-4 py-3 rounded-xl bg-surface-highlight-dark/50 hover:bg-white/5 text-gray-400 hover:text-white text-sm font-medium transition-all border border-white/5 hover:border-white/10">
                            <span>За день</span>
                        </button>
                    </div>
                </div>
            </div>

            <div className="glass-panel border border-white/5 rounded-2xl overflow-hidden p-4 bg-[#121217]/80">
                <h3 className="text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-4 px-1 flex items-center gap-2">
                    <span className="material-symbols-outlined text-[14px]">sort</span>
                    Критерии
                </h3>
                <div className="flex flex-col space-y-1">
                    <div className="flex items-center justify-between px-3 py-2.5 rounded-lg text-primary bg-primary/10 border border-primary/20 font-bold cursor-pointer">
                        <span>Прочитано глав</span>
                        <span className="material-symbols-outlined text-sm">auto_stories</span>
                    </div>
                    {['Лайки', 'Комментарии', 'Друзья', 'Подписчики'].map(Sort => (
                        <div key={Sort} className="flex items-center justify-between px-3 py-2.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer text-sm font-medium border border-transparent hover:border-white/5">
                            <span>{Sort}</span>
                            <span className="material-symbols-outlined text-sm">
                                {Sort === 'Лайки' ? 'favorite' : Sort === 'Комментарии' ? 'chat' : Sort === 'Друзья' ? 'group' : 'person_add'}
                            </span>
                        </div>
                    ))}
                </div>
            </div>
        </aside>
    );

    return (
        <PageLayout leftSidebar={<Sidebar />} rightSidebar={RightSidebarContent}>
            <div className="space-y-10">
                <RankingsHeader />

                {/* Podium Section */}
                <div className="pt-24 pb-8 relative">
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-[400px] bg-primary/5 blur-[120px] rounded-full pointer-events-none"></div>
                    <div className="flex items-end justify-center gap-8 sm:gap-14 md:gap-20 relative z-10 px-4">
                        {loading ? (
                            // Skeleton Podium
                            [1, 2, 3].map(i => <div key={i} className={`w-28 md:w-36 h-40 bg-[#121217] rounded-full animate-pulse ${i === 1 ? 'mb-10 w-36 md:w-48 h-56' : ''}`}></div>)
                        ) : (
                            podiumUsers.map((user, index) => {
                                // Map index in podiumUsers to Rank: index 0 -> Rank 2, index 1 -> Rank 1, index 2 -> Rank 3
                                const rank = index === 0 ? 2 : index === 1 ? 1 : 3;
                                const isFirst = rank === 1;

                                return (
                                    <div key={user.id} className={`flex flex-col items-center relative transition-transform duration-500 ease-out hover:-translate-y-2 ${isFirst ? 'w-36 md:w-48 -mt-16 z-20 order-2' : 'w-28 md:w-36 ' + (rank === 2 ? 'order-1' : 'order-3')}`}>
                                        {isFirst && (
                                            <div className="absolute -top-10 left-1/2 -translate-x-1/2 animate-bounce duration-[2000ms]">
                                                <span className="material-symbols-outlined text-[42px] text-amber-400 drop-shadow-[0_0_15px_rgba(251,191,36,0.8)] filled">crown</span>
                                            </div>
                                        )}

                                        <Link href={`/user/${user.id}`} className={`relative w-full aspect-square rounded-full mb-4 group cursor-pointer transform hover:scale-[1.05] transition-transform ${isFirst ? 'shadow-[0_0_50px_rgba(168,85,247,0.3)]' : 'shadow-2xl'}`}>
                                            <div className={`w-full h-full rounded-full p-1 bg-gradient-to-b ${rank === 1 ? 'from-[#FFD700] via-amber-300 to-transparent' :
                                                rank === 2 ? 'from-[#C0C0C0] to-transparent' :
                                                    'from-[#CD7F32] to-transparent'
                                                }`}>
                                                <img
                                                    alt={user.username}
                                                    className={`w-full h-full object-cover rounded-full border-surface-dark ${rank === 1 ? 'border-4' : 'border-2'}`}
                                                    src={user.avatar_url || "https://lh3.googleusercontent.com/aida-public/AB6AXuCfFgyhB1YYy0-bpdjhLXKaWSZm-iYOJSrqcXRukuHUPp0kOUt4P7Ce7ooKyjgfHli44P_V6I0ID_ZltKoiCbzkJPVkpXrZ4rKVCD_SsfMvbtYBN9LW5ysRWtruHHQbJmGvDi9fAfZJ5FcjYpzqOGuVftiPRor5qJaEeepvBL_plANH2s0sAzZXsSjHJN8bnsYF_6uCqzbOJHd53bD5d7ZcgPShHWoINmrT7m81jOBdrwr28slj3DkReBH0DAqVIJYVLX1hakCH3a0"}
                                                />
                                            </div>
                                            <div className={`flex items-center justify-center font-black text-surface-dark shadow-lg absolute left-1/2 -translate-x-1/2 rounded-full border-4 border-surface-dark z-20 transition-transform hover:scale-110 ${rank === 1 ? 'bg-[#FFD700] w-12 h-12 text-xl top-full -translate-y-1/2 box-shadow-[0_0_30px_rgba(255,215,0,0.5)]' :
                                                rank === 2 ? 'bg-[#C0C0C0] text-sm w-9 h-9 -bottom-3 box-shadow-[0_0_20px_rgba(192,192,192,0.4)]' :
                                                    'bg-[#CD7F32] text-sm w-9 h-9 -bottom-3 box-shadow-[0_0_20px_rgba(205,127,50,0.4)]'
                                                }`}>
                                                {rank}
                                            </div>
                                        </Link>

                                        <div className="text-center w-full mt-2">
                                            <Link href={`/user/${user.id}`}>
                                                <h3 className={`font-bold text-gray-200 line-clamp-1 hover:text-primary transition-colors cursor-pointer ${isFirst ? 'text-xl md:text-2xl mt-4' : 'text-base'}`}>
                                                    {user.username}
                                                </h3>
                                            </Link>
                                            <div className="flex justify-center items-center gap-1 mt-1">
                                                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${isFirst ? 'bg-gradient-to-r from-amber-500/20 to-yellow-500/20 text-amber-400 border-amber-500/30' : 'bg-surface-highlight-dark text-gray-400 border-white/5'}`}>
                                                    LVL {user.level}
                                                </span>
                                            </div>
                                            <p className={`text-xs font-bold mt-1 ${rank === 1 ? 'text-[#FFD700] text-sm' : rank === 2 ? 'text-[#C0C0C0]' : 'text-[#CD7F32]'}`}>
                                                {user.xp.toLocaleString()} XP
                                            </p>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>

                {/* List Section */}
                <div className="relative max-w-4xl mx-auto space-y-3">
                    <div className="flex items-center justify-between mb-6 px-2">
                        <h2 className="text-lg font-bold text-white flex items-center gap-3">
                            <span className="w-1.5 h-6 bg-primary rounded-full shadow-[0_0_10px_rgba(168,85,247,0.5)]"></span>
                            Остальной список
                        </h2>
                        <div className="text-xs font-medium text-gray-500 bg-surface-highlight-dark px-3 py-1.5 rounded-lg border border-white/5">
                            Топ {users.length > 50 ? '50+' : users.length}
                        </div>
                    </div>

                    {loading ? (
                        [...Array(5)].map((_, i) => <div key={i} className="h-20 bg-[#121217] rounded-xl animate-pulse"></div>)
                    ) : (
                        restUsers.map((user, index) => (
                            <Link href={`/user/${user.id}`} key={user.id}>
                                <div className="glass-panel border border-white/5 rounded-xl p-3 flex items-center gap-4 bg-[#121217]/60 hover:shadow-[0_0_20px_rgba(168,85,247,0.15)] hover:border-primary/30 hover:bg-surface-highlight-dark/80 transition-all duration-300 group cursor-pointer">
                                    <div className="min-w-[40px] h-8 px-2 rounded-lg flex items-center justify-center text-sm font-bold text-gray-400 bg-surface-highlight-dark border border-white/5">
                                        {index + 4}
                                    </div>
                                    <div className="relative w-12 h-12 rounded-full overflow-hidden border border-white/10 shrink-0">
                                        <img
                                            alt={user.username}
                                            src={user.avatar_url || "https://lh3.googleusercontent.com/aida-public/AB6AXuCfFgyhB1YYy0-bpdjhLXKaWSZm-iYOJSrqcXRukuHUPp0kOUt4P7Ce7ooKyjgfHli44P_V6I0ID_ZltKoiCbzkJPVkpXrZ4rKVCD_SsfMvbtYBN9LW5ysRWtruHHQbJmGvDi9fAfZJ5FcjYpzqOGuVftiPRor5qJaEeepvBL_plANH2s0sAzZXsSjHJN8bnsYF_6uCqzbOJHd53bD5d7ZcgPShHWoINmrT7m81jOBdrwr28slj3DkReBH0DAqVIJYVLX1hakCH3a0"}
                                            className="w-full h-full object-cover"
                                        />
                                    </div>
                                    <div className="flex items-center gap-3 flex-1">
                                        <h3 className="text-base font-bold text-white group-hover:text-primary transition-colors">{user.username}</h3>
                                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-surface-highlight-dark text-gray-400 border border-white/5">LVL {user.level}</span>
                                    </div>
                                    <div className="text-right">
                                        <span className="text-sm font-bold text-primary">{user.xp.toLocaleString()}</span>
                                        <p className="text-[10px] text-gray-500 uppercase">XP</p>
                                    </div>
                                </div>
                            </Link>
                        ))
                    )}

                    {restUsers.length > 0 && (
                        <div className="flex justify-center pt-8">
                            <button className="px-8 py-3 rounded-xl bg-surface-dark/50 backdrop-blur border border-white/10 hover:border-primary/40 hover:text-primary hover:bg-white/5 text-gray-300 text-sm font-bold transition-all flex items-center gap-2 group shadow-lg">
                                Показать еще
                                <span className="material-symbols-outlined text-[18px] group-hover:translate-y-0.5 transition-transform">expand_more</span>
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </PageLayout>
    );
}
