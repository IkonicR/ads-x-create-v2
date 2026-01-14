import React from 'react';
import { TaskCategory, Task } from '../../types';
import { NeuInput, NeuDropdown, useThemeStyles } from '../NeuComponents';
import { Search, X, FileText, Megaphone, Smartphone, Mail, BarChart3, Pin, Circle } from 'lucide-react';

interface TaskFilters {
    search: string;
    category: TaskCategory | 'all';
    priority: Task['priority'] | 'all';
    status: Task['status'] | 'all';
}

interface TaskFiltersProps {
    filters: TaskFilters;
    onChange: (filters: TaskFilters) => void;
    taskCount: number;
    filteredCount: number;
}

const CATEGORY_OPTIONS = [
    { value: 'all', label: 'All Categories' },
    { value: 'content', label: 'Content', icon: <FileText size={12} /> },
    { value: 'ads', label: 'Ads', icon: <Megaphone size={12} /> },
    { value: 'social', label: 'Social', icon: <Smartphone size={12} /> },
    { value: 'email', label: 'Email', icon: <Mail size={12} /> },
    { value: 'analytics', label: 'Analytics', icon: <BarChart3 size={12} /> },
    { value: 'other', label: 'Other', icon: <Pin size={12} /> }
];

const PRIORITY_OPTIONS = [
    { value: 'all', label: 'All Priorities' },
    { value: 'Low', label: 'Low', icon: <Circle size={8} className="fill-green-500 text-green-500" /> },
    { value: 'Medium', label: 'Medium', icon: <Circle size={8} className="fill-yellow-500 text-yellow-500" /> },
    { value: 'High', label: 'High', icon: <Circle size={8} className="fill-orange-500 text-orange-500" /> },
    { value: 'Urgent', label: 'Urgent', icon: <Circle size={8} className="fill-red-500 text-red-500" /> }
];

export const TaskFiltersBar: React.FC<TaskFiltersProps> = ({
    filters,
    onChange,
    taskCount,
    filteredCount
}) => {
    const { styles } = useThemeStyles();

    const hasActiveFilters = filters.search || filters.category !== 'all' || filters.priority !== 'all';

    const clearFilters = () => {
        onChange({
            search: '',
            category: 'all',
            priority: 'all',
            status: 'all'
        });
    };

    return (
        <div className={`flex items-center gap-3 p-3 rounded-xl ${styles.bg} ${styles.shadowOut}`}>
            {/* Search */}
            <div className="relative flex-1 max-w-xs">
                <Search size={14} className={`absolute left-3 top-1/2 -translate-y-1/2 ${styles.textSub}`} />
                <NeuInput
                    value={filters.search}
                    onChange={e => onChange({ ...filters, search: e.target.value })}
                    placeholder="Search tasks..."
                    className="pl-9 w-full"
                />
            </div>

            {/* Category filter */}
            <NeuDropdown
                overlay
                value={filters.category}
                options={CATEGORY_OPTIONS}
                onChange={val => onChange({ ...filters, category: val as TaskCategory | 'all' })}
            />

            {/* Priority filter */}
            <NeuDropdown
                overlay
                value={filters.priority}
                options={PRIORITY_OPTIONS}
                onChange={val => onChange({ ...filters, priority: val as Task['priority'] | 'all' })}
            />

            {/* Clear filters */}
            {hasActiveFilters && (
                <button
                    onClick={clearFilters}
                    className={`flex items-center gap-1 px-2 py-1 text-xs ${styles.textSub} hover:text-red-400 transition-colors`}
                >
                    <X size={12} /> Clear
                </button>
            )}

            {/* Count */}
            <div className={`text-xs ${styles.textSub} ml-auto`}>
                {filteredCount === taskCount
                    ? `${taskCount} tasks`
                    : `${filteredCount} of ${taskCount} tasks`
                }
            </div>
        </div>
    );
};

export default TaskFiltersBar;
