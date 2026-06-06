import {
  LayoutDashboard, CheckSquare, Calendar, ShoppingBag, Trophy,
  Gift, CreditCard, Package, BarChart2, Bell, Settings,
  ChevronLeft, ChevronRight, Home, Zap, LogOut,
} from 'lucide-react';
import { useApp } from '../context/AppContext';

const navItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'tasks', label: "Today's Tasks", icon: CheckSquare },
  { id: 'schedule', label: 'Schedule', icon: Calendar },
  { id: 'marketplace', label: 'Task Marketplace', icon: ShoppingBag },
  { id: 'leaderboard', label: 'Leaderboard', icon: Trophy },
  { id: 'rewards', label: 'Rewards', icon: Gift },
  { id: 'expenses', label: 'Expenses', icon: CreditCard },
  { id: 'inventory', label: 'Inventory', icon: Package },
  { id: 'analytics', label: 'Analytics', icon: BarChart2 },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'settings', label: 'Settings', icon: Settings },
];

export default function Sidebar({ activePage, setActivePage, collapsed, setCollapsed }) {
  const { currentUser, house, members, unreadCount, logout } = useApp();
  const memberCount = members.length || 0;

  async function handleLogout() {
    await logout();
    setActivePage('login');
  }

  return (
    <aside
      className={`hidden md:flex flex-col h-screen bg-[#111827] border-r border-[#1e2d45] transition-all duration-300 ease-in-out flex-shrink-0 ${
        collapsed ? 'w-16' : 'w-60'
      }`}
    >
      <div className={`flex items-center gap-3 px-4 py-5 border-b border-[#1e2d45] ${collapsed ? 'justify-center' : ''}`}>
        <div className="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center flex-shrink-0">
          <Home size={16} className="text-white" />
        </div>
        {!collapsed && (
          <span className="font-bold text-lg text-white tracking-tight">HouseMate</span>
        )}
      </div>

      {!collapsed && (
        <div className="px-4 py-3 border-b border-[#1e2d45]">
          <p className="text-xs text-[#8896b0] uppercase tracking-wider mb-1">Current House</p>
          <p className="text-sm font-semibold text-white">{house?.name || 'Your House'}</p>
          <p className="text-xs text-[#8896b0]">{memberCount} Members</p>
        </div>
      )}

      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
        {navItems.map(({ id, label, icon: Icon }) => {
          const isActive = activePage === id;
          return (
            <button
              key={id}
              onClick={() => setActivePage(id)}
              title={collapsed ? label : ''}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 group ${
                isActive
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                  : 'text-[#8896b0] hover:bg-[#1a2236] hover:text-white'
              } ${collapsed ? 'justify-center' : ''}`}
            >
              <Icon
                size={18}
                className={`flex-shrink-0 transition-colors ${isActive ? 'text-emerald-400' : 'text-[#8896b0] group-hover:text-white'}`}
              />
              {!collapsed && <span className="truncate">{label}</span>}
              {!collapsed && id === 'notifications' && unreadCount > 0 && (
                <span className="ml-auto text-xs bg-amber-500 text-white px-1.5 py-0.5 rounded-full">{unreadCount}</span>
              )}
              {!collapsed && isActive && id !== 'notifications' && (
                <span className="ml-auto w-1.5 h-1.5 rounded-full bg-emerald-400" />
              )}
            </button>
          );
        })}
      </nav>

      <div className={`border-t border-[#1e2d45] p-3 ${collapsed ? 'flex justify-center' : ''}`}>
        {collapsed ? (
          <div className="w-9 h-9 rounded-full bg-indigo-600 flex items-center justify-center text-white text-xs font-bold">
            {currentUser?.avatar}
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-indigo-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
              {currentUser?.avatar}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-white truncate">{currentUser?.name}</p>
              <p className="text-xs text-[#8896b0]">
                <span className="text-emerald-400 font-medium">{currentUser?.points} pts</span>
                {' '}&bull; Rank #{currentUser?.rank}
              </p>
            </div>
            <Zap size={14} className="text-emerald-400 flex-shrink-0 ml-auto" />
          </div>
        )}
      </div>

      <div className="border-t border-[#1e2d45] flex">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="flex-1 flex items-center justify-center h-10 text-[#8896b0] hover:text-white hover:bg-[#1a2236] transition-colors"
          title={collapsed ? 'Expand' : 'Collapse'}
        >
          {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
        {!collapsed && (
          <button
            onClick={handleLogout}
            title="Sign Out"
            className="flex items-center gap-2 px-3 h-10 text-[#8896b0] hover:text-red-400 hover:bg-red-500/10 transition-colors border-l border-[#1e2d45] text-xs font-medium"
          >
            <LogOut size={14} />
            <span>Sign Out</span>
          </button>
        )}
      </div>
    </aside>
  );
}
