import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCheck, Trash2 } from 'lucide-react';
import { useNotification } from '../../context/NotificationContext';
import { useTheme } from '../../context/ThemeContext';
import { NotificationItem } from './NotificationItem';
import { NeuTabs } from '../NeuComponents';

interface NotificationDrawerProps {
    isOpen: boolean;
    onClose: () => void;
}

export const NotificationDrawer: React.FC<NotificationDrawerProps> = ({ isOpen, onClose }) => {
    const { notifications, markAsRead, markAllAsRead, clearAllNotifications, deleteNotification, unreadCount } = useNotification();
    const { theme } = useTheme();
    const isDark = theme === 'dark';
    const [activeTab, setActiveTab] = useState('all');

    const filteredNotifications = activeTab === 'all'
        ? notifications
        : notifications.filter(n => !n.is_read);

    // Animation Variants
    const drawerVariants = {
        closed: { x: "100%", opacity: 0 },
        open: {
            x: 0,
            opacity: 1,
            transition: { type: "spring", stiffness: 300, damping: 30 }
        }
    };

    // Render via Portal to escape all parent stacking contexts
    return createPortal(
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 z-50 bg-black/20 backdrop-blur-sm"
                    />

                    {/* Drawer */}
                    <motion.div
                        variants={drawerVariants}
                        initial="closed"
                        animate="open"
                        exit="closed"
                        className={`
              fixed top-0 right-0 h-full w-full md:w-[400px] z-[60]
              flex flex-col shadow-2xl
              ${isDark ? 'bg-neu-dark border-l border-white/5' : 'bg-neu-light border-l border-black/5'}
            `}
                    >
                        {/* Header */}
                        <div className="p-6 pb-2">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                    Notifications
                                </h2>
                                <div className="flex gap-2">
                                    <button
                                        onClick={markAllAsRead}
                                        className="p-2 rounded-full hover:bg-brand/10 text-brand transition-colors"
                                        title="Mark all as read"
                                    >
                                        <CheckCheck size={18} />
                                    </button>
                                    <button
                                        onClick={() => {
                                            clearAllNotifications();
                                            onClose();
                                        }}
                                        className="p-2 rounded-full hover:bg-red-500/10 text-red-400 hover:text-red-500 transition-colors"
                                        title="Clear all notifications"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                    <button
                                        onClick={onClose}
                                        className={`p-2 rounded-full hover:bg-black/5 ${isDark ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-black'}`}
                                    >
                                        <X size={20} />
                                    </button>
                                </div>
                            </div>

                            <NeuTabs
                                tabs={[
                                    { id: 'all', label: 'All' },
                                    { id: 'unread', label: `Unread (${unreadCount})` }
                                ]}
                                activeTab={activeTab}
                                onChange={setActiveTab}
                            />
                        </div>

                        {/* List */}
                        <div className="flex-1 overflow-y-auto p-6 pt-2 custom-scrollbar">
                            <AnimatePresence mode="popLayout">
                                {filteredNotifications.length > 0 ? (
                                    filteredNotifications.map(notification => (
                                        <NotificationItem
                                            key={notification.id}
                                            notification={notification}
                                            onClick={(n) => {
                                                if (!n.is_read) markAsRead(n.id);
                                                if (n.link) window.location.href = n.link;
                                            }}
                                            onDelete={(id) => deleteNotification(id)}
                                        />
                                    ))
                                ) : (
                                    <motion.div
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 0.5 }}
                                        className="flex flex-col items-center justify-center h-full text-center p-8"
                                    >
                                        <div className="w-16 h-16 rounded-full bg-gray-500/10 flex items-center justify-center mb-4 text-gray-400">
                                            <CheckCheck size={32} />
                                        </div>
                                        <p className="text-sm font-medium">No notifications</p>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>,
        document.body
    );
};
