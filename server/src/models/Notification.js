const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    house: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'House',
      required: true,
      index: true,
    },
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    type: {
      type: String,
      enum: [
        'task_assigned',
        'task_completed',
        'task_overdue',
        'task_reminder',
        'assist_requested',
        'assist_accepted',
        'assist_completed',
        'swap_requested',
        'swap_accepted',
        'swap_rejected',
        'sick_leave',
        'sick_cover_bonus',
        'points_earned',
        'badge_earned',
        'rank_changed',
        'leaderboard_updated',
        'expense_added',
        'expense_settled',
        'inventory_low',
        'refill_requested',
        'member_joined',
        'member_left',
        'house_announcement',
      ],
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    data: {
      // Extra payload (task ID, expense ID, etc.)
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    isRead: {
      type: Boolean,
      default: false,
      index: true,
    },
    readAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Static: create and save notification
notificationSchema.statics.notify = async function ({
  house,
  recipient,
  sender = null,
  type,
  title,
  message,
  data = {},
}) {
  return await this.create({ house, recipient, sender, type, title, message, data });
};

module.exports = mongoose.model('Notification', notificationSchema);
