const User = require('../models/User');
const Task = require('../models/Task');
const { successResponse, errorResponse } = require('../utils/response');
const { getBadgeProgress } = require('../utils/gamification');

/**
 * @desc    Get a user's public profile (within same house)
 * @route   GET /api/users/:id
 * @access  Private
 */
exports.getUserProfile = async (req, res, next) => {
  try {
    const user = await User.findOne({ _id: req.params.id, house: req.user.house }).select(
      'name avatar points rank streak stats badges createdAt lastSeen'
    );
    if (!user) return errorResponse(res, 'User not found.', 404);

    const badgeProgress = getBadgeProgress(user);

    // Recent activity (last 10 completed tasks)
    const recentActivity = await Task.find({
      assignedTo: user._id,
      house: req.user.house,
      status: 'completed',
    })
      .sort({ completedAt: -1 })
      .limit(10)
      .select('title emoji completedAt points category');

    return successResponse(
      res,
      {
        user,
        badgeProgress,
        recentActivity,
      },
      'Profile fetched'
    );
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Get current user's full profile with badge progress
 * @route   GET /api/users/me/profile
 * @access  Private
 */
exports.getMyProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).populate('house', 'name');
    const badgeProgress = getBadgeProgress(user);

    const recentActivity = req.user.house
      ? await Task.find({
          assignedTo: user._id,
          house: req.user.house,
          status: 'completed',
        })
          .sort({ completedAt: -1 })
          .limit(20)
          .select('title emoji completedAt points category')
      : [];

    return successResponse(
      res,
      { user, badgeProgress, recentActivity },
      'Profile fetched'
    );
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Get all house members (for dropdowns, etc.)
 * @route   GET /api/users/house-members
 * @access  Private
 */
exports.getHouseMembers = async (req, res, next) => {
  try {
    const House = require('../models/House');
    const house = await House.findById(req.user.house)
      .populate('members.user', 'name avatar points rank streak stats isActive lastSeen');

    if (!house) return errorResponse(res, 'House not found.', 404);

    const members = (house.members || [])
      .filter((m) => m.isActive)
      .map((m) => ({
        ...m.user.toObject(),
        customRole: m.customRole,
        joinedAt: m.joinedAt,
      }));

    return successResponse(res, members, 'Members fetched');
  } catch (err) {
    next(err);
  }
};
