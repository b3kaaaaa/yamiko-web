import { Skeleton } from "@/components/ui/Skeleton";

export default function ProfileSkeleton() {
    return (
        <div className="space-y-6 pb-12 w-full animate-pulse">
            {/* Header Skeleton */}
            <div className="w-full relative glass-panel rounded-2xl overflow-hidden border-0 bg-[#121217] border border-white/5 h-96">
                <div className="h-72 bg-white/5 w-full"></div>
                <div className="px-8 pb-8 -mt-24 relative flex items-end gap-6 z-10">
                    <div className="w-40 h-40 rounded-full bg-[#1C1C22] border-4 border-[#121217] shrink-0"></div>
                    <div className="flex-1 mb-3 space-y-3">
                        <div className="h-10 w-64 bg-white/10 rounded"></div>
                        <div className="flex gap-4">
                            <div className="h-6 w-24 bg-white/5 rounded"></div>
                            <div className="h-6 w-32 bg-white/5 rounded"></div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Grid Skeleton */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-[#121217] border border-white/5 rounded-2xl p-6 h-64">
                        <div className="h-6 w-32 bg-white/10 rounded mb-4"></div>
                        <div className="space-y-2">
                            <div className="h-4 w-full bg-white/5 rounded"></div>
                            <div className="h-4 w-3/4 bg-white/5 rounded"></div>
                            <div className="h-4 w-1/2 bg-white/5 rounded"></div>
                        </div>
                    </div>
                </div>
                <div className="bg-[#121217] border border-white/5 rounded-2xl p-6 h-64">
                    <div className="h-6 w-24 bg-white/10 rounded mb-4"></div>
                    <div className="space-y-3">
                        {[1, 2, 3, 4].map(i => (
                            <div key={i} className="h-10 w-full bg-white/5 rounded"></div>
                        ))}
                    </div>
                </div>
            </div>

            <div className="h-64 bg-[#121217] border border-white/5 rounded-2xl"></div>
        </div>
    );
}
