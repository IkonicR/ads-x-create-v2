import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { Task, Subtask, TaskCategory } from '../types';
import { StorageService } from '../services/storage';

// ============================================================================
// TASK CONTEXT
// Manages task state with optimistic updates and undo functionality
// ============================================================================

interface TaskContextValue {
    tasks: Task[];
    isLoading: boolean;
    businessId: string;

    // CRUD Operations
    addTask: (task: Omit<Task, 'id' | 'createdAt' | 'updatedAt' | 'sortOrder'>) => Promise<void>;
    updateTask: (task: Task) => Promise<void>;
    deleteTask: (taskId: string) => Promise<void>;

    // Drag & Drop
    reorderTasks: (activeId: string, overId: string, overColumn?: Task['status']) => void;
    commitReorder: () => Promise<void>;

    // Subtasks
    toggleSubtask: (taskId: string, subtaskId: string) => Promise<void>;
    addSubtask: (taskId: string, title: string) => Promise<void>;
    removeSubtask: (taskId: string, subtaskId: string) => Promise<void>;

    // Undo
    canUndo: boolean;
    undo: () => void;

    // Filter State
    filters: TaskFilters;
    setFilters: (filters: TaskFilters) => void;
    filteredTasks: Task[];
}

interface TaskFilters {
    search: string;
    category: TaskCategory | 'all';
    priority: Task['priority'] | 'all';
    status: Task['status'] | 'all';
}

const defaultFilters: TaskFilters = {
    search: '',
    category: 'all',
    priority: 'all',
    status: 'all'
};

const TaskContext = createContext<TaskContextValue | undefined>(undefined);

export const useTaskContext = () => {
    const context = useContext(TaskContext);
    if (!context) {
        throw new Error('useTaskContext must be used within TaskProvider');
    }
    return context;
};

interface TaskProviderProps {
    children: React.ReactNode;
    businessId: string;
}

