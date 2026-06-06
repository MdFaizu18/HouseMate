import { useCallback, useEffect, useState } from 'react';
import { Trophy, Flame, CheckCircle2, RefreshCw, Users, Edit } from 'lucide-react';
import { api } from '../lib/api';
import { mapActivityItem, mapBadgeProgress } from '../lib/mappers';
import { useApp } from '../context/AppContext';
import { achievements as mockAchievements, activityTimeline as mockTimeline } from '../data/mockData';
import { LoadingState, ErrorState } from '../components/LoadingState';

function StatPill({ icon: Icon, label, value, color }) {
  return (
    <div className="bg-[#1a2236] rounded-xl p-3 flex flex-col items-center gap-1 border border-[#1e2d45]">
      <Icon size={16} style={{ color }} />
      <span className="text-base font-bold text-white">{value}</span>
      <span className="text-xs text-[#8896b0] text-center">{label}</span>
    </div>
  );
}

export default function Profile() {
  const { currentUser, house } = useApp();
  const [achievements, setAchievements] = useState([]);
  const [activity, setActivity] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadProfile = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.getMyProfile();
      const { badgeProgress, recentActivity } = res.data;
      setAchievements((badgeProgress || []).slice(0, 3).map(mapBadgeProgress));
      setActivity((recentActivity || []).map(mapActivityItem));
    } catch (err) {
      setError(err.message);
      setAchievements(mockAchievements);
      setActivity(mockTimeline);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadProfile(); }, [loadProfile]);

  if (loading) return <LoadingState message="Loading profile..." />;

  return (
    <div className="p-4 md:p-6 pb-20 md:pb-6 space-y-5 animate-slide-in">
      <div className="bg-[#111827] border border-[#1e2d45] rounded-2xl p-5">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="w-16 h-16 rounded-full bg-indigo-600 flex items-center justify-center text-xl font-bold text-white border-2 border-indigo-400/40">
                {currentUser?.avatar}
              </div>
              <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center border-2 border-[#111827]">
                <span className="text-white text-xs font-bold">✓</span>
              </div>
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">{currentUser?.name}</h1>
              <p className="text-xs text-indigo-400 font-medium">Rank #{currentUser?.rank} in {house?.name || 'your house'}</p>
              <p className="text-xs text-[#8896b0] mt-0.5">Member since {currentUser?.joinedDate}</p>
            </div>
          </div>
          <button className="p-2 rounded-xl bg-[#1a2236] border border-[#1e2d45] text-[#8896b0] hover:text-white transition-colors">
            <Edit size={16} />
          </button>
        </div>

        <div className="bg-gradient-to-r from-emerald-500/10 to-indigo-500/10 border border-emerald-500/20 rounded-xl px-4 py-3 flex items-center justify-between">
          <div>
            <p className="text-xs text-[#8896b0]">Total Points</p>
            <p className="text-2xl font-bold text-emerald-400">{currentUser?.points}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-[#8896b0]">Streak</p>
            <p className="text-xl font-bold text-amber-400">🔥 {currentUser?.streak}d</p>
          </div>
        </div>
      </div>

      {error && <ErrorState message={error} onRetry={loadProfile} />}

      <div className="grid grid-cols-4 gap-2">
        <StatPill icon={CheckCircle2} label="Completed" value={currentUser?.completedThisMonth ?? 0} color="#10b981" />
        <StatPill icon={Users}        label="Assists"   value={currentUser?.assists ?? 0} color="#6366f1" />
        <StatPill icon={RefreshCw}    label="Swaps"     value={currentUser?.swaps ?? 0} color="#f59e0b" />
        <StatPill icon={Flame}        label="Day Streak" value={currentUser?.streak ?? 0} color="#ef4444" />
      </div>

      <div className="bg-[#111827] border border-[#1e2d45] rounded-2xl p-4">
        <h3 className="text-sm font-semibold text-white mb-4">Badges</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {achievements.map((a) => (
            <div key={a.id} className="bg-[#1a2236] rounded-xl p-3 border border-[#1e2d45] flex items-center gap-3">
              <span className="text-2xl">{a.icon}</span>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-white">{a.title}</p>
                <p className="text-xs text-[#8896b0]">{a.desc}</p>
                <div className="mt-1.5 h-1.5 rounded-full bg-[#0a0f1e] overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: `${(a.current / a.total) * 100}%`, backgroundColor: a.color }} />
                </div>
                <p className="text-xs mt-0.5" style={{ color: a.color }}>{a.current}/{a.total}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-[#111827] border border-[#1e2d45] rounded-2xl p-4">
        <h3 className="text-sm font-semibold text-white mb-4">Activity Timeline</h3>
        <div className="space-y-0">
          {activity.length === 0 ? (
            <p className="text-xs text-[#8896b0]">No recent activity.</p>
          ) : (
            activity.map((a, i) => (
              <div key={a.id} className="flex gap-3">
                <div className="flex flex-col items-center">
                  <div className="w-8 h-8 rounded-full bg-[#1a2236] border border-[#1e2d45] flex items-center justify-center text-base flex-shrink-0">
                    {a.icon}
                  </div>
                  {i < activity.length - 1 && (
                    <div className="w-0.5 flex-1 bg-[#1e2d45] my-1" style={{ minHeight: '20px' }} />
                  )}
                </div>
                <div className="pb-4 flex-1">
                  <p className="text-xs font-medium text-white">{a.action}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs text-[#8896b0]">{a.time}</span>
                    <span className="text-xs font-semibold text-emerald-400">{a.points} pts</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
