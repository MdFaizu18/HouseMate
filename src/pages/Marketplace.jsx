import { useCallback, useEffect, useState } from 'react';
import { ShoppingBag, CheckCircle2, Zap } from 'lucide-react';
import { api } from '../lib/api';
import { mapTask } from '../lib/mappers';
import { marketplaceTasks as mockMarketplace } from '../data/mockData';
import { LoadingState, ErrorState } from '../components/LoadingState';

export default function Marketplace() {
  const [tasks, setTasks] = useState([]);
  const [claimed, setClaimed] = useState([]);
  const [useMock, setUseMock] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadMarketplace = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.getTasks({ isMarketplace: 'true', limit: 50 });
      setTasks((res.data || []).map(mapTask));
      setUseMock(false);
    } catch (err) {
      setError(err.message);
      setTasks(mockMarketplace);
      setUseMock(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadMarketplace(); }, [loadMarketplace]);

  async function handleClaim(id) {
    if (useMock) {
      setClaimed((prev) => [...prev, id]);
      return;
    }
    try {
      await api.claimTask(id);
      setClaimed((prev) => [...prev, id]);
      await loadMarketplace();
    } catch (err) {
      alert(err.message);
    }
  }

  if (loading) return <LoadingState message="Loading marketplace..." />;

  return (
    <div className="p-4 md:p-6 pb-20 md:pb-6 animate-slide-in">
      <div className="flex items-center justify-between mb-2">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <ShoppingBag size={20} className="text-indigo-400" /> Task Marketplace
          </h1>
          <p className="text-xs text-[#8896b0] mt-0.5">Claim unassigned tasks and earn bonus points</p>
        </div>
      </div>

      {useMock && (
        <p className="text-xs text-amber-400 mb-3">Showing mock marketplace (API unavailable)</p>
      )}
      {error && !useMock && <ErrorState message={error} onRetry={loadMarketplace} />}

      <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-xl px-4 py-3 mb-5 flex items-center gap-3">
        <Zap size={16} className="text-indigo-400 flex-shrink-0" />
        <p className="text-xs text-indigo-300">Claim tasks to earn extra points. Swap requests from members also appear here.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {tasks.map((task) => {
          const isClaimed = claimed.includes(task.id);
          const hasPoster = !!task.postedBy;
          return (
            <div
              key={task.id}
              className={`bg-[#111827] border rounded-2xl p-5 card-hover ${
                isClaimed ? 'border-emerald-500/30' : 'border-[#1e2d45]'
              }`}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 rounded-xl bg-[#1a2236] flex items-center justify-center text-2xl">
                  {task.icon}
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span className="text-emerald-400 font-bold text-lg">+{task.reward}</span>
                  <span className="text-xs text-[#8896b0]">points</span>
                </div>
              </div>

              <h3 className="text-sm font-semibold text-white mb-1">{task.title}</h3>

              {hasPoster ? (
                <p className="text-xs text-[#8896b0] mb-3">
                  Posted by: <span className="text-indigo-400 font-medium">{task.postedBy}</span>
                </p>
              ) : (
                <p className="text-xs text-[#8896b0] mb-3">
                  Assigned: <span className="text-amber-400">Nobody</span>
                </p>
              )}

              {isClaimed ? (
                <div className="flex items-center gap-2 text-emerald-400 text-sm font-medium">
                  <CheckCircle2 size={15} /> Task claimed!
                </div>
              ) : (
                <button
                  onClick={() => handleClaim(task.id)}
                  className={`w-full py-2 rounded-xl text-sm font-medium transition-colors ${
                    hasPoster
                      ? 'bg-indigo-600 hover:bg-indigo-700 text-white'
                      : 'bg-emerald-500 hover:bg-emerald-600 text-white'
                  }`}
                >
                  {hasPoster ? 'Accept' : 'Claim Task'}
                </button>
              )}
            </div>
          );
        })}

        <div className="bg-[#111827] border border-dashed border-[#1e2d45] rounded-2xl p-5 flex flex-col items-center justify-center gap-3 card-hover cursor-pointer hover:border-indigo-500/40">
          <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
            <span className="text-2xl">➕</span>
          </div>
          <div className="text-center">
            <p className="text-sm font-semibold text-white">Post a Task</p>
            <p className="text-xs text-[#8896b0] mt-0.5">Let others help you with a task</p>
          </div>
        </div>
      </div>
    </div>
  );
}
