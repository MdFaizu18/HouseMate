import { useCallback, useEffect, useState } from 'react';
import { BarChart2, CheckCircle2, Users, RefreshCw, AlertCircle, Zap } from 'lucide-react';
import { api } from '../lib/api';
import { buildHeatmapGrid, buildPieData, buildWeeklyBarData } from '../lib/mappers';
import { useApp } from '../context/AppContext';
import { weeklyBarData as mockWeekly, pieData as mockPie, heatmapData as mockHeatmap } from '../data/mockData';
import { LoadingState, ErrorState } from '../components/LoadingState';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from 'recharts';

function StatBadge({ icon: Icon, label, value, color }) {
  return (
    <div className="bg-[#111827] border border-[#1e2d45] rounded-xl p-4 flex items-center gap-3 card-hover">
      <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: color + '22' }}>
        <Icon size={18} style={{ color }} />
      </div>
      <div>
        <p className="text-lg font-bold text-white">{value}</p>
        <p className="text-xs text-[#8896b0]">{label}</p>
      </div>
    </div>
  );
}

function HeatmapCell({ value }) {
  const opacity = value === 0 ? 0.05 : value === 1 ? 0.2 : value === 2 ? 0.4 : value === 3 ? 0.6 : value === 4 ? 0.8 : 1;
  return (
    <div className="w-4 h-4 rounded-sm" style={{ backgroundColor: `rgba(16, 185, 129, ${opacity})` }} title={`${value} tasks`} />
  );
}

export default function Analytics() {
  const { currentUser } = useApp();
  const [summary, setSummary] = useState(null);
  const [weeklyBarData, setWeeklyBarData] = useState(mockWeekly);
  const [pieData, setPieData] = useState(mockPie);
  const [heatmapData, setHeatmapData] = useState(mockHeatmap);
  const [favoriteTask, setFavoriteTask] = useState('—');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadAnalytics = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.getTaskAnalytics();
      const data = res.data;
      setSummary(data.summary);
      setWeeklyBarData(buildWeeklyBarData(data.weeklyHeatmap));
      setPieData(buildPieData(data.summary).length ? buildPieData(data.summary) : mockPie);
      setHeatmapData(buildHeatmapGrid(data.weeklyHeatmap));
      setFavoriteTask(
        data.favoriteCategory
          ? data.favoriteCategory.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
          : '—'
      );
    } catch (err) {
      setError(err.message);
      setSummary({
        completed: currentUser?.completedThisMonth || 0,
        assists: currentUser?.assists || 0,
        swaps: currentUser?.swaps || 0,
        skipped: currentUser?.skipped || 0,
        efficiency: currentUser?.efficiency || 0,
      });
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  useEffect(() => { loadAnalytics(); }, [loadAnalytics]);

  if (loading) return <LoadingState message="Loading analytics..." />;

  const stats = summary || {};

  return (
    <div className="p-4 md:p-6 pb-20 md:pb-6 space-y-5 animate-slide-in">
      <div>
        <h1 className="text-xl font-bold text-white flex items-center gap-2">
          <BarChart2 size={20} className="text-indigo-400" /> Analytics
        </h1>
        <p className="text-xs text-[#8896b0] mt-0.5">Your performance overview</p>
      </div>

      {error && <ErrorState message={error} onRetry={loadAnalytics} />}

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <StatBadge icon={CheckCircle2} label="Tasks Completed" value={stats.completed ?? 0} color="#10b981" />
        <StatBadge icon={Users}        label="Assists Given"    value={stats.assists ?? 0} color="#6366f1" />
        <StatBadge icon={RefreshCw}    label="Swaps Used"       value={stats.swaps ?? 0} color="#f59e0b" />
        <StatBadge icon={AlertCircle}  label="Skipped"          value={stats.skipped ?? 0} color="#ef4444" />
        <StatBadge icon={Zap}          label="Efficiency"       value={`${stats.efficiency ?? 0}%`} color="#3b82f6" />
        <div className="bg-[#111827] border border-[#1e2d45] rounded-xl p-4 flex items-center gap-3 card-hover">
          <span className="text-2xl">🍽</span>
          <div>
            <p className="text-xs font-bold text-white truncate">{favoriteTask}</p>
            <p className="text-xs text-[#8896b0]">Favorite Category</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-[#111827] border border-[#1e2d45] rounded-2xl p-4">
          <h3 className="text-sm font-semibold text-white mb-4">Weekly Activity</h3>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={weeklyBarData} barSize={14} barGap={2}>
              <XAxis dataKey="day" tick={{ fill: '#8896b0', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#8896b0', fontSize: 11 }} axisLine={false} tickLine={false} width={20} />
              <Tooltip contentStyle={{ backgroundColor: '#1a2236', border: '1px solid #1e2d45', borderRadius: '8px', fontSize: '12px' }} />
              <Bar dataKey="tasks" name="Tasks" fill="#10b981" radius={[4,4,0,0]} />
              <Bar dataKey="assists" name="Assists" fill="#6366f1" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
          <div className="flex gap-4 justify-center mt-2">
            <div className="flex items-center gap-1.5 text-xs text-[#8896b0]"><span className="w-2.5 h-2.5 rounded-sm bg-emerald-500" /> Tasks</div>
            <div className="flex items-center gap-1.5 text-xs text-[#8896b0]"><span className="w-2.5 h-2.5 rounded-sm bg-indigo-500" /> Assists</div>
          </div>
        </div>

        <div className="bg-[#111827] border border-[#1e2d45] rounded-2xl p-4">
          <h3 className="text-sm font-semibold text-white mb-2">Task Distribution</h3>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie data={pieData} cx="50%" cy="50%" outerRadius={75} paddingAngle={3} dataKey="value">
                {pieData.map((entry, index) => (
                  <Cell key={index} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ backgroundColor: '#1a2236', border: '1px solid #1e2d45', borderRadius: '8px', fontSize: '12px' }} />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex flex-wrap gap-2 justify-center">
            {pieData.map((e, i) => (
              <div key={i} className="flex items-center gap-1.5 text-xs text-[#8896b0]">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: e.color }} />
                {e.name} ({e.value})
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-[#111827] border border-[#1e2d45] rounded-2xl p-4">
        <h3 className="text-sm font-semibold text-white mb-4">Activity Heatmap</h3>
        <div className="overflow-x-auto">
          <div className="flex gap-1 min-w-max">
            {Array(7).fill(null).map((_, week) => (
              <div key={week} className="flex flex-col gap-1">
                {Array(7).fill(null).map((_, day) => {
                  const cell = heatmapData.find((c) => c.week === week && c.day === day);
                  return <HeatmapCell key={day} value={cell?.value || 0} />;
                })}
              </div>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-2 mt-3 text-xs text-[#8896b0]">
          <span>Less</span>
          {[0.05, 0.2, 0.4, 0.6, 0.8, 1].map((o, i) => (
            <div key={i} className="w-3 h-3 rounded-sm" style={{ backgroundColor: `rgba(16,185,129,${o})` }} />
          ))}
          <span>More</span>
        </div>
      </div>
    </div>
  );
}
