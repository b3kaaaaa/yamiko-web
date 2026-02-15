import Link from 'next/link';
import { PopularWorld } from '@/types/wiki';

export default function WikiCard({ world }: { world: PopularWorld }) {
    if (!world) return null;

    return (
        <div className="group relative flex flex-col gap-3 cursor-pointer">
            {/* Card Container with Rounded Corners */}
            <div className="aspect-[16/9] w-full rounded-2xl overflow-hidden relative border border-white/5 group-hover:border-primary/50 transition-all shadow-lg group-hover:shadow-primary/10">
                <img
                    src={world.cover_url || "https://placehold.co/800x450"}
                    alt={world.title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />

                {/* Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent"></div>

                {/* Content Overlay */}
                <div className="absolute bottom-4 left-5 right-5 flex flex-col gap-1">
                    <h3 className="text-2xl font-black text-white drop-shadow-lg leading-tight group-hover:text-primary transition-colors line-clamp-1">{world.title}</h3>
                    <p className="text-[10px] text-gray-300 font-bold uppercase tracking-[0.2em]">{world.slug}</p>
                </div>

                {/* Status Badge */}
                <div className="absolute top-4 right-4 flex items-center gap-1.5 bg-black/40 backdrop-blur-md px-2.5 py-1 rounded-full border border-white/10">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)] animate-pulse"></span>
                    <span className="text-[10px] font-bold text-white uppercase tracking-wider">Active</span>
                </div>
            </div>

            {/* Info Section */}
            <div className="px-1 flex flex-col flex-1">
                <div className="flex items-center gap-4 mb-3 text-[11px] text-gray-400 font-medium">
                    <span className="flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-[16px] text-primary">article</span>
                        <span className="text-gray-200">{world.entity_count || 0}</span> статей
                    </span>
                    <span className="flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-[16px] text-blue-400">visibility</span>
                        <span className="text-gray-200">{new Intl.NumberFormat('en-US', { notation: "compact", maximumFractionDigits: 1 }).format(world.views || 0)}</span> просмотров
                    </span>
                </div>

                <p className="text-gray-400 text-xs mb-5 line-clamp-2 leading-relaxed h-8">
                    Полная мультимедийная энциклопедия по миру &quot;{world.title}&quot;. Исследуйте лор, персонажей и теорию магии.
                </p>

                {/* Premium Button */}
                <Link
                    href={`/manga/${world.slug}/wiki`}
                    className="w-full py-3 rounded-xl bg-white/5 hover:bg-primary text-white text-xs font-black transition-all flex items-center justify-center gap-2 border border-white/10 hover:border-primary group-hover:shadow-lg group-hover:shadow-primary/20 uppercase tracking-widest"
                >
                    Исследовать Wiki <span className="material-symbols-outlined text-[18px]">explore</span>
                </Link>
            </div>
        </div>
    );
}
