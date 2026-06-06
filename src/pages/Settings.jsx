import { Settings as SettingsIcon, Bell, Moon, Shield, Users, LogOut, ChevronRight } from 'lucide-react';
import { useApp } from '../context/AppContext';

const settingGroups = [
  {
    title: 'Account',
    items: [
      { icon: Users,  label: 'Edit Profile',         desc: 'Update your name and avatar' },
      { icon: Shield, label: 'Privacy',               desc: 'Manage your privacy settings' },
    ],
  },
  {
    title: 'Preferences',
    items: [
      { icon: Bell, label: 'Notifications',          desc: 'Control what you get notified about' },
      { icon: Moon, label: 'Dark Mode',              desc: 'Currently enabled', toggle: true },
    ],
  },
  {
    title: 'House',
    items: [
      { icon: Users, label: 'Manage Members',        desc: 'Active members' },
      { icon: SettingsIcon, label: 'House Rules',    desc: 'Edit chore rotation rules' },
    ],
  },
];

export default function Settings() {
  const { currentUser, house, members, logout } = useApp();
  const memberCount = members.length || house?.members?.filter((m) => m.isActive)?.length || 0;

  const groups = settingGroups.map((group) => ({
    ...group,
    items: group.items.map((item) =>
      item.label === 'Manage Members'
        ? { ...item, desc: `${memberCount} active members` }
        : item
    ),
  }));

  return (
    <div className="p-4 md:p-6 pb-20 md:pb-6 space-y-5 animate-slide-in">
      <h1 className="text-xl font-bold text-white flex items-center gap-2">
        <SettingsIcon size={20} className="text-[#8896b0]" /> Settings
      </h1>

      <div className="bg-[#111827] border border-[#1e2d45] rounded-2xl p-4 flex items-center gap-4">
        <div className="w-12 h-12 rounded-full bg-indigo-600 flex items-center justify-center text-lg font-bold text-white border-2 border-indigo-400/40">
          {currentUser?.avatar}
        </div>
        <div>
          <p className="text-sm font-semibold text-white">{currentUser?.name}</p>
          <p className="text-xs text-[#8896b0]">{house?.name || 'Your house'} &bull; Rank #{currentUser?.rank}</p>
          <p className="text-xs text-emerald-400 font-medium mt-0.5">{currentUser?.points} points</p>
        </div>
      </div>

      {groups.map((group) => (
        <div key={group.title} className="bg-[#111827] border border-[#1e2d45] rounded-2xl overflow-hidden">
          <p className="text-xs font-semibold text-[#8896b0] uppercase tracking-wider px-4 pt-3 pb-1">{group.title}</p>
          <div className="divide-y divide-[#1e2d45]">
            {group.items.map((item) => (
              <div key={item.label} className="flex items-center gap-3 px-4 py-3 hover:bg-[#1a2236] transition-colors cursor-pointer">
                <div className="w-8 h-8 rounded-lg bg-[#1a2236] border border-[#1e2d45] flex items-center justify-center flex-shrink-0">
                  <item.icon size={15} className="text-[#8896b0]" />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-white">{item.label}</p>
                  <p className="text-xs text-[#8896b0]">{item.desc}</p>
                </div>
                {item.toggle ? (
                  <div className="w-10 h-5 bg-emerald-500 rounded-full relative">
                    <div className="absolute right-0.5 top-0.5 w-4 h-4 bg-white rounded-full shadow" />
                  </div>
                ) : (
                  <ChevronRight size={15} className="text-[#8896b0]" />
                )}
              </div>
            ))}
          </div>
        </div>
      ))}

      <button
        onClick={logout}
        className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl border border-red-500/20 bg-red-500/5 text-red-400 hover:bg-red-500/10 transition-colors text-sm font-medium"
      >
        <LogOut size={16} /> Logout
      </button>
    </div>
  );
}
