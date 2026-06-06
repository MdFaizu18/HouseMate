import { useCallback, useEffect, useState } from 'react';
import { Zap, Trophy, Flame, CheckCircle2, AlertCircle, RefreshCw, CheckCheck, Heart } from 'lucide-react';
import { api } from '../lib/api';
import { mapBadgeProgress, mapMember, mapTask } from '../lib/mappers';
import { useApp } from '../context/AppContext';
import { achievements as mockAchievements } from '../data/mockData';
import AssistModal from '../components/modals/AssistModal';
import SwapModal from '../components/modals/SwapModal';
import SickLeaveModal from '../components/modals/SickLeaveModal';
import { LoadingState, ErrorState } from '../components/LoadingState';

function StatCard({ icon: Icon, label, value, sub, glowColor }) {
  return (
    <div className="bg-[#111827] border border-[#1e2d45] rounded-xl p-4 flex items-start gap-4 card-hover cursor-default">
      <div
        className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
        style={{ backgroundColor: `${glowColor}22` }}
      >
        <Icon size={20} style={{ color: glowColor }} />
      </div>
      <div>
        <p className="text-xs text-[#8896b0] mb-0.5">{label}</p>
        <p className="text-xl font-bold text-white">{value}</p>
        {sub && <p className="text-xs mt-0.5" style={{ color: glowColor }}>{sub}</p>}
      </div>
    </div>
  );
}

