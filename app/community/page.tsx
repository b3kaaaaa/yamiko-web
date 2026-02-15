"use client";

import PageLayout from "@/components/layout/PageLayout";
import Sidebar from "@/components/layout/Sidebar";
import RightSidebar from '@/components/layout/RightSidebar';
import CommunityFeed from "@/components/community/CommunityFeed";
import { browserClient as supabase } from "@/lib/supabase/client";
import { useEffect, useState } from "react";

export default function CommunityPage() {
    const [spotlight, setSpotlight] = useState<any>(null);
    const [widgetsData, setWidgetsData] = useState<any>(null);
    const [popular, setPopular] = useState<any[]>([]);
    const [activeUsers, setActiveUsers] = useState<any[]>([]);

    // Feed State (Local to Feed now)

    useEffect(() => {
        const fetchData = async () => {
            // Sidebar Widgets (Spotlight is here)
            const { data } = await (supabase.rpc as any)('get_sidebar_widgets');
            if (data) {
                setWidgetsData(data);
            }

            // Standard Right Sidebar Data - Sync with Home Page Logic
            const { data: popData } = await supabase.from('manga')
                .select('id, title, cover_url, rating, status, description, views, slug')
                .order('views', { ascending: false })
                .limit(4);

            if (popData) {
                setPopular(popData.map((m: any) => ({
                    ...m,
                    views: m.views || 0,
                    rating: m.rating || 0
                })));
            }

            const { data: userData } = await supabase.from('profiles')
                .select('id, username, avatar_url, level, exp, energy, display_id')
                .eq('is_online', true)
                .limit(10);

            if (userData) {
                setActiveUsers(userData.map((u: any) => ({
                    ...u,
                    id: u.id,
                    display_id: u.display_id || u.id
                })));
            }
        };
        fetchData();
    }, []);

    return (
        <PageLayout leftSidebar={<Sidebar />} rightSidebar={
            <RightSidebar popular={popular} activeUsers={activeUsers} />
        }>
            <CommunityFeed
                spotlight={widgetsData?.spotlight}
            />
        </PageLayout>
    );
}
