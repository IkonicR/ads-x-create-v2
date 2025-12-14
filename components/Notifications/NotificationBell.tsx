import React from 'react';
import { motion } from 'framer-motion';
import { Bell } from 'lucide-react';
import { useNotification } from '../../context/NotificationContext';
import { useTheme } from '../../context/ThemeContext';

interface NotificationBellProps {
    onClick: () => void;
}

export const NotificationBell: React.FC<NotificationBellProps> = ({ onClick }) => {
    const { unreadCount } = useNotification();
    const { theme } = useTheme();
    const isDark = theme === 'dark';

    return (
        <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={onClick}
            className={`relative p-2 rounded-full transition-colors ${isDark ? 'text-gray-400 hover:text-white hover:bg-white/5' : 'text-gray-600 hover:text-black hover:bg-black/5'}`}
        >
            <Bell size={20} />
            {unreadCount > 0 && (
                <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    key={unreadCount} // Re-animate on count change
                    className="absolute top-1 right-1 w-4 h-4 bg-brand text-white text-[10px] font-bold flex items-center justify-center rounded-full shadow-lg border border-white/20"
                >
                    {unreadCount > 9 ? '9+' : unreadCount}
                </motion.div>
            )}
        </motion.button>
    );
};
