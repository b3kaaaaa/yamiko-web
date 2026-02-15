"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { useParams } from "next/navigation";

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

import PageLayout from "@/components/layout/PageLayout";
import ProfileSidebar from "@/components/profile/ProfileSidebar";
import ListSkeleton from "@/components/skeletons/ListSkeleton";

// ... existing types ...

export default function QuestsPage() {
    const supabase = createClient();
    const [quests, setQuests] = useState<Quest[]>([]);
    const [streak, setStreak] = useState<Streak>({ current_streak: 0, last_activity_date: '', max_streak: 0 });
    const [loading, setLoading] = useState(true);
    const [timeToReset, setTimeToReset] = useState("");

    // We need params to pass to ProfileSidebar
    // Since this is a client component, we can use useParams() or just assume it's passed if we change signature.
    // But page definitions in App Router receive params as props.
    // Let's use useParams() which is already imported in bookmarks page, or just add it here.
    // Actually, let's use the layout similar to bookmarks.

    const params = useParams(); // Need to import this

    // ... existing fetchData ...

    // ... existing useEffect ...

    // ... existing handleClaim ...

    // ... existing getDifficultyColor ...

    if (loading) return (
        <PageLayout leftSidebar={<ProfileSidebar profileId={params?.id as string} />}>
            <ListSkeleton />
        </PageLayout>
    );

    return (
        <PageLayout
            leftSidebar={<ProfileSidebar profileId={params?.id as string} />}
            rightSidebar={
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
            }
        >
            <div className="flex-1 min-w-0 mx-auto space-y-6 w-full">
                {/* ... existing content ... */}
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
                                {/* ... quest content ... */}
                            </div>
                        ))
                    ) : (
                        <div className="col-span-full py-10 text-center text-gray-500">Нет доступных квестов. Возвращайтесь завтра!</div>
                    )}
                </div>
            </div>
        </PageLayout>
    );
}
