const User = require('../models/User');
const Notification = require('../models/Notification');

// Badge definitions
const BADGES = {
  CLEANING_KING: {
    id: 'cleaning_king',
    name: 'Cleaning King',
    emoji: '🏅',
    description: '100 Tasks Completed',
    condition: (stats) => stats.tasksCompleted >= 100,
  },
  BEST_FRIEND: {
    id: 'best_friend',
    name: 'Best Friend',
    emoji: '🤝',
    description: '25 Assists Given',
    condition: (stats) => stats.assistsGiven >= 25,
  },
  UNSTOPPABLE: {
    id: 'unstoppable',
    name: 'Unstoppable',
    emoji: '🔥',
    description: '30 Day Streak',
    condition: (stats, streak) => streak.longest >= 30,
  },
  QUICK_STARTER: {
    id: 'quick_starter',
    name: 'Quick Starter',
    emoji: '⚡',
    description: 'Complete 5 tasks in a day',
    condition: (stats) => stats.tasksCompleted >= 5,
  },
  TEAM_PLAYER: {
    id: 'team_player',
    name: 'Team Player',
    emoji: '🎯',
    description: '10 Assists Given',
    condition: (stats) => stats.assistsGiven >= 10,
  },
  FIRST_TASK: {
    id: 'first_task',
    name: 'First Step',
    emoji: '🌟',
    description: 'Complete your first task',
    condition: (stats) => stats.tasksCompleted >= 1,
  },
};

/**
 * Award points to a user and check for badge unlocks
 */
const awardPoints = async (userId, points, house, notificationType = 'points_earned') => {
  const user = await User.findById(userId);
  if (!user) return null;

  user.points += points;
  user.totalPointsEarned += points;
  await user.save();

  // Check badge unlocks
  await checkAndAwardBadges(user, house);

  return user;
};

/**
 * Deduct points from a user
 */
const deductPoints = async (userId, points) => {
  const user = await User.findById(userId);
  if (!user) return null;

  user.points = Math.max(0, user.points - points);
  await user.save();
  return user;
};

/**
 * Check and award any newly unlocked badges
 */
const checkAndAwardBadges = async (user, house) => {
  const earnedBadgeIds = user.badges.map((b) => b.badgeId);
  const newBadges = [];

  for (const [key, badge] of Object.entries(BADGES)) {
    if (!earnedBadgeIds.includes(badge.id)) {
      const unlocked = badge.condition(user.stats, user.streak);
      if (unlocked) {
        user.badges.push({ badgeId: badge.id, earnedAt: new Date() });
        newBadges.push(badge);

        if (house) {
          await Notification.notify({
            house,
            recipient: user._id,
            type: 'badge_earned',
            title: `Badge Unlocked: ${badge.name} ${badge.emoji}`,
            message: badge.description,
            data: { badge },
          });
        }
      }
    }
  }

  if (newBadges.length > 0) {
    await user.save();
  }

  return newBadges;
};

/**
 * Recalculate house leaderboard ranks
 */
const recalculateRanks = async (houseId) => {
  const House = require('../models/House');
  const house = await House.findById(houseId).select('members');
  if (!house) return;

  const memberIds = house.members.filter((m) => m.isActive).map((m) => m.user);
  const users = await User.find({ _id: { $in: memberIds } })
    .select('_id points rank')
    .sort({ points: -1 });

  const bulkOps = users.map((user, index) => ({
    updateOne: {
      filter: { _id: user._id },
      update: { rank: index + 1 },
    },
  }));

  if (bulkOps.length > 0) {
    await User.bulkWrite(bulkOps);
  }
};

/**
 * Get leaderboard for a house
 */
const getLeaderboard = async (houseId) => {
  const House = require('../models/House');
  const house = await House.findById(houseId).select('members');
  if (!house) return [];

  const memberIds = house.members.filter((m) => m.isActive).map((m) => m.user);
  const users = await User.find({ _id: { $in: memberIds } })
    .select('name avatar points streak stats rank badges')
    .sort({ points: -1 });

  return users.map((user, index) => ({
    ...user.toObject(),
    rank: index + 1,
  }));
};

/**
 * Get badge progress for a user
 */
const getBadgeProgress = (user) => {
  const badges = user?.badges || [];
  const stats = user?.stats || {};
  const streak = user?.streak || {};

  return Object.values(BADGES).map((badge) => {
    const earned = badges.some((b) => b.badgeId === badge.id);
    let current = 0;
    let target = 0;

    switch (badge.id) {
      case 'cleaning_king':
        current = stats.tasksCompleted || 0;
        target = 100;
        break;
      case 'best_friend':
        current = stats.assistsGiven || 0;
        target = 25;
        break;
      case 'unstoppable':
        current = streak.current || 0;
        target = 30;
        break;
      case 'team_player':
        current = stats.assistsGiven || 0;
        target = 10;
        break;
      case 'quick_starter':
        current = stats.tasksCompleted || 0;
        target = 5;
        break;
      case 'first_task':
        current = stats.tasksCompleted || 0;
        target = 1;
        break;
    }

    return {
      ...badge,
      earned,
      progress: { current: Math.min(current, target), target },
      percent: target > 0 ? Math.min(Math.round((current / target) * 100), 100) : 0,
    };
  });
};

module.exports = {
  BADGES,
  awardPoints,
  deductPoints,
  checkAndAwardBadges,
  recalculateRanks,
  getLeaderboard,
  getBadgeProgress,
};
