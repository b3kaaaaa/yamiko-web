import Link from "next/link";

interface Manga {
    id: string;
    title: string;
    cover_url?: string | null;
    rating?: number;
    status?: string;
    type?: string;
    slug?: string;
    genres?: any[];
}

interface HotNewReleasesProps {
    mangas: Manga[];
}

export default function HotNewReleases({ mangas = [] }: HotNewReleasesProps) {
    // If no mangas, show nothing or skeleton. For now, graceful fallback.
    // However, if empty, we might want to hide the whole section or show specific empty state.
    if (!mangas || mangas.length === 0) return null;

    return (
        <section>
            <div className="flex items-center justify-between mb-6 pl-1">
                <div className="flex items-center gap-4">
                    <div className="w-1.5 h-8 bg-red-500 rounded-full shadow-[0_0_15px_rgba(239,68,68,0.8)]" />
                    <h2 className="text-2xl font-bold text-white tracking-wide">
                        Горячие новинки
                    </h2>
                </div>
                <Link href="/catalog?sort=created_at" className="text-xs font-bold text-gray-400 hover:text-white uppercase tracking-wider flex items-center gap-1 group">
                    Смотреть все
                    <span className="material-symbols-outlined text-[16px] group-hover:translate-x-1 transition-transform">arrow_forward</span>
                </Link>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
                {mangas.map((manga) => (
                    <Link href={`/manga/${manga.slug}`} key={manga.id} className="group relative flex flex-col gap-2 cursor-pointer">
                        <div className="aspect-[2/3] w-full rounded-xl overflow-hidden relative border border-white/5 group-hover:border-primary/50 transition-all shadow-md group-hover:shadow-primary/10">
                            {/* Image */}
                            {manga.cover_url ? (
                                <img
                                    src={manga.cover_url}
                                    alt={manga.title}
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                />
                            ) : (
                                <div className="absolute inset-0 bg-gray-800 flex items-center justify-center">
                                    <span className="material-symbols-outlined text-gray-600 text-4xl">image</span>
                                </div>
                            )}

                            {/* Badge */}
                            <div className="absolute top-2 left-2 bg-primary/90 backdrop-blur-sm text-white text-[10px] font-bold px-2 py-1 rounded shadow-lg">
                                NEW
                            </div>

                            {/* Rating */}
                            <div className="absolute bottom-2 left-2 flex items-center gap-1 bg-black/60 backdrop-blur-sm px-1.5 py-0.5 rounded text-yellow-400">
                                <span className="material-symbols-outlined text-[12px] filled">star</span>
                                <span className="text-[10px] font-bold text-white">{manga.rating || '0.0'}</span>
                            </div>
                        </div>
                        <div className="px-1 space-y-1">
                            <h3 className="text-[14px] font-bold text-white leading-tight group-hover:text-primary transition-colors line-clamp-1">
                                {manga.title}
                            </h3>
                            <p className="text-[11px] text-gray-400 line-clamp-1 group-hover:text-gray-300">
                                {/* Genre placeholder if not joined yet */}
                                Манга
                            </p>
                        </div>
                    </Link>
                ))}
            </div>
        </section>
    );
}
