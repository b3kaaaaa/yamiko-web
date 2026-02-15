import { createClient } from '@supabase/supabase-js';
import PageLayout from '@/components/layout/PageLayout';
import Sidebar from '@/components/layout/Sidebar';
import CatalogFilters from './components/CatalogFilters';
import CatalogMangaCard from './components/CatalogMangaCard';
import CatalogHeader from './components/CatalogHeader';

export const revalidate = 60;
export const dynamic = 'force-dynamic';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export default async function CatalogPage({
    searchParams,
}: {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
    const supabase = createClient(supabaseUrl, supabaseKey);
    const resolvedSearchParams = await searchParams;

    // Extract params
    const query = typeof resolvedSearchParams.query === 'string' ? resolvedSearchParams.query : '';
    const statusParam = resolvedSearchParams.status;
    const statusFilter = Array.isArray(statusParam) ? statusParam : statusParam ? [statusParam] : [];

    const typeParam = resolvedSearchParams.type;
    const typeFilter = Array.isArray(typeParam) ? typeParam[0] : typeParam;

    const genresParam = resolvedSearchParams.genres;
    const genresFilter = Array.isArray(genresParam) ? genresParam : genresParam ? [genresParam] : [];

    const sort = typeof resolvedSearchParams.sort === 'string' ? resolvedSearchParams.sort : 'popularity';

    // Build Query
    let dbQuery = supabase
        .from('manga')
        .select(`
            *,
            manga_genres!inner (
                genres!inner (
                    name
                )
            )
        `);

    // Search
    if (query) {
        dbQuery = dbQuery.ilike('title', `%${query}%`);
    }

    // Status Filter
    if (statusFilter.length > 0) {
        dbQuery = dbQuery.in('status', statusFilter);
    }

    // Type Filter
    if (typeFilter) {
        dbQuery = dbQuery.eq('type', typeFilter);
    }

    // Genre Filter
    if (genresFilter.length > 0) {
        dbQuery = dbQuery.in('manga_genres.genres.name', genresFilter);
    }

    // Sort
    if (sort === 'updated_at') {
        dbQuery = dbQuery.order('updated_at', { ascending: false });
    } else if (sort === 'rating') {
        dbQuery = dbQuery.order('rating', { ascending: false });
    } else {
        dbQuery = dbQuery.order('views', { ascending: false });
    }

    // Execute
    const { data: rawMangas, error } = await dbQuery.limit(50);

    if (error) {
        console.error("Error fetching manga:", error);
    }

    const mangas = rawMangas || [];

    return (
        <PageLayout
            leftSidebar={<Sidebar />}
            rightSidebar={<CatalogFilters />}
        >


            {/* Correcting structure: CatalogHeader contains the entire header section */}
            <div className="flex flex-col gap-6">
                <CatalogHeader />

                <div className="flex-1 mt-2">
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-x-6 gap-y-10">
                        {mangas && mangas.length > 0 ? (
                            mangas.map((manga) => (
                                <CatalogMangaCard key={manga.id} manga={manga} />
                            ))
                        ) : (
                            <div className="col-span-full py-20 text-center text-gray-500">
                                <span className="material-symbols-outlined text-4xl mb-2">search_off</span>
                                <p>Ничего не найдено</p>
                            </div>
                        )}
                    </div>

                    {/* Pagination Mock */}
                    {mangas && mangas.length > 0 && (
                        <div className="mt-12 flex justify-center">
                            <button className="px-10 py-3.5 bg-surface-highlight-dark hover:bg-white/10 border border-white/5 rounded-full text-sm font-bold text-white transition-all shadow-lg hover:shadow-primary/20 flex items-center gap-3 group">
                                <span className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin hidden group-hover:block"></span>
                                Загрузить еще
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </PageLayout>
    );
}

