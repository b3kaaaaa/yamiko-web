import { createClient } from '@/lib/supabase/server';
import PageLayout from '@/components/layout/PageLayout';
import RightSidebar from "@/components/layout/RightSidebar";
import Image from "next/image";
import Link from "next/link";
import { format, isToday, isYesterday } from 'date-fns';
import { ru } from 'date-fns/locale';

export const revalidate = 60;

export default async function LatestPage() {
    const supabase = await createClient();

    // Fetch Data
    const [newReleasesResult, heroMangasResult, usersResult] = await Promise.all([
        supabase.from('manga')
            .select('id, title, cover_url, rating, status, created_at, slug, description, type')
            .order('created_at', { ascending: false })
            .limit(30), // Fetch more to show grouping
        supabase.from('manga')
            .select('id, title, cover_url, rating, views, slug')
            .order('views', { ascending: false })
            .limit(5),
        supabase
            .from('profiles')
            .select('id, username, avatar_url, level, exp, display_id')
            .limit(10)
    ]);

    const latestManga = newReleasesResult.data || [];
    const popularManga = heroMangasResult.data || [];
    const activeUsers = usersResult.data || [];

    // Group by Date
    const groupedManga: Record<string, any[]> = {};

    latestManga.forEach(manga => {
        const date = new Date(manga.created_at);
        let key = format(date, 'd MMMM', { locale: ru });

        if (isToday(date)) key = 'Сегодня';
        else if (isYesterday(date)) key = 'Вчера';

        if (!groupedManga[key]) groupedManga[key] = [];
        groupedManga[key].push(manga);
    });

    // Sort keys to ensure Today/Yesterday come first
    // Since objects aren't ordered, we'll iterate array of keys
    // But basic iteration often follows insertion order for strings. 
    // Let's rely on the input order (sorted by created_at desc) which naturally groups properly.
    const distinctKeys = Array.from(new Set(latestManga.map(m => {
        const date = new Date(m.created_at);
        if (isToday(date)) return 'Сегодня';
        if (isYesterday(date)) return 'Вчера';
        return format(date, 'd MMMM', { locale: ru });
    })));

    return (
        <PageLayout
            rightSidebar={<RightSidebar popular={popularManga} activeUsers={activeUsers} />}
        >
            <div className="space-y-10">
                <div className="flex items-end justify-between border-b border-white/5 pb-4">
                    <div>
                        <h1 className="text-3xl font-black text-white flex items-center gap-3 mb-2">
                            <span className="material-symbols-outlined text-primary text-4xl">new_releases</span>
                            Новинки манги
                        </h1>
                        <p className="text-text-muted-dark text-sm">Следите за последними добавлениями в нашу библиотеку</p>
                    </div>
                    {/* Filter button removed as requested */}
                </div>

                {distinctKeys.map(groupKey => {
                    const mangasInGroup = groupedManga[groupKey] || [];
                    if (mangasInGroup.length === 0) return null;

                    return (
                        <div key={groupKey}>
                            <div className="flex items-center gap-4 mb-6">
                                <h2 className="text-xl font-bold text-white capitalize">{groupKey}</h2>
                                <div className="h-[1px] bg-white/10 flex-1"></div>
                                <span className="text-xs font-bold text-primary bg-primary/10 px-2 py-1 rounded">
                                    {mangasInGroup.length} {mangasInGroup.length === 1 ? 'релиз' : mangasInGroup.length < 5 ? 'релиза' : 'релизов'}
                                </span>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {mangasInGroup.map((manga) => (
                                    <Link
                                        href={`/manga/${manga.slug}`}
                                        key={manga.id}
                                        className="flex gap-5 bg-surface-dark rounded-xl p-4 border border-white/5 hover:border-primary/40 transition-all card-hover-effect cursor-pointer group"
                                    >
                                        <div className="w-32 aspect-[3/4] rounded-lg gray-placeholder shrink-0 overflow-hidden relative shadow-lg bg-[#27272A]">
                                            {manga.cover_url && (
                                                <Image
                                                    src={manga.cover_url}
                                                    alt={manga.title}
                                                    fill
                                                    className="object-cover"
                                                />
                                            )}
                                            {/* Logic for "New" or "Upd" badge can be added here */}
                                            <div className="absolute top-2 left-2 bg-primary text-white text-[10px] font-bold px-2 py-1 rounded shadow-md uppercase">New</div>
                                        </div>

                                        <div className="flex flex-col justify-between flex-1 min-w-0 py-1">
                                            <div>
                                                <h3 className="text-lg font-bold text-white mb-2 group-hover:text-primary transition-colors truncate">
                                                    {manga.title}
                                                </h3>
                                                <div className="flex flex-wrap gap-2 mb-3">
                                                    {/* Mock genres or fetch if available. Using Type for now */}
                                                    <span className="text-[10px] font-bold text-gray-400 bg-white/5 px-2 py-1 rounded">
                                                        {manga.type === 'MANHWA' ? 'Манхва' : manga.type === 'MANGA' ? 'Манга' : 'Маньхуа'}
                                                    </span>
                                                </div>
                                                <p className="text-xs text-gray-400 line-clamp-3 leading-relaxed">
                                                    {manga.description || 'Описание отсутствует...'}
                                                </p>
                                            </div>

                                            <div className="flex items-center justify-between mt-4 pt-3 border-t border-white/5">
                                                <div className="flex items-center gap-2">
                                                    <span className="w-2 h-2 rounded-full bg-green-500"></span>
                                                    <span className="text-[11px] font-medium text-gray-300">
                                                        {/* Mock chapter info since we just fetch manga */}
                                                        Новинка
                                                    </span>
                                                </div>
                                                <span className="text-[10px] text-gray-500 font-medium">
                                                    {/* Time or date */}
                                                    {format(new Date(manga.created_at), 'HH:mm')}
                                                </span>
                                            </div>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        </div>
                    );
                })}

                {latestManga.length === 0 && (
                    <div className="text-center py-20 text-gray-500">
                        Пока нет новых релизов
                    </div>
                )}

                <div className="pt-8 pb-4 flex flex-col items-center justify-center gap-4">
                    <button className="px-8 py-3 rounded-full bg-white/5 hover:bg-white/10 text-white font-bold transition-all border border-white/5 hover:border-primary/30 flex items-center gap-2">
                        Загрузить ещё
                        <span className="material-symbols-outlined text-[18px]">expand_more</span>
                    </button>
                </div>
            </div>
        </PageLayout>
    );
}
