"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import Image from "next/image";

import PageLayout from "@/components/layout/PageLayout";
import ProfileSidebar from "@/components/profile/ProfileSidebar";
import ListSkeleton from "@/components/skeletons/ListSkeleton";
function timeAgo(created_at: string) {
    if (!created_at) return "недавно";
    const now = new Date();
    const date = new Date(created_at);
    // @ts-ignore
    const diffInSeconds = Math.floor((now - date) / 1000);

    if (diffInSeconds < 60) return `${diffInSeconds} сек. назад`;
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) return `${diffInMinutes} мин. назад`;
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours} ч. назад`;
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays} дн. назад`;
    const diffInWeeks = Math.floor(diffInDays / 7);
    if (diffInWeeks < 4) return `${diffInWeeks} нед. назад`;
    const diffInMonths = Math.floor(diffInDays / 30);
    return `${diffInMonths} мес. назад`;
}

type Profile = {
    id: string;
    username: string;
    avatar_url: string | null;
    level: number;
    created_at: string;
    is_online: boolean;
};

type ArmyStats = {
    total: number;
    today: number;
    week: number;
};

export default function ShadowArmyPage({ params }: { params: { id: string } }) {
    const supabase = createClient();
    const [stats, setStats] = useState<ArmyStats>({ total: 0, today: 0, week: 0 });
    const [army, setArmy] = useState<Profile[]>([]);
    const [loading, setLoading] = useState(true);
    const [referralCode, setReferralCode] = useState<string | null>(null);
    const [profile, setProfile] = useState<any>(null);

    // Rank Logic
    // General (100) -> Marshal (150) -> Monarch (500)
    const isGeneral = stats.total >= 100;
    const isMarshal = stats.total >= 150;
    const isMonarch = stats.total >= 500;

    let nextRewardTitle = "Титул Генерала";
    let nextRewardTarget = 100;

    if (isMonarch) {
        nextRewardTitle = "Максимальный уровень";
        nextRewardTarget = 500;
    } else if (isMarshal) {
        nextRewardTitle = "Титул Монарха";
        nextRewardTarget = 500;
    } else if (isGeneral) {
        nextRewardTitle = "Титул Маршала";
        nextRewardTarget = 150;
    }

    useEffect(() => {
        const fetchData = async () => {
            try {
                const { data: { user } } = await supabase.auth.getUser();

                if (!user) return; // Handle not logged in

                // 1. Get My Profile (Code + ID)
                let { data: myProfile, error: profileError } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', user.id)
                    .single() as { data: any, error: any };

                // If profile doesn't exist, create it (Auto-add logic as requested)
                if (!myProfile) {
                    // Try to insert a new profile
                    const { data: newProfile, error: createError } = await supabase
                        .from('profiles')
                        .insert([
                            {
                                id: user.id,
                                username: user.email?.split('@')[0] || `Hunter_${user.id.slice(0, 6)}`,
                                // trigger will generate referral_code
                            }
                        ] as any)
                        .select()
                        .single();

                    if (newProfile) {
                        myProfile = newProfile;
                    } else if (createError) {
                        console.error("Error creating profile:", createError);
                    }
                }

                if (myProfile) {
                    setProfile(myProfile);
                    setReferralCode(myProfile.referral_code || 'PENDING');
                }

                // 2. Get Army List
                const { data: armyList, error: armyError } = await supabase
                    .from('profiles')
                    .select('id, username, avatar_url, level, created_at, is_online')
                    .eq('referrer_id', user.id)
                    .order('created_at', { ascending: false })
                    .limit(50);

                // Explicitly cast to Profile[] to fix TS "never" error
                if (armyList) setArmy(armyList as Profile[]);

                // 3. Get Stats (Manual Calc if RPC missing, or use RPC)
                const total = armyList?.length || 0;
                // Note: For large armies, limit(50) makes this inaccurate for TOTAL count.
                // Better to run a count query.

                const { count: realTotal } = await supabase
                    .from('profiles')
                    .select('*', { count: 'exact', head: true })
                    .eq('referrer_id', user.id);

                const now = new Date();
                const todayCount = armyList?.filter((p: any) => new Date(p.created_at).toDateString() === now.toDateString()).length || 0;
                const weekAgo = new Date(now.setDate(now.getDate() - 7));
                const weekCount = armyList?.filter((p: any) => new Date(p.created_at) > weekAgo).length || 0;

                setStats({
                    total: realTotal || total,
                    today: todayCount,
                    week: weekCount
                });

            } catch (error) {
                console.error("Error fetching army:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    const copyCode = () => {
        if (referralCode) {
            navigator.clipboard.writeText(`https://yamiko.com/register?ref=${referralCode}`);
            // In a real app, use a toast here
            alert("Код приглашения скопирован!");
        }
    };

    if (loading) return (
        <PageLayout leftSidebar={<ProfileSidebar profileId={params.id} />}>
            <ListSkeleton />
        </PageLayout>
    );

    const RightSidebarContent = (
        <aside className="hidden lg:block w-80 shrink-0 space-y-6 sticky top-24 self-start h-[calc(100vh-6rem)] overflow-y-auto no-scrollbar pb-10">
            {/* Monarch Rewards Section */}
            <div className="bg-[#121217] border border-white/5 rounded-2xl overflow-hidden shadow-lg flex flex-col">
                <div className="p-5 border-b border-white/5 bg-[#1C1C22]/30">
                    <h3 className="text-base font-bold text-white flex items-center gap-3">
                        <span className="material-symbols-outlined text-purple-500 text-xl">emoji_events</span>
                        НАГРАДЫ МОНАРХА
                    </h3>
                </div>

                <div className="p-6 relative">
                    {/* Vertical Line - Gray for locked, Purple for completed */}
                    <div className="absolute left-[2.25rem] top-8 bottom-8 w-0.5 bg-white/10"></div>

                    {/* Step 1: General (Goal: 100) */}
                    <div className="relative pl-10 mb-8">
                        <div className={`absolute left-0 top-0 w-8 h-8 rounded-full flex items-center justify-center shadow-[0_0_10px_rgba(168,85,247,0.5)] z-10 ${isGeneral ? 'bg-purple-500 text-white' : 'bg-[#1C1C22] border-2 border-gray-600 text-gray-500'}`}>
                            {isGeneral ? <span className="material-symbols-outlined text-sm font-bold">check</span> : <span className="text-[10px]">100</span>}
                        </div>
                        <div className="mb-2">
                            <h4 className={`font-bold text-sm uppercase tracking-wide ${isGeneral ? 'text-purple-400' : 'text-gray-500'}`}>ГЕНЕРАЛ (100)</h4>
                        </div>
                        <div className={`bg-[#1C1C22]/50 border border-white/5 rounded-xl p-3 flex items-center gap-3 ${isGeneral ? 'opacity-100' : 'opacity-40 grayscale'}`}>
                            <span className="material-symbols-outlined text-yellow-500">workspace_premium</span>
                            <span className="text-sm text-gray-400 font-medium">Премиум на месяц</span>
                        </div>
                    </div>

                    {/* Step 2: Marshal (Goal: 150) */}
                    <div className="relative pl-10 mb-8">
                        <div className={`absolute left-0 top-0 w-8 h-8 rounded-full flex items-center justify-center z-10 ${isMarshal ? 'bg-purple-500 text-white' : (isGeneral ? 'bg-[#121217] border-2 border-purple-500 text-purple-500 shadow-[0_0_15px_rgba(168,85,247,0.4)]' : 'bg-[#121217] border-2 border-white/10 text-gray-500')}`}>
                            {isMarshal ? <span className="material-symbols-outlined text-sm">check</span> : '150'}
                        </div>
                        <div className="mb-2 flex justify-between items-end">
                            <h4 className={`font-bold text-sm uppercase tracking-wide ${isMarshal || isGeneral ? 'text-white' : 'text-gray-500'}`}>МАРШАЛ (150)</h4>
                            {!isMarshal && isGeneral && (
                                <span className="text-xs text-purple-400 font-bold">{Math.min(100, Math.floor(((stats.total - 100) / 50) * 100))}%</span>
                            )}
                        </div>
                        {/* Only show progress bar if General is done but Marshal is not */}
                        {isGeneral && !isMarshal && (
                            <div className="w-full h-1.5 bg-white/10 rounded-full mb-3 overflow-hidden">
                                <div className="h-full bg-gradient-to-r from-purple-600 to-purple-400 shadow-[0_0_10px_rgba(168,85,247,0.5)]" style={{ width: `${Math.min(100, Math.floor(((stats.total - 100) / 50) * 100))}%` }}></div>
                            </div>
                        )}

                        <div className={`bg-[#1C1C22] border border-white/10 rounded-xl p-3 flex items-center gap-3 relative overflow-hidden group ${isGeneral ? 'opacity-100' : 'opacity-40 grayscale'}`}>
                            {isGeneral && <div className="absolute inset-0 bg-purple-500/5 group-hover:bg-purple-500/10 transition-colors"></div>}
                            <span className="material-symbols-outlined text-purple-400">swords</span>
                            <span className="text-sm text-white font-medium">Уникальный Титул</span>
                        </div>
                        {!isMarshal && isGeneral && (
                            <p className="text-[10px] text-gray-500 mt-2 font-medium">Осталось призвать {Math.max(0, 150 - stats.total)} солдат</p>
                        )}
                    </div>

                    {/* Step 3: Monarch (Goal: 500) */}
                    <div className="relative pl-10">
                        <div className={`absolute left-0 top-0 w-8 h-8 rounded-full border-2 flex items-center justify-center z-10 ${isMonarch ? 'bg-purple-500 border-purple-500 text-white' : (isMarshal ? 'bg-[#121217] border-purple-500 text-purple-500' : 'bg-[#121217] border-white/10 text-gray-500')}`}>
                            {isMonarch ? <span className="material-symbols-outlined text-sm">check</span> : <span className="material-symbols-outlined text-sm">lock</span>}
                        </div>
                        <div className="mb-2">
                            <h4 className={`font-bold text-sm uppercase tracking-wide ${isMonarch || isMarshal ? 'text-white' : 'text-gray-500'}`}>МОНАРХ (500)</h4>
                        </div>
                        <div className={`bg-[#1C1C22]/30 border border-white/5 rounded-xl p-3 flex items-center gap-3 ${isMonarch || isMarshal ? 'opacity-100' : 'opacity-50'}`}>
                            <div className="w-5 h-5 bg-gradient-to-br from-gray-400 to-gray-600 rounded-sm"></div>
                            <span className="text-sm text-gray-500 font-medium">Легендарная Карта</span>
                        </div>
                    </div>
                </div>
                <div className="p-4 bg-[#1C1C22]/30 border-t border-white/5 text-center">
                    <p className="text-[10px] text-gray-500">Награды выдаются автоматически при достижении цели</p>
                </div>
            </div>

            {/* Summon Statistics Section */}
            <div className="bg-[#121217] border border-white/5 rounded-2xl overflow-hidden shadow-lg p-5">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">СТАТИСТИКА ПРИЗЫВА</h3>
                <div className="space-y-3">
                    <div className="bg-[#1C1C22]/50 border border-white/5 rounded-xl p-3 flex items-center justify-between">
                        <span className="text-sm text-gray-300">За сегодня</span>
                        <span className="text-green-400 font-bold">+{stats.today}</span>
                    </div>
                    <div className="bg-[#1C1C22]/50 border border-white/5 rounded-xl p-3 flex items-center justify-between">
                        <span className="text-sm text-gray-300">За неделю</span>
                        <span className="text-purple-400 font-bold">+{stats.week}</span>
                    </div>
                    <div className="bg-[#1C1C22] border border-white/10 rounded-xl p-3 flex items-center justify-between">
                        <span className="text-sm text-gray-200 font-medium">Всего переходов</span>
                        <span className="text-white font-black text-lg">{stats.total}</span>
                    </div>
                </div>
            </div>
        </aside>
    );

    return (
        <PageLayout leftSidebar={<ProfileSidebar profileId={params.id} />} rightSidebar={RightSidebarContent}>
            {/* Hero Section */}
            <div className="relative w-full rounded-3xl overflow-hidden border border-purple-500/20 bg-[#121217] mb-10 shadow-2xl">
                <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1519074069444-1ba4fff66d16?q=80&w=2544&auto=format&fit=crop')] bg-cover bg-center opacity-30 mix-blend-color-dodge"></div>
                <div className="absolute inset-0 bg-gradient-to-r from-black via-black/80 to-purple-900/20"></div>
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(168,85,247,0.15)_0%,transparent_70%)] animate-pulse-slow"></div>
                <div className="relative z-10 p-12 flex flex-col md:flex-row items-center justify-between gap-10">
                    <div className="text-center md:text-left">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-300 text-xs font-bold mb-4 uppercase tracking-widest backdrop-blur-sm">
                            <span className="w-2 h-2 rounded-full bg-purple-500 animate-ping"></span>
                            Реферальная система
                        </div>
                        <h1 className="text-6xl md:text-8xl font-black bg-gradient-to-b from-white to-purple-500 bg-clip-text text-transparent tracking-tight leading-none mb-2 font-display drop-shadow-[0_0_30px_rgba(168,85,247,0.4)]">
                            ПОДНЯТИЕ
                        </h1>
                        <p className="text-gray-400 text-lg font-medium max-w-md">Призови новых последователей в армию. Стань Монархом Теней и получи вечную славу.</p>
                        <div className="mt-8 flex items-center gap-4 justify-center md:justify-start">
                            <div className="bg-[#121217]/80 backdrop-blur border border-white/5 rounded-xl px-5 py-3 text-center min-w-[140px]">
                                <div className="text-xs text-gray-400 uppercase tracking-wider mb-1">Размер армии</div>
                                <div className="text-2xl font-bold text-white flex items-center justify-center gap-2">
                                    <span className="material-symbols-outlined text-purple-500">groups</span>
                                    {stats.total} <span className="text-sm font-normal text-gray-500">Теней</span>
                                </div>
                            </div>
                            <div className="bg-[#121217]/80 backdrop-blur border border-white/5 rounded-xl px-5 py-3 text-center min-w-[140px]">
                                <div className="text-xs text-gray-400 uppercase tracking-wider mb-1">Бонус силы</div>
                                <div className="text-2xl font-bold text-white flex items-center justify-center gap-2">
                                    <span className="text-yellow-400">+{Math.min(100, stats.total)}%</span>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="relative flex-shrink-0 group">
                        <div className="absolute inset-0 -m-8 rounded-full border border-purple-500/20 animate-[spin_12s_linear_infinite] opacity-60"></div>
                        <div className="absolute inset-0 -m-16 rounded-full border border-purple-500/10 animate-[spin_12s_linear_infinite] opacity-30" style={{ animationDirection: 'reverse', animationDuration: '20s' }}></div>
                        <div className="relative">
                            <div className="absolute inset-0 bg-purple-500 blur-2xl opacity-20 group-hover:opacity-40 transition-opacity duration-500"></div>
                            <button onClick={copyCode} className="relative w-48 h-48 rounded-full bg-[#1C1C22] border-2 border-purple-500/50 flex flex-col items-center justify-center gap-2 shadow-[0_0_40px_rgba(168,85,247,0.3),inset_0_0_20px_rgba(168,85,247,0.2)] hover:scale-105 transition-all duration-300 z-20 group active:scale-95 hover:shadow-[0_0_60px_rgba(168,85,247,0.5),inset_0_0_30px_rgba(168,85,247,0.4)]">
                                <span className="material-symbols-outlined text-5xl text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.8)] group-hover:text-purple-200 transition-colors">auto_fix_high</span>
                                <span className="text-sm font-bold text-purple-100 uppercase tracking-widest text-center">Извлечь<br />Тень</span>
                                <div className="absolute inset-1 rounded-full border border-white/10"></div>
                            </button>
                        </div>
                        <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 w-max text-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                            <span className="text-xs text-purple-400 font-medium">Скопировать код: {referralCode || '...'}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Monarch Path Section */}
            <div className="mb-12">
                <div className="flex items-end justify-between mb-6 px-2">
                    <h3 className="text-xl font-bold text-white flex items-center gap-2">
                        <span className="material-symbols-outlined text-purple-400">trending_up</span>
                        Путь Монарха
                    </h3>
                    <span className="text-sm text-gray-400 font-medium">Следующая награда: <span className="text-white">{nextRewardTitle}</span> ({nextRewardTarget})</span>
                </div>
                <div className="relative bg-[#121217] border border-white/5 rounded-2xl p-8 pb-12">
                    {/* Track */}
                    <div className="absolute left-10 right-10 top-12 h-1 bg-white/5 rounded-full"></div>
                    {/* Progress */}
                    <div className="absolute left-10 top-12 h-1 bg-gradient-to-r from-purple-600 to-purple-400 rounded-full shadow-[0_0_15px_rgba(168,85,247,0.6)]" style={{ width: `${Math.min(100, Math.max(0, (stats.total / 100) * 100))}%` }}></div>

                    {/* Steps Container using real stats.total to show active state */}
                    <div className="relative w-full flex justify-between px-4">
                        {/* Start */}
                        <div className="flex flex-col items-center gap-4 relative z-10">
                            <div className="w-8 h-8 rounded-full bg-purple-500 border-2 border-white shadow-[0_0_10px_rgba(168,85,247,0.8)] z-10"></div>
                            <span className="text-xs font-bold text-purple-400 absolute top-10 whitespace-nowrap">Начало</span>
                        </div>

                        {/* 10 Shadows */}
                        <div className="flex flex-col items-center gap-4 relative z-10">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center shadow-lg transition-colors ${stats.total >= 10 ? 'bg-purple-500 text-white' : 'bg-[#1C1C22] border-2 border-gray-600 text-gray-500'}`}>
                                {stats.total >= 10 ? <span className="material-symbols-outlined text-sm font-bold">check</span> : <span className="w-2 h-2 bg-gray-600 rounded-full"></span>}
                            </div>
                            <span className={`text-xs font-bold absolute top-10 whitespace-nowrap ${stats.total >= 10 ? 'text-white' : 'text-gray-500'}`}>10 Теней</span>
                        </div>

                        {/* 50 Shadows */}
                        <div className="flex flex-col items-center gap-4 relative z-10">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center shadow-lg transition-colors ${stats.total >= 50 ? 'bg-purple-500 text-white' : 'bg-[#1C1C22] border-2 border-gray-600 text-gray-500'}`}>
                                {stats.total >= 50 ? <span className="material-symbols-outlined text-sm font-bold">check</span> : <span className="w-2 h-2 bg-gray-600 rounded-full"></span>}
                            </div>
                            <span className={`text-xs font-bold absolute top-10 whitespace-nowrap ${stats.total >= 50 ? 'text-white' : 'text-gray-500'}`}>50 Теней</span>
                        </div>

                        {/* 100 Shadows */}
                        <div className="flex flex-col items-center gap-4 relative z-10">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center shadow-lg transition-colors ${stats.total >= 100 ? 'bg-purple-500 text-white' : 'bg-[#1C1C22] border-2 border-gray-600 text-gray-500'}`}>
                                {stats.total >= 100 ? <span className="material-symbols-outlined text-sm font-bold">check</span> : <span className="w-2 h-2 bg-gray-600 rounded-full"></span>}
                            </div>
                            <span className={`text-xs font-bold absolute top-10 whitespace-nowrap ${stats.total >= 100 ? 'text-white' : 'text-gray-500'}`}>100 Теней</span>
                        </div>

                        {/* Crown */}
                        <div className="flex flex-col items-center gap-4 relative z-10">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-colors ${stats.total >= 500 ? 'bg-purple-500 border-white' : 'bg-[#1C1C22] border-gray-600'}`}>
                                <span className={`material-symbols-outlined text-sm ${stats.total >= 500 ? 'text-white' : 'text-gray-500'}`}>crown</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* My Army Section */}
            <div>
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-2xl font-black text-white flex items-center gap-3">
                        <span className="w-1.5 h-8 bg-purple-500 rounded-full shadow-[0_0_15px_rgba(168,85,247,0.6)]"></span>
                        Моя Армия
                    </h3>
                    <div className="flex gap-3">
                        <div className="relative group">
                            <input className="bg-[#121217] border border-white/10 rounded-xl px-4 py-2.5 pl-10 text-sm text-white focus:outline-none focus:border-purple-500/50 w-64 placeholder-gray-600 transition-all group-hover:border-white/20" placeholder="Поиск тени..." type="text" />
                            <span className="material-symbols-outlined absolute left-3 top-3 text-gray-500 text-lg group-hover:text-gray-400 transition-colors">search</span>
                        </div>
                        <button className="w-10 h-10 bg-[#121217] border border-white/10 hover:bg-white/5 hover:border-white/20 rounded-xl text-white transition-all flex items-center justify-center">
                            <span className="material-symbols-outlined text-lg">filter_list</span>
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                    {/* Render Real Army or Empty State */}
                    {army.length > 0 ? (
                        army.map((soldier) => (
                            <div key={soldier.id} className="bg-[#0B0B0E] border border-white/5 rounded-2xl p-4 relative group hover:-translate-y-1 transition-all duration-300">
                                <div className="absolute top-3 right-3 z-10">
                                    <div className={`w-2 h-2 rounded-full ${soldier.is_online ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.8)]' : 'bg-gray-600'}`}></div>
                                </div>
                                <div className="flex flex-col items-center pt-2">
                                    <div className="relative w-20 h-20 mb-3 ml-auto mr-auto">
                                        <div className="absolute inset-0 bg-white/10 rounded-full blur-md opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                        {soldier.avatar_url ? (
                                            <Image
                                                alt={soldier.username}
                                                width={80}
                                                height={80}
                                                className="w-full h-full rounded-full object-cover border border-white/10 relative z-10"
                                                src={soldier.avatar_url}
                                            />
                                        ) : (
                                            <div className="w-full h-full rounded-full bg-[#1C1C22] border border-white/10 relative z-10 flex items-center justify-center">
                                                <span className="text-2xl font-bold text-gray-500 group-hover:text-purple-400 transition-colors">
                                                    {(soldier.username || '?').charAt(0).toUpperCase()}
                                                </span>
                                            </div>
                                        )}
                                        <div className="absolute -bottom-1.5 inset-x-0 flex justify-center z-20">
                                            <span className="bg-[#121217] border border-white/10 text-[10px] text-gray-300 px-2 py-px rounded-full font-bold">Ур. {soldier.level}</span>
                                        </div>
                                    </div>
                                    <h4 className="text-white font-bold text-base mb-0.5 truncate max-w-full text-center">{soldier.username}</h4>
                                    <p className="text-gray-500 text-[10px] mb-4 text-center">Призван: {timeAgo(soldier.created_at)}</p>

                                    <div className="w-full bg-[#121217] rounded-lg p-2.5 flex justify-between items-center group-hover:bg-[#1C1C22] transition-colors">
                                        <span className="text-[10px] text-gray-500 uppercase font-bold tracking-wide">АКТИВНОСТЬ</span>
                                        <div className="text-xs font-bold text-green-400 flex flex-col items-end leading-none">
                                            <span>ACTIVE</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="col-span-full flex flex-col items-center justify-center py-10 text-gray-500">
                            <span className="material-symbols-outlined text-4xl mb-2 opacity-50">groups_2</span>
                            <p>Ваша армия пока пуста. Призовите первых теней!</p>
                        </div>
                    )}

                    {/* Invite Card Always Visible */}
                    <div onClick={copyCode} className="bg-[#0B0B0E] border border-white/5 border-dashed rounded-2xl p-4 relative group hover:bg-white/5 transition-all duration-300 flex flex-col items-center justify-center cursor-pointer min-h-[250px]">
                        <div className="w-16 h-16 rounded-full bg-[#121217] flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                            <span className="material-symbols-outlined text-3xl text-gray-600 group-hover:text-purple-400 transition-colors">add</span>
                        </div>
                        <h4 className="text-gray-400 font-bold text-base mb-1 group-hover:text-white transition-colors">Призвать</h4>
                        <p className="text-gray-600 text-[10px] text-center px-2">Отправь ссылку другу и получи награду</p>
                    </div>
                </div>
            </div>
        </PageLayout>
    );
}
