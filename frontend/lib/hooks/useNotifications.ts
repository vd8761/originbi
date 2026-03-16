import { useState, useEffect, useCallback } from 'react';
import { getStoredUser, getAuthHeaders } from '../auth-helpers';
import { usePathname } from 'next/navigation';

export interface Notification {
    id: string;
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

    const fetchUnreadCount = useCallback(async () => {
        if (!user.id || user.id === 0) return;

        try {
            const baseUrl = process.env.NEXT_PUBLIC_ADMIN_SERVICE_URL || 'http://localhost:4001';
            const response = await fetch(`${baseUrl}/notifications/unread-count?userId=${user.id}&role=${user.role}`, {
                headers: getAuthHeaders(),
            });
            if (response.ok) {
                const data = await response.json();
                setUnreadCount(data.unreadCount);
            }
        } catch (error) {
            console.error('Failed to fetch unread count:', error);
        }
    }, [user.id, user.role]);

    const fetchNotifications = useCallback(async () => {
        if (!user.id || user.id === 0) return;

        setLoading(true);
        try {
            const baseUrl = process.env.NEXT_PUBLIC_ADMIN_SERVICE_URL || 'http://localhost:4001';
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

    const markAsRead = async (id: string) => {
        try {
            const baseUrl = process.env.NEXT_PUBLIC_ADMIN_SERVICE_URL || 'http://localhost:4001';
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
            }
        } catch (error) {
            console.error('Failed to mark notification as read:', error);
        }
    };

    const markAllAsRead = async () => {
        try {
            const baseUrl = process.env.NEXT_PUBLIC_ADMIN_SERVICE_URL || 'http://localhost:4001';
            const response = await fetch(`${baseUrl}/notifications/read-all`, {
                method: 'PATCH',
                headers: getAuthHeaders(),
                body: JSON.stringify({ userId: user.id, role: user.role }),
            });
            if (response.ok) {
                setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
                setUnreadCount(0);
            }
        } catch (error) {
            console.error('Failed to mark all notifications as read:', error);
        }
    };

    useEffect(() => {
        if (!user.id || user.id === 0) {
            setUnreadCount(0);
            return;
        }

        // Initial fetch and on route change
        fetchUnreadCount();

        // Start polling every 120 seconds
        const intervalId = setInterval(fetchUnreadCount, 120000);

        return () => clearInterval(intervalId);
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
