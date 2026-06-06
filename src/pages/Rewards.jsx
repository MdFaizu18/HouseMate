import { Gift, Zap, Lock } from 'lucide-react';
import { achievements as mockAchievements } from '../data/mockData';
import { useApp } from '../context/AppContext';

const rewardItems = [
  { id: 1, icon: '🎮', title: 'Game Night Host',    cost: 100, desc: 'Host the next game night, skip 1 task',    locked: false },
  { id: 2, icon: '🍕', title: 'Order Choice',       cost: 150, desc: "Pick this month's takeout order",         locked: false },
  { id: 3, icon: '😴', title: 'Lazy Sunday Pass',   cost: 200, desc: 'Skip all Sunday tasks for one week',      locked: false },
  { id: 4, icon: '👑', title: 'Week Off Pass',      cost: 350, desc: 'Full week task-free',                     locked: true },
  { id: 5, icon: '🎁', title: 'Mystery Reward',     cost: 500, desc: 'Surprise reward from the house fund',     locked: true },
];

export default function Rewards() {
  const { currentUser } = useApp();
  const achievements = mockAchievements;

  return (
    <div className="p-4 md:p-6 pb-20 md:pb-6 space-y-5 animate-slide-in">
      <div>
        <h1 className="text-xl font-bold text-white flex items-center gap-2">
          <Gift size={20} className="text-amber-400" /> Rewards
        </h1>
        <p className="text-xs text-[#8896b0] mt-0.5">Spend your points on house perks (mock store — no API yet)</p>
      </div>

      {/* Points balance */}
      <div className="bg-gradient-to-r from-emerald-500/10 to-indigo-500/10 border border-emerald-500/20 rounded-2xl p-4 flex items-center justify-between">
        <div>
          <p className="text-xs text-[#8896b0]">Your Balance</p>
          <p className="text-2xl font-bold text-emerald-400 flex items-center gap-1.5">
            <Zap size={18} /> {currentUser.points} pts
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs text-[#8896b0]">Rank</p>
          <p className="text-xl font-bold text-indigo-400">#{currentUser.rank}</p>
        </div>
      </div>

      {/* Reward store */}
      <div>
        <h2 className="text-sm font-semibold text-white mb-3">Reward Store</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {rewardItems.map(r => {
            const canAfford = currentUser.points >= r.cost;
            return (
              <div
                key={r.id}
                className={`bg-[#111827] border rounded-2xl p-4 card-hover ${r.locked ? 'border-[#1e2d45] opacity-70' : 'border-[#1e2d45] hover:border-amber-500/30'}`}
              >
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 rounded-xl bg-[#1a2236] flex items-center justify-center text-2xl flex-shrink-0">
                    {r.locked ? <Lock size={20} className="text-[#8896b0]" /> : r.icon}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="text-sm font-semibold text-white">{r.title}</h3>
                      <span className="text-amber-400 font-bold text-sm flex-shrink-0">{r.cost} pts</span>
                    </div>
                    <p className="text-xs text-[#8896b0] mt-0.5">{r.desc}</p>
                    <button
                      disabled={r.locked || !canAfford}
                      className={`mt-3 w-full py-2 rounded-xl text-xs font-medium transition-colors ${
                        r.locked
                          ? 'bg-[#1a2236] text-[#8896b0] cursor-not-allowed border border-[#1e2d45]'
                          : canAfford
                          ? 'bg-amber-500 hover:bg-amber-600 text-white'
                          : 'bg-[#1a2236] text-[#8896b0] cursor-not-allowed border border-[#1e2d45]'
                      }`}
                    >
                      {r.locked ? 'Locked' : !canAfford ? `Need ${r.cost - currentUser.points} more pts` : 'Redeem'}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Achievements */}
      <div className="bg-[#111827] border border-[#1e2d45] rounded-2xl p-4">
        <h2 className="text-sm font-semibold text-white mb-4">Achievement Progress</h2>
        <div className="space-y-4">
          {achievements.map(a => (
            <div key={a.id}>
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2">
                  <span className="text-base">{a.icon}</span>
                  <div>
                    <p className="text-xs font-medium text-white">{a.title}</p>
                    <p className="text-xs text-[#8896b0]">{a.desc}</p>
                  </div>
                </div>
                <span className="text-xs font-medium" style={{ color: a.color }}>{a.current}/{a.total}</span>
              </div>
              <div className="h-2 rounded-full bg-[#1a2236] overflow-hidden">
                <div className="h-full rounded-full transition-all duration-700" style={{ width: `${(a.current / a.total) * 100}%`, backgroundColor: a.color }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
