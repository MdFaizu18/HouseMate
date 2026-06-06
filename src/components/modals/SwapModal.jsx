import { useState } from 'react';
import { X, RefreshCw } from 'lucide-react';
import { api } from '../../lib/api';
import { useApp } from '../../context/AppContext';

const rewardOptions = [10, 20, 30, 40];

export default function SwapModal({ task, onClose, onSuccess }) {
  const { members, currentUserId } = useApp();
  const [selectedMember, setSelectedMember] = useState('');
  const [reward, setReward] = useState(20);
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const otherMembers = members.filter((m) => m.id !== currentUserId);

  async function handleSend() {
    if (!selectedMember) return;
    setLoading(true);
    setError(null);
    try {
      await api.requestSwap(task.id, {
        requestedTo: selectedMember,
        offeredPoints: reward,
      });
      setSent(true);
      onSuccess?.();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  const selectedName = otherMembers.find((m) => m.id === selectedMember)?.name;

  return (
    <div className="fixed inset-0 z-50 modal-backdrop flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-[#111827] border border-[#1e2d45] rounded-2xl p-6 w-full max-w-sm animate-slide-in"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <RefreshCw size={16} className="text-amber-400" /> Swap Your Task
          </h2>
          <button onClick={onClose} className="text-[#8896b0] hover:text-white transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-xs text-[#8896b0] mb-1.5">Select House Member</label>
            <select
              value={selectedMember}
              onChange={(e) => setSelectedMember(e.target.value)}
              className="w-full bg-[#1a2236] border border-[#1e2d45] rounded-xl px-3 py-2.5 text-sm text-white outline-none focus:border-amber-500/50 transition-colors"
            >
              <option value="">Choose a member...</option>
              {otherMembers.map((m) => (
                <option key={m.id} value={m.id}>{m.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs text-[#8896b0] mb-2">Offer Reward</label>
            <div className="flex gap-2">
              {rewardOptions.map((r) => (
                <button
                  key={r}
                  onClick={() => setReward(r)}
                  className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-colors ${
                    reward === r
                      ? 'bg-amber-500 text-white'
                      : 'bg-[#1a2236] text-[#8896b0] border border-[#1e2d45] hover:border-amber-500/30 hover:text-amber-400'
                  }`}
                >
                  {r} pts
                </button>
              ))}
            </div>
          </div>

          <div className="bg-[#1a2236] rounded-xl p-3">
            <p className="text-xs text-[#8896b0] mb-2">Summary</p>
            <div className="flex items-center justify-between text-sm">
              <div>
                <p className="text-white font-medium">{task.icon} {task.title}</p>
                <p className="text-xs text-[#8896b0] mt-0.5">You are offering this task</p>
              </div>
              <span className="text-amber-400 font-bold">+{reward} pts</span>
            </div>
          </div>

          {error && <p className="text-xs text-red-400">{error}</p>}

          {sent ? (
            <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3 text-center animate-slide-in">
              <p className="text-emerald-400 text-sm font-medium">Swap request sent!</p>
              <p className="text-xs text-[#8896b0] mt-1">Waiting for {selectedName || 'member'} to accept.</p>
            </div>
          ) : null}

          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-[#1e2d45] text-[#8896b0] hover:text-white text-sm font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSend}
              disabled={!selectedMember || loading}
              className="flex-1 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-medium transition-colors"
            >
              {loading ? 'Sending...' : 'Send Request'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
