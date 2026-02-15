import Link from "next/link";

export default function LatestUpdates() {
    return (
        <div>
            <div className="flex items-center justify-between mb-6 px-1">
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                    <span className="w-1.5 h-6 bg-primary rounded-full shadow-[0_0_10px_rgba(168,85,247,0.5)]"></span>
                    Свежие обновления
                </h3>
                <Link
                    className="text-xs font-bold text-primary hover:text-primaryHover transition-colors flex items-center gap-1 uppercase tracking-wider"
                    href="#"
                >
                    Показать все{" "}
                    <span className="material-symbols-outlined text-[14px]">
                        arrow_forward_ios
                    </span>
                </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Update 1 */}
                <div className="flex gap-4 p-4 rounded-xl bg-surface-dark border border-white/5 hover:border-primary/40 transition-all cursor-pointer group">
                    <div className="w-20 aspect-[3/4] rounded-lg gray-placeholder overflow-hidden shrink-0 relative shadow-lg">
                        <div className="absolute top-1 right-1 w-2 h-2 rounded-full bg-green-500 ring-2 ring-black"></div>
                    </div>
                    <div className="flex flex-col justify-between py-1 min-w-0 flex-1">
                        <div>
                            <h4 className="text-sm font-bold text-gray-100 mb-1 truncate group-hover:text-primary transition-colors">
                                Наномашины
                            </h4>
                            <p className="text-[10px] text-gray-500 uppercase font-medium">
                                Боевые искусства
                            </p>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="px-2 py-1 rounded bg-white/10 text-white text-[11px] font-bold">
                                Гл. 110
                            </span>
                            <span className="text-[10px] text-gray-500">15 мин назад</span>
                        </div>
                    </div>
                </div>
                {/* Update 2 */}
                <div className="flex gap-4 p-4 rounded-xl bg-surface-dark border border-white/5 hover:border-primary/40 transition-all cursor-pointer group">
                    <div className="w-20 aspect-[3/4] rounded-lg gray-placeholder overflow-hidden shrink-0 relative shadow-lg">
                        <div className="absolute top-1 right-1 w-2 h-2 rounded-full bg-green-500 ring-2 ring-black"></div>
                    </div>
                    <div className="flex flex-col justify-between py-1 min-w-0 flex-1">
                        <div>
                            <h4 className="text-sm font-bold text-gray-100 mb-1 truncate group-hover:text-primary transition-colors">
                                Жнец дрейфующей луны
                            </h4>
                            <p className="text-[10px] text-gray-500 uppercase font-medium">
                                Мурим • Экшен
                            </p>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="px-2 py-1 rounded bg-white/10 text-white text-[11px] font-bold">
                                Гл. 88
                            </span>
                            <span className="text-[10px] text-gray-500">1 час назад</span>
                        </div>
                    </div>
                </div>
                {/* Update 3 */}
                <div className="flex gap-4 p-4 rounded-xl bg-surface-dark border border-white/5 hover:border-primary/40 transition-all cursor-pointer group">
                    <div className="w-20 aspect-[3/4] rounded-lg gray-placeholder overflow-hidden shrink-0 relative shadow-lg"></div>
                    <div className="flex flex-col justify-between py-1 min-w-0 flex-1">
                        <div>
                            <h4 className="text-sm font-bold text-gray-100 mb-1 truncate group-hover:text-primary transition-colors">
                                Чертова Реинкарнация
                            </h4>
                            <p className="text-[10px] text-gray-500 uppercase font-medium">
                                Фэнтези
                            </p>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="px-2 py-1 rounded bg-white/10 text-white text-[11px] font-bold">
                                Гл. 42
                            </span>
                            <span className="text-[10px] text-gray-500">2 часа назад</span>
                        </div>
                    </div>
                </div>
                {/* Update 4 */}
                <div className="flex gap-4 p-4 rounded-xl bg-surface-dark border border-white/5 hover:border-primary/40 transition-all cursor-pointer group">
                    <div className="w-20 aspect-[3/4] rounded-lg gray-placeholder overflow-hidden shrink-0 relative shadow-lg"></div>
                    <div className="flex flex-col justify-between py-1 min-w-0 flex-1">
                        <div>
                            <h4 className="text-sm font-bold text-gray-100 mb-1 truncate group-hover:text-primary transition-colors">
                                Убийца Питер
                            </h4>
                            <p className="text-[10px] text-gray-500 uppercase font-medium">
                                Триллер
                            </p>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="px-2 py-1 rounded bg-white/10 text-white text-[11px] font-bold">
                                Гл. 15
                            </span>
                            <span className="text-[10px] text-gray-500">3 часа назад</span>
                        </div>
                    </div>
                </div>
                {/* Update 5 */}
                <div className="flex gap-4 p-4 rounded-xl bg-surface-dark border border-white/5 hover:border-primary/40 transition-all cursor-pointer group">
                    <div className="w-20 aspect-[3/4] rounded-lg gray-placeholder overflow-hidden shrink-0 relative shadow-lg"></div>
                    <div className="flex flex-col justify-between py-1 min-w-0 flex-1">
                        <div>
                            <h4 className="text-sm font-bold text-gray-100 mb-1 truncate group-hover:text-primary transition-colors">
                                Магия и Мускулы
                            </h4>
                            <p className="text-[10px] text-gray-500 uppercase font-medium">
                                Комедия
                            </p>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="px-2 py-1 rounded bg-white/10 text-white text-[11px] font-bold">
                                Гл. 201
                            </span>
                            <span className="text-[10px] text-gray-500">5 часов назад</span>
                        </div>
                    </div>
                </div>
                {/* Update 6 */}
                <div className="flex gap-4 p-4 rounded-xl bg-surface-dark border border-white/5 hover:border-primary/40 transition-all cursor-pointer group">
                    <div className="w-20 aspect-[3/4] rounded-lg gray-placeholder overflow-hidden shrink-0 relative shadow-lg"></div>
                    <div className="flex flex-col justify-between py-1 min-w-0 flex-1">
                        <div>
                            <h4 className="text-sm font-bold text-gray-100 mb-1 truncate group-hover:text-primary transition-colors">
                                Кайдзю №8
                            </h4>
                            <p className="text-[10px] text-gray-500 uppercase font-medium">
                                Сёнен • Экшен
                            </p>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="px-2 py-1 rounded bg-white/10 text-white text-[11px] font-bold">
                                Гл. 55
                            </span>
                            <span className="text-[10px] text-gray-500">6 часов назад</span>
                        </div>
                    </div>
                </div>
            </div>
            {/* Loading Spinner */}
            <div className="pt-8 pb-4 flex flex-col items-center justify-center gap-4 opacity-60">
                <div className="w-8 h-8 border-2 border-primary/20 border-t-primary rounded-full animate-spin"></div>
            </div>
        </div>
    );
}
