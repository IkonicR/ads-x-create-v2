/**
 * ChatHistoryPopover - Floating popover for session history
 */
import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Plus, MessageSquare, Trash2 } from 'lucide-react';
import { useThemeStyles, NeuButton, NeuIconButton } from './NeuComponents';
import { ChatSession } from '../services/chatService';

interface ChatHistoryPopoverProps {
    sessions: ChatSession[];
    activeSessionId: string | null;
    onSelect: (session: ChatSession) => void;
    onNewChat: () => void;
    onDelete: (sessionId: string) => Promise<void>;
    onClose: () => void;
}

// Group sessions by date
const groupByDate = (sessions: ChatSession[]) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const groups: { label: string; sessions: ChatSession[] }[] = [
        { label: 'Today', sessions: [] },
        { label: 'Yesterday', sessions: [] },
        { label: 'Older', sessions: [] }
    ];

    sessions.forEach(session => {
        const sessionDate = new Date(session.updated_at);
        sessionDate.setHours(0, 0, 0, 0);

        if (sessionDate.getTime() === today.getTime()) {
            groups[0].sessions.push(session);
        } else if (sessionDate.getTime() === yesterday.getTime()) {
            groups[1].sessions.push(session);
        } else {
            groups[2].sessions.push(session);
        }
    });

    return groups.filter(g => g.sessions.length > 0);
};

export const ChatHistoryPopover: React.FC<ChatHistoryPopoverProps> = ({
    sessions,
    activeSessionId,
    onSelect,
    onNewChat,
    onDelete,
    onClose
}) => {
    const { styles } = useThemeStyles();
    const popoverRef = useRef<HTMLDivElement>(null);
    const [deletingId, setDeletingId] = useState<string | null>(null);

    // Click outside to close
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
                onClose();
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [onClose]);

    const handleDelete = async (e: React.MouseEvent, sessionId: string) => {
        e.stopPropagation(); // Prevent selecting the session
        setDeletingId(sessionId);
        await onDelete(sessionId);
        setDeletingId(null);
    };

    const grouped = groupByDate(sessions);

    return (
        <motion.div
            ref={popoverRef}
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className={`
        absolute top-full right-0 mt-2 z-50
        w-80 max-h-80 overflow-hidden
        rounded-xl ${styles.bg} ${styles.shadowOut}
        border border-gray-200/50 dark:border-gray-700/50
      `}
        >
            {/* Sessions List */}
            <div className="max-h-60 overflow-y-auto custom-scrollbar p-2">
                {grouped.length === 0 ? (
                    <div className={`text-center py-6 ${styles.textSub} text-sm`}>
                        No chat history yet
                    </div>
                ) : (
                    grouped.map(group => (
                        <div key={group.label} className="mb-2">
                            <div className={`text-xs font-bold uppercase tracking-wider px-2 py-1 ${styles.textSub}`}>
                                {group.label}
                            </div>
                            {group.sessions.map(session => (
                                <div
                                    key={session.id}
                                    className={`
                                        flex items-center gap-2 px-3 py-2 rounded-lg text-sm group
                                        transition-all hover:bg-brand/10
                                        ${session.id === activeSessionId ? 'bg-brand/5' : ''}
                                        ${deletingId === session.id ? 'opacity-50' : ''}
                                    `}
                                >
                                    <button
                                        onClick={() => onSelect(session)}
                                        className="flex-1 flex items-center gap-2 text-left min-w-0"
                                        disabled={deletingId === session.id}
                                    >
                                        <MessageSquare size={14} className={`${styles.textSub} shrink-0`} />
                                        <span className={`flex-1 truncate ${styles.textMain}`}>
                                            {session.title}
                                        </span>
                                        {session.id === activeSessionId && (
                                            <Check size={14} className="text-brand shrink-0" />
                                        )}
                                    </button>
                                    {/* Delete Button - visible on hover or if deleting */}
                                    <button
                                        onClick={(e) => handleDelete(e, session.id)}
                                        disabled={deletingId === session.id}
                                        className={`
                                            shrink-0 p-1 rounded-md
                                            opacity-0 group-hover:opacity-100 transition-opacity
                                            hover:bg-red-100 dark:hover:bg-red-900/30
                                            text-gray-400 hover:text-red-500
                                            ${deletingId === session.id ? 'opacity-100 animate-pulse' : ''}
                                        `}
                                        title="Delete chat"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    ))
                )}
            </div>

            {/* New Chat Button */}
            <div className={`p-2 border-t border-gray-200/50 dark:border-gray-700/50`}>
                <NeuButton
                    onClick={onNewChat}
                    className="w-full justify-center text-sm py-2"
                >
                    <Plus size={14} /> New Chat
                </NeuButton>
            </div>
        </motion.div>
    );
};
