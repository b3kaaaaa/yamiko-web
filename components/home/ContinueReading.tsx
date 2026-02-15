
export default function ContinueReading() {
    return (
        <div>
            <div className="flex items-center justify-between mb-6 px-1">
                <div className="flex items-center gap-4">
                    <div className="w-1.5 h-6 bg-primary rounded-full shadow-[0_0_15px_rgba(168,85,247,0.8)]" />
                    <h3 className="text-lg font-bold text-white tracking-wide">
                        Продолжить читать
                    </h3>
                </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Card 1 */}
                <div className="flex items-center gap-3 p-3 rounded-xl bg-surface-dark border border-white/5 hover:border-primary/30 transition-all cursor-pointer group">
                    <div className="w-12 h-16 gray-placeholder rounded-md overflow-hidden shrink-0 relative">
                        <div className="absolute inset-0 bg-primary/20 hidden group-hover:block transition-all"></div>
                    </div>
                    <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-bold text-gray-200 truncate group-hover:text-primary transition-colors">
                            Магия возвращенца...
                        </h4>
                        <div className="flex items-center justify-between mt-1">
                            <span className="text-[11px] text-gray-500">Гл. 248</span>
                            <div className="w-20 h-1.5 bg-white/5 rounded-full overflow-hidden shadow-inner">
                                <div className="h-full bg-primary w-[70%] shadow-[0_0_10px_#A855F7] rounded-full"></div>
                            </div>
                        </div>
                    </div>
                    <button className="p-1.5 rounded-full hover:bg-white/10 text-gray-400 hover:text-white transition-colors">
                        <span className="material-symbols-outlined text-lg">play_arrow</span>
                    </button>
                </div>

                {/* Card 2 */}
                <div className="flex items-center gap-3 p-3 rounded-xl bg-surface-dark border border-white/5 hover:border-primary/30 transition-all cursor-pointer group">
                    <div className="w-12 h-16 gray-placeholder rounded-md overflow-hidden shrink-0 relative">
                        <div className="absolute inset-0 bg-primary/20 hidden group-hover:block transition-all"></div>
                    </div>
                    <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-bold text-gray-200 truncate group-hover:text-primary transition-colors">
                            Начало после конца
                        </h4>
                        <div className="flex items-center justify-between mt-1">
                            <span className="text-[11px] text-gray-500">Гл. 175</span>
                            <div className="w-20 h-1.5 bg-white/5 rounded-full overflow-hidden shadow-inner">
                                <div className="h-full bg-primary w-[30%] shadow-[0_0_10px_#A855F7] rounded-full"></div>
                            </div>
                        </div>
                    </div>
                    <button className="p-1.5 rounded-full hover:bg-white/10 text-gray-400 hover:text-white transition-colors">
                        <span className="material-symbols-outlined text-lg">play_arrow</span>
                    </button>
                </div>

                {/* Card 3 */}
                <div className="flex items-center gap-3 p-3 rounded-xl bg-surface-dark border border-white/5 hover:border-primary/30 transition-all cursor-pointer group hidden lg:flex">
                    <div className="w-12 h-16 gray-placeholder rounded-md overflow-hidden shrink-0 relative">
                        <div className="absolute inset-0 bg-primary/20 hidden group-hover:block transition-all"></div>
                    </div>
                    <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-bold text-gray-200 truncate group-hover:text-primary transition-colors">
                            Реинкарнация безработного
                        </h4>
                        <div className="flex items-center justify-between mt-1">
                            <span className="text-[11px] text-gray-500">Том 15</span>
                            <div className="w-20 h-1.5 bg-white/5 rounded-full overflow-hidden shadow-inner">
                                <div className="h-full bg-primary w-[90%] shadow-[0_0_10px_#A855F7] rounded-full"></div>
                            </div>
                        </div>
                    </div>
                    <button className="p-1.5 rounded-full hover:bg-white/10 text-gray-400 hover:text-white transition-colors">
                        <span className="material-symbols-outlined text-lg">play_arrow</span>
                    </button>
                </div>
            </div>
        </div>
    );
}
