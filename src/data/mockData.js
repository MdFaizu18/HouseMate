export const currentUser = {
  id: 2,
  name: 'Faizu',
  avatar: 'FA',
  points: 240,
  rank: 2,
  streak: 12,
  completedThisMonth: 24,
  totalThisMonth: 30,
  assists: 8,
  swaps: 2,
  skipped: 1,
  efficiency: 96,
  favoriteTask: 'Kitchen Cleaning',
  joinedDate: 'Jan 2024',
};

export const members = [
  { id: 1, name: 'Harri',       avatar: 'HA', points: 420, rank: 1, role: 'House Champion',  color: '#10b981' },
  { id: 2, name: 'Faizu',       avatar: 'FA', points: 240, rank: 2, role: 'Member',           color: '#6366f1' },
  { id: 3, name: 'Bala',        avatar: 'BA', points: 230, rank: 3, role: 'Member',           color: '#f59e0b' },
  { id: 4, name: 'Athreya',     avatar: 'AT', points: 210, rank: 4, role: 'Member',           color: '#ec4899' },
  { id: 5, name: 'Dhayanandh',  avatar: 'DH', points: 180, rank: 5, role: 'Member',           color: '#3b82f6' },
  { id: 6, name: 'Afzal',       avatar: 'AF', points: 150, rank: 6, role: 'Weekend Off',      color: '#8b5cf6' },
];

export const todaysTasks = [
  {
    id: 1,
    icon: '🍽',
    title: 'Kitchen Cleaning',
    assignedTo: 'Faizu',
    due: 'Today',
    reward: 10,
    status: 'pending',
  },
  {
    id: 2,
    icon: '🛋',
    title: 'Living Room',
    assignedTo: 'Faizu',
    due: 'Today',
    reward: 10,
    status: 'completed',
    completedAt: '8:15 PM',
  },
  {
    id: 3,
    icon: '🚽',
    title: 'Toilet Cleaning',
    assignedTo: 'Faizu',
    due: '20 June',
    reward: 25,
    status: 'upcoming',
  },
];

export const marketplaceTasks = [
  { id: 1, icon: '🧹', title: 'Sunday Mop',       reward: 25, assignedTo: null,    postedBy: null },
  { id: 2, icon: '🚽', title: 'Toilet Cleaning',  reward: 35, assignedTo: null,    postedBy: null },
  { id: 3, icon: '🍽', title: 'Kitchen Cleaning', reward: 20, assignedTo: 'Faizu', postedBy: 'Faizu' },
];

export const achievements = [
  { id: 1, icon: '🏅', title: 'Cleaning King',   desc: '100 Tasks Completed', current: 78,  total: 100, color: '#f59e0b' },
  { id: 2, icon: '🤝', title: 'Best Friend',     desc: '25 Assists',           current: 16,  total: 25,  color: '#10b981' },
  { id: 3, icon: '🔥', title: 'Unstoppable',     desc: '30 Day Streak',        current: 12,  total: 30,  color: '#ef4444' },
];

export const expenses = [
  { id: 1, category: 'Rent',      amount: 48000, icon: '🏠' },
  { id: 2, category: 'Groceries', amount: 11500, icon: '🛒' },
  { id: 3, category: 'Gas',       amount: 1200,  icon: '⛽' },
  { id: 4, category: 'Wifi',      amount: 999,   icon: '📡' },
];

export const recentTransactions = [
  { id: 1, user: 'Faizu',      action: 'added',  category: 'Groceries', amount: 2300,  time: '2h ago' },
  { id: 2, user: 'Bala',       action: 'paid',   category: 'Gas',       amount: 1200,  time: '5h ago' },
  { id: 3, user: 'Dhayanandh', action: 'paid',   category: 'Wifi',      amount: 999,   time: '1d ago' },
];

