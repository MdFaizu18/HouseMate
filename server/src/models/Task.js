const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema(
  {
    house: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'House',
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Task title is required'],
      trim: true,
      maxlength: [100, 'Title cannot exceed 100 characters'],
    },
    description: {
      type: String,
      maxlength: [500, 'Description cannot exceed 500 characters'],
      default: '',
    },
    emoji: {
      type: String,
      default: '📋',
    },
    category: {
      type: String,
      enum: ['kitchen', 'bathroom', 'living_room', 'bedroom', 'laundry', 'grocery', 'trash', 'garden', 'general'],
      default: 'general',
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    // Scheduling
    dueDate: {
      type: Date,
      required: [true, 'Due date is required'],
      index: true,
    },
    scheduledTime: {
      type: String, // HH:MM
      default: null,
    },
    isRecurring: {
      type: Boolean,
      default: false,
    },
    recurrence: {
      frequency: {
        type: String,
        enum: ['daily', 'weekly', 'biweekly', 'monthly'],
        default: 'weekly',
      },
      daysOfWeek: [{ type: Number }], // 0=Sun, 6=Sat
      endDate: { type: Date, default: null },
    },
    // Gamification
    points: {
      type: Number,
      default: 10,
      min: 0,
      max: 200,
    },
    bonusPoints: {
      type: Number,
      default: 0,
    },
    // Status
    status: {
      type: String,
      enum: ['unassigned', 'pending', 'in_progress', 'completed', 'skipped', 'overdue'],
      default: 'pending',
      index: true,
    },
    completedAt: {
      type: Date,
      default: null,
    },
    completedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    // Assist
    assistRequest: {
      isRequested: { type: Boolean, default: false },
      requestedAt: { type: Date, default: null },
      acceptedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null,
      },
      acceptedAt: { type: Date, default: null },
      assistPoints: { type: Number, default: 15 },
      status: {
        type: String,
        enum: ['none', 'pending', 'accepted', 'completed'],
        default: 'none',
      },
    },
    // Swap
    swapRequest: {
      isRequested: { type: Boolean, default: false },
      requestedTo: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null,
      },
      requestedAt: { type: Date, default: null },
      offeredPoints: { type: Number, default: 0 },
      status: {
        type: String,
        enum: ['none', 'pending', 'accepted', 'rejected'],
        default: 'none',
      },
      respondedAt: { type: Date, default: null },
    },
    // Sick leave
    sickLeave: {
      isActive: { type: Boolean, default: false },
      reason: { type: String, default: '' },
      coveredBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null,
      },
      bonusForCovering: { type: Number, default: 30 },
    },
    // Marketplace
    isMarketplace: {
      type: Boolean,
      default: false,
      index: true,
    },
    marketplacePostedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    // Proof of completion (photo URL)
    completionProof: {
      type: String,
      default: null,
    },
    notes: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes
taskSchema.index({ house: 1, dueDate: 1 });
taskSchema.index({ house: 1, status: 1 });
taskSchema.index({ assignedTo: 1, dueDate: 1 });

// Virtual: isOverdue
taskSchema.virtual('isOverdue').get(function () {
  return this.status === 'pending' && new Date() > this.dueDate;
});

// Auto-mark overdue before save (Mongoose 9: no next callback)
taskSchema.pre('save', function () {
  if (this.status === 'pending' && new Date() > this.dueDate) {
    this.status = 'overdue';
  }
});

module.exports = mongoose.model('Task', taskSchema);
