import React, { useState } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Task } from '../../types';
import { NeuCard, useThemeStyles } from '../NeuComponents';
import {
    GripVertical,
    Calendar,
    CheckCircle2,
    Circle,
    AlertCircle,
    MoreHorizontal,
    Trash2,
    Edit3,
    Tag,
    FileText,
    Megaphone,
    Smartphone,
    Mail,
    BarChart3,
    Pin
} from 'lucide-react';
import { motion } from 'framer-motion';

interface TaskCardProps {
    task: Task;
    onEdit: (task: Task) => void;
    onDelete: (taskId: string) => void;
    isDragging?: boolean;
}

// Category icons using Lucide
const CATEGORY_ICONS: Record<string, React.ReactNode> = {
    content: <FileText size={12} className="text-blue-400" />,
    ads: <Megaphone size={12} className="text-purple-400" />,
    social: <Smartphone size={12} className="text-pink-400" />,
    email: <Mail size={12} className="text-green-400" />,
    analytics: <BarChart3 size={12} className="text-orange-400" />,
    other: <Pin size={12} className="text-gray-400" />
};

// Priority colors
const PRIORITY_COLORS: Record<Task['priority'], string> = {
    'Low': 'bg-green-500',
    'Medium': 'bg-yellow-500',
    'High': 'bg-orange-500',
    'Urgent': 'bg-red-500'
};

export const TaskCard: React.FC<TaskCardProps> = ({ task, onEdit, onDelete, isDragging }) => {
    const { styles } = useThemeStyles();
    const [showMenu, setShowMenu] = useState(false);

    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging: isSortableDragging
    } = useSortable({ id: task.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isSortableDragging ? 0.5 : 1
    };

    // Calculate subtask progress
    const subtaskCount = task.subtasks?.length || 0;
    const completedSubtasks = task.subtasks?.filter(st => st.done).length || 0;
    const subtaskProgress = subtaskCount > 0 ? (completedSubtasks / subtaskCount) * 100 : 0;

    // Check if overdue
    const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'Done';

    // Format due date
    const formatDueDate = (date: string) => {
        const d = new Date(date);
        const today = new Date();
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        if (d.toDateString() === today.toDateString()) return 'Today';
        if (d.toDateString() === tomorrow.toDateString()) return 'Tomorrow';

        return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    };

    const categoryIcon = CATEGORY_ICONS[task.category || 'other'] || CATEGORY_ICONS.other;

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...attributes}
            {...listeners}
            className="touch-none"
        >
            <NeuCard
                className={`p-3 group relative transition-all duration-200 cursor-grab active:cursor-grabbing ${isDragging || isSortableDragging ? 'shadow-2xl ring-2 ring-brand/50 scale-[1.02]' : ''
                    }`}
            >
                {/* Priority indicator bar */}
                <div className={`absolute left-0 top-0 bottom-0 w-1 rounded-l-xl ${PRIORITY_COLORS[task.priority]}`} />

                {/* Header row */}
                <div className="flex items-start gap-2 pl-2">
                    {/* Drag handle - always visible now */}
                    <div className={`p-1 ${styles.textSub} opacity-40 group-hover:opacity-100 transition-opacity`}>
                        <GripVertical size={14} />
                    </div>

                    {/* Category icon */}
                    <span className="flex items-center" title={task.category}>
                        {categoryIcon}
                    </span>

                    {/* Title */}
                    <h4
                        className={`flex-1 font-medium ${styles.textMain} text-sm leading-tight cursor-pointer hover:text-brand transition-colors`}
                        onClick={() => onEdit(task)}
                    >
                        {task.title}
                    </h4>

                    {/* Menu button */}
                    <div className="relative">
                        <button

                            onClick={() => setShowMenu(!showMenu)}
                            className={`p-1 ${styles.textSub} hover:${styles.textMain} opacity-0 group-hover:opacity-100 transition-opacity`}
                        >
                            <MoreHorizontal size={14} />
                        </button>

                        {showMenu && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className={`absolute right-0 top-6 z-50 ${styles.bg} ${styles.shadowOut} rounded-lg border ${styles.border} py-1 min-w-[120px]`}
                            >
                                <button
                                    onClick={() => { onEdit(task); setShowMenu(false); }}
                                    className={`w-full px-3 py-1.5 text-left text-xs ${styles.textSub} hover:${styles.textMain} hover:bg-brand/10 flex items-center gap-2`}
                                >
                                    <Edit3 size={12} /> Edit
                                </button>
                                <button
                                    onClick={() => { onDelete(task.id); setShowMenu(false); }}
                                    className="w-full px-3 py-1.5 text-left text-xs text-red-400 hover:text-red-500 hover:bg-red-500/10 flex items-center gap-2"
                                >
                                    <Trash2 size={12} /> Delete
                                </button>
                            </motion.div>
                        )}
                    </div>
                </div>

                {/* Description preview (if exists) */}
                {task.description && (
                    <p className={`text-xs ${styles.textSub} mt-1 pl-7 line-clamp-2`}>
                        {task.description}
                    </p>
                )}

                {/* Subtask progress */}
                {subtaskCount > 0 && (
                    <div className="mt-2 pl-7">
                        <div className="flex items-center gap-2 text-xs">
                            <div className="flex-1 h-1 bg-gray-700 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-brand transition-all duration-300"
                                    style={{ width: `${subtaskProgress}%` }}
                                />
                            </div>
                            <span className={styles.textSub}>
                                {completedSubtasks}/{subtaskCount}
                            </span>
                        </div>
                    </div>
                )}

                {/* Footer: Labels + Due date */}
                <div className="flex items-center justify-between mt-2 pl-7">
                    {/* Labels */}
                    <div className="flex gap-1 flex-wrap">
                        {task.labels?.slice(0, 2).map((label, i) => (
                            <span
                                key={i}
                                className={`text-[10px] px-1.5 py-0.5 rounded-full ${styles.bgAccent} ${styles.textSub}`}
                            >
                                {label}
                            </span>
                        ))}
                        {(task.labels?.length || 0) > 2 && (
                            <span className={`text-[10px] ${styles.textSub}`}>
                                +{task.labels!.length - 2}
                            </span>
                        )}
                    </div>

                    {/* Due date */}
                    {task.dueDate && (
                        <div className={`flex items-center gap-1 text-xs ${isOverdue ? 'text-red-400' : styles.textSub}`}>
                            <Calendar size={10} />
                            <span>{formatDueDate(task.dueDate)}</span>
                        </div>
                    )}
                </div>
            </NeuCard>
        </div>
    );
};

export default TaskCard;
