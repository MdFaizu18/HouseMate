import { useState } from 'react';
import { X, Heart, CheckCircle2 } from 'lucide-react';
import { api } from '../../lib/api';

export default function SickLeaveModal({ tasks = [], onClose, onSuccess }) {
  const [submitted, setSubmitted] = useState(false);
  const [reason, setReason] = useState('Fever');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const pendingTasks = tasks.filter((t) => t.status === 'pending');

  async function handleSubmit() {
    if (pendingTasks.length === 0) {
      setError('No pending tasks to request sick leave for.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await Promise.all(
        pendingTasks.map((t) => api.requestSickLeave(t.id, { reason }))
      );
      setSubmitted(true);
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
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Heart size={16} className="text-red-400" /> Sick Leave Request
          </h2>
          <button onClick={onClose} className="text-[#8896b0] hover:text-white transition-colors">
            <X size={18} />
          </button>
        </div>

        {submitted ? (
          <div className="text-center py-4 animate-slide-in">
            <CheckCircle2 size={40} className="text-emerald-400 mx-auto mb-3" />
            <p className="text-white font-semibold">Request submitted!</p>
            <p className="text-sm text-[#8896b0] mt-1">Your housemates have been notified.</p>
            <button
              onClick={onClose}
              className="mt-4 w-full py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-medium transition-colors"
            >
              Close
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="block text-xs text-[#8896b0] mb-1.5">Tasks affected</label>
              <div className="w-full bg-[#1a2236] border border-[#1e2d45] rounded-xl px-3 py-2.5 text-sm text-white">
                {pendingTasks.length} pending task{pendingTasks.length !== 1 ? 's' : ''} today
              </div>
            </div>

            <div>
              <label className="block text-xs text-[#8896b0] mb-1.5">Reason</label>
              <input
                type="text"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full bg-[#1a2236] border border-[#1e2d45] rounded-xl px-3 py-2.5 text-sm text-white outline-none focus:border-red-500/50 transition-colors"
                placeholder="e.g. Fever"
              />
            </div>

            {error && <p className="text-xs text-red-400">{error}</p>}

            <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3">
              <span className="text-lg">🎁</span>
              <div>
                <p className="text-xs text-[#8896b0]">Replacement Bonus</p>
                <p className="text-sm font-bold text-emerald-400">+30 Points for your helper</p>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 py-2.5 rounded-xl border border-[#1e2d45] text-[#8896b0] hover:text-white text-sm font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={loading || pendingTasks.length === 0}
                className="flex-1 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 disabled:opacity-50 text-white text-sm font-medium transition-colors"
              >
                {loading ? 'Submitting...' : 'Submit'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
