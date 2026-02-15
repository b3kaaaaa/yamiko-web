import { createClient } from '@/lib/supabase/server';
import PageLayout from '@/components/layout/PageLayout';
import HeroBanner from "@/components/home/HeroBanner";
import HotNewReleases from "@/components/home/HotNewReleases";
import RightSidebar from "@/components/layout/RightSidebar";
import ContinueReading from "@/components/home/ContinueReading";
import Collections from "@/components/home/Collections";
import CuratedLists from "@/components/home/CuratedLists";
import EditorChoice from "@/components/home/EditorChoice";
import LatestUpdates from "@/components/home/LatestUpdates";

// ISR: Revalidate every 60 seconds
export const revalidate = 60;

export default async function Home() {
  const supabase = await createClient();

  // Parallel data fetching
  const [newReleasesResult, heroMangasResult, usersResult] = await Promise.all([
    // New Releases (fetch more to allow filtering)
    supabase.from('manga')
      .select('id, title, cover_url, rating, status, created_at, slug')
      .order('created_at', { ascending: false })
      .limit(20), // Reduced from 50 to 20
    // Hero Slider (Top 12 to form 4 sets of 3)
    supabase.from('manga')
      .select('id, title, cover_url, rating, status, description, views, slug')
      .order('views', { ascending: false })
      .limit(9), // Reduced from 12 to 9 (3 sets of 3)
    // 2. Fetch Active Users (Simulated by recent updates or just random for now)
    supabase
      .from('profiles')
      .select('id, username, avatar_url, level, exp, energy, display_id') // Added display_id
      .eq('is_online', true)
      .limit(10)
  ]);

  const rawUsers = usersResult.data;
  const rawNewReleases = newReleasesResult.data;
  const heroMangas = heroMangasResult.data;
  const users = usersResult.data;

  // Safe defaults
  const safeHeroMangas = heroMangas || [];
  const safeUsers = users || [];
  const rawSafeNewReleases = rawNewReleases || [];

  // Filter Hero items out of New Releases to avoid duplicates
  const heroIds = new Set(safeHeroMangas.map(m => m.id));
  let safeNewReleases = rawSafeNewReleases.filter(m => !heroIds.has(m.id));

  // FALLBACK: If we filtered everything out (small DB), just show the raw list to avoid empty section
  if (safeNewReleases.length < 4) {
    safeNewReleases = rawSafeNewReleases;
  }

  // Slice to final display count
  safeNewReleases = safeNewReleases.slice(0, 12);

  // We can reuse the hero mangas as "popular" for the sidebar if needed, 
  // or fetch separately if the sidebar logic differs. 
  // For now, let's use the same list or a slice of it for efficiency, 
  // or simple reuse safeHeroMangas as "popular" for the sidebar since they are the most viewed.
  const safePopular = safeHeroMangas;

  return (
    <PageLayout
      rightSidebar={<RightSidebar popular={safePopular.slice(0, 4)} activeUsers={safeUsers} />}
    >
      <div className="space-y-16">
        <HeroBanner slides={safeHeroMangas} />
        <HotNewReleases mangas={safeNewReleases} />

        {/* Placeholder components (Static for now until we port them fully) */}
        {/* <ContinueReading /> */}
        {/* <Collections /> */}
        {/* <CuratedLists /> */}
        {/* <EditorChoice /> */}
        {/* <LatestUpdates /> */}
      </div>
    </PageLayout>
  );
}
