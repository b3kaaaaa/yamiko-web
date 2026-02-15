"use client";

import PageLayout from "@/components/layout/PageLayout";
import Sidebar from "@/components/layout/Sidebar";
import RankingsHeader from "@/components/rankings/RankingsHeader";
import { usePopularFeed } from "@/app/popular/hooks/usePopularFeed";
import { useEffect } from "react";
import Link from "next/link";
import { format } from "date-fns";

export default function TopMangaPage() {
    // Reuse specific feed params for "Top Manga"
    // The user design shows "Top Manga" which implies high rating or popularity.
    // Let's use filterType='rating' by default or 'view' count.
    const { mangaList, loading, loadMore, hasMore, updateParams } = usePopularFeed();

    useEffect(() => {
        updateParams({ filterType: 'rating', timePeriod: 'all_time' });
    }, []);

    const RightSidebarContent = (
        <aside className="hidden lg:flex flex-col w-80 shrink-0 space-y-6 sticky top-24 self-start h-[calc(100vh-6rem)] overflow-y-auto no-scrollbar pb-10">
            {/* Filter Period */}
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

            {/* Categories */}
            <div className="glass-panel border border-white/5 rounded-2xl overflow-hidden p-4 shadow-lg bg-[#121217]/80">
                <h3 className="text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-4 px-1 flex items-center gap-2">
                    <span className="material-symbols-outlined text-[14px]">category</span>
                    Категории
                </h3>
                <div className="flex flex-col space-y-1 max-h-[400px] overflow-y-auto no-scrollbar">
                    {['Все', 'Сёдзё', 'Сёнэн', 'Системки', 'Школьная жизнь', 'Исекаи', 'Имбовый ГГ'].map((cat, i) => (
                        <div key={cat} className={`flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium border border-transparent transition-colors cursor-pointer ${i === 0 ? 'text-primary bg-primary/10 border-primary/20 font-bold' : 'text-gray-400 hover:text-white hover:bg-white/5 hover:border-white/5'}`}>
                            <span>{cat}</span>
                            <span className={`text-xs px-1.5 py-0.5 rounded ${i === 0 ? 'bg-primary/20 text-primary' : 'bg-surface-highlight-dark text-gray-500'}`}>
                                {100 + (cat.length * 42) % 900}
                            </span>
                        </div>
                    ))}
                </div>
            </div>
        </aside>
    );

    return (
        <PageLayout leftSidebar={<Sidebar />} rightSidebar={RightSidebarContent}>
            <div className="space-y-8">
                <RankingsHeader />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {loading && mangaList.length === 0 ? (
                        // Skeletons
                        [...Array(6)].map((_, i) => (
                            <div key={i} className="h-[220px] bg-[#121217] rounded-xl animate-pulse"></div>
                        ))
                    ) : (
                        mangaList.map((manga, index) => {
                            const glowClass = index === 0 ? 'shadow-[0_0_20px_rgba(255,215,0,0.03)] border-yellow-500/15' :
                                index === 1 ? 'shadow-[0_0_20px_rgba(192,192,192,0.03)] border-gray-400/15' :
                                    index === 2 ? 'shadow-[0_0_20px_rgba(205,127,50,0.03)] border-orange-700/15' : 'border-white/5';

                            return (
                                <Link href={`/manga/${manga.id}`} key={manga.id}>
                                    <div className={`flex items-stretch gap-4 bg-surface-highlight-dark/40 hover:bg-surface-highlight-dark/80 rounded-2xl p-3 border transition-all duration-300 hover:border-white/10 overflow-hidden relative h-[220px] group cursor-pointer ${glowClass}`}>
                                        <div className="w-[140px] shrink-0 rounded-xl overflow-hidden shadow-lg relative h-full">
                                            <img
                                                alt={manga.title}
                                                src={manga.cover_url || "https://placehold.co/400x600/1e1e1e/white?text=No+Cover"}
                                                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                            />
                                        </div>
                                        <div className="flex-1 flex flex-col justify-between py-2 pr-2">
                                            <div className="flex items-center justify-between">
                                                <span className="text-[13px] font-medium text-white/80">
                                                    {index === 0 ? '🔥 Топ-1' : (index < 3 ? `Топ-${index + 1}` : 'Популярное')}
                                                </span>
                                                <div className="flex items-center gap-1 bg-surface-dark/50 px-2 py-1 rounded-md border border-white/5">
                                                    <span className="material-symbols-outlined text-white text-[14px] filled">star</span>
                                                    <span className="text-[13px] font-bold text-white">{manga.rating.toFixed(1)}</span>
                                                </div>
                                            </div>
                                            <div className="space-y-1">
                                                <div className="text-[11px] font-medium text-gray-400 uppercase tracking-wide truncate">
                                                    {manga.type} • {new Date().getFullYear()}
                                                </div>
                                                <h3 className="text-[17px] font-bold text-white group-hover:text-primary transition-colors leading-tight line-clamp-2">
                                                    {manga.title}
                                                </h3>
                                                <div className="flex flex-wrap gap-2 text-[11px] text-gray-500 pt-1">
                                                    {manga.genres?.slice(0, 2).map(g => <span key={g}>{g}</span>)}
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-4 text-xs text-gray-400 mt-2">
                                                <div className="flex items-center gap-1.5">
                                                    <span className="material-symbols-outlined text-[14px]">favorite</span>
                                                    <span>{Math.floor(manga.views_7_days / 10)}</span> {/* Mock likes */}
                                                </div>
                                                <div className="flex items-center gap-1.5">
                                                    <span className="material-symbols-outlined text-[14px]">visibility</span>
                                                    <span>{manga.views_7_days}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </Link>
                            );
                        })
                    )}
                </div>

                {hasMore && (
                    <div className="flex justify-center pt-2">
                        <button
                            onClick={loadMore}
                            disabled={loading}
                            className="px-8 py-3 rounded-lg bg-surface-dark/50 backdrop-blur border border-white/10 hover:border-primary/40 hover:text-primary hover:bg-white/5 text-gray-300 text-sm font-bold transition-all flex items-center gap-2 group shadow-lg disabled:opacity-50"
                        >
                            {loading ? "Загрузка..." : "Показать следующие 10"}
                            {!loading && <span className="material-symbols-outlined text-[18px] group-hover:translate-y-0.5 transition-transform">expand_more</span>}
                        </button>
                    </div>
                )}
            </div>
        </PageLayout>
    );
}
