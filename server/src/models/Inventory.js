const mongoose = require('mongoose');

const inventorySchema = new mongoose.Schema(
  {
    house: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'House',
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Item name is required'],
      trim: true,
      maxlength: [80, 'Name cannot exceed 80 characters'],
    },
    category: {
      type: String,
      enum: ['groceries', 'cleaning', 'toiletries', 'kitchen', 'appliances', 'other'],
      default: 'other',
    },
    emoji: {
      type: String,
      default: '📦',
    },
    // Quantity tracking
    quantity: {
      current: { type: Number, required: true, min: 0 },
      unit: { type: String, default: 'units' }, // kg, L, bottles, rolls, etc.
      minThreshold: { type: Number, default: 0 }, // triggers low stock warning
      maxCapacity: { type: Number, default: null },
    },
    // Percentage-based tracking alternative
    stockPercent: {
      type: Number,
      min: 0,
      max: 100,
      default: null,
    },
    status: {
      type: String,
      enum: ['ok', 'low', 'out_of_stock', 'refill_requested'],
      default: 'ok',
    },
    refillRequest: {
      isRequested: { type: Boolean, default: false },
      requestedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null,
      },
      requestedAt: { type: Date, default: null },
      fulfilledBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null,
      },
      fulfilledAt: { type: Date, default: null },
    },
    lastRestockedAt: {
      type: Date,
      default: null,
    },
    lastRestockedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    addedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
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

// Auto-compute status before save (Mongoose 9: no next callback)
inventorySchema.pre('save', function () {
  const { current, minThreshold } = this.quantity;

  if (this.stockPercent !== null) {
    if (this.stockPercent === 0) this.status = 'out_of_stock';
    else if (this.stockPercent <= 20) this.status = 'low';
    else this.status = 'ok';
  } else {
    if (current === 0) this.status = 'out_of_stock';
    else if (current <= minThreshold) this.status = 'low';
    else this.status = 'ok';
  }
});

module.exports = mongoose.model('Inventory', inventorySchema);
