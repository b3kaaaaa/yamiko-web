import Link from "next/link";
import Image from "next/image";

interface RightSidebarProps {
    popular?: any[];
    activeUsers?: any[];
    children?: React.ReactNode;
}

export default function RightSidebar({ popular = [], activeUsers = [], children }: RightSidebarProps) {
    return (
        <aside className="hidden lg:block w-72 shrink-0 space-y-6 sticky top-24 self-start h-[calc(100vh-6rem)] overflow-y-auto no-scrollbar pb-10">
            {children}

            {children && <div className="w-full h-px bg-white/5"></div>}


            <div className="py-2">
                <div className="flex items-center justify-between mb-4 px-1">
                    <h3 className="text-base font-bold text-white flex items-center gap-2">
                        <span className="material-symbols-outlined text-primary text-xl">
                            local_fire_department
                        </span>
                        Популярное сегодня
                    </h3>
                    <Link href="/catalog?sort=popularity" className="text-[10px] text-gray-500 cursor-pointer hover:text-white uppercase font-bold tracking-wider transition-colors">
                        Все
                    </Link>
                </div>
                <div className="space-y-2">
                    {popular.map((manga, index) => (
                        <Link href={`/manga/${manga.slug}`} key={manga.id} className="flex items-center gap-4 p-2 rounded-xl hover:bg-white/5 transition-colors cursor-pointer group border-b border-white/5 pb-3 last:border-0">
                            <div className="text-2xl font-black text-white/10 w-6 text-center group-hover:text-primary/40 transition-colors italic">
                                {index + 1}
                            </div>
                            <div className="w-12 h-16 bg-surface-dark rounded-lg shrink-0 shadow-lg border border-white/5 overflow-hidden relative">
                                {manga.cover_url ? (
                                    <img src={manga.cover_url} alt={manga.title} className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full bg-gray-800" />
                                )}
                            </div>
                            <div className="min-w-0 flex-1">
                                <h4 className="text-sm font-bold text-gray-200 truncate group-hover:text-primary transition-colors mb-1">
                                    {manga.title}
                                </h4>
                                <div className="flex items-center gap-3 text-[10px] text-gray-500 font-medium">
                                    <span className="flex items-center gap-1">
                                        <span className="material-symbols-outlined text-[12px]">
                                            visibility
                                        </span>{" "}
                                        {manga.views >= 1000000 ? `${(manga.views / 1000000).toFixed(1)}m` : manga.views >= 1000 ? `${(manga.views / 1000).toFixed(1)}k` : manga.views}
                                    </span>
                                    <span className="flex items-center gap-1 text-pink-500">
                                        <span className="material-symbols-outlined text-[12px] fill-current">
                                            favorite
                                        </span>{" "}
                                        {Math.floor(manga.rating * 100)}
                                    </span>
                                </div>
                            </div>
                        </Link>
                    ))}
                    {popular.length === 0 && (
                        <div className="p-4 text-center text-gray-500 text-xs text-text-muted">Пока нет данных</div>
                    )}
                </div>
            </div>

            <div className="w-full h-px bg-white/5"></div>

            <div className="py-2">
                <div className="flex items-center justify-between mb-4 px-1">
                    <h3 className="text-base font-bold text-white flex items-center gap-2">
                        <span className="material-symbols-outlined text-green-400 text-xl">
                            trending_up
                        </span>
                        Активные за неделю
                    </h3>
                </div>
                <div className="max-h-[500px] overflow-y-auto no-scrollbar space-y-2">
                    {activeUsers.map((user, index) => (
                        <Link href={`/profile/${user.display_id || 1}`} key={user.id} className="flex items-center gap-3 p-2 hover:bg-white/5 transition-colors group relative cursor-pointer rounded-lg border-b border-white/5 pb-3 last:border-0">
                            <div className="w-9 h-9 rounded-full bg-gray-700 overflow-hidden ring-2 ring-primary/30 shrink-0 relative">
                                {user.avatar_url ? (
                                    <img
                                        alt={user.username}
                                        className="w-full h-full object-cover"
                                        src={user.avatar_url}
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-[10px] font-bold text-white bg-primary/50">
                                        {user.username?.[0]?.toUpperCase() || 'U'}
                                    </div>
                                )}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex justify-between items-center mb-0.5">
                                    <span className="text-xs font-bold text-white group-hover:text-primary transition-colors">
                                        {user.username || 'User'}
                                    </span>
                                    <span className="text-[9px] text-primary bg-primary/10 px-1.5 py-0.5 rounded font-bold">
                                        #{index + 1}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-[10px] text-gray-500">Ур. {user.level || 1}</span>
                                    <span className="text-[10px] text-white font-bold">{user.exp || 0} exp</span>
                                </div>
                            </div>
                        </Link>
                    ))}
                    {activeUsers.length === 0 && (
                        <div className="p-4 text-center text-gray-500 text-xs text-text-muted">Пока нет данных</div>
                    )}
                </div>
            </div>

            <div className="flex flex-wrap gap-x-4 gap-y-2 px-2 pb-4 pt-4 border-t border-white/5">
                <Link className="text-[10px] font-medium text-gray-600 hover:text-gray-400" href="#">О нас</Link>
                <Link className="text-[10px] font-medium text-gray-600 hover:text-gray-400" href="#">Приватность</Link>
                <Link className="text-[10px] font-medium text-gray-600 hover:text-gray-400" href="#">Условия</Link>
                <Link className="text-[10px] font-medium text-gray-600 hover:text-gray-400" href="#">DMCA</Link>
                <span className="text-[10px] text-gray-700 w-full mt-2">© 2024 Yamiko Project</span>
            </div>
        </aside>
    );
}
