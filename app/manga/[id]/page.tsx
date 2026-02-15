import { getMangaBySlug } from '@/lib/services/content';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import BookmarkButton from './BookmarkButton';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { createAdminClient } from '@/lib/supabase/admin';
import PageLayout from '@/components/layout/PageLayout';
import { MangaTerritoryInfo } from '@/types/guild';
import MangaContent from './components/MangaContent';

interface PageProps {
    params: Promise<{ id: string }>;
}

export default async function MangaDetailsPage({ params }: PageProps) {
    const { id } = await params;
    // Search links use slug, so 'id' param is actually the slug here.
    const result = await getMangaBySlug(id);

    if (!result.success || !result.data) {
        notFound();
    }

    const manga = result.data;
    const firstChapterId = manga.firstChapterId;

    // Check if user is bookmarked (Server-side check)
    let isBookmarked = false;
    let libraryEntry: { status: any } | null = null;
    const cookieStore = await cookies();
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                get(name: string) {
                    return cookieStore.get(name)?.value;
                },
            },
        }
    );

    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
        const supabaseAdmin = createAdminClient();
        const { data } = await supabaseAdmin
            .from('library_entries')
            .select('id, status')
            .eq('user_id', session.user.id)
            .eq('manga_id', manga.id)
            .maybeSingle();

        if (data) {
            libraryEntry = data;
            isBookmarked = true;
        }
    }

    // Fetch Sidebar data (Active Users, Similar Manga, Territory)
    const supabaseAdmin = createAdminClient();
    const [
        { data: activeUsers },
        { data: similarMangas },
        { data: territoryData }
    ] = await Promise.all([
        supabaseAdmin.from('profiles').select('id, username, avatar_url, level, exp, display_id').order('exp', { ascending: false }).limit(4),
        supabaseAdmin.from('manga').select('*').neq('id', manga.id).limit(4),
        (supabase.rpc as any)('get_manga_territory', { p_manga_id: manga.id })
    ]);

    const territory = territoryData as MangaTerritoryInfo | null;

    // Format status
    const statusMap: Record<string, string> = {
        ONGOING: 'Выходит',
        COMPLETED: 'Завершено',
        HIATUS: 'На паузе',
        CANCELLED: 'Отменено',
    };

    // --- LEFT SIDEBAR (Context Navigation) ---
    const MangaContextSidebar = (
        <aside className="hidden xl:flex flex-col w-64 shrink-0 sticky top-24 self-start h-[calc(100vh-6rem)]">
            <Link href="/catalog" className="flex items-center gap-2 text-gray-500 hover:text-white transition-colors mb-6 text-sm font-bold uppercase tracking-wider pl-3">
                <span className="material-symbols-outlined text-lg">arrow_back</span>
                Назад к поиску
            </Link>

            <nav className="space-y-1 w-full">
                <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl bg-primary/10 text-white font-medium border border-primary/20">
                    <span className="material-symbols-outlined text-[20px] text-primary">menu_book</span>
                    Сюжет
                </button>
                <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-gray-400 hover:bg-white/5 hover:text-white transition-colors font-medium">
                    <span className="material-symbols-outlined text-[20px]">format_list_numbered</span>
                    Главы <span className="ml-auto text-xs bg-white/10 px-1.5 py-0.5 rounded text-gray-300">{manga.chapters.length}</span>
                </button>
                <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-gray-400 hover:bg-white/5 hover:text-white transition-colors font-medium">
                    <span className="material-symbols-outlined text-[20px]">group</span>
                    Персонажи
                </button>
                <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-gray-400 hover:bg-white/5 hover:text-white transition-colors font-medium">
                    <span className="material-symbols-outlined text-[20px]">photo_library</span>
                    Моменты
                </button>
                <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-gray-400 hover:bg-white/5 hover:text-white transition-colors font-medium">
                    <span className="material-symbols-outlined text-[20px]">style</span>
                    Карты / Лут
                </button>
                <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-gray-400 hover:bg-white/5 hover:text-white transition-colors font-medium">
                    <span className="material-symbols-outlined text-[20px]">rate_review</span>
                    Рецензии
                </button>
                <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-gray-400 hover:bg-white/5 hover:text-white transition-colors font-medium">
                    <span className="material-symbols-outlined text-[20px]">forum</span>
                    Обсуждение
                </button>
            </nav>
        </aside>
    );

    // --- RIGHT SIDEBAR (Widgets) ---
    const MangaRightSidebar = (
        <aside className="hidden lg:block w-80 shrink-0 space-y-6 sticky top-24 self-start h-[calc(100vh-6rem)] overflow-y-auto no-scrollbar pb-10 pr-0">
            {/* GUILD TERRITORY WIDGET */}
            <div className="bg-[#121217] border border-white/5 rounded-2xl overflow-hidden shadow-lg p-0">
                <div className="p-4 border-b border-white/5 bg-[#1C1C22]/30 flex items-center justify-between">
                    <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                        <span className="material-symbols-outlined text-yellow-500 text-lg">flag</span>
                        Территория
                    </h3>
                    {territory && <span className="text-[10px] text-gray-500 font-bold uppercase">Захвачена</span>}
                </div>

                {territory ? (
                    <div className="p-4">
                        <Link href={`/guilds/${territory.guild_id}`} className="block group">
                            {/* Guild Banner Mock */}
                            <div className="h-24 rounded-xl bg-gray-800 relative overflow-hidden mb-3 border border-white/10 group-hover:border-primary/50 transition-colors">
                                {/* Use generic gradient if no banner, or mock one */}
                                <div className="absolute inset-0 bg-gradient-to-br from-purple-900 via-gray-900 to-black"></div>
                                <div className="absolute inset-0 flex items-center justify-center">
                                    {territory.guild_avatar ? (
                                        <img src={territory.guild_avatar} className="w-12 h-12 rounded-lg border-2 border-[#121217] shadow-lg" />
                                    ) : (
                                        <div className="w-12 h-12 rounded-lg bg-[#121217] flex items-center justify-center text-xl font-black text-white border-2 border-white/10">
                                            {territory.guild_tag[0]}
                                        </div>
                                    )}
                                </div>
                                <div className="absolute bottom-2 right-2 text-[10px] font-bold bg-black/50 backdrop-blur px-1.5 rounded text-white">
                                    LVL {territory.guild_level}
                                </div>
                            </div>

                            <div className="flex items-center justify-between mb-2">
                                <div className="font-bold text-white group-hover:text-primary transition-colors">{territory.guild_name}</div>
                                <div className="text-xs font-bold text-gray-500">[{territory.guild_tag}]</div>
                            </div>

                            <div className="space-y-1">
                                <div className="flex justify-between text-[10px] text-gray-400 font-bold uppercase">
                                    <span>Влияние</span>
                                    <span>{territory.influence}%</span>
                                </div>
                                <div className="h-1.5 w-full bg-[#1C1C22] rounded-full overflow-hidden">
                                    <div className="h-full bg-primary w-1/2 rounded-full"></div>
                                </div>
                            </div>
                        </Link>
                    </div>
                ) : (
                    <div className="p-6 text-center">
                        <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-3 text-gray-600">
                            <span className="material-symbols-outlined text-2xl">flag</span>
                        </div>
                        <div className="text-sm font-bold text-gray-400 mb-1">Ничья земля</div>
                        <button className="text-[10px] font-bold text-primary hover:text-white uppercase tracking-wider">Захватить</button>
                    </div>
                )}
            </div>

            {/* MONARCH WIDGET (Mock) */}
            <div className="bg-[#121217] border border-white/5 rounded-2xl overflow-hidden shadow-lg">
                <div className="p-4 border-b border-white/5 bg-[#1C1C22]/30 bg-gradient-to-r from-yellow-500/10 to-transparent">
                    <h3 className="text-xs font-bold text-yellow-500 uppercase tracking-wider flex items-center gap-2">
                        <span className="material-symbols-outlined text-lg">crown</span>
                        Монарх Тайтла
                    </h3>
                </div>
                <div className="p-4 flex items-center gap-4">
                    <div className="relative w-12 h-12">
                        <div className="w-12 h-12 rounded-full bg-gray-700 overflow-hidden border-2 border-yellow-500 shadow-[0_0_15px_rgba(234,179,8,0.3)]">
                            <img src="https://lh3.googleusercontent.com/aida-public/AB6AXuD0Mrr9eDGmd6HeJl9S3PG1oiUyrBaU1rEIrXOFK7-hCcJx1hFIeK1bw54taXkw_tkE74_7YAkWZ2HLwBD6c5GbePIV--pUCsfJHMjGac3Y_2pJx5EKorUhc3d3_yZYsBlcVtEk8xw296LpcOUdp5dAjLs44VoYKS_sB5pgOG5yBY_Paue93TJe8a_qXnw_x0EsXus7l2xGQLrzKobhnTdaQPbfrymzmaGP7AsfFuDWtg2Pk7rMbzJBZIH1FKZdp3deOeG8O1786-o" className="w-full h-full object-cover" />
                        </div>
                        <div className="absolute -top-1 -right-1 text-lg">👑</div>
                    </div>
                    <div>
                        <div className="font-bold text-white text-sm">ShadowMaster</div>
                        <div className="text-[10px] text-gray-500 font-bold uppercase">Топ-1 Вкладчик</div>
                        <div className="text-xs font-bold text-yellow-500 mt-0.5">1.5M Coins</div>
                    </div>
                </div>
            </div>

            {/* Translators Section */}
            <div className="bg-[#121217] border border-white/5 rounded-2xl overflow-hidden shadow-lg">
                <div className="p-4 border-b border-white/5 bg-[#1C1C22]/30">
                    <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                        <span className="material-symbols-outlined text-purple-400 text-lg">translate</span>
                        Переводчики
                    </h3>
                </div>
                <div className="p-4 space-y-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center text-white font-bold text-xs ring-2 ring-white/5 shadow-lg">
                            RS
                        </div>
                        <div className="flex-1">
                            <h4 className="text-sm font-bold text-white">Reaper Scans</h4>
                            <p className="text-[10px] text-gray-400">Переводят с 1 главы</p>
                        </div>
                        <button className="w-8 h-8 rounded-full bg-white/5 hover:bg-primary/20 text-gray-400 hover:text-primary flex items-center justify-center transition-all">
                            <span className="material-symbols-outlined text-[18px]">group_add</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Similar Section */}
            <div className="bg-[#121217] border border-white/5 rounded-2xl overflow-hidden shadow-lg">
                <div className="p-4 border-b border-white/5 bg-[#1C1C22]/30 flex items-center justify-between">
                    <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                        <span className="material-symbols-outlined text-blue-400 text-lg">auto_awesome</span>
                        Похожее
                    </h3>
                </div>
                <div className="p-2 space-y-1">
                    {(similarMangas || []).map((m: any) => (
                        <Link href={`/manga/${m.slug}`} key={m.id} className="flex gap-3 p-2 rounded-xl hover:bg-white/5 transition-colors cursor-pointer group">
                            <div className="w-11 h-16 rounded bg-gray-700 shrink-0 border border-white/5 shadow-sm overflow-hidden">
                                {m.cover_url ? <img src={m.cover_url} alt={m.title} className="w-full h-full object-cover" /> : <div className="w-full h-full bg-gray-800" />}
                            </div>
                            <div className="min-w-0 flex-1 flex flex-col justify-center">
                                <h4 className="text-xs font-bold text-gray-200 truncate group-hover:text-primary transition-colors mb-1.5">
                                    {m.title}
                                </h4>
                                <div className="flex items-center gap-1 text-[10px] text-yellow-500 font-bold">
                                    <span className="material-symbols-outlined text-[12px] filled">star</span> {m.rating}
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
                <div className="px-4 pb-3 pt-1 text-center">
                    <Link href="/catalog" className="text-[10px] font-bold text-gray-500 hover:text-white uppercase tracking-wider transition-colors">Показать еще</Link>
                </div>
            </div>

            {/* Footer included in sidebar */}
            <div className="flex flex-wrap gap-x-4 gap-y-2 px-2 pb-4 pt-2 opacity-50">
                <span className="text-[10px] text-gray-700 w-full mt-2">© 2024 Yamiko Project</span>
            </div>
        </aside>
    );

    return (
        <PageLayout rightSidebar={MangaRightSidebar}>
            {/* MAIN CONTENT CENTER COLUMN */}
            <div className="relative w-full mb-8">
                {/* Hero Background Effect */}
                <div className="absolute inset-x-0 -top-6 h-[500px] overflow-hidden rounded-b-[3rem] pointer-events-none z-0">
                    <div
                        className="w-full h-full bg-cover bg-top opacity-30 blur-3xl scale-110 transition-all duration-700"
                        style={{ backgroundImage: `url(${manga.coverImage})` }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0B0B0E] via-[#0B0B0E]/80 to-transparent" />
                    {/* Horizontal gradient to fade edges */}
                    <div className="absolute inset-0 bg-gradient-to-r from-[#0B0B0E] via-transparent to-[#0B0B0E]" />
                </div>

                <div className="relative z-10 pt-4 pb-8 flex flex-col md:flex-row gap-8 items-start">
                    {/* Left Column (Cover & Buttons) */}
                    <div className="w-full md:w-[240px] shrink-0 flex flex-col gap-4">
                        <div className="aspect-[2/3] rounded-xl overflow-hidden shadow-2xl ring-1 ring-white/10 relative group bg-[#121217] w-[240px]">
                            <Image
                                src={manga.coverImage}
                                alt={manga.title}
                                fill
                                className="object-cover group-hover:scale-105 transition-transform duration-500"
                            />
                            <div className="absolute top-2 left-2 flex gap-2">
                                <span className="px-2.5 py-1 bg-red-600/90 backdrop-blur-sm text-white text-[10px] font-bold uppercase rounded shadow-glow-red tracking-wider border border-white/10">
                                    {statusMap[manga.status] || 'Выходит'}
                                </span>
                            </div>
                        </div>

                        <div className="flex items-center gap-2 w-[240px]">
                            {firstChapterId ? (
                                <Link
                                    href={`/reader/${firstChapterId}`}
                                    className="flex-1 h-11 bg-primary hover:bg-primaryHover text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-primary/20 group hover:shadow-primary/40 text-sm uppercase tracking-wide"
                                >
                                    <span className="material-symbols-outlined text-xl">menu_book</span>
                                    <span>Читать</span>
                                </Link>
                            ) : (
                                <button disabled className="flex-1 h-11 bg-gray-600 text-white/50 font-bold rounded-xl flex items-center justify-center gap-2 cursor-not-allowed text-sm uppercase tracking-wide">
                                    <span className="material-symbols-outlined text-xl">block</span>
                                    <span>Нет глав</span>
                                </button>
                            )}
                            <BookmarkButton
                                mangaId={manga.id}
                                mangaTitle={manga.title}
                                initialIsBookmarked={isBookmarked}
                                initialStatus={libraryEntry?.status || null}
                            />
                        </div>
                    </div>

                    {/* Right Column (Info) */}
                    <div className="flex-1 flex flex-col pt-2 min-w-0">
                        <div className="mb-5 space-y-3">
                            <h1 className="text-3xl lg:text-5xl font-black text-white leading-tight tracking-tight drop-shadow-xl w-full">
                                {manga.title}
                            </h1>
                            {/* Alternative Titles could go here if available */}
                            <div className="flex flex-col gap-1.5 opacity-90">
                                <div className="flex items-center gap-2 text-sm text-gray-300">
                                    <span className="w-5 h-5 rounded flex items-center justify-center bg-white/10 text-[9px] font-bold shrink-0 border border-white/5 uppercase">EN</span>
                                    <span className="truncate font-medium">{manga.slug.replace(/-/g, ' ')}</span>
                                </div>
                            </div>
                        </div>

                        {/* Metadata Bar */}
                        <div className="flex flex-wrap items-center gap-y-3 gap-x-6 mb-7">
                            {/* Author/Artist info could go here */}
                            <div className="text-sm font-medium text-gray-400">
                                Автор: <span className="text-white">Author Name</span>
                            </div>

                            <div className="flex items-center gap-2 text-yellow-400">
                                <span className="material-symbols-outlined filled text-[18px]">star</span>
                                <b className="text-white text-base">{manga.rating.toFixed(1)}</b>
                                <span className="text-xs text-gray-500">(12.5k)</span>
                            </div>

                            <div className="flex items-center gap-4 text-xs font-bold text-gray-400 uppercase tracking-wider">
                                <span>{manga.releaseYear || '2024'}</span>
                                <div className="w-1 h-1 bg-gray-600 rounded-full"></div>
                                <span>Манхва</span>
                                <div className="w-1 h-1 bg-gray-600 rounded-full"></div>
                                <span>16+</span>
                            </div>
                        </div>

                        {/* Genres */}
                        <div className="flex flex-wrap gap-2 mb-8 items-center max-w-4xl">
                            {manga.genres.map((genreRelation: any) => (
                                <Link
                                    key={genreRelation.genre.id}
                                    href={`/catalog?genre=${genreRelation.genre.slug}`}
                                    className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-gray-300 hover:text-white text-[10px] font-bold uppercase tracking-wide hover:bg-primary/20 hover:border-primary/30 transition-all cursor-pointer"
                                >
                                    {genreRelation.genre.name}
                                </Link>
                            ))}
                        </div>

                        {/* Stats Row */}
                        <div className="flex items-center gap-8 border-t border-white/5 py-4">
                            <div>
                                <div className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-0.5">Просмотров</div>
                                <div className="text-lg font-black text-white">{manga.views >= 1000000 ? `${(manga.views / 1000000).toFixed(1)}M` : manga.views >= 1000 ? `${(manga.views / 1000).toFixed(1)}K` : manga.views}</div>
                            </div>
                            <div>
                                <div className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-0.5">В закладках</div>
                                <div className="text-lg font-black text-white">{manga.bookmarkCount || 0}</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Description Tab Content replaced by MangaContent client component */}
            <MangaContent manga={manga} />
        </PageLayout>
    );
}
