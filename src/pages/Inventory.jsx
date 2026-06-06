import { useCallback, useEffect, useState } from 'react';
import { Package, Plus, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { api } from '../lib/api';
import { mapInventoryItem } from '../lib/mappers';
import { inventoryItems as mockInventory } from '../data/mockData';
import { LoadingState, ErrorState } from '../components/LoadingState';

const statusConfig = {
  critical: { color: '#ef4444', label: 'Critical',  icon: AlertTriangle },
  low:      { color: '#f59e0b', label: 'Low Stock', icon: AlertTriangle },
  ok:       { color: '#10b981', label: 'Stocked',   icon: CheckCircle2 },
};

export default function Inventory() {
  const [items, setItems] = useState([]);
  const [refilled, setRefilled] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadInventory = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.getInventory({ limit: 50 });
      setItems((res.data || []).map(mapInventoryItem));
    } catch (err) {
      setError(err.message);
      setItems(mockInventory);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadInventory(); }, [loadInventory]);

  async function handleRefill(id) {
    try {
      await api.requestRefill(id);
      setRefilled((prev) => [...prev, id]);
      await loadInventory();
    } catch (err) {
      alert(err.message);
    }
  }

  if (loading) return <LoadingState message="Loading inventory..." />;

  return (
    <div className="p-4 md:p-6 pb-20 md:pb-6 animate-slide-in">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <Package size={20} className="text-amber-400" /> Inventory
          </h1>
          <p className="text-xs text-[#8896b0] mt-0.5">{items.filter((i) => i.status !== 'ok').length} items need attention</p>
        </div>
        <button className="flex items-center gap-2 px-3 py-2 bg-amber-500 hover:bg-amber-600 text-white text-xs font-medium rounded-xl transition-colors">
          <Plus size={14} /> Add Item
        </button>
      </div>

      {error && <ErrorState message={error} onRetry={loadInventory} />}

      {items.some((i) => i.status === 'critical') && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 mb-5 flex items-center gap-3 animate-slide-in">
          <AlertTriangle size={16} className="text-red-400 flex-shrink-0" />
          <p className="text-xs text-red-300">
            {items.filter((i) => i.status === 'critical').map((i) => i.name).join(', ')} {items.filter((i) => i.status === 'critical').length > 1 ? 'are' : 'is'} critically low. Please refill soon.
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {items.map((item) => {
          const sc = statusConfig[item.status] || statusConfig.ok;
          const StatusIcon = sc.icon;
          const isRefilled = refilled.includes(item.id) || item.refillRequested;

          return (
            <div
              key={item.id}
              className={`bg-[#111827] border rounded-2xl p-4 card-hover ${
                item.status === 'critical' ? 'border-red-500/20' : item.status === 'low' ? 'border-amber-500/20' : 'border-[#1e2d45]'
              }`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2.5">
                  <span className="text-2xl">{item.icon}</span>
                  <div>
                    <h3 className="text-sm font-semibold text-white">{item.name}</h3>
                    <p className="text-xs text-[#8896b0]">{item.amount}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1 text-xs font-medium" style={{ color: sc.color }}>
                  <StatusIcon size={12} />
                  <span>{sc.label}</span>
                </div>
              </div>

              <div className="h-2 rounded-full bg-[#1a2236] overflow-hidden mb-3">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{
                    width: isRefilled ? '100%' : `${item.percent}%`,
                    backgroundColor: isRefilled ? '#10b981' : sc.color,
                  }}
                />
              </div>

              <div className="flex items-center justify-between">
                <span className="text-xs text-[#8896b0]">{isRefilled ? '100%' : `${item.percent}%`} remaining</span>
                {(item.status === 'critical' || item.status === 'low') && !isRefilled ? (
                  <button
                    onClick={() => handleRefill(item.id)}
                    className="text-xs font-medium px-3 py-1.5 rounded-lg transition-colors"
                    style={{
                      backgroundColor: sc.color + '20',
                      color: sc.color,
                      border: `1px solid ${sc.color}40`,
                    }}
                  >
                    Need Refill
                  </button>
                ) : isRefilled ? (
                  <span className="text-xs text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 size={11} /> Requested
                  </span>
                ) : null}
              </div>
            </div>
          );
        })}

        <div className="bg-[#111827] border border-dashed border-[#1e2d45] rounded-2xl p-4 flex flex-col items-center justify-center gap-3 card-hover cursor-pointer hover:border-amber-500/40 min-h-[140px]">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
            <Plus size={18} className="text-amber-400" />
          </div>
          <p className="text-xs text-[#8896b0] text-center">Add new item</p>
        </div>
      </div>
    </div>
  );
}
