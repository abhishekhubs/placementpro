import React, { createContext, useContext, useState, ReactNode } from 'react';

export interface AppNotification {
    id: string;
    title: string;
    body: string;
    type: 'job_referral' | 'comment' | 'like' | 'general';
    timestamp: Date;
    read: boolean;
    avatarUrl?: string;
}

interface NotificationContextType {
    notifications: AppNotification[];
    unreadCount: number;
    addNotification: (n: Omit<AppNotification, 'id' | 'timestamp' | 'read'>) => void;
    markAllRead: () => void;
    markRead: (id: string) => void;
}

const NotificationContext = createContext<NotificationContextType | null>(null);

export function NotificationProvider({ children }: { children: ReactNode }) {
    const [notifications, setNotifications] = useState<AppNotification[]>([]);

    const addNotification = (n: Omit<AppNotification, 'id' | 'timestamp' | 'read'>) => {
        const newNote: AppNotification = {
            ...n,
            id: Date.now().toString(),
            timestamp: new Date(),
            read: false,
        };
        setNotifications(prev => [newNote, ...prev]);
    };

    const markAllRead = () => {
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    };

    const markRead = (id: string) => {
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    };

    const unreadCount = notifications.filter(n => !n.read).length;

    return (
        <NotificationContext.Provider value={{ notifications, unreadCount, addNotification, markAllRead, markRead }}>
            {children}
        </NotificationContext.Provider>
    );
}

export function useNotifications() {
    const ctx = useContext(NotificationContext);
    if (!ctx) throw new Error('useNotifications must be used inside NotificationProvider');
    return ctx;
}
