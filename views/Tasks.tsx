import React, { useState, useMemo, useEffect } from 'react';
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  useDroppable,
  DragStartEvent,
  DragEndEvent,
  DragOverEvent
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy
} from '@dnd-kit/sortable';
import { Task, TaskCategory } from '../types';
import { NeuCard, NeuButton, useThemeStyles } from '../components/NeuComponents';
import { TaskCard, TaskDetailPanel, TaskFiltersBar } from '../components/tasks';
import { GalaxyHeading } from '../components/GalaxyHeading';
import { Plus, Undo2, AlertTriangle } from 'lucide-react';
import { useTaskContext, TaskProvider } from '../context/TaskContext';
import { TeamService } from '../services/teamService';
import { motion, AnimatePresence } from 'framer-motion';

// ============================================================================
// TASKS VIEW (MARKETING COMMAND CENTER)
// ============================================================================

interface TasksInnerProps {
  businessDesc: string;
  activeBusinessId: string;
  businesses: { id: string; name: string }[];
}

const COLUMNS: { id: Task['status']; label: string; warnAt: number }[] = [
  { id: 'To Do', label: 'To Do', warnAt: 10 },
  { id: 'In Progress', label: 'In Progress', warnAt: 5 },
  { id: 'Blocked', label: 'Blocked', warnAt: 3 },
  { id: 'Done', label: 'Done', warnAt: 999 }
];

// Droppable wrapper for each column
interface DroppableColumnProps {
  id: string;
  children: React.ReactNode;
  className?: string;
}

const DroppableColumn: React.FC<DroppableColumnProps> = ({ id, children, className }) => {
  const { setNodeRef, isOver } = useDroppable({ id });

  return (
    <div
      ref={setNodeRef}
      className={`${className} ${isOver ? 'ring-2 ring-brand/30 bg-brand/5' : ''} transition-all duration-200`}
    >
      {children}
    </div>
  );
};