export const TaskProvider: React.FC<TaskProviderProps> = ({ children, businessId }) => {
    const [tasks, setTasks] = useState<Task[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [filters, setFilters] = useState<TaskFilters>(defaultFilters);

    // Undo stack (stores previous states)
    const [undoStack, setUndoStack] = useState<Task[][]>([]);
    const MAX_UNDO = 10;

    // Debounce timer for auto-save
    const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    // Load tasks on mount
    useEffect(() => {
        if (!businessId) return;

        const loadTasks = async () => {
            setIsLoading(true);
            try {
                const loaded = await StorageService.getTasks(businessId);
                setTasks(loaded);
            } catch (error) {
                console.error('[TaskContext] Failed to load tasks:', error);
            } finally {
                setIsLoading(false);
            }
        };

        loadTasks();
    }, [businessId]);

    // Push to undo stack
    const pushUndo = useCallback((prevState: Task[]) => {
        setUndoStack(stack => [...stack.slice(-MAX_UNDO + 1), prevState]);
    }, []);

    // Undo last action
    const undo = useCallback(() => {
        if (undoStack.length === 0) return;

        const prevState = undoStack[undoStack.length - 1];
        setUndoStack(stack => stack.slice(0, -1));
        setTasks(prevState);

        // Persist the undo
        StorageService.saveTasks(prevState, businessId);
    }, [undoStack, businessId]);

    // Generate unique ID
    const generateId = () => `task_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;

    // Add new task
    const addTask = useCallback(async (taskData: Omit<Task, 'id' | 'createdAt' | 'updatedAt' | 'sortOrder'>) => {
        const now = new Date().toISOString();
        const maxSortOrder = Math.max(...tasks.map(t => t.sortOrder), -1);

        const newTask: Task = {
            ...taskData,
            id: generateId(),
            createdAt: now,
            updatedAt: now,
            sortOrder: maxSortOrder + 1
        };

        pushUndo(tasks);
        setTasks(prev => [...prev, newTask]);

        await StorageService.saveTask(newTask, businessId);
    }, [tasks, businessId, pushUndo]);

    // Update existing task
    const updateTask = useCallback(async (updatedTask: Task) => {
        const now = new Date().toISOString();
        const taskWithTimestamp = { ...updatedTask, updatedAt: now };

        pushUndo(tasks);
        setTasks(prev => prev.map(t => t.id === updatedTask.id ? taskWithTimestamp : t));

        await StorageService.saveTask(taskWithTimestamp, businessId);
    }, [tasks, businessId, pushUndo]);

    // Delete task
    const deleteTask = useCallback(async (taskId: string) => {
        pushUndo(tasks);
        setTasks(prev => prev.filter(t => t.id !== taskId));

        await StorageService.deleteTask(taskId);
    }, [tasks, pushUndo]);

    // Reorder tasks (optimistic, no persist yet)
    const reorderTasks = useCallback((activeId: string, overId: string, overColumn?: Task['status']) => {
        setTasks(prev => {
            const activeIndex = prev.findIndex(t => t.id === activeId);
            const overIndex = prev.findIndex(t => t.id === overId);

            if (activeIndex === -1) return prev;

            pushUndo(prev);

            const newTasks = [...prev];
            const [movedTask] = newTasks.splice(activeIndex, 1);

            // Update status if moving to different column
            if (overColumn) {
                movedTask.status = overColumn;
            }

            // Insert at new position
            const insertIndex = overIndex === -1 ? newTasks.length : overIndex;
            newTasks.splice(insertIndex, 0, movedTask);

            // Recalculate sort orders
            return newTasks.map((task, index) => ({ ...task, sortOrder: index }));
        });
    }, [pushUndo]);

    // Commit reorder to database
    const commitReorder = useCallback(async () => {
        const updates = tasks.map(t => ({ id: t.id, sortOrder: t.sortOrder, status: t.status }));
        await StorageService.updateTaskOrder(updates, businessId);
    }, [tasks, businessId]);

    // Toggle subtask completion
    const toggleSubtask = useCallback(async (taskId: string, subtaskId: string) => {
        const task = tasks.find(t => t.id === taskId);
        if (!task) return;

        const updatedSubtasks = (task.subtasks || []).map(st =>
            st.id === subtaskId ? { ...st, done: !st.done } : st
        );

        await updateTask({ ...task, subtasks: updatedSubtasks });
    }, [tasks, updateTask]);

    // Add subtask
    const addSubtask = useCallback(async (taskId: string, title: string) => {
        const task = tasks.find(t => t.id === taskId);
        if (!task) return;

        const newSubtask: Subtask = {
            id: `sub_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
            title,
            done: false
        };

        await updateTask({ ...task, subtasks: [...(task.subtasks || []), newSubtask] });
    }, [tasks, updateTask]);

    // Remove subtask
    const removeSubtask = useCallback(async (taskId: string, subtaskId: string) => {
        const task = tasks.find(t => t.id === taskId);
        if (!task) return;

        const updatedSubtasks = (task.subtasks || []).filter(st => st.id !== subtaskId);
        await updateTask({ ...task, subtasks: updatedSubtasks });
    }, [tasks, updateTask]);

    // Apply filters
    const filteredTasks = tasks.filter(task => {
        if (filters.search && !task.title.toLowerCase().includes(filters.search.toLowerCase())) {
            return false;
        }
        if (filters.category !== 'all' && task.category !== filters.category) {
            return false;
        }
        if (filters.priority !== 'all' && task.priority !== filters.priority) {
            return false;
        }
        if (filters.status !== 'all' && task.status !== filters.status) {
            return false;
        }
        return true;
    });

    return (
        <TaskContext.Provider value={{
            tasks,
            isLoading,
            businessId,
            addTask,
            updateTask,
            deleteTask,
            reorderTasks,
            commitReorder,
            toggleSubtask,
            addSubtask,
            removeSubtask,
            canUndo: undoStack.length > 0,
            undo,
            filters,
            setFilters,
            filteredTasks
        }}>
            {children}
        </TaskContext.Provider>
    );
};
