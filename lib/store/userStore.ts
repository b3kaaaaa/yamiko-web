// Global User Store using Zustand
// Shared between Admin Panel and Main App for real-time updates

import { create } from 'zustand';
import { browserClient } from '@/lib/supabase/client';

export interface User {
    id: string;
    display_id?: string;
    username: string;
    avatar_url?: string;
    level: number;
    exp: number;
    maxExp?: number; // Calculated on client or returned by simplified API
    rubies: number; // Premium currency
    energy: number; // Action points
    role: 'USER' | 'ADMIN' | 'MODERATOR';
    created_at?: string;
    last_login?: string;
    main_guild_id?: string;
}

interface UserStore {
    currentUser: User | null;
    users: User[];

    // UI State
    isLoginOpen: boolean;
    isRegisterOpen: boolean;
    isProfileOpen: boolean;
    isSearchOpen: boolean; // Added for search modal
    openLoginModal: () => void;
    closeLoginModal: () => void;
    openRegisterModal: () => void;
    closeRegisterModal: () => void;
    openProfileModal: () => void;
    closeProfileModal: () => void;
    openSearchModal: () => void; // Added action
    closeSearchModal: () => void; // Added actions
    isSidebarCollapsed: boolean;
    toggleSidebar: () => void;
    isLoadingUser: boolean;

    // Actions
    setCurrentUser: (user: User | null) => void;
    setUsers: (users: User[]) => void;
    updateUser: (userId: string, updates: Partial<User>) => void;
    addExp: (userId: string, amount: number) => void;
    addRubies: (userId: string, amount: number) => void;
    addEnergy: (userId: string, amount: number) => void;

    // Fetch functions
    fetchCurrentUser: () => Promise<void>;
    fetchUsers: () => Promise<void>;
}

export const useUserStore = create<UserStore>((set, get) => ({
    currentUser: null,
    users: [],

    // UI State
    isLoginOpen: false,
    isRegisterOpen: false,
    isProfileOpen: false,
    isSearchOpen: false,
    isSidebarCollapsed: false, // Default expanded
    isLoadingUser: false, // NEW: Loading state

    openLoginModal: () => set({ isLoginOpen: true, isRegisterOpen: false, isProfileOpen: false, isSearchOpen: false }),
    closeLoginModal: () => set({ isLoginOpen: false }),
    openRegisterModal: () => set({ isRegisterOpen: true, isLoginOpen: false, isProfileOpen: false, isSearchOpen: false }),
    closeRegisterModal: () => set({ isRegisterOpen: false }),
    openProfileModal: () => set({ isProfileOpen: true, isLoginOpen: false, isRegisterOpen: false, isSearchOpen: false }),
    closeProfileModal: () => set({ isProfileOpen: false }),
    openSearchModal: () => set({ isSearchOpen: true, isLoginOpen: false, isRegisterOpen: false, isProfileOpen: false }),
    closeSearchModal: () => set({ isSearchOpen: false }),
    toggleSidebar: () => set((state) => ({ isSidebarCollapsed: !state.isSidebarCollapsed })),

    setCurrentUser: (user) => set({ currentUser: user }),
    setUsers: (users) => set({ users }),

    updateUser: (userId, updates) => {
        set((state) => ({
            users: state.users.map((user) =>
                user.id === userId ? { ...user, ...updates } : user
            ),
            currentUser:
                state.currentUser?.id === userId
                    ? { ...state.currentUser, ...updates }
                    : state.currentUser,
        }));
    },

    addExp: (userId, amount) => {
        const user = get().users.find((u) => u.id === userId);
        if (user) {
            get().updateUser(userId, { exp: user.exp + amount });
        }
    },

    addRubies: (userId, amount) => {
        const user = get().users.find((u) => u.id === userId);
        if (user) {
            get().updateUser(userId, { rubies: user.rubies + amount });
        }
    },

    addEnergy: (userId, amount) => {
        const user = get().users.find((u) => u.id === userId);
        if (user) {
            get().updateUser(userId, { energy: user.energy + amount });
        }
    },

    fetchCurrentUser: async () => {
        const state = get();
        // Prevent concurrent fetches or unnecessary re-fetches if data is already there (unless we want to force refresh, but for now let's be safe)
        if ((state as any).isLoadingUser) return;

        set({ isLoadingUser: true } as any);

        try {
            console.log("DEBUG: fetchCurrentUser started");

            const { data: { session }, error: sessionError } = await browserClient.auth.getSession();

            if (sessionError) throw sessionError;

            if (session?.user) {
                const { data: profile, error: profileError } = await browserClient
                    .from('profiles')
                    .select('*')
                    .eq('id', session.user.id)
                    .single();

                if (profile) {
                    set({ currentUser: profile as unknown as User });
                } else {
                    console.log("DEBUG: Profile missing! Creating default...");
                    try {
                        const response = await fetch('/api/user/profile/create', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ username: session.user.user_metadata.username })
                        });

                        if (!response.ok) throw new Error(`Profile creation failed: ${response.statusText}`);

                        const { profile: newProfile } = await response.json();
                        set({ currentUser: newProfile as unknown as User });
                    } catch (createError) {
                        console.error('Failed to create profile:', createError);
                    }
                }
            } else {
                set({ currentUser: null });
            }

        } catch (error: any) {
            // Ignore AbortError and 'The operation was aborted' (Code 20)
            if (error?.name === 'AbortError' || error?.code === 20 || error?.message?.includes('aborted')) {
                console.log('DEBUG: Fetch aborted (likely navigation/cleanup)');
                return;
            }
            console.error('DEBUG: Failed to fetch current user:', error);
        } finally {
            set({ isLoadingUser: false } as any);
        }
    },

    fetchUsers: async () => {
        try {
            const response = await fetch('/api/admin/users');
            if (response.ok) {
                const users = await response.json();
                set({ users });
            }
        } catch (error) {
            console.error('Failed to fetch users:', error);
        }
    },
}));
