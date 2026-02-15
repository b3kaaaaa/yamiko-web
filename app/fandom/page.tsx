"use client";

import { useEffect, useState } from 'react';
import { browserClient as supabase } from '@/lib/supabase/client';
import PageLayout from "@/components/layout/PageLayout";
import Sidebar from "@/components/layout/Sidebar";
import WikiCard from '@/components/wiki/WikiCard';
import TopKeepers from '@/components/wiki/TopKeepers';
import ActivityFeed from '@/components/wiki/ActivityFeed';
import Link from 'next/link';
import { FandomHubData } from '@/types/wiki';

export default function FandomPage() {
    const [data, setData] = useState<FandomHubData | null>(null);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [isSearching, setIsSearching] = useState(false);

    useEffect(() => {
        const fetchHubData = async () => {
            const { data: hubData, error } = await (supabase.rpc as any)('get_fandom_hub');
            if (error) {
                console.error("FULL RPC ERROR DETAILS:", {
                    message: error.message,
                    details: error.details,
                    hint: error.hint,
                    code: error.code
                });
            } else {
                setData(hubData as FandomHubData);
            }
            setLoading(false);
        };
        fetchHubData();
    }, []);

    const handleSearch = async (query: string) => {
        setSearchQuery(query);
        if (query.length > 2) {
            setIsSearching(true);
            const { data: results, error } = await (supabase.rpc as any)('search_wiki', { p_query: query });
            if (!error) {
                setSearchResults(results || []);
            }
            setIsSearching(false);
        } else {
            setSearchResults([]);
        }
    };

    return (
        <PageLayout
            leftSidebar={<Sidebar />}
            rightSidebar={
                <aside className="hidden xl:flex flex-col w-72 shrink-0 space-y-6 sticky top-24 self-start h-[calc(100vh-6rem)] overflow-y-auto no-scrollbar pb-10">
                    <TopKeepers keepers={data?.top_keepers || []} />
                    <ActivityFeed activity={data?.recent_activity || []} />
                </aside>
            }
        >
            <main className="flex-1 min-w-0 space-y-8">
                {/* Hero / Search Section */}
                <div className="relative w-full rounded-3xl overflow-hidden bg-surface-dark border border-white/5 flex flex-col items-center justify-center p-8 md:p-10 shadow-lg">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-primary/10 via-transparent to-transparent opacity-50"></div>
                    <div className="relative z-10 w-full flex flex-col items-center text-center max-w-2xl mx-auto">
                        <div className="mb-3 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold uppercase tracking-widest backdrop-blur-sm">
                            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></span>
                            Глобальный Портал
                        </div>
                        <h1 className="text-3xl md:text-4xl lg:text-5xl font-black text-white leading-tight mb-6 tracking-tight drop-shadow-xl">
                            Энциклопедия Миров
                        </h1>
                        <div className="w-full relative group max-w-xl mx-auto">
                            <div className="absolute -inset-1 bg-gradient-to-r from-primary to-purple-600 rounded-xl blur opacity-20 group-hover:opacity-60 transition duration-700"></div>
                            <div className="relative flex items-center bg-surface-highlight-dark border border-white/10 rounded-xl p-1.5 shadow-xl transition-colors focus-within:border-primary/50 focus-within:bg-surface-dark">
                                <span className="material-symbols-outlined text-gray-400 group-focus-within:text-primary text-2xl ml-3 transition-colors">search</span>
                                <input
                                    className="w-full bg-transparent border-none text-white text-base placeholder-gray-500 focus:ring-0 px-3 py-2 font-medium"
                                    placeholder="Поиск по всем мирам и персонажам..."
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => handleSearch(e.target.value)}
                                />
                                <div className="hidden sm:flex items-center gap-2 pr-2">
                                    <kbd className="hidden sm:inline-block px-2 py-1 text-[10px] font-bold text-gray-500 bg-white/5 border border-white/10 rounded-md">⌘ K</kbd>
                                </div>
                            </div>

                            {/* Search Dropdown */}
                            {searchResults.length > 0 && (
                                <div className="absolute top-full left-0 right-0 mt-2 bg-surface-dark border border-white/10 rounded-xl shadow-2xl z-50 overflow-hidden">
                                    {searchResults.map((result) => (
                                        <Link href={`/wiki/${result.slug}`} key={result.id} className="flex items-center gap-4 p-3 hover:bg-white/5 transition-colors border-b border-white/5 last:border-0">
                                            <div className="w-10 h-10 rounded-lg overflow-hidden bg-surface-highlight-dark flex-shrink-0">
                                                <img src={result.cover_image || "https://placehold.co/100"} alt={result.title} className="w-full h-full object-cover" />
                                            </div>
                                            <div>
                                                <h4 className="text-sm font-bold text-white">{result.title}</h4>
                                                <p className="text-[10px] text-gray-400 uppercase tracking-wider">{result.type} • {result.manga_title}</p>
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            )}
                        </div>
                        <div className="mt-5 flex flex-wrap justify-center gap-x-4 gap-y-2 text-xs font-medium text-gray-500">
                            <span>Популярные запросы:</span>
                            <span className="hover:text-primary transition-colors hover:underline cursor-pointer">Solo Leveling</span>
                            <span className="hover:text-primary transition-colors hover:underline cursor-pointer">Omniscient Reader</span>
                            <span className="hover:text-primary transition-colors hover:underline cursor-pointer">TBATE</span>
                        </div>
                    </div>
                </div>

                {/* Categories Tiles */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <Link href="/fandom/characters" className="group relative flex flex-col items-center justify-center text-center p-6 rounded-2xl bg-surface-dark border border-white/5 hover:border-blue-500/50 transition-all overflow-hidden">
                        <div className="w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-300 border border-blue-500/20 relative z-10">
                            <span className="material-symbols-outlined text-2xl text-blue-400">group</span>
                        </div>
                        <h3 className="text-sm font-bold text-white group-hover:text-blue-400 transition-colors relative z-10">Персонажи</h3>
                        <p className="text-[10px] text-gray-500 mt-1 relative z-10 font-bold uppercase tracking-widest">2,400+ статей</p>
                    </Link>
                    <Link href="/fandom/locations" className="group relative flex flex-col items-center justify-center text-center p-6 rounded-2xl bg-surface-dark border border-white/5 hover:border-green-500/50 transition-all overflow-hidden">
                        <div className="w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-300 border border-green-500/20 relative z-10">
                            <span className="material-symbols-outlined text-2xl text-green-400">public</span>
                        </div>
                        <h3 className="text-sm font-bold text-white group-hover:text-green-400 transition-colors relative z-10">Локации</h3>
                        <p className="text-[10px] text-gray-500 mt-1 relative z-10 font-bold uppercase tracking-widest">850+ статей</p>
                    </Link>
                    <Link href="/fandom/artifacts" className="group relative flex flex-col items-center justify-center text-center p-6 rounded-2xl bg-surface-dark border border-white/5 hover:border-yellow-500/50 transition-all overflow-hidden">
                        <div className="w-12 h-12 rounded-full bg-yellow-500/10 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-300 border border-yellow-500/20 relative z-10">
                            <span className="material-symbols-outlined text-2xl text-yellow-400">token</span>
                        </div>
                        <h3 className="text-sm font-bold text-white group-hover:text-yellow-400 transition-colors relative z-10">Артефакты</h3>
                        <p className="text-[10px] text-gray-500 mt-1 relative z-10 font-bold uppercase tracking-widest">1,200+ статей</p>
                    </Link>
                    <Link href="/fandom/factions" className="group relative flex flex-col items-center justify-center text-center p-6 rounded-2xl bg-surface-dark border border-white/5 hover:border-red-500/50 transition-all overflow-hidden">
                        <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-300 border border-red-500/20 relative z-10">
                            <span className="material-symbols-outlined text-2xl text-red-400">flag</span>
                        </div>
                        <h3 className="text-sm font-bold text-white group-hover:text-red-400 transition-colors relative z-10">Фракции</h3>
                        <p className="text-[10px] text-gray-500 mt-1 relative z-10 font-bold uppercase tracking-widest">300+ статей</p>
                    </Link>
                </div>

                {/* Popular Worlds Section */}
                <section className="pt-4">
                    <div className="flex items-center justify-between mb-8 pl-1">
                        <div className="flex items-center gap-4">
                            <div className="w-1.5 h-8 bg-primary rounded-full shadow-[0_0_15px_rgba(99,102,241,0.8)]" />
                            <h2 className="text-2xl font-bold text-white tracking-wide">
                                Популярные миры
                            </h2>
                        </div>
                        <Link href="/fandom/worlds" className="text-xs font-bold text-gray-400 hover:text-white uppercase tracking-wider flex items-center gap-1 group">
                            Все миры
                            <span className="material-symbols-outlined text-[16px] group-hover:translate-x-1 transition-transform">arrow_forward</span>
                        </Link>
                    </div>

                    {loading ? (
                        <div className="flex justify-center py-20">
                            <div className="w-8 h-8 border-2 border-primary/20 border-t-primary rounded-full animate-spin"></div>
                        </div>
                    ) : (
                        <div className="flex flex-col gap-10">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                {(data?.popular_worlds || []).map((world) => (
                                    <WikiCard key={world.id} world={world} />
                                ))}

                                {/* "New World" Card */}
                                <div className="group relative flex flex-col gap-3 cursor-pointer">
                                    <div className="aspect-[16/9] w-full rounded-2xl overflow-hidden relative border-2 border-dashed border-white/10 group-hover:border-primary/50 transition-all flex flex-col items-center justify-center p-6 text-center bg-white/[0.02] hover:bg-primary/[0.05]">
                                        <div className="w-16 h-16 rounded-full bg-surface-highlight-dark flex items-center justify-center mb-4 group-hover:scale-110 transition-transform border border-white/5">
                                            <span className="material-symbols-outlined text-3xl text-gray-500 group-hover:text-primary transition-colors">add</span>
                                        </div>
                                        <h3 className="text-xl font-black text-white mb-2 tracking-tight">Создать Вики</h3>
                                        <p className="text-gray-500 text-xs px-10 leading-relaxed">
                                            Станьте первооткрывателем и создайте энциклопедию для новой манги
                                        </p>
                                        <button className="mt-6 px-8 py-2.5 rounded-full bg-primary/10 hover:bg-primary text-primary hover:text-white font-black transition-all text-[10px] border border-primary/30 uppercase tracking-widest">
                                            Начать проект
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </section>

                <div className="flex flex-wrap gap-x-6 gap-y-2 pt-8 border-t border-white/5 mt-4">
                    <span className="text-[10px] text-gray-600">© 2024 Yamiko Project</span>
                    <Link className="text-[10px] font-medium text-gray-500 hover:text-gray-300" href="#">О нас</Link>
                    <Link className="text-[10px] font-medium text-gray-500 hover:text-gray-300" href="#">Приватность</Link>
                    <Link className="text-[10px] font-medium text-gray-500 hover:text-gray-300" href="#">DMCA</Link>
                </div>
            </main>
        </PageLayout>
    );
}