export const inventoryItems = [
  { id: 1, name: 'Rice',              icon: '🌾', amount: '2 KG Left',   percent: 30, status: 'low' },
  { id: 2, name: 'Oil',               icon: '🫙', amount: '1 Bottle',    percent: 50, status: 'ok' },
  { id: 3, name: 'Dish Wash Liquid',  icon: '🧴', amount: '20%',         percent: 20, status: 'critical' },
  { id: 4, name: 'Salt',              icon: '🧂', amount: '500g Left',   percent: 60, status: 'ok' },
  { id: 5, name: 'Sugar',             icon: '🍬', amount: '1 KG Left',   percent: 70, status: 'ok' },
  { id: 6, name: 'Eggs',              icon: '🥚', amount: '4 Left',      percent: 25, status: 'low' },
];

export const notifications = [
  { id: 1, type: 'assist',    message: 'Harri accepted your assist request.',     sub: '+15 Points earned.',              time: '5m ago',  read: false },
  { id: 2, type: 'claim',     message: 'Bala claimed Sunday Mop.',                sub: null,                              time: '30m ago', read: false },
  { id: 3, type: 'complete',  message: 'Afzal completed Kitchen Cleaning.',       sub: null,                              time: '2h ago',  read: true },
  { id: 4, type: 'leader',    message: 'Monthly leaderboard updated.',            sub: 'Harri moves to #1.',              time: '5h ago',  read: true },
  { id: 5, type: 'swap',      message: 'Dhayanandh sent you a swap request.',     sub: 'Kitchen Cleaning for Toilet Cleaning.', time: '1d ago', read: true },
];

export const weeklyBarData = [
  { day: 'Mon', tasks: 4, assists: 1 },
  { day: 'Tue', tasks: 3, assists: 0 },
  { day: 'Wed', tasks: 5, assists: 2 },
  { day: 'Thu', tasks: 2, assists: 1 },
  { day: 'Fri', tasks: 6, assists: 1 },
  { day: 'Sat', tasks: 3, assists: 2 },
  { day: 'Sun', tasks: 1, assists: 1 },
];

export const pieData = [
  { name: 'Completed', value: 24, color: '#10b981' },
  { name: 'Assisted',  value: 8,  color: '#6366f1' },
  { name: 'Swapped',   value: 2,  color: '#f59e0b' },
  { name: 'Skipped',   value: 1,  color: '#ef4444' },
];

export const heatmapData = (() => {
  const d = [];
  for (let w = 0; w < 7; w++) {
    for (let day = 0; day < 7; day++) {
      d.push({ week: w, day, value: Math.floor(Math.random() * 5) });
    }
  }
  return d;
})();

export const scheduleEvents = {
  '2025-06-18': [{ task: 'Kitchen Cleaning', assignee: 'Faizu', status: 'completed' }],
  '2025-06-19': [{ task: 'Living Room',       assignee: 'Harri',  status: 'completed' }],
  '2025-06-20': [
    { task: 'Kitchen Cleaning', assignee: 'Faizu',  status: 'pending' },
    { task: 'Toilet Cleaning',  assignee: 'Bala',   status: 'pending' },
    { task: 'Sunday Mop',       assignee: 'Athreya', status: 'upcoming' },
  ],
  '2025-06-21': [{ task: 'Trash Out',         assignee: 'Afzal', status: 'upcoming' }],
  '2025-06-22': [{ task: 'Kitchen Cleaning',  assignee: 'Dhayanandh', status: 'upcoming' }],
};

export const activityTimeline = [
  { id: 1, action: 'Completed Kitchen Cleaning',    points: '+10', time: 'Today, 8:00 AM',   icon: '🍽' },
  { id: 2, action: 'Helped Harri with Living Room', points: '+15', time: 'Yesterday, 6:30 PM', icon: '🤝' },
  { id: 3, action: 'Swapped Toilet Cleaning',       points: '+5',  time: '2 days ago',         icon: '🔄' },
  { id: 4, action: 'Completed Living Room',         points: '+10', time: '3 days ago',         icon: '🛋' },
  { id: 5, action: 'Earned Streak Bonus',           points: '+20', time: '5 days ago',         icon: '🔥' },
];
