import { useCallback, useEffect, useState } from 'react';
import { Trophy, Star } from 'lucide-react';
import { api } from '../lib/api';
import { mapBadgeProgress, mapMember } from '../lib/mappers';
import { useApp } from '../context/AppContext';
import { members as mockMembers, achievements as mockAchievements } from '../data/mockData';
import { LoadingState, ErrorState } from '../components/LoadingState';

const medals = ['🥇', '🥈', '🥉'];

export default function Leaderboard() {
  const { currentUser, currentUserId } = useApp();
  const [members, setMembers] = useState([]);
  const [achievements, setAchievements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [boardRes, profileRes] = await Promise.all([
        api.getLeaderboard(),
        api.getMyProfile(),
      ]);
      setMembers((boardRes.data || []).map(mapMember));
      setAchievements((profileRes.data?.badgeProgress || []).slice(0, 3).map(mapBadgeProgress));
    } catch (err) {
      setError(err.message);
      setMembers(mockMembers);
      setAchievements(mockAchievements);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const topPoints = members[0]?.points || 420;
  const top3 = members.slice(0, 3);

  if (loading) return <LoadingState message="Loading leaderboard..." />;

  return (
    <div className="p-4 md:p-6 pb-20 md:pb-6 space-y-6 animate-slide-in">
      <div>
        <h1 className="text-xl font-bold text-white flex items-center gap-2">
          <Trophy size={20} className="text-amber-400" /> House Champions
        </h1>
        <p className="text-xs text-[#8896b0] mt-0.5">Live rankings from API</p>
      </div>

      {error && <ErrorState message={error} onRetry={loadData} />}

      {top3.length >= 3 && (
        <div className="flex items-end justify-center gap-3 pt-4">
          <div className="flex flex-col items-center gap-2 mb-0">
            <div className="text-lg font-bold" style={{ color: top3[1].color }}>🥈</div>
            <div className="w-14 h-14 rounded-full flex items-center justify-center text-lg font-bold text-white border-2" style={{ backgroundColor: top3[1].color + '33', borderColor: top3[1].color }}>
              {top3[1].avatar}
            </div>
            <p className="text-xs font-medium text-white">{top3[1].name}</p>
            <p className="text-xs text-[#8896b0]">{top3[1].points} pts</p>
            <div className="w-20 h-16 bg-[#1a2236] border border-[#1e2d45] rounded-t-lg flex items-center justify-center">
              <span className="text-[#8896b0] text-sm font-bold">2</span>
            </div>
          </div>
          <div className="flex flex-col items-center gap-2">
            <div className="text-xl">🥇</div>
            <div className="w-16 h-16 rounded-full flex items-center justify-center text-xl font-bold text-white border-2 relative" style={{ backgroundColor: top3[0].color + '33', borderColor: top3[0].color, boxShadow: `0 0 20px ${top3[0].color}44` }}>
              {top3[0].avatar}
              <div className="absolute -top-2 -right-1 w-5 h-5 bg-amber-400 rounded-full flex items-center justify-center">
                <Star size={10} className="text-white fill-white" />
              </div>
            </div>
            <p className="text-sm font-semibold text-white">{top3[0].name}</p>
            <p className="text-xs text-amber-400 font-medium">{top3[0].points} pts</p>
            <div className="w-20 h-24 bg-gradient-to-b from-amber-500/20 to-[#1a2236] border border-amber-500/30 rounded-t-lg flex items-center justify-center">
              <span className="text-amber-400 text-sm font-bold">1</span>
            </div>
          </div>
          <div className="flex flex-col items-center gap-2 mb-0">
            <div className="text-lg font-bold" style={{ color: top3[2].color }}>🥉</div>
            <div className="w-14 h-14 rounded-full flex items-center justify-center text-lg font-bold text-white border-2" style={{ backgroundColor: top3[2].color + '33', borderColor: top3[2].color }}>
              {top3[2].avatar}
            </div>
            <p className="text-xs font-medium text-white">{top3[2].name}</p>
            <p className="text-xs text-[#8896b0]">{top3[2].points} pts</p>
            <div className="w-20 h-12 bg-[#1a2236] border border-[#1e2d45] rounded-t-lg flex items-center justify-center">
              <span className="text-[#8896b0] text-sm font-bold">3</span>
            </div>
          </div>
        </div>
      )}

      <div className="bg-[#111827] border border-[#1e2d45] rounded-2xl overflow-hidden">
        <div className="px-4 py-3 border-b border-[#1e2d45]">
          <h3 className="text-sm font-semibold text-white">All Rankings</h3>
        </div>
        <div className="divide-y divide-[#1e2d45]">
          {members.map((m, i) => {
            const isCurrentUser = m.id === currentUserId;
            return (
              <div key={m.id} className={`flex items-center gap-3 px-4 py-3 transition-colors ${isCurrentUser ? 'bg-indigo-500/5' : 'hover:bg-[#1a2236]'}`}>
                <span className="w-7 text-center text-sm font-bold text-[#8896b0]">
                  {i < 3 ? medals[i] : `${i + 1}`}
                </span>
                <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-white flex-shrink-0" style={{ backgroundColor: m.color + '33', border: `1.5px solid ${m.color}66` }}>
                  {m.avatar}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-white">{m.name}</p>
                    {isCurrentUser && (
                      <span className="text-xs px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">you</span>
                    )}
                  </div>
                  <p className="text-xs text-[#8896b0]">{m.role}</p>
                  <div className="mt-1.5 h-1.5 rounded-full bg-[#1a2236] overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-700" style={{ width: `${(m.points / topPoints) * 100}%`, backgroundColor: m.color }} />
                  </div>
                </div>
                <span className="text-sm font-bold" style={{ color: m.color }}>{m.points}</span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="bg-[#111827] border border-[#1e2d45] rounded-2xl p-4">
        <h3 className="text-sm font-semibold text-white mb-4">Your Achievements</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {achievements.map((a) => (
            <div key={a.id} className="bg-[#1a2236] rounded-xl p-3 border border-[#1e2d45]">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xl">{a.icon}</span>
                <div>
                  <p className="text-xs font-semibold text-white">{a.title}</p>
                  <p className="text-xs text-[#8896b0]">{a.desc}</p>
                </div>
              </div>
              <div className="h-2 rounded-full bg-[#0a0f1e] overflow-hidden">
                <div className="h-full rounded-full" style={{ width: `${(a.current / a.total) * 100}%`, backgroundColor: a.color }} />
              </div>
              <p className="text-xs text-right mt-1" style={{ color: a.color }}>
                {a.current}/{a.total}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
