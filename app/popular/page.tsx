'use client';

import Navbar from "@/components/layout/Navbar"; // Assuming path
import Sidebar from "@/components/layout/Sidebar"; // Assuming path
import { usePopularFeed } from "./hooks/usePopularFeed";
import { PopularHeader } from "./components/PopularHeader";
import { MangaGrid } from "./components/MangaGrid";
import { LoadingButton } from "./components/LoadingButton";

export default function PopularPage() {
    const {
        mangaList,
        loading,
        hasMore,
        params,
        updateParams,
        loadMore
    } = usePopularFeed();

    // Helper handlers
    const handleFilterChange = (type: any) => updateParams({ filterType: type });
    const handleTimePeriodChange = (period: any) => updateParams({ timePeriod: period });
    const handleFeedModeChange = (mode: any) => updateParams({ feedMode: mode });
    const handleSearchChange = (query: string) => updateParams({ searchQuery: query });

    return (
        <div className="bg-background-dark text-text-dark selection:bg-primary/30 min-h-screen flex flex-col group/app">
            <Navbar />

            <div className="flex-1 max-w-[1920px] mx-auto w-full px-6 pt-6 pb-12 flex gap-8">
                <aside className="hidden xl:flex flex-col w-64 shrink-0 sticky top-24 self-start h-[calc(100vh-6rem)] overflow-y-auto no-scrollbar transition-all duration-300">
                    {/* Reusing Sidebar */}
                    <Sidebar />
                </aside>

                <main className="flex-1 min-w-0 flex flex-col gap-8">
                    {/* Header with Filters */}
                    <PopularHeader
                        filterType={params.filterType}
                        timePeriod={params.timePeriod}
                        searchQuery={params.searchQuery}
                        feedMode={params.feedMode}
                        onFilterChange={handleFilterChange}
                        onTimePeriodChange={handleTimePeriodChange}
                        onFeedModeChange={handleFeedModeChange}
                        onSearchChange={handleSearchChange}
                    />

                    {/* Grid */}
                    <div className="flex flex-col">
                        <div className="flex-1">
                            <MangaGrid mangaList={mangaList} loading={loading} />

                            {/* Load More */}
                            {hasMore && (
                                <div className="mt-12 flex justify-center">
                                    <LoadingButton
                                        loading={loading}
                                        onClick={loadMore}
                                    />
                                </div>
                            )}
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
}
