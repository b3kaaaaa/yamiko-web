"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { ru } from "date-fns/locale";

type Quest = {
    id: string; // user_quest_id
    title: string;
    description: string;
    type: string;
    frequency: string;
    difficulty: string;
    progress: number;
    target_count: number;
    rewards: { xp: number; rubies: number; energy: number };
    is_completed: boolean;
    is_claimed: boolean;
    expires_at: string;
};

type Streak = {
    current_streak: number;
    last_activity_date: string;
    max_streak: number;
};

export default function QuestsPage() {
    const supabase = createClient();
    const [quests, setQuests] = useState<Quest[]>([]);
    const [streak, setStreak] = useState<Streak>({ current_streak: 0, last_activity_date: '', max_streak: 0 });
    const [loading, setLoading] = useState(true);
    const [timeToReset, setTimeToReset] = useState("");

    const fetchData = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            // 1. Generate Quests if needed (Auto-trigger)
            // We can try to call it, it safely does nothing if quests exist
            // @ts-ignore
            await (supabase.rpc as any)('generate_daily_quests', { target_user_id: user.id });

            // 2. Fetch Active Quests
            const { data: userQuests, error: questsError } = await (supabase.from('user_quests') as any)
                .select(`
                    id,
                    progress,
                    is_completed,
                    is_claimed,
                    expires_at,
                    quest_definitions (
                        title,
                        description,
                        type,
                        frequency,
                        difficulty,
                        target_count,
                        rewards
                    )
                `)
                .eq('user_id', user.id)
                .order('is_claimed', { ascending: true }) // Claimed last
                .order('is_completed', { ascending: false }); // Completed first

            if (questsError) console.error("Quests error:", questsError);

            // Transform to flat structure
            const formattedQuests = userQuests?.map((uq: any) => ({
                id: uq.id,
                title: uq.quest_definitions.title,
                description: uq.quest_definitions.description,
                type: uq.quest_definitions.type,
                frequency: uq.quest_definitions.frequency,
                difficulty: uq.quest_definitions.difficulty,
                target_count: uq.quest_definitions.target_count,
                rewards: uq.quest_definitions.rewards,
                progress: uq.progress,
                is_completed: uq.is_completed,
                is_claimed: uq.is_claimed,
                expires_at: uq.expires_at
            })) || [];

            setQuests(formattedQuests);

            // 3. Fetch Streak
            const { data: streakData, error: streakError } = await (supabase.from('quest_streaks') as any)
                .select('*')
                .eq('user_id', user.id)
                .single();

            if (streakData) setStreak(streakData);

        } catch (error) {
            console.error("Error fetching quests:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();

        // Timer Logic
        const interval = setInterval(() => {
            const now = new Date();
            const tomorrow = new Date(now);
            tomorrow.setDate(tomorrow.getDate() + 1);
            tomorrow.setHours(0, 0, 0, 0);

            const diff = tomorrow.getTime() - now.getTime();
            const hours = Math.floor((diff % (10000 * 3600)) / (1000 * 3600));
            const minutes = Math.floor((diff % (1000 * 3600)) / (1000 * 60));
            const seconds = Math.floor((diff % (1000 * 60)) / 1000);

            setTimeToReset(`${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
        }, 1000);

        return () => clearInterval(interval);
    }, []);

    const handleClaim = async (questId: string) => {
        try {
            // @ts-ignore
            const { data, error } = await (supabase.rpc as any)('claim_quest_reward', { target_quest_id: questId });
            if (error) throw error;

            // Refresh data to show claimed state and header update
            fetchData();
            // In real app, trigger a "Toast" or "Level Up" animation here
            alert("Награда получена!");
        } catch (e) {
            console.error("Claim error:", e);
            alert("Ошибка при получении награды.");
        }
    };

    // Helper for difficulty color
    const getDifficultyColor = (diff: string) => {
        switch (diff) {
            case 'S': return 'text-red-500';
            case 'A': return 'text-orange-500';
            case 'B': return 'text-purple-500';
            case 'C': return 'text-blue-500';
            default: return 'text-green-500';
        }
    };

    return (
        <>
            <div className="flex-1 min-w-0 mx-auto space-y-6 w-full">
                <div className="flex items-end justify-between mb-2">
                    <div>
                        <h1 className="text-3xl font-black text-white tracking-tight uppercase flex items-center gap-3">
                            <span className="material-symbols-outlined text-4xl text-purple-500">assignment</span>
                            Дневные Квесты
                        </h1>
                        <p className="text-gray-400 text-sm mt-1">Выполняйте задания, чтобы получить награды и повысить ранг</p>
                    </div>
                    <div className="flex flex-col items-end">
                        <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Обновление через</span>
                        <div className="flex items-center gap-2 font-mono text-xl font-bold text-white bg-[#1C1C22] px-3 py-1 rounded-lg border border-white/5">
                            <span className="text-purple-500">{timeToReset.split(':')[0]}</span>:<span className="text-gray-300">{timeToReset.split(':')[1]}</span>:<span className="text-gray-300">{timeToReset.split(':')[2]}</span>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {loading ? (
                        // Skeletons
                        [1, 2, 3, 4].map(i => <div key={i} className="h-48 bg-[#121217] rounded-xl animate-pulse"></div>)
                    ) : quests.length > 0 ? (
                        quests.map((quest) => (
                            <div key={quest.id} className={`bg-[#121217]/80 backdrop-blur-sm border border-white/5 hover:border-white/10 transition-all duration-300 rounded-xl p-4 relative overflow-hidden group flex flex-col justify-between h-full ${quest.is_claimed ? 'opacity-50 grayscale' : ''}`}>
                                <div className="absolute top-0 right-0 p-3 opacity-5 group-hover:opacity-10 transition-opacity pointer-events-none">
                                    <span className="material-symbols-outlined text-8xl text-purple-500 -rotate-12">menu_book</span>
                                </div>

                                <div>
                                    <div className="flex items-start justify-between mb-3 relative z-10">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center border border-purple-500/30 shadow-[0_0_15px_rgba(168,85,247,0.3)] shrink-0">
                                                <span className="material-symbols-outlined text-xl text-purple-500">
                                                    {quest.type === 'read_chapter' ? 'auto_stories' : quest.type === 'comment' ? 'chat' : quest.type === 'like' ? 'favorite' : 'star'}
                                                </span>
                                            </div>
                                            <div>
                                                <h3 className="text-base font-bold text-white leading-tight">{quest.title}</h3>
                                                <span className={`text-[10px] font-bold mt-0.5 block ${getDifficultyColor(quest.difficulty)}`}>
                                                    Ранг {quest.difficulty} • {quest.frequency === 'daily' ? 'Ежедневное' : 'Еженедельное'}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="flex gap-1.5">
                                            {quest.rewards.energy && (
                                                <div className="flex items-center gap-1 bg-[#121217]/50 px-1.5 py-1 rounded border border-white/5" title="Энергия">
                                                    <span className="material-symbols-outlined text-yellow-400 text-[14px]">bolt</span>
                                                    <span className="text-[10px] font-bold text-white">{quest.rewards.energy}</span>
                                                </div>
                                            )}
                                            {quest.rewards.rubies && (
                                                <div className="flex items-center gap-1 bg-[#121217]/50 px-1.5 py-1 rounded border border-white/5" title="Рубины">
                                                    <span className="material-symbols-outlined text-red-500 text-[14px]">diamond</span>
                                                    <span className="text-[10px] font-bold text-white">{quest.rewards.rubies}</span>
                                                </div>
                                            )}
                                            {quest.rewards.xp && (
                                                <div className="flex items-center gap-1 bg-[#121217]/50 px-1.5 py-1 rounded border border-white/5" title="XP">
                                                    <span className="material-symbols-outlined text-purple-400 text-[14px]">military_tech</span>
                                                    <span className="text-[10px] font-bold text-white">{quest.rewards.xp}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <p className="text-xs text-gray-400 mb-4 line-clamp-2">{quest.description}</p>
                                </div>

                                <div className="space-y-3 relative z-10">
                                    <div className="flex justify-between text-[10px] mb-1">
                                        <span className="font-bold text-gray-400 uppercase tracking-wide">Прогресс</span>
                                        <span className="font-bold text-purple-500">{Math.min(quest.progress, quest.target_count)} <span className="text-gray-500">/</span> {quest.target_count}</span>
                                    </div>
                                    <div className="h-1.5 bg-[#121217] rounded-full overflow-hidden">
                                        <div className="h-full bg-gradient-to-r from-purple-500 to-purple-400 rounded-full relative overflow-hidden"
                                            style={{ width: `${Math.min(100, (quest.progress / quest.target_count) * 100)}%` }}>
                                        </div>
                                    </div>

                                    {quest.is_claimed ? (
                                        <button disabled className="w-full py-2 bg-white/5 text-gray-500 text-xs font-bold uppercase tracking-wider rounded-lg cursor-not-allowed border border-white/5 flex items-center justify-center gap-2">
                                            <span className="material-symbols-outlined text-sm">check</span>
                                            Получено
                                        </button>
                                    ) : quest.is_completed ? (
                                        <button onClick={() => handleClaim(quest.id)} className="w-full py-2 bg-green-600 hover:bg-green-500 text-white text-xs font-bold uppercase tracking-wider rounded-lg transition-all shadow-[0_0_10px_rgba(34,197,94,0.3)] hover:shadow-[0_0_15px_rgba(34,197,94,0.5)] animate-pulse">
                                            Забрать награду
                                        </button>
                                    ) : (
                                        <button className="w-full py-2 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold uppercase tracking-wider rounded-lg transition-all shadow-[0_0_10px_rgba(168,85,247,0.3)] hover:shadow-[0_0_15px_rgba(168,85,247,0.5)]">
                                            Продолжить
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="col-span-full py-10 text-center text-gray-500">Нет доступных квестов. Возвращайтесь завтра!</div>
                    )}
                </div>
            </div>

            <aside className="hidden lg:flex flex-col w-80 shrink-0 space-y-6 sticky top-24 self-start h-[calc(100vh-6rem)] overflow-y-auto no-scrollbar pb-10">
                {/* Streak Widget */}
                <div className="bg-[#121217]/80 backdrop-blur-md border border-white/5 rounded-2xl overflow-hidden shadow-lg">
                    <div className="p-4 border-b border-white/5 bg-gradient-to-r from-orange-500/20 to-transparent">
                        <h3 className="text-sm font-bold text-white flex items-center gap-2 uppercase tracking-wide">
                            <span className="material-symbols-outlined text-orange-500 text-lg">local_fire_department</span>
                            Серия заданий
                        </h3>
                    </div>
                    <div className="p-5">
                        <div className="flex flex-col items-center justify-center text-center mb-6">
                            <div className="relative w-24 h-24 flex items-center justify-center mb-2">
                                <div className="absolute inset-0 rounded-full border-4 border-orange-500/20"></div>
                                <div className="absolute inset-0 rounded-full border-4 border-orange-500 border-t-transparent animate-spin duration-[3s]"></div>
                                <span className="text-4xl font-black text-white drop-shadow-[0_0_10px_rgba(249,115,22,0.8)]">{streak.current_streak}</span>
                            </div>
                            <span className="text-xs font-bold text-orange-400 uppercase tracking-widest">Дней подряд</span>
                            <p className="text-[10px] text-gray-500 mt-2 px-4">Заходите каждый день и выполняйте квесты, чтобы не потерять серию.</p>
                        </div>

                        {/* Days Visual (Static for MVP, could be dynamic) */}
                        <div className="flex justify-between items-center gap-1 opacity-70">
                            {[...Array(7)].map((_, i) => (
                                <div key={i} className="flex flex-col items-center gap-1 group">
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center border ${i < (streak.current_streak % 7) ? 'bg-orange-500 border-orange-500 text-white' : 'bg-[#121217] border-white/10'}`}>
                                        {i < (streak.current_streak % 7) && <span className="material-symbols-outlined text-sm">check</span>}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="p-3 bg-orange-500/10 border-t border-orange-500/20 text-center">
                        <span className="text-xs font-bold text-orange-300">Следующая награда: 50 Рубинов (7 дней)</span>
                    </div>
                </div>
            </aside>
        </>
    );
}
