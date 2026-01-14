import React, { useState, useEffect } from 'react';
import { Task, TaskCategory, Subtask } from '../../types';
import { NeuCard, NeuButton, NeuInput, NeuTextArea, NeuDropdown, useThemeStyles, NeuCloseButton } from '../NeuComponents';
import {
    Calendar,
    Tag,
    Plus,
    Trash2,
    CheckCircle2,
    Circle,
    Flag,
    Folder,
    Clock,
    X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { DatePicker } from '../DatePicker';

interface TaskDetailModalProps {
    task: Task | null;
    isOpen: boolean;
    onClose: () => void;
    onSave: (task: Task) => void;
    onDelete: (taskId: string) => void;
    isNew?: boolean;
}

const PRIORITY_OPTIONS = [
    { value: 'Low', label: 'Low', color: 'text-green-400' },
    { value: 'Medium', label: 'Medium', color: 'text-yellow-400' },
    { value: 'High', label: 'High', color: 'text-orange-400' },
    { value: 'Urgent', label: 'Urgent', color: 'text-red-400' }
];

const CATEGORY_OPTIONS = [
    { value: 'content', label: '📝 Content' },
    { value: 'ads', label: '📢 Ads' },
    { value: 'social', label: '📱 Social' },
    { value: 'email', label: '✉️ Email' },
    { value: 'analytics', label: '📊 Analytics' },
    { value: 'other', label: '📌 Other' }
];

const STATUS_OPTIONS = [
    { value: 'To Do', label: 'To Do' },
    { value: 'In Progress', label: 'In Progress' },
    { value: 'Done', label: 'Done' },
    { value: 'Blocked', label: 'Blocked' }
];

export const TaskDetailModal: React.FC<TaskDetailModalProps> = ({
    task,
    isOpen,
    onClose,
    onSave,
    onDelete,
    isNew = false
}) => {
    const { styles } = useThemeStyles();
    const [editedTask, setEditedTask] = useState<Task | null>(null);
    const [newSubtaskTitle, setNewSubtaskTitle] = useState('');
    const [newLabel, setNewLabel] = useState('');
    const [showDatePicker, setShowDatePicker] = useState(false);

    // Sync with prop
    useEffect(() => {
        if (task) {
            setEditedTask({ ...task });
        }
    }, [task]);

    if (!isOpen || !editedTask) return null;

    const handleSave = () => {
        if (editedTask.title.trim()) {
            onSave(editedTask);
            onClose();
        }
    };

    const handleAddSubtask = () => {
        if (!newSubtaskTitle.trim()) return;

        const newSubtask: Subtask = {
            id: `sub_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
            title: newSubtaskTitle.trim(),
            done: false
        };

        setEditedTask({
            ...editedTask,
            subtasks: [...(editedTask.subtasks || []), newSubtask]
        });
        setNewSubtaskTitle('');
    };

    const toggleSubtask = (subtaskId: string) => {
        setEditedTask({
            ...editedTask,
            subtasks: (editedTask.subtasks || []).map(st =>
                st.id === subtaskId ? { ...st, done: !st.done } : st
            )
        });
    };

    const removeSubtask = (subtaskId: string) => {
        setEditedTask({
            ...editedTask,
            subtasks: (editedTask.subtasks || []).filter(st => st.id !== subtaskId)
        });
    };

    const handleAddLabel = () => {
        if (!newLabel.trim()) return;
        if (editedTask.labels?.includes(newLabel.trim())) return;

        setEditedTask({
            ...editedTask,
            labels: [...(editedTask.labels || []), newLabel.trim()]
        });
        setNewLabel('');
    };

    const removeLabel = (label: string) => {
        setEditedTask({
            ...editedTask,
            labels: (editedTask.labels || []).filter(l => l !== label)
        });
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
                    onClick={onClose}
                >
                    <motion.div
                        initial={{ scale: 0.95, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.95, opacity: 0 }}
                        onClick={e => e.stopPropagation()}
                        className="w-full max-w-xl"
                    >
                        <NeuCard className="p-6 max-h-[85vh] overflow-y-auto">
                            {/* Header */}
                            <div className="flex items-center justify-between mb-6">
                                <h2 className={`text-xl font-bold ${styles.textMain}`}>
                                    {isNew ? 'New Task' : 'Edit Task'}
                                </h2>
                                <NeuCloseButton onClick={onClose} />
                            </div>

                            {/* Title */}
                            <div className="mb-4">
                                <label className={`text-xs font-bold ${styles.textSub} uppercase mb-1 block`}>
                                    Title
                                </label>
                                <NeuInput
                                    value={editedTask.title}
                                    onChange={e => setEditedTask({ ...editedTask, title: e.target.value })}
                                    placeholder="What needs to be done?"
                                    className="w-full"
                                    autoFocus
                                />
                            </div>

                            {/* Description */}
                            <div className="mb-4">
                                <label className={`text-xs font-bold ${styles.textSub} uppercase mb-1 block`}>
                                    Description
                                </label>
                                <NeuTextArea
                                    value={editedTask.description || ''}
                                    onChange={e => setEditedTask({ ...editedTask, description: e.target.value })}
                                    placeholder="Add details, notes, or context..."
                                    className="w-full min-h-[80px]"
                                />
                            </div>

                            {/* Status, Priority, Category row */}
                            <div className="grid grid-cols-3 gap-3 mb-4">
                                <div>
                                    <label className={`text-xs font-bold ${styles.textSub} uppercase mb-1 block`}>
                                        Status
                                    </label>
                                    <NeuDropdown
                                        value={editedTask.status}
                                        options={STATUS_OPTIONS}
                                        onChange={val => setEditedTask({ ...editedTask, status: val as Task['status'] })}
                                    />
                                </div>
                                <div>
                                    <label className={`text-xs font-bold ${styles.textSub} uppercase mb-1 block`}>
                                        Priority
                                    </label>
                                    <NeuDropdown
                                        value={editedTask.priority}
                                        options={PRIORITY_OPTIONS}
                                        onChange={val => setEditedTask({ ...editedTask, priority: val as Task['priority'] })}
                                    />
                                </div>
                                <div>
                                    <label className={`text-xs font-bold ${styles.textSub} uppercase mb-1 block`}>
                                        Category
                                    </label>
                                    <NeuDropdown
                                        value={editedTask.category || 'other'}
                                        options={CATEGORY_OPTIONS}
                                        onChange={val => setEditedTask({ ...editedTask, category: val as TaskCategory })}
                                    />
                                </div>
                            </div>

                            {/* Due Date */}
                            <div className="mb-4">
                                <label className={`text-xs font-bold ${styles.textSub} uppercase mb-1 block`}>
                                    Due Date
                                </label>
                                <div className="relative">
                                    <NeuButton
                                        variant="secondary"
                                        onClick={() => setShowDatePicker(!showDatePicker)}
                                        className="w-full justify-start"
                                    >
                                        <Calendar size={14} />
                                        {editedTask.dueDate
                                            ? new Date(editedTask.dueDate).toLocaleDateString('en-US', {
                                                weekday: 'short', month: 'short', day: 'numeric'
                                            })
                                            : 'Set due date'
                                        }
                                    </NeuButton>
                                    {showDatePicker && (
                                        <div className="absolute top-full left-0 mt-2 z-50">
                                            <DatePicker
                                                selectedDate={editedTask.dueDate ? new Date(editedTask.dueDate) : undefined}
                                                onSelect={(date) => {
                                                    setEditedTask({ ...editedTask, dueDate: date?.toISOString() });
                                                    setShowDatePicker(false);
                                                }}
                                                onClose={() => setShowDatePicker(false)}
                                            />
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Labels */}
                            <div className="mb-4">
                                <label className={`text-xs font-bold ${styles.textSub} uppercase mb-1 block`}>
                                    Labels
                                </label>
                                <div className="flex flex-wrap gap-2 mb-2">
                                    {editedTask.labels?.map((label) => (
                                        <span
                                            key={label}
                                            className={`px-2 py-1 text-xs rounded-full ${styles.bgAccent} ${styles.textMain} flex items-center gap-1`}
                                        >
                                            {label}
                                            <button onClick={() => removeLabel(label)} className="hover:text-red-400">
                                                <X size={10} />
                                            </button>
                                        </span>
                                    ))}
                                </div>
                                <div className="flex gap-2">
                                    <NeuInput
                                        value={newLabel}
                                        onChange={e => setNewLabel(e.target.value)}
                                        placeholder="Add label..."
                                        className="flex-1"
                                        onKeyDown={e => e.key === 'Enter' && handleAddLabel()}
                                    />
                                    <NeuButton onClick={handleAddLabel} disabled={!newLabel.trim()}>
                                        <Plus size={14} />
                                    </NeuButton>
                                </div>
                            </div>

                            {/* Subtasks (Checkpoints) */}
                            <div className="mb-6">
                                <label className={`text-xs font-bold ${styles.textSub} uppercase mb-1 block`}>
                                    Checkpoints
                                </label>
                                <div className="space-y-2 mb-2">
                                    {editedTask.subtasks?.map((subtask) => (
                                        <div
                                            key={subtask.id}
                                            className={`flex items-center gap-2 p-2 rounded-lg ${styles.bgAccent}`}
                                        >
                                            <button onClick={() => toggleSubtask(subtask.id)}>
                                                {subtask.done
                                                    ? <CheckCircle2 size={16} className="text-green-400" />
                                                    : <Circle size={16} className={styles.textSub} />
                                                }
                                            </button>
                                            <span className={`flex-1 text-sm ${subtask.done ? 'line-through opacity-50' : ''} ${styles.textMain}`}>
                                                {subtask.title}
                                            </span>
                                            <button
                                                onClick={() => removeSubtask(subtask.id)}
                                                className={`${styles.textSub} hover:text-red-400`}
                                            >
                                                <Trash2 size={12} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                                <div className="flex gap-2">
                                    <NeuInput
                                        value={newSubtaskTitle}
                                        onChange={e => setNewSubtaskTitle(e.target.value)}
                                        placeholder="Add checkpoint..."
                                        className="flex-1"
                                        onKeyDown={e => e.key === 'Enter' && handleAddSubtask()}
                                    />
                                    <NeuButton onClick={handleAddSubtask} disabled={!newSubtaskTitle.trim()}>
                                        <Plus size={14} />
                                    </NeuButton>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex items-center justify-between pt-4 border-t border-gray-700">
                                {!isNew && (
                                    <NeuButton
                                        variant="secondary"
                                        onClick={() => { onDelete(editedTask.id); onClose(); }}
                                        className="text-red-400 hover:text-red-500"
                                    >
                                        <Trash2 size={14} /> Delete
                                    </NeuButton>
                                )}
                                <div className="flex gap-2 ml-auto">
                                    <NeuButton variant="secondary" onClick={onClose}>
                                        Cancel
                                    </NeuButton>
                                    <NeuButton variant="primary" onClick={handleSave} disabled={!editedTask.title.trim()}>
                                        {isNew ? 'Create Task' : 'Save Changes'}
                                    </NeuButton>
                                </div>
                            </div>
                        </NeuCard>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default TaskDetailModal;
