export default function StatsCard({
    title,
    value,
    trend,
    trendLabel,
    icon,
    color = "blue"
}: {
    title: string;
    value: string | number;
    trend?: string;
    trendLabel?: string;
    icon: string;
    color?: "blue" | "green" | "purple" | "orange" | "red" | "cyan";
}) {
    const colorClasses = {
        blue: "bg-blue-500/10 text-blue-500 hover:border-blue-500/30",
        green: "bg-green-500/10 text-green-500 hover:border-green-500/30",
        purple: "bg-purple-500/10 text-purple-500 hover:border-purple-500/30",
        orange: "bg-orange-500/10 text-orange-500 hover:border-orange-500/30",
        red: "bg-red-500/10 text-red-500 hover:border-red-500/30",
        cyan: "bg-cyan-500/10 text-cyan-500 hover:border-cyan-500/30",
    };

    const isPositive = trend?.startsWith('+');

    return (
        <div className={`glass-card rounded-2xl p-6 relative overflow-hidden group border border-white/5 transition-all ${colorClasses[color].split(' ').pop()}`}>
            <div className="flex justify-between items-start mb-4">
                <div className={`p-3 rounded-xl flex items-center justify-center ${colorClasses[color].split(' ')[0]} ${colorClasses[color].split(' ')[1]}`}>
                    <span className="material-symbols-outlined text-[24px]">{icon}</span>
                </div>
                {trend && (
                    <span className={`text-xs px-2 py-1 rounded font-bold ${isPositive ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
                        {trend}
                    </span>
                )}
            </div>

            <div>
                <h4 className="text-3xl font-black text-white mb-1">{value}</h4>
                <p className="text-xs text-gray-500 uppercase font-bold tracking-wider">{title}</p>
                {trendLabel && <p className="text-[10px] text-gray-600 mt-1">{trendLabel}</p>}
            </div>

            <div className={`absolute -right-4 -bottom-4 w-24 h-24 rounded-full blur-2xl transition-all opacity-0 group-hover:opacity-100 ${colorClasses[color].split(' ')[0]}`}></div>
        </div>
    );
}