function TaskCard({ task, currentUserId, onComplete, onAssist, onSwap }) {
  const statusStyles = {
    pending:   { bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/20', label: 'Pending' },
    completed: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/20', label: 'Completed' },
    upcoming:  { bg: 'bg-indigo-500/10', text: 'text-indigo-400', border: 'border-indigo-500/20', label: 'Upcoming' },
  };
  const s = statusStyles[task.status];
  const isMine = task.assignedToId === currentUserId;

  return (
    <div className="bg-[#111827] border border-[#1e2d45] rounded-xl p-4 card-hover">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2.5">
          <span className="text-2xl">{task.icon}</span>
          <div>
            <h4 className="text-sm font-semibold text-white">{task.title}</h4>
            <p className="text-xs text-[#8896b0]">Assigned: {task.assignedTo}</p>
          </div>
        </div>
        <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${s.bg} ${s.text} ${s.border}`}>
          {s.label}
        </span>
      </div>

      <div className="flex items-center gap-4 text-xs text-[#8896b0] mb-3">
        <span>Due: <span className="text-white">{task.due}</span></span>
        <span className="text-emerald-400 font-semibold">+{task.reward} pts</span>
        {task.completedAt && <span>At: <span className="text-emerald-400">{task.completedAt}</span></span>}
      </div>

      {task.status === 'pending' && isMine && (
        <div className="flex gap-2 mt-3">
          <button
            onClick={() => onComplete(task.id)}
            className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-medium py-1.5 rounded-lg transition-colors flex items-center justify-center gap-1"
          >
            <CheckCheck size={13} /> Complete
          </button>
          <button
            onClick={() => onAssist(task)}
            className="flex-1 bg-[#1a2236] hover:bg-indigo-500/10 border border-[#1e2d45] hover:border-indigo-500/30 text-[#8896b0] hover:text-indigo-400 text-xs font-medium py-1.5 rounded-lg transition-colors flex items-center justify-center gap-1"
          >
            <AlertCircle size={13} /> Need Assist
          </button>
          <button
            onClick={() => onSwap(task)}
            className="flex-1 bg-[#1a2236] hover:bg-amber-500/10 border border-[#1e2d45] hover:border-amber-500/30 text-[#8896b0] hover:text-amber-400 text-xs font-medium py-1.5 rounded-lg transition-colors flex items-center justify-center gap-1"
          >
            <RefreshCw size={13} /> Swap
          </button>
        </div>
      )}

      {task.status === 'completed' && (
        <div className="flex items-center gap-2 mt-3 text-emerald-400 text-xs">
          <CheckCircle2 size={14} /> Completed at {task.completedAt}
        </div>
      )}
    </div>
  );
}

export default function Dashboard({ setActivePage }) {
  const { currentUser, currentUserId, refreshUser, loadHouseData } = useApp();
  const [assistTask, setAssistTask] = useState(null);
  const [swapTask, setSwapTask]     = useState(null);
  const [sickOpen, setSickOpen]     = useState(false);
  const [tasks, setTasks] = useState([]);
  const [members, setMembers] = useState([]);
  const [achievements, setAchievements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [todayRes, leaderboardRes, profileRes] = await Promise.all([
        api.getTodayTasks(),
        api.getLeaderboard(),
        api.getMyProfile(),
      ]);
      setTasks((todayRes.data || []).map(mapTask));
      setMembers((leaderboardRes.data || []).map(mapMember));
      setAchievements(
        (profileRes.data?.badgeProgress || []).slice(0, 3).map(mapBadgeProgress)
      );
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  async function handleComplete(taskId) {
    try {
      await api.completeTask(taskId);
      await Promise.all([loadData(), refreshUser(), loadHouseData()]);
    } catch (err) {
      alert(err.message);
    }
  }

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good Morning' : hour < 17 ? 'Good Afternoon' : 'Good Evening';
  const pendingCount = tasks.filter((t) => t.status === 'pending').length;
  const topPoints = members[0]?.points || 420;

  if (loading) return <LoadingState message="Loading dashboard..." />;
  if (error) return <ErrorState message={error} onRetry={loadData} />;

  return (
    <div className="p-4 md:p-6 space-y-6 animate-slide-in pb-20 md:pb-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-white">
            {greeting}, {currentUser?.name || 'there'} 👋
          </h1>
          <p className="text-sm text-[#8896b0] mt-1">
            You have <span className="text-amber-400 font-medium">{pendingCount} pending task{pendingCount !== 1 ? 's' : ''}</span> today.
            {currentUser?.streak > 0 && (
              <> Keep your <span className="text-emerald-400 font-medium">{currentUser.streak}-day streak</span> alive!</>
            )}
          </p>
        </div>
        <button
          onClick={() => setSickOpen(true)}
          className="hidden md:flex items-center gap-2 text-xs font-medium px-3 py-2 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg hover:bg-red-500/20 transition-colors"
        >
          <Heart size={13} /> I&apos;m Sick
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard icon={Zap} label="Current Points" value={currentUser?.points ?? 0} sub="Live from API" glowColor="#10b981" />
        <StatCard icon={Trophy} label="Current Rank" value={`#${currentUser?.rank || '-'}`} sub="House Champions" glowColor="#6366f1" />
        <StatCard icon={Flame} label="Current Streak" value={`${currentUser?.streak || 0} Days`} sub="Keep going!" glowColor="#f59e0b" />
        <StatCard icon={CheckCircle2} label="Tasks Done" value={currentUser?.completedThisMonth ?? 0} sub="All time" glowColor="#3b82f6" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-semibold text-white">Today&apos;s Duties</h2>
            <button onClick={() => setActivePage('tasks')} className="text-xs text-emerald-400 hover:text-emerald-300 transition-colors">
              View all
            </button>
          </div>
          <div className="space-y-3">
            {tasks.length === 0 ? (
              <p className="text-sm text-[#8896b0]">No tasks due today.</p>
            ) : (
              tasks.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  currentUserId={currentUserId}
                  onComplete={handleComplete}
                  onAssist={setAssistTask}
                  onSwap={setSwapTask}
                />
              ))
            )}
          </div>
        </div>

        <div className="space-y-4">
          <div className="md:hidden bg-red-500/5 border border-red-500/20 rounded-xl p-4 flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-white">Feeling Unwell?</p>
              <p className="text-xs text-[#8896b0]">Request replacement.</p>
            </div>
            <button onClick={() => setSickOpen(true)} className="px-3 py-1.5 bg-red-500 text-white text-xs font-medium rounded-lg hover:bg-red-600 transition-colors">
              I&apos;m Sick
            </button>
          </div>

          <div className="bg-[#111827] border border-[#1e2d45] rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <Trophy size={15} className="text-amber-400" /> House Champions
              </h3>
              <button onClick={() => setActivePage('leaderboard')} className="text-xs text-emerald-400 hover:text-emerald-300 transition-colors">
                Full board
              </button>
            </div>
            <div className="space-y-2.5">
              {members.slice(0, 4).map((m, i) => (
                <div key={m.id} className={`flex items-center gap-2.5 ${m.id === currentUserId ? 'bg-indigo-500/5 -mx-2 px-2 py-1 rounded-lg border border-indigo-500/10' : ''}`}>
                  <span className="w-5 text-xs font-bold text-[#8896b0]">
                    {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}`}
                  </span>
                  <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0" style={{ backgroundColor: m.color }}>
                    {m.avatar}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-white truncate">{m.name}</p>
                    <div className="mt-0.5 h-1 rounded-full bg-[#1a2236] overflow-hidden">
                      <div className="h-full rounded-full transition-all duration-700" style={{ width: `${(m.points / topPoints) * 100}%`, backgroundColor: m.color }} />
                    </div>
                  </div>
                  <span className="text-xs font-semibold text-[#8896b0]">{m.points}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-[#111827] border border-[#1e2d45] rounded-xl p-4">
            <h3 className="text-sm font-semibold text-white mb-3">Achievements</h3>
            <div className="space-y-3">
              {(achievements.length ? achievements : mockAchievements).map((a) => (
                <div key={a.id}>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-base">{a.icon}</span>
                    <div className="flex-1">
                      <p className="text-xs font-medium text-white">{a.title}</p>
                      <p className="text-xs text-[#8896b0]">{a.desc}</p>
                    </div>
                    <span className="text-xs text-[#8896b0]">{a.current}/{a.total}</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-[#1a2236] overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-700" style={{ width: `${(a.current / a.total) * 100}%`, backgroundColor: a.color }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {assistTask && <AssistModal task={assistTask} onClose={() => setAssistTask(null)} onSuccess={loadData} />}
      {swapTask   && <SwapModal   task={swapTask}   onClose={() => setSwapTask(null)} onSuccess={loadData} />}
      {sickOpen   && <SickLeaveModal tasks={tasks} onClose={() => setSickOpen(false)} onSuccess={loadData} />}
    </div>
  );
}
