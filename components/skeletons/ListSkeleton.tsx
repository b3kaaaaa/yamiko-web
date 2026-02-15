import { Skeleton } from "@/components/ui/Skeleton";

export default function ListSkeleton() {
    return (
        <div className="w-full space-y-6 animate-pulse">
            <div className="h-32 bg-[#121217] rounded-2xl border border-white/5"></div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((i) => (
                    <div key={i} className="aspect-[2/3] bg-[#121217] rounded-xl border border-white/5"></div>
                ))}
            </div>
        </div>
    );
}