const TasksInner: React.FC<TasksInnerProps> = ({ businessDesc, activeBusinessId, businesses }) => {
  const { styles } = useThemeStyles();
  const {
    tasks,
    isLoading,
    userId,
    addTask,
    updateTask,
    deleteTask,
    reorderTasks,
    commitReorder,
    canUndo,
    undo,
    filters,
    setFilters,
    filteredTasks
  } = useTaskContext();

  const [activeId, setActiveId] = useState<string | null>(null);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [isNewTask, setIsNewTask] = useState(false);
  const [teamMembers, setTeamMembers] = useState<{ userId: string; userName: string; avatarUrl?: string }[]>([]);

  // Fetch team members for all businesses
  useEffect(() => {
    const fetchTeamMembers = async () => {
      if (businesses.length === 0) return;

      const allMembers: { userId: string; userName: string; avatarUrl?: string }[] = [];
      const seenUserIds = new Set<string>();

      for (const biz of businesses) {
        const members = await TeamService.getBusinessMembers(biz.id);
        for (const m of members) {
          if (!seenUserIds.has(m.userId)) {
            seenUserIds.add(m.userId);
            allMembers.push({
              userId: m.userId,
              userName: m.userName || 'Unknown',
              avatarUrl: m.avatarUrl
            });
          }
        }
      }
      setTeamMembers(allMembers);
    };
    fetchTeamMembers();
  }, [businesses]);

  // Keyboard shortcut for undo
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'z' && canUndo) {
        e.preventDefault();
        undo();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [canUndo, undo]);

  // Sensors for drag
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  // Group tasks by status
  const tasksByColumn = useMemo(() => {
    const grouped: Record<Task['status'], Task[]> = {
      'To Do': [],
      'In Progress': [],
      'Blocked': [],
      'Done': []
    };
    filteredTasks.forEach(task => {
      grouped[task.status]?.push(task);
    });
    // Sort each column by sortOrder
    Object.keys(grouped).forEach(key => {
      grouped[key as Task['status']].sort((a, b) => a.sortOrder - b.sortOrder);
    });
    return grouped;
  }, [filteredTasks]);

  // Create businessMap for quick lookup
  const businessMap = useMemo(() => {
    const map: Record<string, string> = {};
    businesses.forEach(b => { map[b.id] = b.name; });
    return map;
  }, [businesses]);

  // Get active task for overlay
  const activeTask = activeId ? tasks.find(t => t.id === activeId) : null;

  // Drag handlers
  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeTask = tasks.find(t => t.id === active.id);
    if (!activeTask) return;

    // Check if dropped over a column header (status)
    if (COLUMNS.some(c => c.id === over.id)) {
      const newStatus = over.id as Task['status'];
      if (activeTask.status !== newStatus) {
        reorderTasks(activeTask.id, '', newStatus);
      }
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    const activeTaskId = active.id as string;
    const activeTask = tasks.find(t => t.id === activeTaskId);
    if (!activeTask) return;

    // Check if dropped on column header
    if (COLUMNS.some(c => c.id === over.id)) {
      const newStatus = over.id as Task['status'];
      if (activeTask.status !== newStatus) {
        reorderTasks(activeTaskId, '', newStatus);
      }
    } else {
      // Dropped on another task
      const overTaskId = over.id as string;
      const overTask = tasks.find(t => t.id === overTaskId);
      if (overTask && overTask.id !== activeTaskId) {
        reorderTasks(activeTaskId, overTaskId, overTask.status);
      }
    }

    // Commit to DB
    commitReorder();
  };

  // Create new task
  const handleNewTask = () => {
    const newTask: Task = {
      id: '',
      title: '',
      status: 'To Do',
      priority: 'Medium',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      sortOrder: 0
    };
    setEditingTask(newTask);
    setIsNewTask(true);
  };

  const handleSaveTask = async (task: Task) => {
    if (isNewTask) {
      // For new tasks, add to database and get back the task with generated ID
      const createdTask = await addTask(task);
      // Update editingTask with the real ID so uploads work
      setEditingTask(createdTask);
      setIsNewTask(false);
    } else {
      // For updates, just save - don't close the panel
      await updateTask(task);
    }
  };

  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setIsNewTask(false);
  };

  const handleDeleteTask = async (taskId: string) => {
    await deleteTask(taskId);
    setEditingTask(null);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className={`text-lg ${styles.textSub}`}>Loading tasks...</div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <GalaxyHeading
            text="Marketing Board"
            className="text-3xl md:text-4xl font-extrabold tracking-tight mb-1"
          />
          <p className={`text-sm ${styles.textSub}`}>
            Drag tasks between columns to update status
          </p>
        </div>
        <div className="flex gap-2">
          <NeuButton onClick={handleNewTask} variant="primary">
            <Plus size={16} /> New Task
          </NeuButton>
        </div>
      </header>

      {/* Filters */}
      <div className="mb-4">
        <TaskFiltersBar
          filters={filters}
          onChange={setFilters}
          taskCount={tasks.length}
          filteredCount={filteredTasks.length}
          businesses={businesses}
        />
      </div>

      {/* Kanban Board */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <div className="flex-1 flex gap-4 overflow-x-auto pb-4">
          {COLUMNS.map(column => {
            const columnTasks = tasksByColumn[column.id];
            const isOverWip = columnTasks.length >= column.warnAt;

            return (
              <div
                key={column.id}
                className="flex-1 min-w-[280px] max-w-[350px] flex flex-col"
              >
                {/* Column Header */}
                <div
                  className={`flex items-center justify-between mb-3 px-2 py-2 rounded-lg ${styles.bgAccent}`}
                  data-column={column.id}
                >
                  <h3 className={`font-bold ${styles.textMain} text-sm uppercase tracking-wider`}>
                    {column.label}
                  </h3>
                  <div className="flex items-center gap-2">
                    {isOverWip && column.id !== 'Done' && (
                      <AlertTriangle size={14} className="text-orange-400" title="High WIP" />
                    )}
                    <span className={`${styles.bgAccent} ${styles.textSub} text-xs font-bold px-2 py-0.5 rounded-full`}>
                      {columnTasks.length}
                    </span>
                  </div>
                </div>

                {/* Tasks - wrapped in droppable zone */}
                <DroppableColumn id={column.id} className="flex-1 min-h-[200px] rounded-xl p-1">
                  <SortableContext
                    items={columnTasks.map(t => t.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    <div className="space-y-3">
                      <AnimatePresence mode="popLayout">
                        {columnTasks.map(task => (
                          <motion.div
                            key={task.id}
                            layout
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                          >
                            <TaskCard
                              task={task}
                              onEdit={handleEditTask}
                              onDelete={handleDeleteTask}
                              businessName={task.businessId ? businessMap[task.businessId] : undefined}
                            />
                          </motion.div>
                        ))}
                      </AnimatePresence>

                      {/* Empty state */}
                      {columnTasks.length === 0 && (
                        <div className={`text-center py-8 text-xs ${styles.textSub} border-2 border-dashed ${styles.border} rounded-xl`}>
                          {column.id === 'To Do' ? 'Add your first task' : 'Drag tasks here'}
                        </div>
                      )}
                    </div>
                  </SortableContext>
                </DroppableColumn>
              </div>
            );
          })}
        </div>

        {/* Drag Overlay */}
        <DragOverlay>
          {activeTask && (
            <TaskCard
              task={activeTask}
              onEdit={() => { }}
              onDelete={() => { }}
              isDragging
              businessName={activeTask.businessId ? businessMap[activeTask.businessId] : undefined}
            />
          )}
        </DragOverlay>
      </DndContext>

      {/* Task Detail Panel (slides from right) */}
      <TaskDetailPanel
        task={editingTask}
        isOpen={!!editingTask}
        onClose={() => { setEditingTask(null); setIsNewTask(false); }}
        onSave={handleSaveTask}
        onDelete={handleDeleteTask}
        isNew={isNewTask}
        businessId={activeBusinessId}
        businesses={businesses}
        teamMembers={teamMembers}
      />
    </div>
  );
};

// ============================================================================
// WRAPPER WITH PROVIDER
// ============================================================================

interface TasksProps {
  userId: string;
  businessDesc: string;
  activeBusinessId: string;
  businesses: { id: string; name: string }[];
}

const Tasks: React.FC<TasksProps> = ({ userId, businessDesc, activeBusinessId, businesses }) => {
  return (
    <TaskProvider userId={userId}>
      <TasksInner businessDesc={businessDesc} activeBusinessId={activeBusinessId} businesses={businesses} />
    </TaskProvider>
  );
};

export default Tasks;
