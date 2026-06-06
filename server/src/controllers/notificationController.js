const Notification = require('../models/Notification');
const { successResponse, errorResponse, paginatedResponse } = require('../utils/response');

/**
 * @desc    Get notifications for current user
 * @route   GET /api/notifications
 * @access  Private
 */
exports.getNotifications = async (req, res, next) => {
  try {
    const { unreadOnly, page = 1, limit = 20 } = req.query;

    const query = { recipient: req.user._id };
    if (unreadOnly === 'true') query.isRead = false;

    const skip = (page - 1) * limit;
    const [notifications, total, unreadCount] = await Promise.all([
      Notification.find(query)
        .populate('sender', 'name avatar')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      Notification.countDocuments(query),
      Notification.countDocuments({ recipient: req.user._id, isRead: false }),
    ]);

    return res.status(200).json({
      success: true,
      data: notifications,
      unreadCount,
      meta: {
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Mark notification(s) as read
 * @route   PUT /api/notifications/read
 * @access  Private
 */
exports.markRead = async (req, res, next) => {
  try {
    const { ids } = req.body; // Array of notification IDs, or empty to mark all

    const query = { recipient: req.user._id };
    if (ids && ids.length > 0) {
      query._id = { $in: ids };
    }

    await Notification.updateMany(query, { isRead: true, readAt: new Date() });
    return successResponse(res, null, 'Notifications marked as read');
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Delete a notification
 * @route   DELETE /api/notifications/:id
 * @access  Private
 */
exports.deleteNotification = async (req, res, next) => {
  try {
    await Notification.findOneAndDelete({ _id: req.params.id, recipient: req.user._id });
    return successResponse(res, null, 'Notification deleted');
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Get unread count
 * @route   GET /api/notifications/count
 * @access  Private
 */
exports.getUnreadCount = async (req, res, next) => {
  try {
    const count = await Notification.countDocuments({ recipient: req.user._id, isRead: false });
    return successResponse(res, { count }, 'Unread count fetched');
  } catch (err) {
    next(err);
  }
};
