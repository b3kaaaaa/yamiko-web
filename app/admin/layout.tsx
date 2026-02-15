'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { browserClient as supabase } from '@/lib/supabase/client';
import AdminSidebar from '@/components/admin/layout/AdminSidebar';
import AdminHeader from '@/components/admin/layout/AdminHeader';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const [isLoading, setIsLoading] = useState(true);
    const [isAuthorized, setIsAuthorized] = useState(false);
    const router = useRouter();

    useEffect(() => {
        let isMounted = true;

        const checkAuth = async () => {
            try {
                const { data: { user } } = await supabase.auth.getUser();

                if (!user) {
                    if (isMounted) router.push('/');
                    return;
                }

                // Optimization: Fetch only role
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('role')
                    .eq('id', user.id)
                    .single<any>();

                if (isMounted) {
                    if (profile?.role === 'ADMIN' || profile?.role === 'SUPER_ADMIN') {
                        setIsAuthorized(true);
                    } else {
                        router.push('/');
                    }
                    setIsLoading(false);
                }
            } catch (err) {
                console.error("Admin Auth Error:", err);
                if (isMounted) {
                    router.push('/');
                    setIsLoading(false);
                }
            }
        };

        checkAuth();
        return () => { isMounted = false; };
    }, [router]);

    if (isLoading) {
        return (
            <div className="flex h-screen w-full items-center justify-center bg-[#0B0B0E] text-white">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                    <span className="text-xs font-black tracking-[0.3em] uppercase text-gray-500 animate-pulse">Initializing System...</span>
                </div>
            </div>
        );
    }

    if (!isAuthorized) return null;

    return (
        <div className="flex bg-[#0B0B0E] min-h-screen text-gray-300 font-sans selection:bg-primary/30 h-screen overflow-hidden">
            <AdminSidebar />
            <div className="flex-1 flex flex-col h-full overflow-hidden relative">
                <AdminHeader />
                <main className="flex-grow overflow-y-auto p-8 custom-scrollbar">
                    <div className="max-w-[1600px] mx-auto pb-20">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
}
