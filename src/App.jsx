import { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import BottomNav from './components/BottomNav';
import AIAssistant from './components/AIAssistant';
import { useApp } from './context/AppContext';
import { LoadingState } from './components/LoadingState';

import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Tasks from './pages/Tasks';
import Schedule from './pages/Schedule';
import Marketplace from './pages/Marketplace';
import Leaderboard from './pages/Leaderboard';
import Rewards from './pages/Rewards';
import Expenses from './pages/Expenses';
import Inventory from './pages/Inventory';
import Analytics from './pages/Analytics';
import Notifications from './pages/Notifications';
import Settings from './pages/Settings';
import Profile from './pages/Profile';

const PAGE_TITLES = {
  dashboard: 'Dashboard',
  tasks: "Today's Tasks",
  schedule: 'Schedule',
  marketplace: 'Task Marketplace',
  leaderboard: 'Leaderboard',
  rewards: 'Rewards',
  expenses: 'Expenses',
  inventory: 'Inventory',
  analytics: 'Analytics',
  notifications: 'Notifications',
  settings: 'Settings',
  profile: 'Profile',
};

function PageRenderer({ page, setActivePage }) {
  if (page === 'login') return <Login setActivePage={setActivePage} />;
  if (page === 'register') return <Register setActivePage={setActivePage} />;

  switch (page) {
    case 'dashboard': return <Dashboard setActivePage={setActivePage} />;
    case 'tasks': return <Tasks />;
    case 'schedule': return <Schedule />;
    case 'marketplace': return <Marketplace />;
    case 'leaderboard': return <Leaderboard />;
    case 'rewards': return <Rewards />;
    case 'expenses': return <Expenses />;
    case 'inventory': return <Inventory />;
    case 'analytics': return <Analytics />;
    case 'notifications': return <Notifications />;
    case 'settings': return <Settings />;
    case 'profile': return <Profile />;
    default: return <Dashboard setActivePage={setActivePage} />;
  }
}

export default function App() {
  const { isAuthenticated, loading, currentUser } = useApp();
  const [activePage, setActivePage] = useState('login');
  const [collapsed, setCollapsed] = useState(false);

  // After login, leave auth pages
  useEffect(() => {
    if (isAuthenticated && (activePage === 'login' || activePage === 'register')) {
      setActivePage('dashboard');
    }
  }, [isAuthenticated, activePage]);

  // After logout or expired session, return to login
  useEffect(() => {
    if (!loading && !isAuthenticated) {
      setActivePage('login');
    }
  }, [isAuthenticated, loading]);

  if (loading) {
    return (
      <div className="flex h-screen bg-[#0a0f1e] items-center justify-center">
        <LoadingState message="Loading HouseMate..." />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="w-full min-h-screen">
        <PageRenderer page={activePage} setActivePage={setActivePage} />
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-[#0a0f1e] overflow-hidden">
      <Sidebar
        activePage={activePage}
        setActivePage={setActivePage}
        collapsed={collapsed}
        setCollapsed={setCollapsed}
      />

      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="md:hidden flex items-center justify-between px-4 py-3 border-b border-[#1e2d45] bg-[#111827] flex-shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-emerald-500 flex items-center justify-center">
              <span className="text-white text-xs font-bold">H</span>
            </div>
            <span className="font-bold text-white text-sm">HouseMate</span>
          </div>
          <span className="text-xs text-[#8896b0] font-medium">{PAGE_TITLES[activePage]}</span>
          <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-xs font-bold text-white">
            {currentUser?.avatar || 'HM'}
          </div>
        </header>

        <div className="flex-1 overflow-y-auto pb-14 md:pb-0">
          <PageRenderer page={activePage} setActivePage={setActivePage} />
        </div>
      </main>

      <BottomNav activePage={activePage} setActivePage={setActivePage} />
      <AIAssistant />
    </div>
  );
}
