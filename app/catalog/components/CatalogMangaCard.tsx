"use client";

import Link from "next/link";
import Image from "next/image";

interface CatalogMangaCardProps {
    manga: {
        id: string;
        title: string;
        cover_url: string | null;
        rating: number;
        type: string;
        status: string;
    };
}

export default function CatalogMangaCard({ manga }: CatalogMangaCardProps) {
    return (
        <div className="group relative flex flex-col gap-3">
            <Link href={`/manga/${manga.id}`}>
                <div className="relative aspect-[3/4.5] rounded-xl overflow-hidden cursor-pointer shadow-lg hover:shadow-primary/20 ring-1 ring-white/5 group-hover:ring-primary/50 transition-all duration-300 transform group-hover:-translate-y-1">
                    <div className="absolute inset-0 gray-placeholder bg-zinc-800"></div>

                    {/* Cover Image */}
                    {manga.cover_url ? (
                        <Image
                            src={manga.cover_url}
                            alt={manga.title}
                            fill
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                    ) : (
                        <div className="absolute inset-0 flex items-center justify-center bg-gray-800">
                            <span className="material-symbols-outlined text-4xl text-gray-600">image</span>
                        </div>
                    )}

                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/10 to-transparent opacity-60 group-hover:opacity-40 transition-opacity"></div>

                    {/* Badges - Example logic, real logic would check metrics */}
                    {manga.rating >= 4.8 && (
                        <div className="absolute top-3 left-3 flex flex-col gap-2 z-10">
                            <div className="bg-red-500/90 backdrop-blur-sm text-white text-[10px] font-black uppercase px-2 py-1 rounded shadow-lg flex items-center gap-1">
                                <span className="material-symbols-outlined text-[12px]">local_fire_department</span> Trending
                            </div>
                        </div>
                    )}

                    {/* Bookmark Button (Visible on Hover) */}
                    <div className="absolute top-3 right-3 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                        <button className="w-8 h-8 rounded-full bg-black/60 backdrop-blur-md text-white flex items-center justify-center hover:bg-primary hover:text-white transition-colors" onClick={(e) => { e.preventDefault(); /* Add bookmark logic */ }}>
                            <span className="material-symbols-outlined text-[18px]">bookmark_add</span>
                        </button>
                    </div>

                    {/* Rating Badge */}
                    <div className="absolute bottom-3 right-3 bg-black/60 backdrop-blur-md px-2 py-1 rounded-lg ring-1 ring-white/10 flex items-center gap-1 z-10">
                        <span className="material-symbols-outlined text-yellow-400 text-[16px] fill-current">star</span>
                        <span className="text-xs font-bold text-white">{manga.rating?.toFixed(1) || "0.0"}</span>
                    </div>
                </div>
            </Link>

            <div className="mt-1">
                <Link href={`/manga/${manga.id}`}>
                    <h3 className="text-base font-bold text-white leading-tight group-hover:text-primary transition-colors line-clamp-1" title={manga.title}>
                        {manga.title}
                    </h3>
                </Link>
                <div className="flex items-center gap-2 mt-1.5 text-xs text-text-muted-dark font-medium">
                    <span className="text-primary font-semibold">
                        {manga.type === 'MANHWA' ? 'Манхва' : manga.type === 'MANHUA' ? 'Маньхуа' : 'Манга'}
                    </span>
                    {/* Optional: Add latest chapter or status */}
                </div>
            </div>
        </div>
    );
}
