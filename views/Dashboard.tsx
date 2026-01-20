
import React from 'react';
import { Business, Asset, Task } from '../types';
import { NeuCard, NeuButton, NeuBadge, useThemeStyles, BRAND_COLOR } from '../components/NeuComponents';
import { TrendingUp, Clock, Zap, Plus } from 'lucide-react';
import { AreaChart, Area, Tooltip, ResponsiveContainer } from 'recharts';
import { GalaxyHeading } from '../components/GalaxyHeading';
import { useAssets } from '../context/AssetContext';
import { useSubscription } from '../context/SubscriptionContext';
import { useTaskContext } from '../context/TaskContext';
import { useAuth } from '../context/AuthContext';

interface DashboardProps {
  business: Business;
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

const Dashboard: React.FC<DashboardProps> = ({ business, onNavigate }) => {
  const { styles, theme } = useThemeStyles();
  const { assets } = useAssets();
  const { creditsRemaining, planName, loading: subscriptionLoading } = useSubscription();
  const { tasks, isLoading: tasksLoading } = useTaskContext();
  const { profile } = useAuth();
  const recentAssets = assets.slice(0, 4);
  const isDark = theme === 'dark';

  // Smart Dashboard Header - context-aware heading + subtitle pairs
  const getDashboardHeader = (): { heading: string; subtitle: string } => {
    const firstName = profile?.full_name?.split(' ')[0] || 'there';
    const now = new Date();
    const hour = now.getHours();
    const dayOfWeek = now.getDay();
    const today = now.toDateString();

    const timeGreeting = hour >= 5 && hour < 12 ? 'Morning'
      : hour < 17 ? 'Afternoon'
        : 'Evening';

    const pick = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

    // Data gathering
    const assetsToday = assets.filter(a => new Date(a.createdAt).toDateString() === today);
    const pendingTasks = tasks.filter(t => t.status !== 'Done');
    const overdueTask = tasks.find(t => t.status !== 'Done' && t.dueDate && new Date(t.dueDate) < now);
    const taskDueToday = tasks.find(t => t.status !== 'Done' && t.dueDate && new Date(t.dueDate).toDateString() === today);
    const lastAsset = assets[0];
    const daysSinceLastAsset = lastAsset
      ? Math.floor((now.getTime() - new Date(lastAsset.createdAt).getTime()) / (1000 * 60 * 60 * 24))
      : null;
    const lastDayName = lastAsset
      ? new Date(lastAsset.createdAt).toLocaleDateString('en-US', { weekday: 'long' })
      : null;
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

    // 1. Late night (after 10pm)
    if (hour >= 22) return pick([
      { heading: `Night owl, ${firstName}`, subtitle: `Still at it? ${business.name} appreciates it.` },
      { heading: `Late session, ${firstName}`, subtitle: `The best ideas come after hours.` }
    ]);

    // 2. Early bird (before 7am)
    if (hour < 7 && hour >= 4) return pick([
      { heading: `Early start, ${firstName}`, subtitle: `${business.name} is all yours.` },
      { heading: `Up early, ${firstName}`, subtitle: `First mover advantage.` }
    ]);

    // 3. Overdue task
    if (overdueTask) return pick([
      { heading: `${timeGreeting}, ${firstName}`, subtitle: `"${overdueTask.title}" is overdue.` },
      { heading: `Quick heads up, ${firstName}`, subtitle: `"${overdueTask.title}" slipped past due.` }
    ]);

    // 4. Task due today
    if (taskDueToday) return pick([
      { heading: `${timeGreeting}, ${firstName}`, subtitle: `"${taskDueToday.title}" is due today.` },
      { heading: `Today's the day, ${firstName}`, subtitle: `"${taskDueToday.title}" needs attention.` }
    ]);

    // 5. Productive day (3+ assets)
    if (assetsToday.length >= 3) return pick([
      { heading: `Productive day, ${firstName}`, subtitle: `${assetsToday.length} assets created.` },
      { heading: `On a roll, ${firstName}`, subtitle: `${assetsToday.length} new assets for ${business.name}.` }
    ]);

    // 6. High task backlog (5+ pending)
    if (pendingTasks.length >= 5) return pick([
      { heading: `${timeGreeting}, ${firstName}`, subtitle: `${pendingTasks.length} tasks in the queue.` },
      { heading: `Busy board, ${firstName}`, subtitle: `${pendingTasks.length} tasks waiting.` }
    ]);

    // 7. Returning after absence (3+ days)
    if (daysSinceLastAsset && daysSinceLastAsset >= 3) return pick([
      { heading: `Been a minute, ${firstName}`, subtitle: `Last activity was ${lastDayName}. Welcome back.` },
      { heading: `Welcome back, ${firstName}`, subtitle: `${daysSinceLastAsset} days since your last session.` }
    ]);

    // 8. Low credits
    if (creditsRemaining < 15 && creditsRemaining > 0) return pick([
      { heading: `${timeGreeting}, ${firstName}`, subtitle: `Running low — ${creditsRemaining} credits left.` },
      { heading: `Heads up, ${firstName}`, subtitle: `Down to ${creditsRemaining} credits.` }
    ]);

    // 9. Monday morning
    if (dayOfWeek === 1 && hour < 12) return pick([
      { heading: `Monday, ${firstName}`, subtitle: `Fresh week for ${business.name}. What's first?` },
      { heading: `New week, ${firstName}`, subtitle: `Clean slate. What are we building?` }
    ]);

    // 10. Friday evening
    if (dayOfWeek === 5 && hour >= 17) return pick([
      { heading: `Friday, ${firstName}`, subtitle: `${business.name} is in good shape.` },
      { heading: `Weekend incoming, ${firstName}`, subtitle: `Finish strong or pick it up Monday?` }
    ]);

    // 11. Weekend
    if (isWeekend) return pick([
      { heading: `Weekend mode, ${firstName}`, subtitle: `No meetings. Just creating.` },
      { heading: `${dayOfWeek === 6 ? 'Saturday' : 'Sunday'}, ${firstName}`, subtitle: `${business.name} doesn't stop.` }
    ]);

    // 12. New user (0 assets)
    if (assets.length === 0) return pick([
      { heading: `Welcome, ${firstName}`, subtitle: `Your first asset is one click away.` },
      { heading: `Fresh start, ${firstName}`, subtitle: `Let's build ${business.name}'s first asset.` }
    ]);

    // 13. Default pool
    return pick([
      { heading: `${timeGreeting}, ${firstName}`, subtitle: `${business.name} is ready when you are.` },
      { heading: `${timeGreeting}, ${firstName}`, subtitle: `What's on the agenda?` },
      { heading: `${timeGreeting}, ${firstName}`, subtitle: `Your move.` },
      { heading: `${timeGreeting}, ${firstName}`, subtitle: `Let's make something.` },
      { heading: `${timeGreeting}, ${firstName}`, subtitle: `Pick up where you left off?` }
    ]);
  };

  // Session storage caching to prevent flickering on navigation
  const getStableHeader = (): { heading: string; subtitle: string } => {
    const hour = new Date().getHours();
    const cacheKey = `dashboard_header_${hour}_${assets.length}_${tasks.length}_${creditsRemaining}`;

    // Check for cached header with matching context
    const cached = sessionStorage.getItem('dashboard_header_cache');
    if (cached) {
      try {
        const { key, header } = JSON.parse(cached);
        if (key === cacheKey) {
          return header;
        }
      } catch { /* ignore parse errors */ }
    }

    // Generate new header and cache it
    const header = getDashboardHeader();
    sessionStorage.setItem('dashboard_header_cache', JSON.stringify({ key: cacheKey, header }));
    return header;
  };

  const { heading, subtitle } = getStableHeader();

  return (
    <div className="space-y-8 pb-10">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <GalaxyHeading
            text={heading}
            className="text-5xl md:text-6xl font-extrabold tracking-tight mb-2 pb-2"
          />
          <p className={`text-lg ${styles.textSub}`}>{subtitle}</p>
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
