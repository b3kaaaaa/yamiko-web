import { Skeleton } from "@/components/ui/Skeleton";

export function MangaSkeleton() {
    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Header / Backdrop Area */}
            <div className="relative h-[400px] w-full overflow-hidden">
                <Skeleton className="absolute inset-0 w-full h-full" />
                <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-transparent" />
            </div>

            <div className="container mx-auto px-4 -mt-32 relative z-10">
                <div className="flex flex-col md:flex-row gap-8">
                    {/* Cover Image */}
                    <div className="shrink-0 mx-auto md:mx-0">
                        <Skeleton className="w-[250px] h-[350px] rounded-xl shadow-2xl" />
                    </div>

                    {/* Info */}
                    <div className="flex-1 space-y-4 pt-10 md:pt-0">
                        <Skeleton className="h-10 w-3/4" />
                        <div className="flex gap-2">
                            <Skeleton className="h-6 w-20 rounded-full" />
                            <Skeleton className="h-6 w-20 rounded-full" />
                            <Skeleton className="h-6 w-20 rounded-full" />
                        </div>
                        <Skeleton className="h-24 w-full" />
                        <div className="flex gap-4 pt-4">
                            <Skeleton className="h-12 w-32 rounded-lg" />
                            <Skeleton className="h-12 w-32 rounded-lg" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Chapters / Content */}
            <div className="container mx-auto px-4 mt-8">
                <Skeleton className="h-8 w-40 mb-4" />
                <div className="space-y-2">
                    {Array.from({ length: 5 }).map((_, i) => (
                        <Skeleton key={i} className="h-16 w-full rounded-lg" />
                    ))}
                </div>
            </div>
        </div>
    );
}
