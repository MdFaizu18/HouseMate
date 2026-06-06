const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const houseSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'House name is required'],
      trim: true,
      maxlength: [100, 'House name cannot exceed 100 characters'],
    },
    description: {
      type: String,
      maxlength: [300, 'Description cannot exceed 300 characters'],
      default: '',
    },
    inviteCode: {
      type: String,
      unique: true,
      default: () => uuidv4().split('-')[0].toUpperCase(),
    },
    admin: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    members: [
      {
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        joinedAt: { type: Date, default: Date.now },
        customRole: { type: String, default: 'Member' }, // e.g. "House Champion", "Weekend Off"
        isActive: { type: Boolean, default: true },
      },
    ],
    maxMembers: {
      type: Number,
      default: 10,
    },
    settings: {
      taskRotationEnabled: { type: Boolean, default: true },
      reminderTime: { type: String, default: '08:00' }, // HH:MM
      timezone: { type: String, default: 'Asia/Kolkata' },
      pointsForCompletion: { type: Number, default: 10 },
      pointsForAssist: { type: Number, default: 15 },
      pointsForSickCover: { type: Number, default: 30 },
    },
    avatar: {
      type: String,
      default: null,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual: member count
houseSchema.virtual('memberCount').get(function () {
  return (this.members || []).filter((m) => m.isActive).length;
});

// Regenerate invite code
houseSchema.methods.regenerateInviteCode = function () {
  this.inviteCode = uuidv4().split('-')[0].toUpperCase();
  return this.inviteCode;
};

module.exports = mongoose.model('House', houseSchema);
