
import React, { useState } from 'react';
import { Task } from '../types';
import { NeuCard, NeuButton, NeuBadge, useThemeStyles } from '../components/NeuComponents';
import { CheckCircle2, Clock, AlertCircle, Plus, MoreVertical, Calendar, MoreHorizontal } from 'lucide-react';
import { generateTaskSuggestions } from '../services/geminiService';
import { GalaxyHeading } from '../components/GalaxyHeading';

interface TasksProps {
  tasks: Task[];
  businessDesc: string;
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>;
}

const Tasks: React.FC<TasksProps> = ({ tasks, businessDesc, setTasks }) => {
  const [loadingAi, setLoadingAi] = useState(false);
  const { styles } = useThemeStyles();

  const handleAiSuggest = async () => {
    setLoadingAi(true);
    try {
      const titles = await generateTaskSuggestions(businessDesc);
      const newTasks: Task[] = titles.map(title => ({
        id: Math.random().toString(),
        title,
        status: 'To Do',
        priority: 'Medium',
        dueDate: new Date().toISOString()
      }));
      setTasks(prev => [...prev, ...newTasks]);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingAi(false);
    }
  };

  const moveTask = (taskId: string, newStatus: Task['status']) => {
    setTasks(tasks.map(t => t.id === taskId ? { ...t, status: newStatus } : t));
  };

  const Column = ({ status }: { status: Task['status'] }) => (
    <div className="flex-1 min-w-[300px]">
      <div className="flex justify-between items-center mb-4 px-2">
        <h3 className={`font-bold ${styles.textSub} uppercase text-sm tracking-wider`}>{status}</h3>
        <span className={`${styles.bgAccent} ${styles.textSub} text-xs font-bold px-2 py-1 rounded-full`}>
          {tasks.filter(t => t.status === status).length}
        </span>
      </div>

      <div className="space-y-4 min-h-[200px]">
        {tasks.filter(t => t.status === status).map(task => (
          <NeuCard key={task.id} className="p-4 group hover:scale-[1.02] cursor-grab active:cursor-grabbing">
            <div className="flex justify-between items-start mb-2">
              <div className={`w-2 h-2 rounded-full mt-1.5 ${task.priority === 'High' ? 'bg-red-400' : task.priority === 'Medium' ? 'bg-yellow-400' : 'bg-green-400'}`} />
              <button className={`${styles.textSub} hover:${styles.textMain}`}><MoreHorizontal size={16} /></button>
            </div>
            <p className={`${styles.textMain} font-bold mb-3`}>{task.title}</p>
            <div className="flex justify-between items-center mt-2">
              <span className={`text-xs ${styles.textSub}`}>{new Date(task.dueDate).toLocaleDateString()}</span>
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                {status !== 'To Do' && <button onClick={() => moveTask(task.id, 'To Do')} className={`p-1 text-xs ${styles.bgAccent} rounded hover:opacity-80`}>&lt;</button>}
                {status !== 'Done' && <button onClick={() => moveTask(task.id, status === 'To Do' ? 'In Progress' : 'Done')} className={`p-1 text-xs ${styles.bgAccent} rounded hover:opacity-80`}>&gt;</button>}
              </div>
            </div>
          </NeuCard>
        ))}

        <NeuButton className={`w-full border-2 border-dashed ${styles.border} shadow-none bg-transparent ${styles.textSub} hover:border-brand hover:text-brand`}>
          <Plus size={16} /> Add Task
        </NeuButton>
      </div>
    </div>
  );

  return (
    <div className="pb-8 h-full flex flex-col">
      <header className="flex justify-between items-center mb-8">
        <div>
          <GalaxyHeading
            text="Marketing Board"
            className="text-4xl md:text-5xl font-extrabold tracking-tight mb-1 pb-2"
          />
        </div>
        <div className="flex gap-4">
          <NeuButton onClick={handleAiSuggest} disabled={loadingAi}>
            {loadingAi ? 'Generating...' : '✨ AI Suggest Tasks'}
          </NeuButton>
          <NeuButton variant="primary"><Plus size={18} /> New Task</NeuButton>
        </div>
      </header>

      <div className="flex overflow-x-auto gap-6 pb-4 flex-1">
        <Column status="To Do" />
        <Column status="In Progress" />
        <Column status="Done" />
      </div>
    </div>
  );
};

export default Tasks;
