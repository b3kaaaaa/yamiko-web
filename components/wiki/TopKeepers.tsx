import Link from 'next/link';
import { TopKeeper } from '@/types/wiki';

export default function TopKeepers({ keepers = [] }: { keepers: TopKeeper[] }) {
    return (
        <div className="py-2">
            {/* Header matches RightSidebar */}
            <div className="flex items-center justify-between mb-4 px-1">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <span className="material-symbols-outlined text-yellow-400 text-xl">military_tech</span>
                    Топ хранителей
                </h3>
                <Link href="/fandom/users" className="text-[10px] text-gray-500 cursor-pointer hover:text-white uppercase font-bold tracking-wider transition-colors">
                    Все
                </Link>
            </div>

            <div className="space-y-2">
                {keepers.map((keeper, index) => (
                    <Link
                        href={`/profile/${keeper.display_id}`}
                        key={keeper.id}
                        className="flex items-center gap-3 p-2 hover:bg-white/5 rounded-xl transition-colors cursor-pointer group border-b border-white/5 pb-3 last:border-0 relative"
                    >
                        <div className="relative shrink-0">
                            <div className={`w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold ring-2 overflow-hidden ${index === 0 ? 'ring-yellow-500/50 shadow-[0_0_10px_rgba(234,179,8,0.2)]' : 'ring-gray-500/30'}`}>
                                {keeper.avatar_url ? (
                                    <img src={keeper.avatar_url} alt={keeper.username} className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full bg-surface-highlight-dark flex items-center justify-center">
                                        {keeper.username.substring(0, 2).toUpperCase()}
                                    </div>
                                )}
                            </div>
                            <div className="absolute -top-1 -right-1 w-4 h-4 bg-surface-dark rounded-full flex items-center justify-center border border-surface-dark">
                                <span className={`text-[9px] font-bold ${index === 0 ? 'text-yellow-400' : index === 1 ? 'text-gray-400' : index === 2 ? 'text-orange-700' : 'text-gray-600'}`}>
                                    {index + 1}
                                </span>
                            </div>
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-center mb-0.5">
                                <span className="text-sm font-bold text-white truncate group-hover:text-primary transition-colors">{keeper.username}</span>
                                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${index === 0 ? 'text-primary bg-primary/10' : 'text-gray-400 bg-white/5'}`}>
                                    {new Intl.NumberFormat('en-US', { notation: "compact", maximumFractionDigits: 1 }).format(keeper.approved_edits_count)}
                                </span>
                            </div>
                            <div className="text-[10px] text-gray-500 truncate font-medium">
                                {index === 0 ? 'Главный редактор' : 'Хранитель знаний'} • {keeper.approved_edits_count} правки
                            </div>
                        </div>
                    </Link>
                ))}

                {keepers.length === 0 && (
                    <div className="p-4 text-center text-gray-500 text-xs">Пока нет данных</div>
                )}
            </div>

            {/* Separator from RightSidebar */}
            <div className="w-full h-px bg-white/5 mt-6"></div>
        </div>
    );
}
