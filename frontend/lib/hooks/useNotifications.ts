import { useState, useEffect, useCallback } from 'react';
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
    
    // Role-specific notification types that should trigger sound
    const getTargetNotificationTypes = (role: string) => {
        switch (role) {
            case 'STUDENT':
                return ['LEVEL_UNLOCKED', 'ASSESSMENT_REPORT_READY'];
            case 'AFFILIATE':
                return ['AFFILIATE_SETTLEMENT_READY', 'AFFILIATE_SETTLEMENT_PROCESSED', 'AFFILIATE_NEW_REFERRAL', 'AFFILIATE_MILESTONE_REACHED'];
            case 'ADMIN':
                return ['NEW_CORPORATE_SIGNUP', 'AFFILIATE_SETTLEMENT_READY', 'STUDENT_REFERRAL_REGISTRATION', 'STUDENT_DIRECT_REGISTRATION'];
            case 'CORPORATE':
                return ['EMPLOYEE_TEST_COMPLETED', 'LOW_CREDITS', 'CREDITS_ADDED', 'EXAM_EXPIRATION'];
            default:
                return [];
        }
    };
    
    const TARGET_NOTIFICATION_TYPES = getTargetNotificationTypes(user.role || '');
    
    // Role-specific localStorage key to prevent interference between roles
    const localStorageKey = `previousTargetUnreadCount_${user.role || 'unknown'}`;
    
    // Initialize previous count from localStorage to persist across page navigations
    const getInitialPreviousCount = () => {
        if (typeof window !== 'undefined') {
            const stored = localStorage.getItem(localStorageKey);
            const parsed = stored ? parseInt(stored, 10) : 0;
            return isNaN(parsed) ? 0 : parsed;
        }
        return 0;
    };
    
    const [previousTargetUnreadCount, setPreviousTargetUnreadCount] = useState(getInitialPreviousCount());

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
                
                // Calculate target notification unread count (LEVEL_UNLOCKED and ASSESSMENT_REPORT_READY)
                const currentTargetUnreadCount = (data.items || []).filter((n: Notification) => 
                    !n.isRead && TARGET_NOTIFICATION_TYPES.includes(n.type)
                ).length;
                
                // Play sound only when new target notifications arrive
                if (currentTargetUnreadCount > previousTargetUnreadCount && previousTargetUnreadCount >= 0) {
                    playNotificationSound();
                }
                
                // Update previous count for next comparison and persist to localStorage with role-specific key
                setPreviousTargetUnreadCount(currentTargetUnreadCount);
                if (typeof window !== 'undefined') {
                    localStorage.setItem(localStorageKey, String(currentTargetUnreadCount));
                }
            }
        } catch (error) {
            console.error('Failed to fetch unread count:', error);
        }
    }, [user.id, user.role, previousTargetUnreadCount, playNotificationSound, localStorageKey]);

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
            // Find notification before API call to check if it was unread
            const notification = notifications.find(n => n.id === id);
            const wasUnreadTargetNotification = notification && !notification.isRead && TARGET_NOTIFICATION_TYPES.includes(notification.type);
            
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
                
                // Update localStorage previous count if the marked notification was a target type
                if (wasUnreadTargetNotification) {
                    const newPreviousCount = Math.max(0, previousTargetUnreadCount - 1);
                    setPreviousTargetUnreadCount(newPreviousCount);
                    if (typeof window !== 'undefined') {
                        localStorage.setItem(localStorageKey, String(newPreviousCount));
                    }
                }
            }
        } catch (error) {
            console.error('Failed to mark notification as read:', error);
        }
    }, [notifications, previousTargetUnreadCount, TARGET_NOTIFICATION_TYPES, localStorageKey, user.id]);

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
                
                // Reset localStorage previous count since all notifications are now read
                setPreviousTargetUnreadCount(0);
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
