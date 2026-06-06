const mongoose = require('mongoose');

const splitSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  amount: { type: Number, required: true },
  isPaid: { type: Boolean, default: false },
  paidAt: { type: Date, default: null },
});

const expenseSchema = new mongoose.Schema(
  {
    house: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'House',
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Expense title is required'],
      trim: true,
      maxlength: [100, 'Title cannot exceed 100 characters'],
    },
    category: {
      type: String,
      enum: ['rent', 'groceries', 'utilities', 'gas', 'wifi', 'maintenance', 'entertainment', 'other'],
      default: 'other',
    },
    emoji: {
      type: String,
      default: '💰',
    },
    amount: {
      type: Number,
      required: [true, 'Amount is required'],
      min: [0, 'Amount cannot be negative'],
    },
    currency: {
      type: String,
      default: 'INR',
    },
    paidBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    month: {
      type: String, // "YYYY-MM"
      required: true,
      index: true,
    },
    // How it's split
    splitType: {
      type: String,
      enum: ['equal', 'custom', 'percentage'],
      default: 'equal',
    },
    splits: [splitSchema],
    // Optional receipt image
    receipt: {
      type: String,
      default: null,
    },
    notes: {
      type: String,
      default: '',
    },
    isSettled: {
      type: Boolean,
      default: false,
    },
    settledAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual: perPersonAmount (equal split)
expenseSchema.virtual('perPersonAmount').get(function () {
  if (!this.splits || this.splits.length === 0) return this.amount;
  return this.amount / this.splits.length;
});

module.exports = mongoose.model('Expense', expenseSchema);
