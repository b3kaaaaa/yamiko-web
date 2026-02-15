export default function CuratedLists() {
    return (
        <div>
            <div className="flex items-center justify-between mb-6 px-1">
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                    <span className="w-1.5 h-6 bg-pink-500 rounded-full shadow-[0_0_10px_rgba(236,72,153,0.5)]"></span>
                    Подборки манг
                </h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* List 1 */}
                <div className="relative h-48 rounded-2xl overflow-hidden cursor-pointer group border border-white/5">
                    <div className="absolute inset-0 bg-gray-800"></div>
                    <div className="absolute inset-0 bg-gradient-to-r from-black via-black/60 to-transparent"></div>
                    <div className="absolute inset-0 p-6 flex flex-col justify-center items-start">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-pink-400 mb-2">
                            РОМАНТИКА
                        </span>
                        <h4 className="text-2xl font-black text-white leading-tight mb-2 group-hover:text-pink-400 transition-colors">
                            Лучшие истории
                            <br />о любви
                        </h4>
                        <span className="text-xs text-gray-300 font-medium bg-white/10 px-3 py-1 rounded-full backdrop-blur-md group-hover:bg-white/20 transition-colors">
                            15 тайтлов
                        </span>
                    </div>
                </div>
                {/* List 2 */}
                <div className="relative h-48 rounded-2xl overflow-hidden cursor-pointer group border border-white/5">
                    <div className="absolute inset-0 bg-gray-800"></div>
                    <div className="absolute inset-0 bg-gradient-to-r from-black via-black/60 to-transparent"></div>
                    <div className="absolute inset-0 p-6 flex flex-col justify-center items-start">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-blue-400 mb-2">
                            ИСЕКАЙ
                        </span>
                        <h4 className="text-2xl font-black text-white leading-tight mb-2 group-hover:text-blue-400 transition-colors">
                            Перерождение
                            <br />в другом мире
                        </h4>
                        <span className="text-xs text-gray-300 font-medium bg-white/10 px-3 py-1 rounded-full backdrop-blur-md group-hover:bg-white/20 transition-colors">
                            24 тайтла
                        </span>
                    </div>
                </div>
                {/* List 3 */}
                <div className="relative h-48 rounded-2xl overflow-hidden cursor-pointer group border border-white/5 hidden lg:block">
                    <div className="absolute inset-0 bg-gray-800"></div>
                    <div className="absolute inset-0 bg-gradient-to-r from-black via-black/60 to-transparent"></div>
                    <div className="absolute inset-0 p-6 flex flex-col justify-center items-start">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-yellow-400 mb-2">
                            КУЛЬТИВАЦИЯ
                        </span>
                        <h4 className="text-2xl font-black text-white leading-tight mb-2 group-hover:text-yellow-400 transition-colors">
                            Путь к<br />
                            бессмертию
                        </h4>
                        <span className="text-xs text-gray-300 font-medium bg-white/10 px-3 py-1 rounded-full backdrop-blur-md group-hover:bg-white/20 transition-colors">
                            18 тайтлов
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
}
