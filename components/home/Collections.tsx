
import Link from "next/link";

export default function Collections() {
    return (
        <div>
            <div className="flex items-center justify-between mb-6 px-1">
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                    <span className="w-1.5 h-6 bg-purple-500 rounded-full shadow-[0_0_10px_rgba(168,85,247,0.5)]"></span>
                    Последние коллекции
                </h3>
                <Link
                    className="text-xs font-bold text-text-muted-dark hover:text-white transition-colors flex items-center gap-1 uppercase tracking-wider"
                    href="#"
                >
                    Все коллекции{" "}
                    <span className="material-symbols-outlined text-[14px]">
                        arrow_forward_ios
                    </span>
                </Link>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {/* Collection 1 */}
                <div className="group relative cursor-pointer bg-surface-dark border border-white/5 rounded-xl p-3 hover:border-purple-500/40 transition-all hover:shadow-[0_0_15px_rgba(168,85,247,0.15)]">
                    <div className="aspect-[2/3] gray-placeholder rounded-lg relative overflow-hidden mb-3">
                        <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-sm px-1.5 py-0.5 rounded text-[10px] font-bold text-purple-300 border border-purple-500/20">
                            SSR
                        </div>
                    </div>
                    <h4 className="text-sm font-bold text-gray-200 text-center group-hover:text-primary transition-colors">
                        Эльфийская Принцесса
                    </h4>
                    <p className="text-[10px] text-gray-500 text-center mt-1">
                        Редкость: Легендарная
                    </p>
                </div>
                {/* Collection 2 */}
                <div className="group relative cursor-pointer bg-surface-dark border border-white/5 rounded-xl p-3 hover:border-purple-500/40 transition-all hover:shadow-[0_0_15px_rgba(168,85,247,0.15)]">
                    <div className="aspect-[2/3] gray-placeholder rounded-lg relative overflow-hidden mb-3">
                        <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-sm px-1.5 py-0.5 rounded text-[10px] font-bold text-blue-300 border border-blue-500/20">
                            SR
                        </div>
                    </div>
                    <h4 className="text-sm font-bold text-gray-200 text-center group-hover:text-primary transition-colors">
                        Тёмный Рыцарь
                    </h4>
                    <p className="text-[10px] text-gray-500 text-center mt-1">
                        Редкость: Эпическая
                    </p>
                </div>
                {/* Collection 3 */}
                <div className="group relative cursor-pointer bg-surface-dark border border-white/5 rounded-xl p-3 hover:border-purple-500/40 transition-all hover:shadow-[0_0_15px_rgba(168,85,247,0.15)]">
                    <div className="aspect-[2/3] gray-placeholder rounded-lg relative overflow-hidden mb-3">
                        <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-sm px-1.5 py-0.5 rounded text-[10px] font-bold text-green-300 border border-green-500/20">
                            R
                        </div>
                    </div>
                    <h4 className="text-sm font-bold text-gray-200 text-center group-hover:text-primary transition-colors">
                        Лесной Дух
                    </h4>
                    <p className="text-[10px] text-gray-500 text-center mt-1">
                        Редкость: Редкая
                    </p>
                </div>
                {/* Collection 4 */}
                <div className="group relative cursor-pointer bg-surface-dark border border-white/5 rounded-xl p-3 hover:border-purple-500/40 transition-all hover:shadow-[0_0_15px_rgba(168,85,247,0.15)]">
                    <div className="aspect-[2/3] gray-placeholder rounded-lg relative overflow-hidden mb-3">
                        <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-sm px-1.5 py-0.5 rounded text-[10px] font-bold text-yellow-300 border border-yellow-500/20">
                            UR
                        </div>
                    </div>
                    <h4 className="text-sm font-bold text-gray-200 text-center group-hover:text-primary transition-colors">
                        Король Демонов
                    </h4>
                    <p className="text-[10px] text-gray-500 text-center mt-1">
                        Редкость: Мифическая
                    </p>
                </div>
                {/* Collection 5 */}
                <div className="group relative cursor-pointer bg-surface-dark border border-white/5 rounded-xl p-3 hover:border-purple-500/40 transition-all hover:shadow-[0_0_15px_rgba(168,85,247,0.15)] hidden lg:block">
                    <div className="aspect-[2/3] gray-placeholder rounded-lg relative overflow-hidden mb-3">
                        <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-sm px-1.5 py-0.5 rounded text-[10px] font-bold text-blue-300 border border-blue-500/20">
                            SR
                        </div>
                    </div>
                    <h4 className="text-sm font-bold text-gray-200 text-center group-hover:text-primary transition-colors">
                        Небесный Меч
                    </h4>
                    <p className="text-[10px] text-gray-500 text-center mt-1">
                        Редкость: Эпическая
                    </p>
                </div>
            </div>
        </div>
    );
}
