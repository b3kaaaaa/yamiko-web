import Link from 'next/link';

interface Manga {
    id: string;
    title: string;
    slug: string;
    cover_url: string;
    rating: number;
    status: string;
    type: string;
    trend_score: number;
    views_7_days: number;
    genres: string[];
}

interface MangaGridProps {
    mangaList: Manga[];
    loading: boolean;
}

export function MangaGrid({ mangaList, loading }: MangaGridProps) {
    if (loading && mangaList.length === 0) {
        return <MangaGridSkeleton />;
    }

    if (mangaList.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-20 text-gray-500">
                <span className="material-symbols-outlined text-6xl mb-4 opacity-20">search_off</span>
                <p>Ничего не найдено</p>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
            {mangaList.map((manga, index) => (
                <MangaCard key={`${manga.id}-${index}`} manga={manga} index={index} />
            ))}
        </div>
    );
}

function MangaCard({ manga, index }: { manga: Manga; index: number }) {
    // Determine badge based on index/score
    const isTop3 = index < 3;
    const isTrending = manga.trend_score > 1000; // Arbitrary threshold for visual

    return (
        <div className="group relative flex flex-col gap-2">
            <Link href={`/manga/${manga.slug}`}>
                <div className="relative aspect-[3/4.5] rounded-xl overflow-hidden cursor-pointer bg-surface-dark transition-all duration-300 transform group-hover:scale-105 group-hover:shadow-[0_0_20px_rgba(124,58,237,0.3)]">

                    {/* Subtle Gradient Border */}
                    <div className="absolute inset-0 rounded-xl p-[1px] bg-gradient-to-br from-white/10 to-transparent pointer-events-none">
                        <div className="w-full h-full bg-surface-dark rounded-xl"></div>
                    </div>

                    {/* Cover Image */}
                    <img
                        src={manga.cover_url || '/placeholder.jpg'}
                        alt={manga.title}
                        className="absolute inset-0 w-full h-full object-cover rounded-xl transition-transform duration-500"
                        loading="lazy"
                    />

                    {/* Gradient Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent opacity-60 group-hover:opacity-40 transition-opacity rounded-xl"></div>

                    {/* Badges */}
                    <div className="absolute top-3 left-3 flex flex-col gap-2">
                        {isTop3 && (
                            <div className={`
                text-white text-[10px] font-black uppercase px-2 py-1 rounded shadow-lg flex items-center gap-1
                ${index === 0 ? 'bg-yellow-500' : index === 1 ? 'bg-gray-400' : 'bg-orange-700'}
              `}>
                                <span className="material-symbols-outlined text-[12px]">emoji_events</span>
                                #{index + 1}
                            </div>
                        )}

                        {!isTop3 && isTrending && (
                            <div className="bg-red-500 text-white text-[10px] font-black uppercase px-2 py-1 rounded shadow-lg flex items-center gap-1">
                                <span className="material-symbols-outlined text-[12px]">local_fire_department</span>
                                Trending
                            </div>
                        )}
                    </div>

                    {/* Bookmark Button (Placeholder functionality) */}
                    <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                            className="w-8 h-8 rounded-full bg-black/40 backdrop-blur-md text-white flex items-center justify-center hover:bg-primary hover:text-white transition-colors"
                            onClick={(e) => {
                                e.preventDefault();
                                // TODO: Implement bookmark logic
                            }}
                        >
                            <span className="material-symbols-outlined text-[18px]">bookmark_add</span>
                        </button>
                    </div>

                    {/* Rating Badge */}
                    <div className="absolute bottom-3 right-3 bg-black/60 backdrop-blur-md px-2 py-1 rounded-lg border border-white/10 flex items-center gap-1">
                        <span className="material-symbols-outlined text-yellow-400 text-[16px] fill-current">star</span>
                        <span className="text-xs font-bold text-white">{manga.rating?.toFixed(1) || '0.0'}</span>
                    </div>
                </div>
            </Link>

            {/* Info */}
            <div className="mt-1">
                <Link href={`/manga/${manga.slug}`}>
                    <h3 className="text-base font-bold text-white leading-tight group-hover:text-primary transition-colors line-clamp-1" title={manga.title}>
                        {manga.title}
                    </h3>
                </Link>
                <div className="flex items-center gap-2 mt-1 text-[11px] text-gray-400 font-medium">
                    <span className="text-primary">{manga.type}</span>
                    <span className="w-1 h-1 rounded-full bg-gray-600"></span>
                    <span className="line-clamp-1">
                        {manga.genres?.slice(0, 2).join(', ') || 'N/A'}
                    </span>
                </div>
            </div>
        </div>
    );
}

function MangaGridSkeleton() {
    return (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
            {[...Array(12)].map((_, i) => (
                <div key={i} className="flex flex-col gap-2">
                    <div className="aspect-[3/4.5] rounded-xl bg-white/5 animate-pulse"></div>
                    <div className="h-4 bg-white/5 rounded w-3/4 animate-pulse"></div>
                    <div className="h-3 bg-white/5 rounded w-1/2 animate-pulse"></div>
                </div>
            ))}
        </div>
    );
}
