
import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { AnimatePresence } from 'framer-motion';
import { NeuToast, Toast } from '../components/NeuModal';
import { supabase } from '../services/supabase';
import { useAuth } from './AuthContext';
import { Notification } from '../types';

const TOAST_DURATION = 4000; // 4s - Figma/Linear sweet spot
const MAX_TOASTS = 3; // Prevents visual overwhelm

interface NotificationContextType {
  // Toast (Ephemeral - no DB)
  toast: (data: Omit<Toast, 'id'>) => void;
  // Notify (Persistent - writes to DB)
  notify: (data: Omit<Toast, 'id'>) => void;
  // Persistent Notifications
  notifications: Notification[];
  unreadCount: number;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  clearAllNotifications: () => Promise<void>;
  deleteNotification: (id: string) => Promise<void>;
  loading: boolean;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) throw new Error('useNotification must be used within a NotificationProvider');
  return context;
};

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // --- Toast Logic ---
  const [toasts, setToasts] = useState<Toast[]>([]);

  // Ephemeral toast - UI only, no DB
  const toast = useCallback((toastData: Omit<Toast, 'id'>) => {
    const id = Date.now().toString();
    const newToast = { ...toastData, id };

    setToasts(prev => {
      // Limit to MAX_TOASTS - remove oldest if needed
      const updated = [newToast, ...prev];
      if (updated.length > MAX_TOASTS) {
        return updated.slice(0, MAX_TOASTS);
      }
      return updated;
    });

    // Auto dismiss
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, TOAST_DURATION);
  }, []);

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  // --- Real-time Notifications ---
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  // Persistent notify - writes to DB AND shows toast
  const notify = useCallback(async (data: Omit<Toast, 'id'>) => {
    // Always show toast immediately for feedback
    toast(data);

    // If no user, can't persist
    if (!user) return;

    try {
      // Persist to DB
      const { error } = await supabase
        .from('notifications')
        .insert({
          user_id: user.id,
          type: data.type,
          title: data.title,
          message: data.message,
          link: data.link
        });

      if (error) throw error;
      // Realtime subscription will update the notifications list
    } catch (err) {
      console.error("Failed to persist notification:", err);
    }
  }, [user, toast]);

  // Fetch Initial Data
  const fetchNotifications = useCallback(async () => {
    if (!user) return;
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;

      setNotifications(data || []);

      // Count unread
      const { count, error: countError } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('is_read', false);

      if (!countError) setUnreadCount(count || 0);

    } catch (err) {
      console.error("Error fetching notifications:", err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Actions
  const markAsRead = async (id: string) => {
    // Optimistic Update
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
    setUnreadCount(prev => Math.max(0, prev - 1));

    await supabase.from('notifications').update({ is_read: true }).eq('id', id);
  };

  const markAllAsRead = async () => {
    // Optimistic
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    setUnreadCount(0);

    await supabase.from('notifications').update({ is_read: true }).eq('user_id', user?.id).eq('is_read', false);
  };

  const deleteNotification = async (id: string) => {
    if (!user) return;

    // Optimistic
    const notification = notifications.find(n => n.id === id);
    setNotifications(prev => prev.filter(n => n.id !== id));
    if (notification && !notification.is_read) {
      setUnreadCount(prev => Math.max(0, prev - 1));
    }

    const { error } = await supabase.from('notifications').delete().eq('id', id);
    if (error) console.error('[Notifications] Delete failed:', error);
  };

  const clearAllNotifications = async () => {
    if (!user) return;

    // Optimistic
    setNotifications([]);
    setUnreadCount(0);

    const { error } = await supabase.from('notifications').delete().eq('user_id', user.id);
    if (error) console.error('[Notifications] Clear all failed:', error);
  };

  // Subscribe to realtime - but DON'T trigger toast (caller already did)
  useEffect(() => {
    if (!user) return;

    fetchNotifications();

    const subscription = supabase
      .channel('public:notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          const newNotification = payload.new as Notification;
          setNotifications(prev => [newNotification, ...prev]);
          setUnreadCount(prev => prev + 1);
          // NOTE: We do NOT show a toast here anymore.
          // The caller of notify() already showed the toast.
          // This prevents double-toasting.
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [user, fetchNotifications]);

  return (
    <NotificationContext.Provider value={{
      toast,
      notify,
      notifications,
      unreadCount,
      markAsRead,
      markAllAsRead,
      clearAllNotifications,
      deleteNotification,
      loading
    }}>
      {children}

      {/* Toast Container - Desktop: top-right (under header), Mobile: bottom-center (above MobileDock) */}
      <div className="fixed z-[100] flex flex-col gap-3 pointer-events-none
        top-20 right-6 md:top-20 md:right-6
        max-md:bottom-24 max-md:left-1/2 max-md:-translate-x-1/2 max-md:top-auto max-md:right-auto
      ">
        <AnimatePresence>
          {toasts.map(t => (
            <div key={t.id} className="pointer-events-auto">
              <NeuToast toast={t} onClose={removeToast} />
            </div>
          ))}
        </AnimatePresence>
      </div>
    </NotificationContext.Provider>
  );
};
