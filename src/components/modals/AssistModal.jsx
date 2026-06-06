import { useState } from 'react';
import { X, CheckCircle2, Zap } from 'lucide-react';
import { api } from '../../lib/api';

export default function AssistModal({ task, onClose, onSuccess }) {
  const [requested, setRequested] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  async function handleRequest() {
    setLoading(true);
    setError(null);
    try {
      await api.requestAssist(task.id);
      setRequested(true);
      onSuccess?.();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 modal-backdrop flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-[#111827] border border-[#1e2d45] rounded-2xl p-6 w-full max-w-sm animate-slide-in"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-bold text-white">Need Assistance?</h2>
          <button onClick={onClose} className="text-[#8896b0] hover:text-white transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="bg-[#1a2236] rounded-xl p-4 mb-4">
          <p className="text-sm text-[#8896b0]">Someone can help you complete this task.</p>
          <p className="text-sm font-semibold text-white mt-2">{task.icon} {task.title}</p>
        </div>

        <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3 mb-4">
          <Zap size={16} className="text-emerald-400" />
          <div>
            <p className="text-xs text-[#8896b0]">Reward for helper</p>
            <p className="text-sm font-bold text-emerald-400">+15 Points</p>
          </div>
        </div>

        {error && (
          <p className="text-xs text-red-400 mb-3">{error}</p>
        )}

        {requested && (
          <div className="flex items-center gap-2 bg-indigo-500/10 border border-indigo-500/20 rounded-xl p-3 mb-4 animate-slide-in">
            <CheckCircle2 size={16} className="text-indigo-400" />
            <p className="text-sm text-indigo-300 font-medium">Assist request sent to housemates.</p>
          </div>
        )}

        {!requested ? (
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-[#1e2d45] text-[#8896b0] hover:text-white text-sm font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleRequest}
              disabled={loading}
              className="flex-1 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white text-sm font-medium transition-colors"
            >
              {loading ? 'Sending...' : 'Request Help'}
            </button>
          </div>
        ) : (
          <button
            onClick={onClose}
            className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium transition-colors"
          >
            Close
          </button>
        )}
      </div>
    </div>
  );
}
