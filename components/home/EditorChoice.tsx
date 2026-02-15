export default function EditorChoice() {
    return (
        <div className="bg-surface-dark border border-white/5 rounded-2xl overflow-hidden flex flex-col sm:flex-row group cursor-pointer hover:border-primary/30 transition-colors shadow-2xl">
            <div className="w-full sm:w-56 h-64 sm:h-auto gray-placeholder shrink-0 relative">
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent"></div>
                <div className="absolute bottom-4 left-4 right-4">
                    <span className="px-2 py-1 bg-primary text-white text-[10px] font-bold rounded mb-2 inline-block shadow-[0_0_10px_rgba(168,85,247,0.4)]">
                        ВЫБОР РЕДАКЦИИ
                    </span>
                </div>
            </div>
            <div className="p-8 flex flex-col justify-between flex-1 relative overflow-hidden">
                <div className="absolute right-0 top-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
                <div>
                    <div className="flex justify-between items-start mb-4 relative z-10">
                        <h3 className="text-3xl font-black text-white mb-2 group-hover:text-primary transition-colors tracking-tight">
                            Мир после падения
                        </h3>
                        <button className="text-gray-500 hover:text-white p-2 hover:bg-white/10 rounded-full transition-all">
                            <span className="material-symbols-outlined">bookmark_add</span>
                        </button>
                    </div>
                    <div className="flex items-center gap-4 mb-6 relative z-10">
                        <span className="flex items-center text-yellow-500 text-sm gap-1 font-bold bg-yellow-500/10 px-2 py-0.5 rounded border border-yellow-500/20">
                            <span className="material-symbols-outlined text-[16px] fill-current">
                                star
                            </span>{" "}
                            4.8
                        </span>
                        <span className="text-xs text-gray-400 font-medium px-2 py-0.5 bg-white/5 rounded">
                            Экшен, Сверхъестественное
                        </span>
                        <span className="text-xs text-gray-400 font-medium px-2 py-0.5 bg-white/5 rounded">
                            Онгоинг
                        </span>
                    </div>
                    <p className="text-sm text-gray-400 line-clamp-3 mb-8 leading-relaxed relative z-10">
                        Люди были призваны в башню, чтобы стать &quot;Идущими&quot; и спасти
                        мир. Но мир уже был обречен. Новый взгляд на жанр восхождения на
                        башню, деконструирующий типичные тропы. Глубокий сюжет и
                        невероятный арт.
                    </p>
                </div>
                <div className="flex items-center justify-between mt-2 relative z-10">
                    <div className="flex -space-x-3">
                        <div className="w-10 h-10 rounded-full bg-zinc-800 border-2 border-surface-dark relative z-30"></div>
                        <div className="w-10 h-10 rounded-full bg-zinc-700 border-2 border-surface-dark relative z-20"></div>
                        <div className="w-10 h-10 rounded-full bg-zinc-600 border-2 border-surface-dark flex items-center justify-center text-[10px] text-white font-bold relative z-10">
                            +1.2k
                        </div>
                    </div>
                    <button className="text-sm font-bold text-white bg-white/10 hover:bg-white/20 px-8 py-3 rounded-full transition-all flex items-center gap-2 group/btn">
                        Начать читать{" "}
                        <span className="material-symbols-outlined text-[18px] group-hover/btn:translate-x-1 transition-transform">
                            arrow_forward
                        </span>
                    </button>
                </div>
            </div>
        </div>
    );
}
