
import React from 'react';
import { Business, Asset, Task } from '../types';
import { NeuCard, NeuButton, NeuBadge, useThemeStyles, BRAND_COLOR } from '../components/NeuComponents';
import { TrendingUp, Clock, Zap, Plus } from 'lucide-react';
import { AreaChart, Area, Tooltip, ResponsiveContainer } from 'recharts';
import { GalaxyHeading } from '../components/GalaxyHeading';

interface DashboardProps {
  business: Business;
  tasks: Task[];
  onNavigate: (view: any) => void;
}

const data = [
  { name: 'Mon', gens: 4 },
  { name: 'Tue', gens: 3 },
  { name: 'Wed', gens: 7 },
  { name: 'Thu', gens: 5 },
  { name: 'Fri', gens: 9 },
  { name: 'Sat', gens: 2 },
  { name: 'Sun', gens: 6 },
];

import { useAssets } from '../context/AssetContext';
import { useSubscription } from '../context/SubscriptionContext';

const Dashboard: React.FC<DashboardProps> = ({ business, tasks, onNavigate }) => {
  const { styles, theme } = useThemeStyles();
  const { assets } = useAssets();
  const { creditsRemaining, planName, loading: subscriptionLoading } = useSubscription();
  const recentAssets = assets.slice(0, 4);
  const isDark = theme === 'dark';

  return (
    <div className="space-y-8 pb-10">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <GalaxyHeading
            text={`Good morning, ${business.role}`}
            className="text-4xl md:text-5xl font-extrabold tracking-tight mb-1 pb-2"
          />
          <p className={styles.textSub}>Here's what's happening with {business.name}</p>
        </div>
        <NeuButton variant="primary" onClick={() => onNavigate('GENERATOR')}>
          <Plus size={18} /> New Generation
        </NeuButton>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Credits Card */}
        <NeuCard className="relative overflow-hidden">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className={`text-sm font-bold ${styles.textSub}`}>Credits Available</p>
              <h3 className="text-3xl font-bold text-brand">
                {subscriptionLoading ? '...' : creditsRemaining}
              </h3>
              <p className={`text-xs mt-1 ${styles.textSub}`}>{planName} Plan</p>
            </div>
            <div className={`p-2 rounded-full ${styles.bg} ${styles.shadowOut} ${styles.textSub}`}>
              <Zap size={20} />
            </div>
          </div>
          <NeuButton className="w-full text-sm py-2" onClick={() => { }}>Top Up</NeuButton>
        </NeuCard>

        {/* Metric 2 */}
        <NeuCard>
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className={`text-sm font-bold ${styles.textSub}`}>Active Tasks</p>
              <h3 className={`text-3xl font-bold ${styles.textMain}`}>{tasks.filter(t => t.status !== 'Done').length}</h3>
            </div>
            <div className={`p-2 rounded-full ${styles.bg} ${styles.shadowOut} ${styles.textSub}`}>
              <Clock size={20} />
            </div>
          </div>
          <NeuButton className="w-full text-sm py-2" onClick={() => onNavigate('TASKS')}>View Board</NeuButton>
        </NeuCard>

        {/* Chart */}
        <NeuCard className="flex flex-col justify-between">
          <div className="flex justify-between items-start mb-2">
            <p className={`text-sm font-bold ${styles.textSub}`}>Generation Activity</p>
            <TrendingUp size={20} className="text-green-500" />
          </div>
          <div className="h-24 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data}>
                <defs>
                  <linearGradient id="colorGens" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={BRAND_COLOR} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={BRAND_COLOR} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <Tooltip
                  contentStyle={{
                    backgroundColor: isDark ? '#0F1115' : '#F4F6F9',
                    border: 'none',
                    borderRadius: '10px',
                    boxShadow: isDark ? '6px 6px 14px #060709' : '5px 5px 12px #D6DAE3',
                    color: isDark ? '#F8FAFC' : '#1F2937'
                  }}
                  itemStyle={{ color: BRAND_COLOR }}
                />
                <Area type="monotone" dataKey="gens" stroke={BRAND_COLOR} fillOpacity={1} fill="url(#colorGens)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </NeuCard>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <section>
          <h3 className={`text-lg font-bold mb-4 ${styles.textSub}`}>Recent Generations</h3>
          <div className="grid grid-cols-2 gap-4">
            {recentAssets.map(asset => (
              <NeuCard key={asset.id} className="aspect-square flex flex-col p-4 group cursor-pointer hover:scale-[1.02] transition-transform">
                <div className={`flex-1 rounded-xl mb-3 overflow-hidden shadow-inner ${isDark ? 'bg-black/30' : 'bg-gray-200'}`}>
                  {/* Placeholder for image */}
                  <img src={asset.content} alt="Asset" className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                </div>
                <div className="flex justify-between items-center">
                  <span className={`text-xs font-bold ${styles.textSub}`}>{asset.type.toUpperCase()}</span>
                  <span className={`text-xs ${styles.textSub}`}>{new Date(asset.createdAt).toLocaleDateString()}</span>
                </div>
              </NeuCard>
            ))}
            <NeuCard className="aspect-square flex items-center justify-center cursor-pointer" inset onClick={() => onNavigate('GENERATOR')}>
              <Plus size={32} className={styles.textSub} />
            </NeuCard>
          </div>
        </section>

        <section>
          <h3 className={`text-lg font-bold mb-4 ${styles.textSub}`}>Priority Tasks</h3>
          <div className="space-y-4">
            {tasks.slice(0, 4).map(task => (
              <NeuCard key={task.id} className="flex justify-between items-center py-4 px-5">
                <div className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${task.priority === 'High' ? 'bg-red-400' : task.priority === 'Medium' ? 'bg-yellow-400' : 'bg-green-400'}`} />
                  <span className={`font-bold text-sm ${styles.textMain}`}>{task.title}</span>
                </div>
                <NeuBadge>{task.status}</NeuBadge>
              </NeuCard>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};

export default Dashboard;
