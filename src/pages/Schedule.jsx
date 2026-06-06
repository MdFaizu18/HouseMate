import { useCallback, useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import { api } from '../lib/api';
import { buildScheduleEvents } from '../lib/mappers';
import { scheduleEvents as mockScheduleEvents } from '../data/mockData';
import { LoadingState, ErrorState } from '../components/LoadingState';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

function getDaysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDay(year, month) {
  return new Date(year, month, 1).getDay();
}

const statusColors = {
  completed: '#10b981',
  pending:   '#f59e0b',
  upcoming:  '#6366f1',
};

export default function Schedule() {
  const today = new Date();
  const [year, setYear]   = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [selected, setSelected] = useState(today.toISOString().slice(0, 10));
  const [scheduleEvents, setScheduleEvents] = useState({});
  const [useMock, setUseMock] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadSchedule = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const start = new Date(year, month, 1);
      const end = new Date(year, month + 1, 0, 23, 59, 59, 999);
      const res = await api.getTasks({
        from: start.toISOString(),
        to: end.toISOString(),
        limit: 100,
      });
      const events = buildScheduleEvents(res.data || []);
      setScheduleEvents(events);
      setUseMock(false);
    } catch (err) {
      setError(err.message);
      setScheduleEvents(mockScheduleEvents);
      setUseMock(true);
    } finally {
      setLoading(false);
    }
  }, [year, month]);

  useEffect(() => { loadSchedule(); }, [loadSchedule]);

  const daysInMonth = getDaysInMonth(year, month);
  const firstDay    = getFirstDay(year, month);

  function prevMonth() {
    if (month === 0) { setMonth(11); setYear((y) => y - 1); }
    else setMonth((m) => m - 1);
  }
  function nextMonth() {
    if (month === 11) { setMonth(0); setYear((y) => y + 1); }
    else setMonth((m) => m + 1);
  }

  function dateKey(d) {
    return `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
  }

  const selectedEvents = scheduleEvents[selected] || [];

  if (loading) return <LoadingState message="Loading schedule..." />;

  return (
    <div className="p-4 md:p-6 pb-20 md:pb-6 animate-slide-in">
      <h1 className="text-xl font-bold text-white flex items-center gap-2 mb-5">
        <Calendar size={20} className="text-indigo-400" /> Schedule
      </h1>

      {useMock && (
        <p className="text-xs text-amber-400 mb-3">Showing mock schedule (API unavailable)</p>
      )}
      {error && !useMock && <ErrorState message={error} onRetry={loadSchedule} />}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 bg-[#111827] border border-[#1e2d45] rounded-2xl p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-white">{MONTHS[month]} {year}</h2>
            <div className="flex gap-1">
              <button onClick={prevMonth} className="w-8 h-8 rounded-lg bg-[#1a2236] hover:bg-[#1e2d45] text-[#8896b0] hover:text-white flex items-center justify-center transition-colors">
                <ChevronLeft size={14} />
              </button>
              <button onClick={nextMonth} className="w-8 h-8 rounded-lg bg-[#1a2236] hover:bg-[#1e2d45] text-[#8896b0] hover:text-white flex items-center justify-center transition-colors">
                <ChevronRight size={14} />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-7 mb-2">
            {DAYS.map((d) => (
              <div key={d} className="text-center text-xs font-medium text-[#8896b0] py-1">{d}</div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {Array(firstDay).fill(null).map((_, i) => <div key={`e${i}`} />)}
            {Array(daysInMonth).fill(null).map((_, i) => {
              const d = i + 1;
              const key = dateKey(d);
              const events = scheduleEvents[key] || [];
              const isSelected = selected === key;
              const isToday = d === today.getDate() && month === today.getMonth() && year === today.getFullYear();

              return (
                <button
                  key={d}
                  onClick={() => setSelected(key)}
                  className={`relative aspect-square rounded-lg flex flex-col items-center justify-start pt-1 transition-all text-xs font-medium ${
                    isSelected
                      ? 'bg-indigo-600 text-white'
                      : isToday
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                      : 'hover:bg-[#1a2236] text-[#8896b0] hover:text-white'
                  }`}
                >
                  {d}
                  {events.length > 0 && (
                    <div className="flex gap-0.5 mt-0.5 flex-wrap justify-center">
                      {events.slice(0, 3).map((ev, ei) => (
                        <span key={ei} className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: statusColors[ev.status] }} />
                      ))}
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          <div className="flex gap-4 mt-4 justify-end">
            {Object.entries(statusColors).map(([status, color]) => (
              <div key={status} className="flex items-center gap-1.5 text-xs text-[#8896b0]">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }} />
                <span className="capitalize">{status}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-[#111827] border border-[#1e2d45] rounded-2xl p-4">
          <h3 className="text-sm font-semibold text-white mb-1">
            {selected ? selected.replace(/-/g, ' ').replace(/(\d{4}) (\d{2}) (\d{2})/, (_, y, m, d) => `${MONTHS[parseInt(m)-1]} ${parseInt(d)}, ${y}`) : 'Select a day'}
          </h3>
          <p className="text-xs text-[#8896b0] mb-4">{selectedEvents.length} assignment(s)</p>

          {selectedEvents.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Calendar size={28} className="text-[#1e2d45] mb-2" />
              <p className="text-xs text-[#8896b0]">No tasks scheduled</p>
            </div>
          ) : (
            <div className="space-y-3">
              {selectedEvents.map((ev, i) => (
                <div key={i} className="bg-[#1a2236] rounded-xl p-3 border border-[#1e2d45]">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-xs font-semibold text-white">{ev.task}</p>
                    <span
                      className="text-xs px-2 py-0.5 rounded-full font-medium capitalize flex-shrink-0"
                      style={{
                        backgroundColor: statusColors[ev.status] + '22',
                        color: statusColors[ev.status],
                        border: `1px solid ${statusColors[ev.status]}44`,
                      }}
                    >
                      {ev.status}
                    </span>
                  </div>
                  <p className="text-xs text-[#8896b0] mt-1">Assignee: <span className="text-white">{ev.assignee}</span></p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
