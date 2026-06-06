const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      maxlength: [50, 'Name cannot exceed 50 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email'],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters'],
      select: false,
    },
    avatar: {
      type: String,
      default: null,
    },
    house: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'House',
      default: null,
    },
    role: {
      type: String,
      enum: ['admin', 'member'],
      default: 'member',
    },
    // Gamification
    points: {
      type: Number,
      default: 0,
    },
    totalPointsEarned: {
      type: Number,
      default: 0,
    },
    rank: {
      type: Number,
      default: null,
    },
    streak: {
      current: { type: Number, default: 0 },
      longest: { type: Number, default: 0 },
      lastCompletedDate: { type: Date, default: null },
    },
    // Stats
    stats: {
      tasksCompleted: { type: Number, default: 0 },
      assistsGiven: { type: Number, default: 0 },
      assistsReceived: { type: Number, default: 0 },
      swapsInitiated: { type: Number, default: 0 },
      swapsReceived: { type: Number, default: 0 },
      tasksSkipped: { type: Number, default: 0 },
      sickDaysTaken: { type: Number, default: 0 },
    },
    // Badges earned (references to badge IDs)
    badges: [
      {
        badgeId: { type: String },
        earnedAt: { type: Date, default: Date.now },
      },
    ],
    // Status
    isActive: {
      type: Boolean,
      default: true,
    },
    lastSeen: {
      type: Date,
      default: Date.now,
    },
    refreshToken: {
      type: String,
      select: false,
    },
    pushToken: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual: display role label
userSchema.virtual('displayRole').get(function () {
  if (this.role === 'admin') return 'House Admin';
  return 'Member';
});

// Hash password before saving
userSchema.pre('save', async function () {
  if (!this.isModified('password')) return;
  this.password = await bcrypt.hash(this.password, 12);
});

// Compare password
userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Update streak
userSchema.methods.updateStreak = function () {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (!this.streak.lastCompletedDate) {
    this.streak.current = 1;
  } else {
    const last = new Date(this.streak.lastCompletedDate);
    last.setHours(0, 0, 0, 0);
    const diffDays = Math.floor((today - last) / (1000 * 60 * 60 * 24));

    if (diffDays === 1) {
      this.streak.current += 1;
    } else if (diffDays === 0) {
      // Already updated today
      return;
    } else {
      this.streak.current = 1;
    }
  }

  this.streak.lastCompletedDate = today;
  if (this.streak.current > this.streak.longest) {
    this.streak.longest = this.streak.current;
  }
};

module.exports = mongoose.model('User', userSchema);
