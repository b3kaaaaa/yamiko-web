"use client";

import { useEffect, useState } from "react";
import { browserClient as supabase } from "@/lib/supabase/client";

type Tab = "gifts" | "rewards";

interface Gift {
    id: string;
    sender_id: string | null;
    receiver_id: string;
    gift_type: string;
    content_id: string;
    message: string | null;
    created_at: string;
    sender?: { nickname: string } | null;
    receiver?: { nickname: string } | null;
}

interface Reward {
    id: string;
    user_id: string;
    source: string;
    rewards_snapshot: any;
    created_at: string;
    profiles?: { nickname: string } | null;
}

export default function AdminTransactionsPage() {
    const [tab, setTab] = useState<Tab>("gifts");
    const [gifts, setGifts] = useState<Gift[]>([]);
    const [rewards, setRewards] = useState<Reward[]>([]);
    const [loading, setLoading] = useState(true);

    async function fetchGifts() {
        setLoading(true);
        const { data, error } = await (supabase
            .from("gifts") as any)
            .select("*, sender:profiles!gifts_sender_id_fkey(nickname), receiver:profiles!gifts_receiver_id_fkey(nickname)")
            .order("created_at", { ascending: false })
            .limit(100);
        if (error) {
            console.error("Gifts fetch error:", error);
            // Fallback without joins
            const { data: fallback } = await (supabase.from("gifts") as any).select("*").order("created_at", { ascending: false }).limit(100);
            setGifts(fallback || []);
        } else {
            setGifts(data || []);
        }
        setLoading(false);
    }

    async function fetchRewards() {
        setLoading(true);
        const { data, error } = await (supabase
            .from("reward_history") as any)
            .select("*, profiles(nickname)")
            .order("created_at", { ascending: false })
            .limit(100);
        if (error) {
            console.error("Rewards fetch error:", error);
            const { data: fallback } = await (supabase.from("reward_history") as any).select("*").order("created_at", { ascending: false }).limit(100);
            setRewards(fallback || []);
        } else {
            setRewards(data || []);
        }
        setLoading(false);
    }

    useEffect(() => {
        if (tab === "gifts") fetchGifts();
        else fetchRewards();
    }, [tab]);

    const giftTypeColors: Record<string, string> = {
        RUBIES: "text-yellow-400 bg-yellow-500/10 border-yellow-500/20",
        ITEM: "text-blue-400 bg-blue-500/10 border-blue-500/20",
        PREMIUM_SUB: "text-purple-400 bg-purple-500/10 border-purple-500/20",
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex justify-between items-end">
                <div className="border-l-4 border-emerald-500 pl-6">
                    <h1 className="text-3xl font-black text-white tracking-tighter uppercase">Транзакции</h1>
                    <p className="text-gray-500 text-xs font-bold uppercase tracking-widest">Подарки и награды (только чтение)</p>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 bg-[#0E0E13] border border-white/5 rounded-xl p-1 w-fit">
                <button onClick={() => setTab("gifts")} className={`px-5 py-2 text-xs font-bold uppercase tracking-wider rounded-lg transition-all ${tab === "gifts" ? "bg-primary text-white" : "text-gray-500 hover:text-white"}`}>
                    Подарки
                </button>
                <button onClick={() => setTab("rewards")} className={`px-5 py-2 text-xs font-bold uppercase tracking-wider rounded-lg transition-all ${tab === "rewards" ? "bg-primary text-white" : "text-gray-500 hover:text-white"}`}>
                    Награды
                </button>
            </div>

            {loading ? (
                <div className="flex justify-center py-20"><div className="w-8 h-8 border-2 border-white/10 border-t-emerald-500 rounded-full animate-spin"></div></div>
            ) : tab === "gifts" ? (
                <div className="bg-[#0E0E13]/80 border border-white/5 rounded-2xl overflow-hidden">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="border-b border-white/5">
                                <th className="px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-gray-500">Отправитель</th>
                                <th className="px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-gray-500">Получатель</th>
                                <th className="px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-gray-500">Тип</th>
                                <th className="px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-gray-500">Содержимое</th>
                                <th className="px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-gray-500">Сообщение</th>
                                <th className="px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-gray-500">Дата</th>
                            </tr>
                        </thead>
                        <tbody>
                            {gifts.length === 0 ? (
                                <tr><td colSpan={6} className="text-center py-20 text-gray-600 text-xs font-bold uppercase tracking-widest">Нет подарков</td></tr>
                            ) : gifts.map(g => (
                                <tr key={g.id} className="border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors">
                                    <td className="px-5 py-3 text-sm text-white font-bold">{(g.sender as any)?.nickname || (g.sender_id ? g.sender_id.slice(0, 8) : "System")}</td>
                                    <td className="px-5 py-3 text-sm text-gray-300">{(g.receiver as any)?.nickname || g.receiver_id.slice(0, 8)}</td>
                                    <td className="px-5 py-3"><span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded border ${giftTypeColors[g.gift_type] || ""}`}>{g.gift_type}</span></td>
                                    <td className="px-5 py-3 text-xs text-gray-400 font-mono">{g.content_id}</td>
                                    <td className="px-5 py-3 text-xs text-gray-500 max-w-[150px] truncate">{g.message || "—"}</td>
                                    <td className="px-5 py-3 text-xs text-gray-500">{new Date(g.created_at).toLocaleDateString("ru-RU")}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : (
                <div className="bg-[#0E0E13]/80 border border-white/5 rounded-2xl overflow-hidden">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="border-b border-white/5">
                                <th className="px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-gray-500">Юзер</th>
                                <th className="px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-gray-500">Источник</th>
                                <th className="px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-gray-500">Награды</th>
                                <th className="px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-gray-500">Дата</th>
                            </tr>
                        </thead>
                        <tbody>
                            {rewards.length === 0 ? (
                                <tr><td colSpan={4} className="text-center py-20 text-gray-600 text-xs font-bold uppercase tracking-widest">Нет наград</td></tr>
                            ) : rewards.map(r => (
                                <tr key={r.id} className="border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors">
                                    <td className="px-5 py-3 text-sm text-white font-bold">{r.profiles?.nickname || r.user_id.slice(0, 8)}</td>
                                    <td className="px-5 py-3 text-xs text-gray-400">{r.source}</td>
                                    <td className="px-5 py-3">
                                        <div className="flex gap-2 text-[10px]">
                                            {r.rewards_snapshot?.xp && <span className="text-blue-400 font-bold">+{r.rewards_snapshot.xp} XP</span>}
                                            {r.rewards_snapshot?.rubies && <span className="text-yellow-400 font-bold">+{r.rewards_snapshot.rubies} 💎</span>}
                                            {r.rewards_snapshot?.energy && <span className="text-green-400 font-bold">+{r.rewards_snapshot.energy} ⚡</span>}
                                        </div>
                                    </td>
                                    <td className="px-5 py-3 text-xs text-gray-500">{new Date(r.created_at).toLocaleDateString("ru-RU")}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
