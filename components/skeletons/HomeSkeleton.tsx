import { Skeleton } from "@/components/ui/Skeleton";

export function HomeSkeleton() {
    return (
        <div className="space-y-6">
            {/* Hero / Banner Area */}
            <Skeleton className="w-full aspect-[21/9] rounded-2xl" />

            {/* Grid Section */}
            <div className="space-y-4">
                <Skeleton className="h-8 w-48" />
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                    {Array.from({ length: 10 }).map((_, i) => (
                        <div key={i} className="space-y-3">
                            <Skeleton className="aspect-[2/3] w-full rounded-xl" />
                            <div className="space-y-2">
                                <Skeleton className="h-4 w-3/4" />
                                <Skeleton className="h-3 w-1/2" />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
