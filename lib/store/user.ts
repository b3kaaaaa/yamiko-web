// Zustand Store for User State Management
// Manages authenticated user profile and RPG stats

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { UserProfile, UserStats } from '@/lib/types';

interface UserStore {
    user: UserProfile | null;
    stats: UserStats | null;
    isLoading: boolean;

    // Actions
    setUser: (user: UserProfile) => void;
    updateStats: (stats: Partial<UserStats>) => void;
    addExp: (amount: number) => void;
    addRubies: (amount: number) => void;
    spendRubies: (amount: number) => boolean;
    consumeEnergy: (amount: number) => boolean;
    regenerateEnergy: () => void;
    logout: () => void;
}

export const useUserStore = create<UserStore>()(
    persist(
        (set, get) => ({
            user: null,
            stats: null,
            isLoading: false,

            setUser: (user) => {
                set({ user });
                // Initialize stats from user data
                const expToNextLevel = calculateExpToNextLevel(user.level);
                set({
                    stats: {
                        level: user.level,
                        exp: user.exp,
                        expToNextLevel,
                        rubies: user.rubies,
                        energy: user.energy,
                        maxEnergy: 100, // Could be level-based
                    },
                });
            },

            updateStats: (newStats) => {
                const currentStats = get().stats;
                if (!currentStats) return;

                set({
                    stats: {
                        ...currentStats,
                        ...newStats,
                    },
                });
            },

            addExp: (amount) => {
                const { stats, user } = get();
                if (!stats || !user) return;

                let newExp = stats.exp + amount;
                let newLevel = stats.level;
                let threshold = stats.expToNextLevel;

                // Check for level up
                while (newExp >= threshold) {
                    newLevel++;
                    newExp -= threshold;
                    threshold = calculateExpToNextLevel(newLevel);

                    // Trigger level up notification (could emit event)
                    console.log(`🎉 Level Up! You are now level ${newLevel}`);
                }

                set({
                    stats: {
                        ...stats,
                        level: newLevel,
                        exp: newExp,
                        expToNextLevel: threshold,
                    },
                    user: {
                        ...user,
                        level: newLevel,
                        exp: newExp,
                    },
                });
            },

            addRubies: (amount) => {
                const { stats, user } = get();
                if (!stats || !user) return;

                set({
                    stats: {
                        ...stats,
                        rubies: stats.rubies + amount,
                    },
                    user: {
                        ...user,
                        rubies: user.rubies + amount,
                    },
                });
            },

            spendRubies: (amount) => {
                const { stats, user } = get();
                if (!stats || !user || stats.rubies < amount) return false;

                set({
                    stats: {
                        ...stats,
                        rubies: stats.rubies - amount,
                    },
                    user: {
                        ...user,
                        rubies: user.rubies - amount,
                    },
                });

                return true;
            },

            consumeEnergy: (amount) => {
                const { stats, user } = get();
                if (!stats || !user || stats.energy < amount) return false;

                set({
                    stats: {
                        ...stats,
                        energy: stats.energy - amount,
                    },
                    user: {
                        ...user,
                        energy: user.energy - amount,
                    },
                });

                return true;
            },

            regenerateEnergy: () => {
                const { stats, user } = get();
                if (!stats || !user) return;

                const newEnergy = Math.min(stats.energy + 1, stats.maxEnergy);

                set({
                    stats: {
                        ...stats,
                        energy: newEnergy,
                    },
                    user: {
                        ...user,
                        energy: newEnergy,
                    },
                });
            },

            logout: () => {
                set({
                    user: null,
                    stats: null,
                });
            },
        }),
        {
            name: 'yamiko-user-storage',
            partialize: (state) => ({
                user: state.user,
                stats: state.stats,
            }),
        }
    )
);

// Helper function to calculate EXP required for next level
function calculateExpToNextLevel(level: number): number {
    // Formula: 100 * (level ^ 1.5)
    return Math.floor(100 * Math.pow(level, 1.5));
}

// Auto-regenerate energy every minute
if (typeof window !== 'undefined') {
    setInterval(() => {
        const { regenerateEnergy, stats } = useUserStore.getState();
        if (stats && stats.energy < stats.maxEnergy) {
            regenerateEnergy();
        }
    }, 60000); // Every 60 seconds
}
