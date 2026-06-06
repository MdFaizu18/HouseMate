import { useCallback, useEffect, useState } from 'react';
import { CreditCard, Plus, TrendingUp, Users } from 'lucide-react';
import { api } from '../lib/api';
import { mapExpenseCategory, mapExpenseTransaction } from '../lib/mappers';
import { expenses as mockExpenses, recentTransactions as mockTransactions } from '../data/mockData';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { LoadingState, ErrorState } from '../components/LoadingState';

const COLORS = ['#10b981', '#6366f1', '#f59e0b', '#3b82f6', '#ec4899', '#8b5cf6'];

function AddExpenseModal({ onClose, onAdd }) {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('');
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  async function handleAdd() {
    if (!title || !amount) return;
    setLoading(true);
    setError(null);
    try {
      await onAdd({
        title,
        category: category || title.toLowerCase(),
        amount: Number(amount),
        emoji: '💰',
      });
      onClose();
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
        <h2 className="text-base font-bold text-white mb-4">Add Expense</h2>
        <div className="space-y-3">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Title (e.g. Groceries)"
            className="w-full bg-[#1a2236] border border-[#1e2d45] rounded-xl px-3 py-2.5 text-sm text-white outline-none focus:border-emerald-500/50 transition-colors placeholder:text-[#8896b0]"
          />
          <input
            type="text"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            placeholder="Category (optional)"
            className="w-full bg-[#1a2236] border border-[#1e2d45] rounded-xl px-3 py-2.5 text-sm text-white outline-none focus:border-emerald-500/50 transition-colors placeholder:text-[#8896b0]"
          />
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="Amount (₹)"
            className="w-full bg-[#1a2236] border border-[#1e2d45] rounded-xl px-3 py-2.5 text-sm text-white outline-none focus:border-emerald-500/50 transition-colors placeholder:text-[#8896b0]"
          />
          {error && <p className="text-xs text-red-400">{error}</p>}
          <div className="flex gap-3 pt-1">
            <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-[#1e2d45] text-[#8896b0] text-sm font-medium hover:text-white transition-colors">Cancel</button>
            <button onClick={handleAdd} disabled={loading} className="flex-1 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white text-sm font-medium transition-colors">
              {loading ? 'Adding...' : 'Add'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Expenses() {
  const [showAdd, setShowAdd] = useState(false);
  const [expenses, setExpenses] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [summary, setSummary] = useState(null);
  const [monthLabel, setMonthLabel] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const currentMonth = new Date().toISOString().slice(0, 7);

  const loadExpenses = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [summaryRes, expensesRes] = await Promise.all([
        api.getExpenseSummary(currentMonth),
        api.getExpenses({ month: currentMonth, limit: 20 }),
      ]);
      const s = summaryRes.data;
      setSummary(s);
      setExpenses(
        (s.categoryBreakdown || []).map((c, i) => mapExpenseCategory(c.category, c.amount, i))
      );
      setTransactions((expensesRes.data || []).map(mapExpenseTransaction));
      const [y, m] = currentMonth.split('-');
      setMonthLabel(new Date(y, m - 1).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' }));
    } catch (err) {
      setError(err.message);
      setExpenses(mockExpenses);
      setTransactions(mockTransactions);
      setSummary({ totalAmount: mockExpenses.reduce((s, e) => s + e.amount, 0), perPerson: Math.round(mockExpenses.reduce((s, e) => s + e.amount, 0) / 6) });
    } finally {
      setLoading(false);
    }
  }, [currentMonth]);

  useEffect(() => { loadExpenses(); }, [loadExpenses]);

  async function handleAddExpense(body) {
    await api.createExpense({ ...body, month: currentMonth });
    await loadExpenses();
  }

  const total = summary?.totalAmount ?? expenses.reduce((s, e) => s + e.amount, 0);
  const perPerson = summary?.perPerson ?? Math.round(total / 6);
  const pieData = expenses.map((e, i) => ({ name: e.category, value: e.amount, color: COLORS[i % COLORS.length] }));

  if (loading) return <LoadingState message="Loading expenses..." />;

  return (
    <div className="p-4 md:p-6 pb-20 md:pb-6 space-y-5 animate-slide-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <CreditCard size={20} className="text-emerald-400" /> Expenses
          </h1>
          <p className="text-xs text-[#8896b0] mt-0.5">{monthLabel || 'This month'}</p>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-2 px-3 py-2 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-medium rounded-xl transition-colors"
        >
          <Plus size={14} /> Add Expense
        </button>
      </div>

      {error && <ErrorState message={error} onRetry={loadExpenses} />}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-[#111827] border border-[#1e2d45] rounded-2xl p-5">
          <h2 className="text-sm font-semibold text-white mb-4">Monthly Summary</h2>
          <div className="space-y-3">
            {expenses.map((e, i) => (
              <div key={e.id} className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="text-lg">{e.icon}</span>
                  <span className="text-sm text-[#8896b0]">{e.category}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-20 h-1.5 rounded-full bg-[#1a2236] overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${total ? (e.amount / total) * 100 : 0}%`, backgroundColor: COLORS[i % COLORS.length] }} />
                  </div>
                  <span className="text-sm font-semibold text-white w-20 text-right">
                    ₹{e.amount.toLocaleString()}
                  </span>
                </div>
              </div>
            ))}
            <div className="border-t border-[#1e2d45] pt-3 mt-1">
              <div className="flex justify-between items-center">
                <span className="text-sm text-white font-semibold">Total</span>
                <span className="text-base font-bold text-emerald-400">₹{total.toLocaleString()}</span>
              </div>
              <div className="flex items-center gap-2 mt-2 bg-indigo-500/10 border border-indigo-500/20 rounded-xl px-3 py-2">
                <Users size={14} className="text-indigo-400" />
                <span className="text-xs text-[#8896b0]">Per person:</span>
                <span className="text-xs font-bold text-indigo-400">₹{perPerson.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-[#111827] border border-[#1e2d45] rounded-2xl p-5">
          <h2 className="text-sm font-semibold text-white mb-2">Breakdown</h2>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={80} paddingAngle={3} dataKey="value">
                {pieData.map((entry, index) => (
                  <Cell key={index} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{ backgroundColor: '#1a2236', border: '1px solid #1e2d45', borderRadius: '8px', fontSize: '12px' }}
                formatter={(v) => [`₹${v.toLocaleString()}`, '']}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex flex-wrap gap-2 justify-center mt-1">
            {pieData.map((e, i) => (
              <div key={i} className="flex items-center gap-1.5 text-xs text-[#8896b0]">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: e.color }} />
                {e.name}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-[#111827] border border-[#1e2d45] rounded-2xl overflow-hidden">
        <div className="px-4 py-3 border-b border-[#1e2d45] flex items-center gap-2">
          <TrendingUp size={15} className="text-emerald-400" />
          <h3 className="text-sm font-semibold text-white">Recent Transactions</h3>
        </div>
        <div className="divide-y divide-[#1e2d45]">
          {transactions.map((tx) => (
            <div key={tx.id} className="flex items-center gap-3 px-4 py-3 hover:bg-[#1a2236] transition-colors">
              <div className="w-8 h-8 rounded-full bg-indigo-600/30 border border-indigo-600/40 flex items-center justify-center text-xs font-bold text-indigo-300">
                {tx.user.slice(0, 2).toUpperCase()}
              </div>
              <div className="flex-1">
                <p className="text-xs font-medium text-white">
                  <span className="text-indigo-400">{tx.user}</span> {tx.action} {tx.category}
                </p>
                <p className="text-xs text-[#8896b0]">{tx.time}</p>
              </div>
              <span className="text-sm font-semibold text-emerald-400">₹{tx.amount.toLocaleString()}</span>
            </div>
          ))}
        </div>
      </div>

      {showAdd && <AddExpenseModal onClose={() => setShowAdd(false)} onAdd={handleAddExpense} />}
    </div>
  );
}
