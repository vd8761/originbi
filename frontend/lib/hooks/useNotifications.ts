import { useState, useEffect, useCallback, useRef } from 'react';
import { getStoredUser, getAuthHeaders } from '../auth-helpers';
import { usePathname } from 'next/navigation';
import { useNotificationSound } from './useNotificationSound';

export interface Notification {
    id: number;
    userId: number;
    role: string;
    type: string;
    title: string;
    message: string;
    isRead: boolean;
    metadata: any;
    createdAt: string;
}

export function useNotifications() {
    const [unreadCount, setUnreadCount] = useState(0);
    const pathname = usePathname();
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(false);
    const user = getStoredUser();
    const { playNotificationSound } = useNotificationSound();

    // Role + user specific key to avoid cross-account bleed when same browser is reused.
    const localStorageKey = `previousUnreadCount_${user.role || 'unknown'}_${user.id || 0}`;

    // Initialize previous unread count from localStorage; null means "first fetch baseline not set".
    const getInitialPreviousCount = () => {
        if (typeof window !== 'undefined') {
            const stored = localStorage.getItem(localStorageKey);
            if (stored === null) {
                return null;
            }
            const parsed = parseInt(stored, 10);
            return isNaN(parsed) ? null : parsed;
        }
        return null;
    };

    const previousUnreadCountRef = useRef<number | null>(getInitialPreviousCount());
    const hasFetchedOnceRef = useRef(false);

    useEffect(() => {
        previousUnreadCountRef.current = getInitialPreviousCount();
        hasFetchedOnceRef.current = false;
    }, [localStorageKey]);

    const fetchUnreadCount = useCallback(async () => {
        if (!user.id || user.id === 0) return;

        try {
            const baseUrl = process.env.NEXT_PUBLIC_ADMIN_API_BASE_URL || 'http://localhost:4001';
            const response = await fetch(`${baseUrl}/notifications?userId=${user.id}&role=${user.role}&limit=50`, {
                headers: getAuthHeaders(),
            });
            if (response.ok) {
                const data = await response.json();
                setNotifications(data.items || []);
                
                // Calculate total unread count
                const totalUnreadCount = (data.items || []).filter((n: Notification) => !n.isRead).length;
                setUnreadCount(totalUnreadCount);

                const currentUnreadCount = totalUnreadCount;
                const previousUnreadCount = previousUnreadCountRef.current;

                // Do not play on first baseline fetch; play only for new incoming unread notifications.
                if (
                    hasFetchedOnceRef.current &&
                    previousUnreadCount !== null &&
                    currentUnreadCount > previousUnreadCount
                ) {
                    playNotificationSound();
                }

                previousUnreadCountRef.current = currentUnreadCount;
                hasFetchedOnceRef.current = true;
                if (typeof window !== 'undefined') {
                    localStorage.setItem(localStorageKey, String(currentUnreadCount));
                }
            }
        } catch (error) {
            console.error('Failed to fetch unread count:', error);
        }
    }, [user.id, user.role, playNotificationSound, localStorageKey]);

    const fetchNotifications = useCallback(async () => {
        if (!user.id || user.id === 0) return;

        setLoading(true);
        try {
            const baseUrl = process.env.NEXT_PUBLIC_ADMIN_API_BASE_URL || 'http://localhost:4001';
            const response = await fetch(`${baseUrl}/notifications?userId=${user.id}&role=${user.role}&limit=20`, {
                headers: getAuthHeaders(),
            });
            if (response.ok) {
                const data = await response.json();
                setNotifications(data.items);
            }
        } catch (error) {
            console.error('Failed to fetch notifications:', error);
        } finally {
            setLoading(false);
        }
    }, [user.id, user.role]);

    const markAsRead = useCallback(async (id: number) => {
        try {
            // Find notification before API call to check if it was unread.
            const notification = notifications.find(n => n.id === id);
            const wasUnreadNotification = Boolean(notification && !notification.isRead);
            
            const baseUrl = process.env.NEXT_PUBLIC_ADMIN_API_BASE_URL || 'http://localhost:4001';
            const response = await fetch(`${baseUrl}/notifications/${id}/read`, {
                method: 'PATCH',
                headers: getAuthHeaders(),
                body: JSON.stringify({ userId: user.id }),
            });
            if (response.ok) {
                setNotifications(prev =>
                    prev.map(n => n.id === id ? { ...n, isRead: true } : n)
                );
                setUnreadCount(prev => Math.max(0, prev - 1));
                
                if (wasUnreadNotification) {
                    const previousUnreadCount = previousUnreadCountRef.current ?? 0;
                    const newPreviousCount = Math.max(0, previousUnreadCount - 1);
                    previousUnreadCountRef.current = newPreviousCount;
                    if (typeof window !== 'undefined') {
                        localStorage.setItem(localStorageKey, String(newPreviousCount));
                    }
                }
            }
        } catch (error) {
            console.error('Failed to mark notification as read:', error);
        }
    }, [notifications, localStorageKey, user.id]);

    const markAllAsRead = useCallback(async () => {
        try {
            const baseUrl = process.env.NEXT_PUBLIC_ADMIN_API_BASE_URL || 'http://localhost:4001';
            const response = await fetch(`${baseUrl}/notifications/read-all`, {
                method: 'PATCH',
                headers: getAuthHeaders(),
                body: JSON.stringify({ userId: user.id, role: user.role }),
            });
            if (response.ok) {
                setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
                setUnreadCount(0);
                
                // Reset baseline since all notifications are now read.
                previousUnreadCountRef.current = 0;
                if (typeof window !== 'undefined') {
                    localStorage.setItem(localStorageKey, '0');
                }
            }
        } catch (error) {
            console.error('Failed to mark all notifications as read:', error);
        }
    }, [localStorageKey, user.id, user.role]);

    useEffect(() => {
        if (!user.id || user.id === 0) {
            setUnreadCount(0);
            return;
        }

        // Initial fetch and on route change
        fetchUnreadCount();

        // Poll frequently so new notification sounds are near real-time.
        const intervalId = setInterval(fetchUnreadCount, 15000);

        const handleVisibilityOrFocus = () => {
            if (typeof document === 'undefined' || !document.hidden) {
                void fetchUnreadCount();
            }
        };

        window.addEventListener('focus', handleVisibilityOrFocus);
        document.addEventListener('visibilitychange', handleVisibilityOrFocus);

        return () => {
            clearInterval(intervalId);
            window.removeEventListener('focus', handleVisibilityOrFocus);
            document.removeEventListener('visibilitychange', handleVisibilityOrFocus);
        };
    }, [user.id, fetchUnreadCount, pathname]);

    return {
        unreadCount,
        notifications,
        loading,
        fetchNotifications,
        markAsRead,
        markAllAsRead,
    };
}
