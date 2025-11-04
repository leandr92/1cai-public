import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import type { Notification } from '../lib/supabase';
import { useAuth } from './AuthContext';

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  clearNotification: (id: string) => Promise<void>;
  sendNotification: (params: {
    title: string;
    message: string;
    type?: string;
    priority?: 'low' | 'normal' | 'high' | 'urgent';
  }) => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // Load notifications for current user
  useEffect(() => {
    if (!user) {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }

    loadNotifications();

    // Subscribe to real-time updates
    const channel = supabase
      .channel('notifications-changes')
      .on('postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          console.log('Notification change:', payload);
          loadNotifications();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  async function loadNotifications() {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      setNotifications(data || []);
      
      // Count unread (pending status)
      const unread = (data || []).filter(n => n.status === 'pending').length;
      setUnreadCount(unread);
    } catch (error) {
      console.error('Error loading notifications:', error);
    }
  }

  async function markAsRead(id: string) {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ status: 'sent' })
        .eq('id', id)
        .eq('user_id', user?.id);

      if (error) throw error;
      await loadNotifications();
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  }

  async function markAllAsRead() {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('notifications')
        .update({ status: 'sent' })
        .eq('user_id', user.id)
        .eq('status', 'pending');

      if (error) throw error;
      await loadNotifications();
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  }

  async function clearNotification(id: string) {
    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', id)
        .eq('user_id', user?.id);

      if (error) throw error;
      await loadNotifications();
    } catch (error) {
      console.error('Error clearing notification:', error);
    }
  }

  async function sendNotification(params: {
    title: string;
    message: string;
    type?: string;
    priority?: 'low' | 'normal' | 'high' | 'urgent';
  }) {
    if (!user) return;

    try {
      const { error } = await supabase.functions.invoke('realtime-notifications', {
        body: {
          action: 'send_notification',
          notification_type: params.type || 'info',
          recipients: [{ id: user.id, email: user.email }],
          title: params.title,
          message: params.message,
          channels: ['web'],
          priority: params.priority || 'normal',
          user_id: user.id,
        },
      });

      if (error) throw error;
    } catch (error) {
      console.error('Error sending notification:', error);
    }
  }

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        markAsRead,
        markAllAsRead,
        clearNotification,
        sendNotification,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
}
