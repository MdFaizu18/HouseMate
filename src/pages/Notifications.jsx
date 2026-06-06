import { useCallback, useEffect, useState } from 'react';
import { Bell, CheckCircle2, RefreshCw, Trophy, Users, CheckCheck } from 'lucide-react';
import { api } from '../lib/api';
import { mapNotification } from '../lib/mappers';
import { notifications as mockNotifications } from '../data/mockData';
import { useApp } from '../context/AppContext';
import { LoadingState, ErrorState } from '../components/LoadingState';

const typeConfig = {
  assist:   { icon: Users,        color: '#10b981' },
  claim:    { icon: CheckCheck,   color: '#6366f1' },
  complete: { icon: CheckCircle2, color: '#3b82f6' },
  leader:   { icon: Trophy,       color: '#f59e0b' },
  swap:     { icon: RefreshCw,    color: '#f59e0b' },
};

export default function Notifications() {
  const { setUnreadCount } = useApp();
  const [notifs, setNotifs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadNotifications = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.getNotifications({ limit: 50 });
      setNotifs((res.data || []).map(mapNotification));
      setUnreadCount(res.unreadCount || 0);
    } catch (err) {
      setError(err.message);
      setNotifs(mockNotifications);
    } finally {
      setLoading(false);
    }
  }, [setUnreadCount]);

  useEffect(() => { loadNotifications(); }, [loadNotifications]);

  async function markAllRead() {
    try {
      await api.markNotificationsRead();
      setNotifs((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (err) {
      alert(err.message);
    }
  }

  async function markOneRead(id) {
    try {
      await api.markNotificationsRead([id]);
      setNotifs((prev) => prev.map((x) => (x.id === id ? { ...x, read: true } : x)));
      setUnreadCount((c) => Math.max(0, c - 1));
    } catch {
      setNotifs((prev) => prev.map((x) => (x.id === id ? { ...x, read: true } : x)));
    }
  }

  const unread = notifs.filter((n) => !n.read).length;

  if (loading) return <LoadingState message="Loading notifications..." />;

  return (
    <div className="p-4 md:p-6 pb-20 md:pb-6 animate-slide-in">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <Bell size={20} className="text-amber-400" /> Notifications
          </h1>
          <p className="text-xs text-[#8896b0] mt-0.5">{unread} unread</p>
        </div>
        {unread > 0 && (
          <button onClick={markAllRead} className="text-xs text-emerald-400 hover:text-emerald-300 transition-colors">
            Mark all read
          </button>
        )}
      </div>

      {error && <ErrorState message={error} onRetry={loadNotifications} />}

      <div className="space-y-2">
        {notifs.map((n) => {
          const cfg = typeConfig[n.type] || typeConfig.complete;
          const Icon = cfg.icon;
          return (
            <div
              key={n.id}
              onClick={() => !n.read && markOneRead(n.id)}
              className={`flex items-start gap-3 px-4 py-3.5 rounded-xl border transition-all cursor-pointer ${
                !n.read
                  ? 'bg-[#111827] border-[#1e2d45] hover:border-emerald-500/20'
                  : 'bg-[#0d1424] border-[#1e2d45]/50 opacity-70 hover:opacity-90'
              }`}
            >
              <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: cfg.color + '22' }}>
                <Icon size={16} style={{ color: cfg.color }} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-white font-medium">{n.message}</p>
                {n.sub && <p className="text-xs text-emerald-400 mt-0.5">{n.sub}</p>}
                <p className="text-xs text-[#8896b0] mt-1">{n.time}</p>
              </div>
              {!n.read && (
                <span className="w-2 h-2 rounded-full bg-emerald-400 flex-shrink-0 mt-1.5" />
              )}
            </div>
          );
        })}
      </div>

      {notifs.every((n) => n.read) && notifs.length > 0 && (
        <div className="flex flex-col items-center justify-center py-12 text-center animate-slide-in">
          <CheckCircle2 size={36} className="text-emerald-500/30 mb-3" />
          <p className="text-sm text-[#8896b0]">All caught up!</p>
        </div>
      )}
    </div>
  );
}
