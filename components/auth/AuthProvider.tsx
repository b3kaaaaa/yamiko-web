'use client';

import { useEffect } from 'react';
import { browserClient } from '@/lib/supabase/client';
import { useUserStore } from '@/lib/store/userStore';

export default function AuthProvider({ children }: { children: React.ReactNode }) {
    const fetchCurrentUser = useUserStore((state) => state.fetchCurrentUser);
    const setCurrentUser = useUserStore((state) => state.setCurrentUser);

    useEffect(() => {
        // Initial fetch
        fetchCurrentUser();

        const { data: { subscription } } = browserClient.auth.onAuthStateChange((event: string, session: any) => {
            if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
                fetchCurrentUser();
            } else if (event === 'SIGNED_OUT') {
                setCurrentUser(null);
            }
        });

        return () => {
            subscription.unsubscribe();
        };
    }, []); // Empty dependency array - only run on mount

    return <>{children}</>;
}
