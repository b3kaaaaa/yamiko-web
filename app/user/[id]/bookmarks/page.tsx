"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useUserStore } from "@/lib/store/userStore";
import PageLayout from "@/components/layout/PageLayout";
import ProfileSidebar from "@/components/profile/ProfileSidebar";
import ListSkeleton from "@/components/skeletons/ListSkeleton";

type BookmarkStatus = 'READING' | 'PLANNED' | 'COMPLETED' | 'DROPPED' | 'FAVORITE';

interface LibraryEntry {
    id: string;
    manga_id: string;
    status: BookmarkStatus;
    updated_at: string;
    created_at: string;
    manga: {
        id: string;
        title: string;
        cover_url: string;
        slug: string;
    };
}

const statusTabs: { id: BookmarkStatus | 'ALL'; label: string }[] = [
    { id: 'ALL', label: 'Все' },
    { id: 'READING', label: 'Читаю' },
    { id: 'PLANNED', label: 'Буду читать' },
    { id: 'COMPLETED', label: 'Прочитано' },
    { id: 'DROPPED', label: 'Брошено' },
    { id: 'FAVORITE', label: 'Любимое' },
];

export default function BookmarksPage() {
    const params = useParams();
    const supabase = createClient();
    const { currentUser } = useUserStore();

    const [entries, setEntries] = useState<LibraryEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<BookmarkStatus | 'ALL'>('READING');
    const [searchQuery, setSearchQuery] = useState("");
    const [viewMode, setViewMode] = useState<'GRID' | 'LIST'>('GRID');
    const [sortBy, setSortBy] = useState<'NEW' | 'OLD' | 'UPDATED' | 'ADDED'>('UPDATED');

    useEffect(() => {
        const fetchBookmarks = async () => {
            const rawId = params?.id;
            const profileId = Array.isArray(rawId) ? rawId[0] : rawId;

            if (!profileId) return;

            // Resolve proper user ID (handle display_id vs uuid)
            let targetUserId = profileId;

            // If params.id looks like a display_id (integer), we need to fetch the UUID
            // Assuming display_id is numeric, UUID is not.
            const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(profileId);

            if (!isUUID) {
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('id')
                    .eq('display_id', profileId)
                    .maybeSingle();
                if (profile) targetUserId = (profile as any).id;
            }

            const { data, error } = await supabase
                .from('library_entries')
                .select(`
                    *,
                    manga:manga_id (
                        id,
                        title,
                        cover_url,
                        slug
                    )
                `)
                .eq('user_id', targetUserId);

            if (data) {
                setEntries(data as any);
            }
            setLoading(false);
        };

        fetchBookmarks();
    }, [params?.id]);

    const filteredEntries = entries.filter(entry => {
        const matchesTab = activeTab === 'ALL' || entry.status === activeTab;
        const matchesSearch = entry.manga?.title?.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesTab && matchesSearch;
    }).sort((a, b) => {
        switch (sortBy) {
            case 'NEW': return new Date(b.created_at).getTime() - new Date(a.created_at).getTime(); // Placeholder logic
            case 'OLD': return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
            case 'UPDATED': return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
            case 'ADDED': return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
            default: return 0;
        }
    });

    const getCount = (status: BookmarkStatus) => entries.filter(e => e.status === status).length;

    if (loading) return (
        <PageLayout leftSidebar={<ProfileSidebar profileId={params.id as string} />}>
            <ListSkeleton />
        </PageLayout>
    );

    return (
        <PageLayout
            leftSidebar={<ProfileSidebar profileId={params.id as string} />}
            rightSidebar={
                <aside className="hidden lg:flex w-80 shrink-0 sticky top-24 self-start flex-col gap-6 pl-2 h-[calc(100vh-6rem)] overflow-y-auto no-scrollbar">
                    <div className="bg-[#121217] rounded-xl border border-white/5 p-4 shadow-lg">
                        <div className="relative group">
                            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-primary transition-colors">search</span>
                            <input
                                className="w-full bg-[#1C1C22] border border-white/10 rounded-lg py-2.5 pl-10 pr-4 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all"
                                placeholder="Поиск по закладкам..."
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                    </div>
                    <div className="bg-[#121217] rounded-xl border border-white/5 p-4 shadow-lg flex flex-col gap-4">
                        <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Вид</span>
                        </div>
                        <div className="flex gap-2 bg-[#1C1C22] p-1 rounded-lg">
                            <button
                                onClick={() => setViewMode('GRID')}
                                className={`flex-1 flex items-center justify-center py-2 rounded transition-colors ${viewMode === 'GRID' ? 'bg-white/10 text-primary shadow-sm' : 'text-gray-500 hover:text-white'}`}
                            >
                                <span className="material-symbols-outlined text-[20px]">grid_view</span>
                            </button>
                            <button
                                onClick={() => setViewMode('LIST')}
                                className={`flex-1 flex items-center justify-center py-2 rounded transition-colors ${viewMode === 'LIST' ? 'bg-white/10 text-primary shadow-sm' : 'text-gray-500 hover:text-white'}`}
                            >
                                <span className="material-symbols-outlined text-[20px]">view_list</span>
                            </button>
                        </div>
                        <div className="h-px w-full bg-white/5"></div>
                        <div className="relative">
                            <button className="w-full flex items-center justify-between text-left text-sm font-medium text-gray-300 hover:text-white group py-1">
                                <span>Сортировка</span>
                                <span className="material-symbols-outlined text-[18px] text-gray-500 group-hover:text-primary transition-colors">expand_more</span>
                            </button>
                            <div className="mt-2 flex flex-col gap-1 pl-2 border-l border-white/5">
                                <label className="flex items-center gap-2 py-1.5 cursor-pointer group">
                                    <input
                                        type="radio" name="sort"
                                        checked={sortBy === 'NEW'} onChange={() => setSortBy('NEW')}
                                        className="w-4 h-4 bg-[#1C1C22] border-gray-600 text-primary focus:ring-primary focus:ring-offset-[#121217] rounded-full"
                                    />
                                    <span className="text-sm text-gray-400 group-hover:text-white transition-colors">Сначала новые</span>
                                </label>
                                <label className="flex items-center gap-2 py-1.5 cursor-pointer group">
                                    <input
                                        type="radio" name="sort"
                                        checked={sortBy === 'OLD'} onChange={() => setSortBy('OLD')}
                                        className="w-4 h-4 bg-[#1C1C22] border-gray-600 text-primary focus:ring-primary focus:ring-offset-[#121217] rounded-full"
                                    />
                                    <span className="text-sm text-gray-400 group-hover:text-white transition-colors">Сначала старые</span>
                                </label>
                                <label className="flex items-center gap-2 py-1.5 cursor-pointer group">
                                    <input
                                        type="radio" name="sort"
                                        checked={sortBy === 'UPDATED'} onChange={() => setSortBy('UPDATED')}
                                        className="w-4 h-4 bg-[#1C1C22] border-gray-600 text-primary focus:ring-primary focus:ring-offset-[#121217] rounded-full"
                                    />
                                    <span className="text-sm text-gray-400 group-hover:text-white transition-colors">По дате обновления</span>
                                </label>
                            </div>
                        </div>
                    </div>
                    <div className="bg-[#121217] rounded-xl border border-white/5 p-4 shadow-lg flex flex-col gap-3">
                        <button className="w-full py-2.5 bg-[#1C1C22] hover:bg-white/5 text-gray-300 hover:text-white text-sm font-semibold rounded-lg transition-all border border-white/5 hover:border-white/10 flex items-center justify-center gap-2">
                            <span className="material-symbols-outlined text-[18px]">edit</span>
                            Редактировать
                        </button>
                        <button className="w-full py-2.5 px-4 bg-[#1C1C22] hover:bg-white/5 border border-white/5 text-gray-400 hover:text-white text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-2">
                            <span className="material-symbols-outlined text-[18px]">drive_file_move</span>
                            Групповое перемещение
                        </button>
                    </div>
                </aside>
            }
        >
            <main className="flex-1 min-w-0">
                <div className="flex flex-col gap-6 w-full">
                    <div className="glass-panel rounded-2xl p-0 overflow-hidden sticky top-20 z-30 shadow-xl shadow-black/20 bg-[#121217]/80 backdrop-blur-md border border-white/5">
                        <div className="px-6 py-4 border-b border-white/5 flex flex-col gap-4">
                            <div className="flex items-center gap-3">
                                <h1 className="text-2xl font-black tracking-tight text-white">Мои Закладки</h1>
                                <button className="w-8 h-8 rounded-full bg-primary/20 text-primary hover:bg-primary hover:text-white flex items-center justify-center transition-all" title="Добавить новое">
                                    <span className="material-symbols-outlined text-[20px]">add</span>
                                </button>
                            </div>
                            <div className="flex items-center gap-1 overflow-x-auto no-scrollbar border-b border-white/5 -mx-6 px-6">
                                {statusTabs.map(tab => (
                                    <button
                                        key={tab.id}
                                        onClick={() => setActiveTab(tab.id)}
                                        className={`px-4 py-3 border-b-2 text-sm font-medium transition-all whitespace-nowrap flex items-center gap-2 ${activeTab === tab.id
                                            ? 'border-primary text-primary bg-primary/5 font-bold'
                                            : 'border-transparent text-gray-400 hover:text-white hover:bg-white/5'
                                            }`}
                                    >
                                        {tab.label}
                                        {tab.id !== 'ALL' && (
                                            <span className={`px-1.5 py-0.5 rounded text-[10px] ${activeTab === tab.id ? 'bg-primary text-white' : 'bg-surface-highlight-dark text-gray-500'
                                                }`}>
                                                {getCount(tab.id as BookmarkStatus)}
                                            </span>
                                        )}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className={`grid gap-4 ${viewMode === 'GRID' ? 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5' : 'grid-cols-1'}`}>
                        {filteredEntries.length > 0 ? filteredEntries.map(entry => (
                            <Link href={`/manga/${entry.manga?.slug || entry.manga_id}`} key={entry.id} className="group relative cursor-pointer block">
                                {viewMode === 'GRID' ? (
                                    <>
                                        <div className="aspect-[2/3] rounded-xl overflow-hidden bg-[#1C1C22] relative shadow-lg group-hover:shadow-[0_0_20px_rgba(168,85,247,0.3)] transition-all duration-300">
                                            {entry.manga?.cover_url ? (
                                                <img
                                                    src={entry.manga.cover_url}
                                                    alt={entry.manga.title}
                                                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                                />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center bg-gray-800 text-gray-600">
                                                    <span className="material-symbols-outlined text-4xl">image</span>
                                                </div>
                                            )}
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                                            <div className="absolute bottom-0 left-0 right-0 p-3 translate-y-4 group-hover:translate-y-0 opacity-0 group-hover:opacity-100 transition-all duration-300">
                                                <button className="w-full py-2 bg-primary hover:bg-primaryHover text-white text-xs font-bold rounded shadow-lg">Читать</button>
                                            </div>
                                            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-all duration-200 z-10">
                                                <div className="w-8 h-8 rounded-full bg-black/60 backdrop-blur-md flex items-center justify-center text-white border border-white/10 hover:bg-white hover:text-black transition-colors">
                                                    <span className="material-symbols-outlined text-[18px]">more_horiz</span>
                                                </div>
                                            </div>
                                        </div>
                                        <h3 className="mt-2 text-sm font-semibold text-gray-300 group-hover:text-primary transition-colors line-clamp-1">
                                            {entry.manga?.title || "Без названия"}
                                        </h3>
                                        <p className="text-xs text-gray-500">
                                            {/* Placeholder for Last Chapter read */}
                                            Глава...
                                        </p>
                                    </>
                                ) : (
                                    <div className="flex gap-4 p-3 rounded-xl bg-[#1C1C22] hover:bg-white/5 border border-white/5">
                                        <div className="w-16 h-24 rounded-lg overflow-hidden shrink-0">
                                            {entry.manga?.cover_url && (
                                                <img src={entry.manga.cover_url} className="w-full h-full object-cover" />
                                            )}
                                        </div>
                                        <div className="flex-1">
                                            <h3 className="text-base font-bold text-white group-hover:text-primary">{entry.manga?.title}</h3>
                                            <div className="text-xs text-gray-500 mt-1">Добавлено: {new Date(entry.created_at).toLocaleDateString()}</div>
                                        </div>
                                    </div>
                                )}
                            </Link>
                        )) : (
                            <div className="col-span-full py-20 text-center flex flex-col items-center justify-center text-gray-500">
                                <span className="material-symbols-outlined text-5xl mb-4 opacity-20">bookmarks</span>
                                <p className="text-lg font-medium">В этом списке пока пусто</p>
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </PageLayout>
    );
}
