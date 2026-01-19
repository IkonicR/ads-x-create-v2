import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Task, TaskCategory, Subtask, TaskAttachment, Asset, TaskTechSpecs, DimensionUnit, FileFormat } from '../../types';
import { supabase } from '../../services/supabase';
import { NeuCard, NeuButton, NeuInput, NeuTextArea, NeuDropdown, NeuCloseButton, useThemeStyles } from '../NeuComponents';
import {
    X,
    FileText,
    Calendar,
    Tag,
    Plus,
    Trash2,
    CheckCircle2,
    Circle,
    ChevronRight,
    Clock,
    Paperclip,
    Megaphone,
    Smartphone,
    Mail,
    BarChart3,
    Pin,
    Upload,
    File,
    Image as ImageIcon,
    Link2,
    Loader2,
    Building2,
    User,
    Bell,
    Mail as MailIcon,
    Check,
    Ruler
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { DatePicker } from '../DatePicker';

interface TaskDetailPanelProps {
    task: Task | null;
    isOpen: boolean;
    onClose: () => void;
    onSave: (task: Task) => void;
    onDelete: (taskId: string) => void;
    isNew?: boolean;
    businessId?: string;
    businesses?: { id: string; name: string }[];
    teamMembers?: { userId: string; userName: string; avatarUrl?: string }[];
}

const PRIORITY_OPTIONS = [
    { value: 'Low', label: 'Low', color: 'bg-green-500' },
    { value: 'Medium', label: 'Medium', color: 'bg-yellow-500' },
    { value: 'High', label: 'High', color: 'bg-orange-500' },
    { value: 'Urgent', label: 'Urgent', color: 'bg-red-500' }
];

const CATEGORY_OPTIONS = [
    { value: 'content', label: 'Content', icon: <FileText size={14} /> },
    { value: 'ads', label: 'Ads', icon: <Megaphone size={14} /> },
    { value: 'social', label: 'Social', icon: <Smartphone size={14} /> },
    { value: 'email', label: 'Email', icon: <Mail size={14} /> },
    { value: 'analytics', label: 'Analytics', icon: <BarChart3 size={14} /> },
    { value: 'other', label: 'Other', icon: <Pin size={14} /> }
];

const STATUS_OPTIONS = [
    { value: 'To Do', label: 'To Do' },
    { value: 'In Progress', label: 'In Progress' },
    { value: 'Blocked', label: 'Blocked' },
    { value: 'Done', label: 'Done' }
];

// Collapsible section with spring animation and optional description
const Section: React.FC<{
    title: string;
    icon: React.ReactNode;
    description?: string;
    badge?: string;
    defaultOpen?: boolean;
    children: React.ReactNode;
}> = ({ title, icon, description, badge, defaultOpen = false, children }) => {
    const [isOpen, setIsOpen] = useState(defaultOpen);
    const { styles } = useThemeStyles();

    return (
        <div className={`border-t ${styles.border} pt-3`}>
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className={`w-full flex items-center gap-2 text-left py-1 ${styles.textSub} hover:${styles.textMain} transition-colors`}
            >
                {/* Animated chevron - tween, not spring */}
                <motion.div
                    animate={{ rotate: isOpen ? 90 : 0 }}
                    transition={{ type: 'tween', duration: 0.15 }}
                >
                    <ChevronRight size={14} />
                </motion.div>
                {icon}
                <div className="flex-1">
                    <span className="text-xs font-bold uppercase tracking-wider">{title}</span>
                    {description && (
                        <span className={`text-[10px] block ${styles.textSub} opacity-60 mt-0.5`}>
                            {description}
                        </span>
                    )}
                </div>
                {badge && (
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${styles.bgAccent}`}>
                        {badge}
                    </span>
                )}
            </button>
            {/* Animated content reveal - height + opacity for smooth expansion */}
            <AnimatePresence initial={false}>
                {isOpen && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2, ease: 'easeInOut' }}
                        className="overflow-hidden"
                    >
                        <div className="pt-3 px-4 pb-3">
                            {children}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export const TaskDetailPanel: React.FC<TaskDetailPanelProps> = ({
    task,
    isOpen,
    onClose,
    onSave,
    onDelete,
    isNew = false,
    businessId,
    businesses = [],
    teamMembers = []
}) => {
    const { styles } = useThemeStyles();
    const [editedTask, setEditedTask] = useState<Task | null>(null);
    const [newSubtaskTitle, setNewSubtaskTitle] = useState('');
    const [newLabel, setNewLabel] = useState('');
    const [isUploading, setIsUploading] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const [showAssetPicker, setShowAssetPicker] = useState(false);
    const [assets, setAssets] = useState<Asset[]>([]);
    const [selectedAssetIds, setSelectedAssetIds] = useState<string[]>([]);
    const [isLoadingAssets, setIsLoadingAssets] = useState(false);
    const [linkSuccess, setLinkSuccess] = useState(false);

    // Auto-save debounce timer
    const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    // Fetch assets when picker opens
    useEffect(() => {
        if (showAssetPicker && businessId) {
            setIsLoadingAssets(true);
            supabase
                .from('assets')
                .select('*')
                .eq('business_id', businessId)
                .order('created_at', { ascending: false })
                .limit(50)
                .then(({ data }) => {
                    setAssets(data || []);
                    setIsLoadingAssets(false);
                });
        }
    }, [showAssetPicker, businessId]);

    // Sync with prop
    useEffect(() => {
        if (task) {
            setEditedTask({ ...task });
            setShowAssetPicker(false); // Reset picker when opening new task
        }
    }, [task]);

    // Stable save handler
    const handleSave = useCallback(() => {
        if (editedTask && editedTask.title.trim()) {
            onSave(editedTask);
        }
    }, [editedTask, onSave]);

    // Handle escape key - use callback to avoid stale closure
    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && isOpen) {
                onClose();
            }
        };
        window.addEventListener('keydown', handleEscape);
        return () => window.removeEventListener('keydown', handleEscape);
    }, [isOpen, onClose]);

    // Cleanup timeout on unmount
    useEffect(() => {
        return () => {
            if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
        };
    }, []);

    // Auto-save on blur - SKIP for new tasks (they get saved on explicit action only)
    const triggerAutoSave = useCallback(() => {
        // Don't auto-save new tasks - the parent will close the panel on save
        if (isNew) return;

        if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
        saveTimeoutRef.current = setTimeout(() => {
            if (editedTask && editedTask.title.trim()) {
                onSave(editedTask);
            }
        }, 500);
    }, [editedTask, onSave, isNew]);

    // Removed early return - AnimatePresence needs the component to stay mounted during exit

    const handleAddSubtask = () => {
        if (!newSubtaskTitle.trim()) return;

        const newSubtask: Subtask = {
            id: `sub_${Date.now()}_${Math.random().toString(36).slice(2, 6)} `,
            title: newSubtaskTitle.trim(),
            done: false
        };

        const updated = {
            ...editedTask,
            subtasks: [...(editedTask.subtasks || []), newSubtask]
        };
        setEditedTask(updated);
        setNewSubtaskTitle('');
        onSave(updated);
    };

    const toggleSubtask = (subtaskId: string) => {
        const updated = {
            ...editedTask,
            subtasks: (editedTask.subtasks || []).map(st =>
                st.id === subtaskId ? { ...st, done: !st.done } : st
            )
        };
        setEditedTask(updated);
        onSave(updated);
    };

    const removeSubtask = (subtaskId: string) => {
        const updated = {
            ...editedTask,
            subtasks: (editedTask.subtasks || []).filter(st => st.id !== subtaskId)
        };
        setEditedTask(updated);
        onSave(updated);
    };

    const handleAddLabel = () => {
        if (!newLabel.trim()) return;
        if (editedTask.labels?.includes(newLabel.trim())) return;

        const updated = {
            ...editedTask,
            labels: [...(editedTask.labels || []), newLabel.trim()]
        };
        setEditedTask(updated);
        setNewLabel('');
        onSave(updated);
    };

    const removeLabel = (label: string) => {
        const updated = {
            ...editedTask,
            labels: (editedTask.labels || []).filter(l => l !== label)
        };
        setEditedTask(updated);
        onSave(updated);
    };

    const subtaskCount = editedTask?.subtasks?.length || 0;
    const completedSubtasks = editedTask?.subtasks?.filter(st => st.done).length || 0;
    const priorityConfig = editedTask ? PRIORITY_OPTIONS.find(p => p.value === editedTask.priority) : null;

    const handleClose = () => {
        handleSave();
        onClose();
    };

    // Shared file upload handler for both click and drag-drop
    const handleFilesUpload = async (files: FileList | File[]) => {
        if (!files || files.length === 0 || !editedTask) return;

        setIsUploading(true);
        try {
            for (const file of Array.from(files) as File[]) {
                const formData = new FormData();
                formData.append('file', file as Blob);
                formData.append('taskId', editedTask.id);
                formData.append('businessId', businessId || 'default');

                const res = await fetch('/api/tasks/upload', {
                    method: 'POST',
                    body: formData,
                });
                const data = await res.json();
                if (data.success && data.attachment) {
                    const updated = {
                        ...editedTask,
                        attachments: [...(editedTask.attachments || []), data.attachment]
                    };
                    setEditedTask(updated);
                    onSave(updated);
                }
            }
        } catch (err) {
            console.error('Upload failed:', err);
        } finally {
            setIsUploading(false);
        }
    };

    return createPortal(
        <AnimatePresence>
            {isOpen && editedTask && (
                <motion.div
                    key="panel-container"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="fixed inset-0 z-[100]"
                >
                    {/* Backdrop */}
                    <div
                        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                        onClick={handleClose}
                    />

                    {/* Panel */}
                    <motion.div
                        initial={{ x: '100%', width: 420 }}
                        animate={{ x: 0, width: showAssetPicker ? 720 : 420 }}
                        exit={{ x: '100%' }}
                        transition={{ type: 'spring', bounce: 0.1, duration: 0.3 }}
                        className={`absolute top-0 right-0 h-full ${styles.bg} shadow-2xl border-l ${styles.border}`}
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="h-full flex">
                            {/* Task Column */}
                            <div className={`flex-1 flex flex-col ${showAssetPicker ? 'border-r ' + styles.border : ''}`}>
                                {/* Header */}
                                <div className={`flex items-center justify-between p-4 border-b ${styles.border}`}>
                                    <div className="flex items-center gap-2">
                                        <span className={`w-2 h-2 rounded-full ${priorityConfig?.color || 'bg-gray-500'}`} />
                                        <span className={`text-xs font-bold uppercase ${styles.textSub}`}>
                                            {isNew ? 'New Task' : editedTask.status}
                                        </span>
                                    </div>
                                    <NeuCloseButton onClick={handleClose} size="sm" />
                                </div>

                                {/* Content - scrollable */}
                                <div className="flex-1 overflow-y-auto py-4 px-6 space-y-4">
                                    {/* Title - inline editable */}
                                    <input
                                        type="text"
                                        value={editedTask.title}
                                        onChange={e => setEditedTask({ ...editedTask, title: e.target.value })}
                                        onBlur={triggerAutoSave}
                                        placeholder="Task title..."
                                        className={`w-full text-xl font-bold ${styles.textMain} bg-transparent border-none outline-none`}
                                        autoFocus={isNew}
                                    />

                                    {/* Quick metadata chips */}
                                    <div className="flex flex-wrap gap-2">
                                        <NeuDropdown
                                            overlay
                                            value={editedTask.status}
                                            options={STATUS_OPTIONS}
                                            onChange={val => {
                                                const updated = { ...editedTask, status: val as Task['status'] };
                                                setEditedTask(updated);
                                                onSave(updated);
                                            }}
                                        />
                                        <NeuDropdown
                                            overlay
                                            value={editedTask.priority}
                                            options={PRIORITY_OPTIONS}
                                            onChange={val => {
                                                const updated = { ...editedTask, priority: val as Task['priority'] };
                                                setEditedTask(updated);
                                                onSave(updated);
                                            }}
                                        />
                                        <NeuDropdown
                                            overlay
                                            value={editedTask.category || 'other'}
                                            options={CATEGORY_OPTIONS}
                                            onChange={val => {
                                                const updated = { ...editedTask, category: val as TaskCategory };
                                                setEditedTask(updated);
                                                onSave(updated);
                                            }}
                                        />

                                    </div>

                                    {/* Due date - use DatePicker directly */}
                                    <DatePicker
                                        value={editedTask.dueDate ? new Date(editedTask.dueDate) : null}
                                        onChange={(date) => {
                                            const updated = { ...editedTask, dueDate: date.toISOString() };
                                            setEditedTask(updated);
                                            onSave(updated);
                                        }}
                                    />

                                    {/* Repeat section - show if due date is set */}
                                    {editedTask.dueDate && (
                                        <div className={`flex items-center gap-3 py-2 px-3 rounded-lg ${styles.bgAccent}`}>
                                            <span className={`text-xs ${styles.textSub}`}>Repeat:</span>
                                            <div className="flex gap-1.5">
                                                {(['none', 'daily', 'weekly', 'monthly'] as const).map(opt => (
                                                    <button
                                                        key={opt}
                                                        type="button"
                                                        onClick={() => {
                                                            const updated = {
                                                                ...editedTask,
                                                                recurrence: opt === 'none' ? undefined : { type: opt }
                                                            };
                                                            setEditedTask(updated);
                                                            onSave(updated);
                                                        }}
                                                        className={`text-xs px-2.5 py-1 rounded-md transition-all ${(opt === 'none' && !editedTask.recurrence) || editedTask.recurrence?.type === opt
                                                            ? `${styles.shadowIn} text-brand font-medium`
                                                            : `${styles.shadowOut} ${styles.textSub} hover:text-brand`
                                                            }`}
                                                    >
                                                        {opt === 'none' ? 'None' : opt.charAt(0).toUpperCase() + opt.slice(1)}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Description section */}
                                    <Section title="Description" icon={<FileText size={12} />} description="Add notes, briefs, or context">
                                        <NeuTextArea
                                            value={editedTask.description || ''}
                                            onChange={e => setEditedTask({ ...editedTask, description: e.target.value })}
                                            onBlur={triggerAutoSave}
                                            placeholder="Add details, notes, or context..."
                                            className="w-full min-h-[80px]"
                                        />
                                    </Section>

                                    {/* Business section - only show if multiple businesses */}
                                    {businesses.length > 0 && (
                                        <Section
                                            title="Business"
                                            icon={<Building2 size={12} />}
                                            description="Tag this task to a specific business"
                                            badge={editedTask.businessId ? businesses.find(b => b.id === editedTask.businessId)?.name : undefined}
                                        >
                                            <div className="flex flex-wrap gap-2 max-h-[120px] overflow-y-auto">
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        const updated = { ...editedTask, businessId: undefined };
                                                        setEditedTask(updated);
                                                        onSave(updated);
                                                    }}
                                                    className={`text-xs px-3 py-1.5 rounded-lg transition-all ${!editedTask.businessId
                                                        ? `${styles.bgAccent} ${styles.shadowIn} text-brand font-medium`
                                                        : `${styles.bg} ${styles.shadowOut} ${styles.textSub} hover:text-brand`
                                                        }`}
                                                >
                                                    None
                                                </button>
                                                {businesses.map(b => (
                                                    <button
                                                        key={b.id}
                                                        type="button"
                                                        onClick={() => {
                                                            const updated = { ...editedTask, businessId: b.id };
                                                            setEditedTask(updated);
                                                            onSave(updated);
                                                        }}
                                                        className={`text-xs px-3 py-1.5 rounded-lg transition-all truncate max-w-[140px] ${editedTask.businessId === b.id
                                                            ? `${styles.bgAccent} ${styles.shadowIn} text-brand font-medium`
                                                            : `${styles.bg} ${styles.shadowOut} ${styles.textSub} hover:text-brand`
                                                            }`}
                                                        title={b.name}
                                                    >
                                                        {b.name}
                                                    </button>
                                                ))}
                                            </div>
                                        </Section>
                                    )}

                                    {/* Assignee section - only show if team members exist */}
                                    {teamMembers.length > 0 && (
                                        <Section
                                            title="Assignee"
                                            icon={<User size={12} />}
                                            description="Assign this task to a team member"
                                            badge={editedTask.assigneeId ? teamMembers.find(m => m.userId === editedTask.assigneeId)?.userName : undefined}
                                        >
                                            <div className="space-y-3">
                                                {/* Team member pills */}
                                                <div className="flex flex-wrap gap-2 max-h-[120px] overflow-y-auto">
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            const updated = { ...editedTask, assigneeId: undefined };
                                                            setEditedTask(updated);
                                                            onSave(updated);
                                                        }}
                                                        className={`text-xs px-3 py-1.5 rounded-lg transition-all ${!editedTask.assigneeId
                                                            ? `${styles.bgAccent} ${styles.shadowIn} text-brand font-medium`
                                                            : `${styles.bg} ${styles.shadowOut} ${styles.textSub} hover:text-brand`
                                                            }`}
                                                    >
                                                        Unassigned
                                                    </button>
                                                    {teamMembers.map(m => (
                                                        <button
                                                            key={m.userId}
                                                            type="button"
                                                            onClick={() => {
                                                                const updated = { ...editedTask, assigneeId: m.userId };
                                                                setEditedTask(updated);
                                                                onSave(updated);
                                                            }}
                                                            className={`text-xs px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${editedTask.assigneeId === m.userId
                                                                ? `${styles.bgAccent} ${styles.shadowIn} text-brand font-medium`
                                                                : `${styles.bg} ${styles.shadowOut} ${styles.textSub} hover:text-brand`
                                                                }`}
                                                            title={m.userName}
                                                        >
                                                            {m.avatarUrl ? (
                                                                <img src={m.avatarUrl} alt="" className="w-4 h-4 rounded-full" />
                                                            ) : (
                                                                <div className="w-4 h-4 rounded-full bg-brand/20 flex items-center justify-center">
                                                                    <span className="text-[8px] font-bold text-brand">{m.userName.charAt(0).toUpperCase()}</span>
                                                                </div>
                                                            )}
                                                            <span className="truncate max-w-[100px]">{m.userName}</span>
                                                        </button>
                                                    ))}
                                                </div>

                                                {/* Notification toggles - only show when assigned */}
                                                {editedTask.assigneeId && (
                                                    <div className={`flex items-center gap-4 pt-2 border-t ${styles.border}`}>
                                                        <label className={`flex items-center gap-2 text-xs ${styles.textSub} cursor-pointer`}>
                                                            <input
                                                                type="checkbox"
                                                                checked={editedTask.notifyInApp !== false}
                                                                onChange={(e) => {
                                                                    const updated = { ...editedTask, notifyInApp: e.target.checked };
                                                                    setEditedTask(updated);
                                                                    onSave(updated);
                                                                }}
                                                                className="w-3.5 h-3.5 rounded accent-brand"
                                                            />
                                                            <Bell size={12} />
                                                            In-app
                                                        </label>
                                                        <label className={`flex items-center gap-2 text-xs ${styles.textSub} cursor-pointer`}>
                                                            <input
                                                                type="checkbox"
                                                                checked={editedTask.notifyEmail === true}
                                                                onChange={(e) => {
                                                                    const updated = { ...editedTask, notifyEmail: e.target.checked };
                                                                    setEditedTask(updated);
                                                                    onSave(updated);
                                                                }}
                                                                className="w-3.5 h-3.5 rounded accent-brand"
                                                            />
                                                            <MailIcon size={12} />
                                                            Email
                                                        </label>
                                                    </div>
                                                )}
                                            </div>
                                        </Section>
                                    )}

                                    {/* Checkpoints section */}
                                    <Section
                                        title="Checkpoints"
                                        icon={<CheckCircle2 size={12} />}
                                        description="Break into smaller steps to track progress"
                                        badge={subtaskCount > 0 ? `${completedSubtasks}/${subtaskCount}` : undefined}
                                        defaultOpen={subtaskCount > 0}
                                    >
                                        <div className="space-y-2">
                                            {editedTask.subtasks?.map((subtask) => (
                                                <div
                                                    key={subtask.id}
                                                    className={`flex items-center gap-2 p-2 rounded-lg ${styles.bgAccent}`}
                                                >
                                                    <button type="button" onClick={() => toggleSubtask(subtask.id)}>
                                                        {subtask.done
                                                            ? <CheckCircle2 size={16} className="text-green-400" />
                                                            : <Circle size={16} className={styles.textSub} />
                                                        }
                                                    </button>
                                                    <span className={`flex-1 text-sm ${subtask.done ? 'line-through opacity-50' : ''} ${styles.textMain}`}>
                                                        {subtask.title}
                                                    </span>
                                                    <button
                                                        type="button"
                                                        onClick={() => removeSubtask(subtask.id)}
                                                        className={`${styles.textSub} hover:text-red-400`}
                                                    >
                                                        <Trash2 size={12} />
                                                    </button>
                                                </div>
                                            ))}
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
                                    </Section >

                                    {/* Labels section */}
                                    < Section
                                        title="Labels"
                                        icon={< Tag size={12} />}
                                        description="Add tags like 'urgent' or 'campaign-q1' to organize"
                                        badge={editedTask.labels?.length ? `${editedTask.labels.length}` : undefined}
                                    >
                                        <div className="space-y-2">
                                            <div className="flex flex-wrap gap-2">
                                                {editedTask.labels?.map((label) => (
                                                    <span
                                                        key={label}
                                                        className={`px-2 py-1 text-xs rounded-full ${styles.bgAccent} ${styles.textMain} flex items-center gap-1`}
                                                    >
                                                        {label}
                                                        <button type="button" onClick={() => removeLabel(label)} className="hover:text-red-400">
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
                                    </Section >

                                    {/* Technical Specs section */}
                                    <Section
                                        title="Technical Specs"
                                        icon={<Ruler size={12} />}
                                        description="File format and dimension requirements"
                                        badge={editedTask.techSpecs?.fileFormat || editedTask.techSpecs?.dimensions ? '✓' : undefined}
                                    >
                                        <div className="space-y-4">
                                            {/* File Format */}
                                            <div>
                                                <label className={`text-xs font-medium ${styles.textSub} mb-1.5 block`}>File Format</label>
                                                <div className="flex flex-wrap gap-1.5">
                                                    {(['PNG', 'JPG', 'PDF', 'SVG', 'WEBP', 'MP4', 'GIF'] as const).map(format => (
                                                        <button
                                                            key={format}
                                                            type="button"
                                                            onClick={() => {
                                                                const updated = {
                                                                    ...editedTask,
                                                                    techSpecs: {
                                                                        ...editedTask.techSpecs,
                                                                        fileFormat: editedTask.techSpecs?.fileFormat === format ? undefined : format
                                                                    }
                                                                };
                                                                setEditedTask(updated);
                                                                onSave(updated);
                                                            }}
                                                            className={`text-xs px-2.5 py-1.5 rounded-md transition-all ${editedTask.techSpecs?.fileFormat === format
                                                                ? `${styles.shadowIn} text-brand font-medium`
                                                                : `${styles.shadowOut} ${styles.textSub} hover:text-brand`
                                                                }`}
                                                        >
                                                            {format}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>

                                            {/* Dimensions - Grid layout */}
                                            <div className="grid grid-cols-3 gap-3">
                                                {/* Width */}
                                                <div>
                                                    <label className={`text-xs font-medium ${styles.textSub} mb-1.5 block`}>Width</label>
                                                    <NeuInput
                                                        type="number"
                                                        placeholder="0"
                                                        value={editedTask.techSpecs?.dimensions?.width || ''}
                                                        onChange={e => {
                                                            const width = e.target.value ? parseFloat(e.target.value) : undefined;
                                                            const updated = {
                                                                ...editedTask,
                                                                techSpecs: {
                                                                    ...editedTask.techSpecs,
                                                                    dimensions: width || editedTask.techSpecs?.dimensions?.height ? {
                                                                        width: width || 0,
                                                                        height: editedTask.techSpecs?.dimensions?.height || 0,
                                                                        unit: editedTask.techSpecs?.dimensions?.unit || 'cm'
                                                                    } : undefined
                                                                }
                                                            };
                                                            setEditedTask(updated);
                                                        }}
                                                        onBlur={triggerAutoSave}
                                                    />
                                                </div>

                                                {/* Height */}
                                                <div>
                                                    <label className={`text-xs font-medium ${styles.textSub} mb-1.5 block`}>Height</label>
                                                    <NeuInput
                                                        type="number"
                                                        placeholder="0"
                                                        value={editedTask.techSpecs?.dimensions?.height || ''}
                                                        onChange={e => {
                                                            const height = e.target.value ? parseFloat(e.target.value) : undefined;
                                                            const updated = {
                                                                ...editedTask,
                                                                techSpecs: {
                                                                    ...editedTask.techSpecs,
                                                                    dimensions: editedTask.techSpecs?.dimensions?.width || height ? {
                                                                        width: editedTask.techSpecs?.dimensions?.width || 0,
                                                                        height: height || 0,
                                                                        unit: editedTask.techSpecs?.dimensions?.unit || 'cm'
                                                                    } : undefined
                                                                }
                                                            };
                                                            setEditedTask(updated);
                                                        }}
                                                        onBlur={triggerAutoSave}
                                                    />
                                                </div>

                                                {/* Unit Dropdown */}
                                                <div>
                                                    <label className={`text-xs font-medium ${styles.textSub} mb-1.5 block`}>Unit</label>
                                                    <NeuDropdown
                                                        value={editedTask.techSpecs?.dimensions?.unit || 'cm'}
                                                        onChange={value => {
                                                            const unit = value as 'px' | 'cm' | 'mm' | 'in';
                                                            const updated = {
                                                                ...editedTask,
                                                                techSpecs: {
                                                                    ...editedTask.techSpecs,
                                                                    dimensions: {
                                                                        width: editedTask.techSpecs?.dimensions?.width || 0,
                                                                        height: editedTask.techSpecs?.dimensions?.height || 0,
                                                                        unit
                                                                    }
                                                                }
                                                            };
                                                            setEditedTask(updated);
                                                            onSave(updated);
                                                        }}
                                                        options={[
                                                            { value: 'px', label: 'px' },
                                                            { value: 'cm', label: 'cm' },
                                                            { value: 'mm', label: 'mm' },
                                                            { value: 'in', label: 'in' }
                                                        ]}
                                                        overlay
                                                        compact
                                                    />
                                                </div>
                                            </div>

                                            {/* Summary line */}
                                            {editedTask.techSpecs?.dimensions && (editedTask.techSpecs.dimensions.width > 0 || editedTask.techSpecs.dimensions.height > 0) && (
                                                <p className={`text-xs ${styles.textSub} opacity-70`}>
                                                    Output: {editedTask.techSpecs.dimensions.width} × {editedTask.techSpecs.dimensions.height} {editedTask.techSpecs.dimensions.unit}
                                                </p>
                                            )}
                                        </div>
                                    </Section>

                                    {/* Attachments section */}
                                    <Section title="Attachments" icon={<Paperclip size={12} />} description="Upload briefs, reference images, or documents" badge={editedTask.attachments?.length ? `${editedTask.attachments.length}` : undefined}>
                                        <div className="space-y-3">
                                            {/* Existing attachments */}
                                            {editedTask.attachments && editedTask.attachments.length > 0 && (
                                                <div className="grid grid-cols-3 gap-2">
                                                    {editedTask.attachments.map((att) => (
                                                        <div
                                                            key={att.id}
                                                            className={`relative group rounded-lg overflow-hidden ${styles.bgAccent} border ${styles.border}`}
                                                        >
                                                            {att.mimeType?.startsWith('image/') || att.type === 'asset' ? (
                                                                <img src={att.url || att.thumbnailUrl} alt={att.name} className="w-full h-16 object-cover" />
                                                            ) : (
                                                                <div className="w-full h-16 flex items-center justify-center">
                                                                    <File size={24} className={styles.textSub} />
                                                                </div>
                                                            )}
                                                            <div className={`absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center`}>
                                                                <button
                                                                    onClick={() => {
                                                                        const updated = {
                                                                            ...editedTask,
                                                                            attachments: editedTask.attachments?.filter(a => a.id !== att.id)
                                                                        };
                                                                        setEditedTask(updated);
                                                                        onSave(updated);
                                                                    }}
                                                                    className="p-1 text-red-400 hover:text-red-500"
                                                                >
                                                                    <Trash2 size={14} />
                                                                </button>
                                                            </div>
                                                            <p className={`text-[10px] truncate px-1 py-0.5 ${styles.textSub}`}>{att.name}</p>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}

                                            {/* Upload zone with drag-drop support */}
                                            <div
                                                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                                                onDragLeave={() => setIsDragging(false)}
                                                onDrop={(e) => {
                                                    e.preventDefault();
                                                    setIsDragging(false);
                                                    handleFilesUpload(e.dataTransfer.files);
                                                }}
                                                className={`flex flex-col items-center justify-center py-4 border-2 border-dashed rounded-lg transition-colors ${isDragging
                                                    ? 'border-brand bg-brand/10'
                                                    : isUploading
                                                        ? 'opacity-50 cursor-wait ' + styles.border
                                                        : 'cursor-pointer hover:border-brand/50 ' + styles.border
                                                    }`}
                                            >
                                                <label className="flex flex-col items-center w-full cursor-pointer">
                                                    {isUploading ? (
                                                        <>
                                                            <Loader2 size={20} className={`${styles.textSub} animate-spin`} />
                                                            <p className={`text-xs ${styles.textSub} mt-1`}>Uploading...</p>
                                                        </>
                                                    ) : isDragging ? (
                                                        <>
                                                            <Upload size={20} className="text-brand" />
                                                            <p className={`text-xs text-brand mt-1`}>Drop to upload</p>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Upload size={20} className={styles.textSub} />
                                                            <p className={`text-xs ${styles.textSub} mt-1`}>Drop files or click to upload</p>
                                                            <p className={`text-[10px] ${styles.textSub} opacity-50`}>Images, PDFs, Docs (max 10MB)</p>
                                                        </>
                                                    )}
                                                    <input
                                                        type="file"
                                                        className="hidden"
                                                        accept="image/*,.pdf,.doc,.docx,.txt"
                                                        multiple
                                                        disabled={isUploading}
                                                        onChange={(e) => {
                                                            if (e.target.files) {
                                                                handleFilesUpload(e.target.files);
                                                                e.target.value = '';
                                                            }
                                                        }}
                                                    />
                                                </label>
                                            </div>

                                            {/* Link Asset button */}
                                            <button
                                                onClick={() => setShowAssetPicker(true)}
                                                className={`w-full flex items-center justify-center gap-2 py-2 text-xs ${styles.textSub} hover:text-brand transition-colors`}
                                            >
                                                <Link2 size={12} /> Link Generated Asset
                                            </button>
                                        </div>
                                    </Section>

                                    {/* Activity section */}
                                    < Section title="Activity" icon={< Clock size={12} />} description="Track when this task was created and updated" >
                                        <div className={`space-y-2 text-xs ${styles.textSub}`}>
                                            {editedTask.createdAt && (
                                                <div className="flex items-center gap-2">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                                                    Created {new Date(editedTask.createdAt).toLocaleDateString()}
                                                </div>
                                            )}
                                            {editedTask.updatedAt && editedTask.updatedAt !== editedTask.createdAt && (
                                                <div className="flex items-center gap-2">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                                                    Updated {new Date(editedTask.updatedAt).toLocaleDateString()}
                                                </div>
                                            )}
                                        </div>
                                    </Section >
                                </div >

                                {/* Footer */}
                                < div className={`flex items-center justify-between p-4 border-t ${styles.border}`}>
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
                                        <NeuButton variant="primary" onClick={handleClose}>
                                            {isNew ? 'Create' : 'Done'}
                                        </NeuButton>
                                    </div>
                                </div >
                            </div >

                            {/* Asset Picker Column */}
                            <AnimatePresence mode="popLayout">
                                {showAssetPicker && (
                                    <motion.div
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                        transition={{ duration: 0.2 }}
                                        className="w-[300px] h-full flex flex-col overflow-hidden"
                                    >
                                        <div className={`flex items-center justify-between p-4 border-b ${styles.border}`}>
                                            <h3 className={`text-sm font-semibold ${styles.textMain}`}>Link Assets</h3>
                                            <NeuCloseButton
                                                onClick={() => { setShowAssetPicker(false); setSelectedAssetIds([]); }}
                                                size="sm"
                                            />
                                        </div>
                                        <div className="flex-1 overflow-y-auto p-4">
                                            {isLoadingAssets ? (
                                                <div className="flex items-center justify-center py-8">
                                                    <Loader2 size={20} className="animate-spin" />
                                                </div>
                                            ) : assets.length === 0 ? (
                                                <div className={`text-center py-8 ${styles.textSub}`}>
                                                    <ImageIcon size={32} className="mx-auto mb-2 opacity-50" />
                                                    <p className="text-xs">No generated assets yet</p>
                                                    <p className="text-[10px] opacity-50">Generate some ads first!</p>
                                                </div>
                                            ) : (
                                                <div className="grid grid-cols-2 gap-2">
                                                    {assets.map((asset) => {
                                                        const isSelected = selectedAssetIds.includes(asset.id);
                                                        return (
                                                            <button
                                                                key={asset.id}
                                                                onClick={() => {
                                                                    setSelectedAssetIds(prev =>
                                                                        isSelected
                                                                            ? prev.filter(id => id !== asset.id)
                                                                            : [...prev, asset.id]
                                                                    );
                                                                }}
                                                                className={`relative aspect-square rounded-lg overflow-hidden border-2 transition-all ${isSelected
                                                                    ? 'border-brand ring-2 ring-brand/30'
                                                                    : styles.border + ' hover:border-brand/50'
                                                                    }`}
                                                            >
                                                                <img
                                                                    src={asset.content}
                                                                    alt="Generated asset"
                                                                    className="w-full h-full object-cover"
                                                                />
                                                                {isSelected && (
                                                                    <div className="absolute top-1 right-1 w-5 h-5 bg-brand rounded-full flex items-center justify-center">
                                                                        <CheckCircle2 size={14} className="text-white" />
                                                                    </div>
                                                                )}
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                            )}
                                        </div>
                                        {/* Link Selected Footer */}
                                        {selectedAssetIds.length > 0 && (
                                            <div className={`p-4 border-t ${styles.border}`}>
                                                <NeuButton
                                                    variant="primary"
                                                    className="w-full"
                                                    disabled={linkSuccess}
                                                    onClick={() => {
                                                        const newAttachments: TaskAttachment[] = selectedAssetIds.map(assetId => {
                                                            const asset = assets.find(a => a.id === assetId);
                                                            return {
                                                                id: `att_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
                                                                type: 'asset',
                                                                name: asset?.stylePreset || 'Generated Asset',
                                                                url: asset?.content || '',
                                                                mimeType: 'image/png',
                                                                assetId,
                                                                thumbnailUrl: asset?.content,
                                                                createdAt: new Date().toISOString()
                                                            };
                                                        });
                                                        const updated = {
                                                            ...editedTask!,
                                                            attachments: [...(editedTask?.attachments || []), ...newAttachments]
                                                        };
                                                        setEditedTask(updated);
                                                        onSave(updated);

                                                        // Show success feedback before closing
                                                        setLinkSuccess(true);
                                                        setTimeout(() => {
                                                            setShowAssetPicker(false);
                                                            setSelectedAssetIds([]);
                                                            setLinkSuccess(false);
                                                        }, 400);
                                                    }}
                                                >
                                                    {linkSuccess ? (
                                                        <><Check size={14} /> Linked!</>
                                                    ) : (
                                                        <><Link2 size={14} /> Link {selectedAssetIds.length} Asset{selectedAssetIds.length > 1 ? 's' : ''}</>
                                                    )}
                                                </NeuButton>
                                            </div>
                                        )}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence >,
        document.body
    );
};

export default TaskDetailPanel;
