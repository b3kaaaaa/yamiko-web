"use client";

// Simple SVG Area Chart
export const AreaChart = ({ data, color = "blue" }: { data: number[], color?: "blue" | "purple" | "green" }) => {
    const max = Math.max(...data, 1);
    const min = Math.min(...data);
    const points = data.map((d, i) => {
        const x = (i / (data.length - 1)) * 100;
        const y = 100 - ((d - min) / (max - min)) * 80 - 10; // keep some padding
        return `${x},${y}`;
    }).join(" ");

    const areaColor = {
        blue: "fill-blue-500/20 stroke-blue-500",
        purple: "fill-purple-500/20 stroke-purple-500",
        green: "fill-green-500/20 stroke-green-500",
    }[color];

    return (
        <div className="w-full h-full relative">
            <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full overflow-visible">
                <defs>
                    <linearGradient id={`gradient-${color}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={color === "blue" ? "#3b82f6" : color === "purple" ? "#a855f7" : "#22c55e"} stopOpacity="0.4" />
                        <stop offset="100%" stopColor={color === "blue" ? "#3b82f6" : color === "purple" ? "#a855f7" : "#22c55e"} stopOpacity="0" />
                    </linearGradient>
                </defs>
                <path
                    d={`M0,100 ${points} 100,100`}
                    className="fill-[url(#gradient-blue)]"
                    style={{ fill: `url(#gradient-${color})` }}
                />
                <polyline
                    points={points}
                    fill="none"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className={areaColor.split(" ")[1]}
                />
            </svg>
        </div>
    );
};

// Simple Bar Chart
export const BarChart = ({ data, labels }: { data: number[], labels: string[] }) => {
    const max = Math.max(...data, 1);

    return (
        <div className="w-full h-full flex items-end justify-between gap-2">
            {data.map((d, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-2 group h-full justify-end">
                    <div className="w-full bg-white/5 rounded-t-lg relative group-hover:bg-white/10 transition-colors" style={{ height: `${(d / max) * 100}%` }}>
                        <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-black border border-white/10 px-2 py-1 rounded text-[10px] opacity-0 group-hover:opacity-100 transition-opacity">
                            {d}
                        </div>
                    </div>
                    <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider truncate w-full text-center">{labels[i]}</span>
                </div>
            ))}
        </div>
    );
}
