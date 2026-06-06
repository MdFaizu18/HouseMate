import { useState } from 'react';
import {
  LayoutDashboard, CheckSquare, Trophy, CreditCard, User,
  Calendar, ShoppingBag, Gift, Package, BarChart2, Bell,
  Settings, Home, Zap, X, LogOut, Menu,
} from 'lucide-react';
import { useApp } from '../context/AppContext';

const primaryItems = [
  { id: 'dashboard', label: 'Home', icon: LayoutDashboard },
  { id: 'tasks', label: 'Tasks', icon: CheckSquare },
  { id: 'leaderboard', label: 'Board', icon: Trophy },
  { id: 'expenses', label: 'Expenses', icon: CreditCard },
];

const allNavItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, group: 'Main' },
  { id: 'tasks', label: "Today's Tasks", icon: CheckSquare, group: 'Main' },
  { id: 'schedule', label: 'Schedule', icon: Calendar, group: 'Main' },
  { id: 'leaderboard', label: 'Leaderboard', icon: Trophy, group: 'Main' },
  { id: 'marketplace', label: 'Task Marketplace', icon: ShoppingBag, group: 'House' },
  { id: 'rewards', label: 'Rewards', icon: Gift, group: 'House' },
  { id: 'expenses', label: 'Expenses', icon: CreditCard, group: 'House' },
  { id: 'inventory', label: 'Inventory', icon: Package, group: 'House' },
  { id: 'analytics', label: 'Analytics', icon: BarChart2, group: 'Insights' },
  { id: 'notifications', label: 'Notifications', icon: Bell, group: 'Insights' },
  { id: 'profile', label: 'Profile', icon: User, group: 'Account' },
  { id: 'settings', label: 'Settings', icon: Settings, group: 'Account' },
];

const groups = ['Main', 'House', 'Insights', 'Account'];

export default function BottomNav({ activePage, setActivePage }) {
  const { currentUser, house, logout } = useApp();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const handleNavigate = (id) => {
    setActivePage(id);
    setDrawerOpen(false);
  };

  async function handleLogout() {
    await logout();
    setActivePage('login');
    setDrawerOpen(false);
  }

  return (
    <>
      {/* Backdrop */}
      {drawerOpen && (
        <div
          className="md:hidden fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
          onClick={() => setDrawerOpen(false)}
        />
      )}

      {/* Slide-up drawer */}
      <div
        className={`md:hidden fixed left-0 right-0 bottom-[56px] z-50 bg-[#111827] border border-[#1e2d45] rounded-t-2xl transition-transform duration-300 ease-in-out ${drawerOpen ? 'translate-y-0' : 'translate-y-full pointer-events-none'
          }`}
        style={{ maxHeight: '80vh', overflowY: 'auto' }}
      >
        {/* Drawer handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-[#1e2d45]" />
        </div>

        {/* User info header */}
        <div className="flex items-center gap-3 px-5 py-3 border-b border-[#1e2d45]">
          <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
            {currentUser?.avatar}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-white truncate">{currentUser?.name}</p>
            <p className="text-xs text-[#8896b0]">
              <span className="text-emerald-400 font-medium">{currentUser?.points} pts</span>
              {' '}&bull; Rank #{currentUser?.rank}
            </p>
          </div>
          <div className="ml-auto flex items-center gap-1">
            <Zap size={13} className="text-emerald-400" />
            <span className="text-xs text-emerald-400 font-medium">{house?.name || 'House'}</span>
          </div>
        </div>

        {/* Nav groups */}
        <div className="px-3 pb-4 pt-2">
          {groups.map((group) => {
            const items = allNavItems.filter((i) => i.group === group);
            return (
              <div key={group} className="mb-3">
                <p className="text-[10px] font-semibold text-[#4a5568] uppercase tracking-widest px-2 mb-1">
                  {group}
                </p>
                <div className="grid grid-cols-2 gap-1">
                  {items.map(({ id, label, icon: Icon }) => {
                    const isActive = activePage === id;
                    return (
                      <button
                        key={id}
                        onClick={() => handleNavigate(id)}
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${isActive
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : 'text-[#8896b0] hover:bg-[#1a2236] hover:text-white'
                          }`}
                      >
                        <Icon size={17} className={isActive ? 'text-emerald-400' : 'text-[#8896b0]'} />
                        <span className="truncate">{label}</span>
                        {isActive && (
                          <span className="ml-auto w-1.5 h-1.5 rounded-full bg-emerald-400 flex-shrink-0" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}

          {/* Logout */}
          <button
            onClick={handleLogout}
            className="w-full mt-1 flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-red-400 hover:bg-red-500/10 transition-all border border-transparent hover:border-red-500/20"
          >
            <LogOut size={17} />
            <span>Sign Out</span>
          </button>
        </div>
      </div>

      {/* Bottom tab bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#111827] border-t border-[#1e2d45] flex" style={{ height: 56 }}>
        {primaryItems.map(({ id, label, icon: Icon }) => {
          const isActive = activePage === id;
          return (
            <button
              key={id}
              onClick={() => handleNavigate(id)}
              className={`flex-1 flex flex-col items-center justify-center py-1.5 gap-0.5 text-[11px] font-medium transition-colors relative ${isActive ? 'text-emerald-400' : 'text-[#8896b0]'
                }`}
            >
              <Icon size={20} />
              <span>{label}</span>
              {isActive && (
                <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-emerald-400 rounded-b-full" />
              )}
            </button>
          );
        })}

        {/* Hamburger / More button */}
        <button
          onClick={() => setDrawerOpen((v) => !v)}
          className={`flex-1 flex flex-col items-center justify-center py-1.5 gap-0.5 text-[11px] font-medium transition-colors relative ${drawerOpen ? 'text-emerald-400' : 'text-[#8896b0]'
            }`}
        >
          {drawerOpen ? <X size={20} /> : <Menu size={20} />}
          <span>{drawerOpen ? 'Close' : 'More'}</span>
          {drawerOpen && (
            <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-emerald-400 rounded-b-full" />
          )}
        </button>
      </nav>
    </>
  );
}
