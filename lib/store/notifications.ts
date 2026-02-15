// Zustand Store for Notifications
// Manages real-time notifications and unread count

import { create } from 'zustand';
import type { Notification } from '@/lib/types';

interface NotificationStore {
    notifications: Notification[];
    unreadCount: number;
    isLoading: boolean;

    // Actions
    setNotifications: (notifications: Notification[]) => void;
    addNotification: (notification: Notification) => void;
    markAsRead: (id: string) => void;
    markAllAsRead: () => void;
    removeNotification: (id: string) => void;
    clearAll: () => void;
}

export const useNotificationStore = create<NotificationStore>((set, get) => ({
    notifications: [],
    unreadCount: 0,
    isLoading: false,

    setNotifications: (notifications) => {
        const unreadCount = notifications.filter((n) => !n.isRead).length;
        set({ notifications, unreadCount });
    },

    addNotification: (notification) => {
        set((state) => ({
            notifications: [notification, ...state.notifications],
            unreadCount: notification.isRead ? state.unreadCount : state.unreadCount + 1,
        }));

        // Show browser notification if permission granted
        if (typeof window !== 'undefined' && Notification.permission === 'granted') {
            new Notification(notification.title, {
                body: notification.message,
                icon: '/icon.png',
            });
        }
    },

    markAsRead: (id) => {
        set((state) => {
            const notifications = state.notifications.map((n) =>
                n.id === id ? { ...n, isRead: true } : n
            );
            const unreadCount = notifications.filter((n) => !n.isRead).length;
            return { notifications, unreadCount };
        });
    },

    markAllAsRead: () => {
        set((state) => ({
            notifications: state.notifications.map((n) => ({ ...n, isRead: true })),
            unreadCount: 0,
        }));
    },

    removeNotification: (id) => {
        set((state) => {
            const notification = state.notifications.find((n) => n.id === id);
            const notifications = state.notifications.filter((n) => n.id !== id);
            const unreadCount = notification && !notification.isRead
                ? state.unreadCount - 1
                : state.unreadCount;

            return { notifications, unreadCount };
        });
    },

    clearAll: () => {
        set({ notifications: [], unreadCount: 0 });
    },
}));

// Request notification permission on load
if (typeof window !== 'undefined' && 'Notification' in window) {
    if (Notification.permission === 'default') {
        Notification.requestPermission();
    }
}
