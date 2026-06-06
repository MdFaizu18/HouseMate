const MEMBER_COLORS = ['#10b981', '#6366f1', '#f59e0b', '#ec4899', '#3b82f6', '#8b5cf6'];
const BADGE_COLORS = {
  cleaning_king: '#f59e0b',
  best_friend: '#10b981',
  unstoppable: '#ef4444',
  team_player: '#6366f1',
  quick_starter: '#3b82f6',
  first_task: '#8b5cf6',
};

export function getInitials(name = '') {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

export function formatRelativeTime(dateStr) {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  const diff = Date.now() - date.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

function formatDueDate(dueDate) {
  const due = new Date(dueDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const dueDay = new Date(due);
  dueDay.setHours(0, 0, 0, 0);

  if (dueDay.getTime() === today.getTime()) return 'Today';
  return due.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

function formatTime(dateStr) {
  if (!dateStr) return null;
  return new Date(dateStr).toLocaleTimeString('en-IN', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

export function mapTaskStatus(task) {
  const due = new Date(task.dueDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const dueDay = new Date(due);
  dueDay.setHours(0, 0, 0, 0);

  if (task.status === 'completed') return 'completed';
  if (task.status === 'skipped') return 'upcoming';
  if (dueDay > today && ['pending', 'overdue', 'in_progress'].includes(task.status)) {
    return 'upcoming';
  }
  if (['pending', 'overdue', 'in_progress'].includes(task.status)) return 'pending';
  return 'upcoming';
}

export function mapTask(task) {
  const status = mapTaskStatus(task);
  return {
    id: task._id,
    icon: task.emoji || '📋',
    title: task.title,
    assignedTo: task.assignedTo?.name || 'Unassigned',
    assignedToId: task.assignedTo?._id,
    due: formatDueDate(task.dueDate),
    dueDate: task.dueDate,
    reward: (task.points || 0) + (task.bonusPoints || 0),
    status,
    completedAt: formatTime(task.completedAt),
    postedBy: task.marketplacePostedBy?.name || null,
    isMarketplace: task.isMarketplace,
    raw: task,
  };
}

export function mapMember(member, index = 0) {
  return {
    id: member._id,
    name: member.name,
    avatar: member.avatar || getInitials(member.name),
    points: member.points || 0,
    rank: member.rank || index + 1,
    role: member.customRole || (member.role === 'admin' ? 'House Admin' : 'Member'),
    color: MEMBER_COLORS[index % MEMBER_COLORS.length],
    streak: member.streak?.current || 0,
    stats: member.stats || {},
  };
}

export function mapCurrentUser(user, house) {
  if (!user) return null;
  const joined = user.createdAt
    ? new Date(user.createdAt).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })
    : '';

  return {
    id: user._id,
    name: user.name,
    avatar: user.avatar || getInitials(user.name),
    points: user.points || 0,
    rank: user.rank || 0,
    streak: user.streak?.current || 0,
    completedThisMonth: user.stats?.tasksCompleted || 0,
    totalThisMonth: user.stats?.tasksCompleted || 0,
    assists: user.stats?.assistsGiven || 0,
    swaps: (user.stats?.swapsInitiated || 0) + (user.stats?.swapsReceived || 0),
    skipped: user.stats?.tasksSkipped || 0,
    efficiency: 0,
    favoriteTask: 'Kitchen Cleaning',
    joinedDate: joined,
    houseName: house?.name || '',
    email: user.email,
  };
}

export function mapBadgeProgress(badge, index) {
  return {
    id: badge.id || index,
    icon: badge.emoji || '🏅',
    title: badge.name,
    desc: badge.description,
    current: badge.progress?.current ?? 0,
    total: badge.progress?.target ?? 1,
    color: BADGE_COLORS[badge.id] || '#6366f1',
    earned: badge.earned,
  };
}

export function mapInventoryItem(item) {
  const percent =
    item.stockPercent ??
    (item.quantity?.maxCapacity
      ? Math.round((item.quantity.current / item.quantity.maxCapacity) * 100)
      : item.status === 'ok'
        ? 70
        : item.status === 'low'
          ? 30
          : 15);

  const status =
    item.status === 'out_of_stock'
      ? 'critical'
      : item.status === 'refill_requested'
        ? 'low'
        : item.status;

  const amount = item.quantity
    ? `${item.quantity.current} ${item.quantity.unit}`
    : `${percent}%`;

  return {
    id: item._id,
    name: item.name,
    icon: item.emoji || '📦',
    amount,
    percent,
    status,
    refillRequested: item.refillRequest?.isRequested,
    raw: item,
  };
}

const NOTIFICATION_TYPE_MAP = {
  assist_accepted: 'assist',
  assist_requested: 'assist',
  assist_completed: 'assist',
  task_assigned: 'claim',
  task_completed: 'complete',
  leaderboard_updated: 'leader',
  rank_changed: 'leader',
  swap_requested: 'swap',
  swap_accepted: 'swap',
  swap_rejected: 'swap',
  points_earned: 'complete',
  badge_earned: 'leader',
  expense_added: 'complete',
  expense_settled: 'complete',
  refill_requested: 'claim',
  sick_leave: 'swap',
};

export function mapNotification(n) {
  return {
    id: n._id,
    type: NOTIFICATION_TYPE_MAP[n.type] || 'complete',
    message: n.message || n.title,
    sub: n.type === 'points_earned' ? n.title : null,
    time: formatRelativeTime(n.createdAt),
    read: n.isRead,
    raw: n,
  };
}

export function mapExpenseCategory(cat, amount, index) {
  const icons = { rent: '🏠', groceries: '🛒', gas: '⛽', wifi: '📡', utilities: '💡', other: '💰' };
  const key = (cat || 'other').toLowerCase();
  return {
    id: key + index,
    category: cat.charAt(0).toUpperCase() + cat.slice(1),
    amount,
    icon: icons[key] || '💰',
  };
}

export function mapExpenseTransaction(expense) {
  const payer = expense.paidBy?.name || 'Someone';
  return {
    id: expense._id,
    user: payer,
    action: 'added',
    category: expense.category || expense.title,
    amount: expense.amount,
    time: formatRelativeTime(expense.createdAt),
  };
}

export function mapActivityItem(task, index) {
  return {
    id: task._id || index,
    action: `Completed ${task.title}`,
    points: `+${task.points || 10}`,
    time: formatRelativeTime(task.completedAt),
    icon: task.emoji || '✅',
  };
}

export function buildScheduleEvents(tasks) {
  const events = {};
  tasks.forEach((task) => {
    const key = new Date(task.dueDate).toISOString().slice(0, 10);
    if (!events[key]) events[key] = [];
    events[key].push({
      task: task.title,
      assignee: task.assignedTo?.name || 'Unassigned',
      status: mapTaskStatus(task),
      taskId: task._id,
    });
  });
  return events;
}

export function buildWeeklyBarData(heatmap) {
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const counts = days.map(() => ({ tasks: 0, assists: 0 }));

  (heatmap || []).forEach((entry) => {
    const date = new Date(entry._id);
    const dayIndex = date.getDay();
    counts[dayIndex].tasks += entry.count || 0;
  });

  return ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => {
    const idx = days.indexOf(day);
    return { day, tasks: counts[idx].tasks, assists: 0 };
  });
}

export function buildHeatmapGrid(heatmap) {
  const grid = [];
  for (let w = 0; w < 7; w++) {
    for (let day = 0; day < 7; day++) {
      grid.push({ week: w, day, value: 0 });
    }
  }

  const today = new Date();
  (heatmap || []).forEach((entry) => {
    const date = new Date(entry._id);
    const diffDays = Math.floor((today - date) / (1000 * 60 * 60 * 24));
    if (diffDays >= 0 && diffDays < 49) {
      const week = Math.floor(diffDays / 7);
      const day = date.getDay();
      const cell = grid.find((c) => c.week === 6 - week && c.day === day);
      if (cell) cell.value = Math.min(entry.count || 0, 5);
    }
  });

  return grid;
}

export function buildPieData(summary) {
  if (!summary) return [];
  return [
    { name: 'Completed', value: summary.completed || 0, color: '#10b981' },
    { name: 'Assisted', value: summary.assists || 0, color: '#6366f1' },
    { name: 'Swapped', value: summary.swaps || 0, color: '#f59e0b' },
    { name: 'Skipped', value: summary.skipped || 0, color: '#ef4444' },
  ].filter((d) => d.value > 0);
}
