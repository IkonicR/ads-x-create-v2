import React from 'react';
import { motion } from 'framer-motion';
import { Notification } from '../../types';
import { useTheme } from '../../context/ThemeContext';
import { Check, Info, AlertTriangle, XCircle, Bell, Trash2 } from 'lucide-react';

interface NotificationItemProps {
    notification: Notification;
    onClick: (notification: Notification) => void;
    onDelete?: (id: string) => void;
}

export const NotificationItem: React.FC<NotificationItemProps> = ({ notification, onClick, onDelete }) => {
    const { theme } = useTheme();
    const isDark = theme === 'dark';

    const icons = {
        info: <Info size={16} className="text-blue-500" />,
        success: <Check size={16} className="text-green-500" />,
        warning: <AlertTriangle size={16} className="text-yellow-500" />,
        error: <XCircle size={16} className="text-red-500" />,
        system: <Bell size={16} className="text-purple-500" />
    };

    const timeAgo = (dateStr: string) => {
        const date = new Date(dateStr);
        const now = new Date();
        const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

        if (diffInSeconds < 60) return 'Just now';
        if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
        if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
        return `${Math.floor(diffInSeconds / 86400)}d ago`;
    };

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onClick(notification)}
            className={`
        relative p-4 rounded-2xl cursor-pointer transition-all mb-3 group
        ${isDark ? 'bg-neu-dark shadow-neu-out-dark' : 'bg-neu-light shadow-neu-out-light'}
        ${!notification.is_read ? 'border-l-4 border-brand pl-3' : 'pl-4'}
      `}
        >
            <div className="flex gap-3 items-start">
                <div className={`mt-1 p-2 rounded-full ${isDark ? 'bg-white/5' : 'bg-black/5'}`}>
                    {icons[notification.type] || icons.info}
                </div>
                <div className="flex-1">
                    <h4 className={`text-sm font-bold ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>
                        {notification.title}
                    </h4>
                    <p className={`text-xs mt-1 leading-relaxed ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                        {notification.message}
                    </p>
                    <span className="text-[10px] opacity-40 mt-2 block font-mono uppercase tracking-wider">
                        {timeAgo(notification.created_at)}
                    </span>
                </div>
                <div className="flex items-center gap-2">
                    {!notification.is_read && (
                        <div className="w-2 h-2 rounded-full bg-brand mt-2" />
                    )}
                    {onDelete && (
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onDelete(notification.id);
                            }}
                            className={`p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500/10 ${isDark ? 'text-gray-500 hover:text-red-400' : 'text-gray-400 hover:text-red-500'}`}
                            title="Delete notification"
                        >
                            <Trash2 size={14} />
                        </button>
                    )}
                </div>
            </div>
        </motion.div>
    );
};
