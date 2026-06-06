import { useCallback, useEffect, useState } from 'react';
import { CheckCheck, AlertCircle, RefreshCw, CheckCircle2, Clock } from 'lucide-react';
import { api } from '../lib/api';
import { mapTask } from '../lib/mappers';
import { useApp } from '../context/AppContext';
import AssistModal from '../components/modals/AssistModal';
import SwapModal from '../components/modals/SwapModal';
import { LoadingState, ErrorState } from '../components/LoadingState';

const statusMap = {
  pending:   { label: 'Pending',   bg: 'bg-amber-500/10',   text: 'text-amber-400',   border: 'border-amber-500/20' },
  completed: { label: 'Completed', bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/20' },
  upcoming:  { label: 'Upcoming',  bg: 'bg-indigo-500/10',  text: 'text-indigo-400',  border: 'border-indigo-500/20' },
};

export default function Tasks() {
  const { currentUserId, refreshUser, loadHouseData } = useApp();
  const [filter, setFilter] = useState('all');
  const [assistTask, setAssistTask] = useState(null);
  const [swapTask, setSwapTask]     = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadTasks = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const today = new Date();
      const start = new Date(today);
      start.setHours(0, 0, 0, 0);
      const end = new Date(today);
      end.setDate(end.getDate() + 14);
      end.setHours(23, 59, 59, 999);

      const res = await api.getTasks({
        from: start.toISOString(),
        to: end.toISOString(),
        limit: 50,
      });
      setTasks((res.data || []).map(mapTask));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadTasks(); }, [loadTasks]);

  async function handleComplete(taskId) {
    try {
      await api.completeTask(taskId);
      await Promise.all([loadTasks(), refreshUser(), loadHouseData()]);
    } catch (err) {
      alert(err.message);
    }
  }

  const filtered = filter === 'all' ? tasks : tasks.filter((t) => t.status === filter);

  if (loading) return <LoadingState message="Loading tasks..." />;
  if (error) return <ErrorState message={error} onRetry={loadTasks} />;

  return (
    <div className="p-4 md:p-6 pb-20 md:pb-6 animate-slide-in">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-xl font-bold text-white">Today&apos;s Tasks</h1>
          <p className="text-xs text-[#8896b0] mt-0.5">{filtered.length} tasks shown</p>
        </div>
      </div>

      <div className="flex gap-2 mb-4 flex-wrap">
        {['all', 'pending', 'completed', 'upcoming'].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-colors ${
              filter === f
                ? 'bg-emerald-500 text-white'
                : 'bg-[#1a2236] text-[#8896b0] border border-[#1e2d45] hover:text-white'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {filtered.length === 0 ? (
          <p className="text-sm text-[#8896b0]">No tasks match this filter.</p>
        ) : (
          filtered.map((task) => {
            const s = statusMap[task.status];
            const isMine = task.assignedToId === currentUserId;
            return (
              <div key={task.id} className="bg-[#111827] border border-[#1e2d45] rounded-xl p-4 card-hover">
                <div className="flex items-start gap-3">
                  <span className="text-2xl">{task.icon}</span>
                  <div className="flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="text-sm font-semibold text-white">{task.title}</h3>
                        <p className="text-xs text-[#8896b0] mt-0.5">Assigned: {task.assignedTo}</p>
                      </div>
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full border flex-shrink-0 ${s.bg} ${s.text} ${s.border}`}>
                        {s.label}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 mt-2 text-xs text-[#8896b0]">
                      <span className="flex items-center gap-1"><Clock size={11} /> {task.due}</span>
                      <span className="text-emerald-400 font-semibold">+{task.reward} pts</span>
                      {task.completedAt && (
                        <span className="flex items-center gap-1 text-emerald-400">
                          <CheckCircle2 size={11} /> {task.completedAt}
                        </span>
                      )}
                    </div>

                    {task.status === 'pending' && isMine && (
                      <div className="flex gap-2 mt-3">
                        <button
                          onClick={() => handleComplete(task.id)}
                          className="flex items-center gap-1 px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-medium rounded-lg transition-colors"
                        >
                          <CheckCheck size={12} /> Complete
                        </button>
                        <button
                          onClick={() => setAssistTask(task)}
                          className="flex items-center gap-1 px-3 py-1.5 bg-[#1a2236] border border-[#1e2d45] hover:border-indigo-500/30 text-[#8896b0] hover:text-indigo-400 text-xs font-medium rounded-lg transition-colors"
                        >
                          <AlertCircle size={12} /> Assist
                        </button>
                        <button
                          onClick={() => setSwapTask(task)}
                          className="flex items-center gap-1 px-3 py-1.5 bg-[#1a2236] border border-[#1e2d45] hover:border-amber-500/30 text-[#8896b0] hover:text-amber-400 text-xs font-medium rounded-lg transition-colors"
                        >
                          <RefreshCw size={12} /> Swap
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {assistTask && <AssistModal task={assistTask} onClose={() => setAssistTask(null)} onSuccess={loadTasks} />}
      {swapTask   && <SwapModal   task={swapTask}   onClose={() => setSwapTask(null)} onSuccess={loadTasks} />}
    </div>
  );
}
