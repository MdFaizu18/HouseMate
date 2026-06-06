const Joi = require('joi');
const { errorResponse } = require('../utils/response');

const validate = (schema, property = 'body') => {
  return (req, res, next) => {
    const { error } = schema.validate(req[property], { abortEarly: false, stripUnknown: true });
    if (!error) return next();

    const errors = error.details.map((d) => ({
      field: d.context.key,
      message: d.message.replace(/['"]/g, ''),
    }));

    return res.status(400).json({ success: false, message: 'Validation failed', errors });
  };
};

// ─── Schemas ─────────────────────────────────────────────────────────────────

const schemas = {
  // Auth
  register: Joi.object({
    name: Joi.string().trim().min(2).max(50).required(),
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required(),
  }),

  login: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required(),
  }),

  // House
  createHouse: Joi.object({
    name: Joi.string().trim().min(2).max(100).required(),
    description: Joi.string().max(300).allow('').optional(),
    maxMembers: Joi.number().integer().min(2).max(20).optional(),
  }),

  updateHouseSettings: Joi.object({
    taskRotationEnabled: Joi.boolean().optional(),
    reminderTime: Joi.string()
      .pattern(/^([01]\d|2[0-3]):([0-5]\d)$/)
      .optional(),
    timezone: Joi.string().optional(),
    pointsForCompletion: Joi.number().min(0).max(100).optional(),
    pointsForAssist: Joi.number().min(0).max(100).optional(),
    pointsForSickCover: Joi.number().min(0).max(100).optional(),
  }),

  updateMemberRole: Joi.object({
    customRole: Joi.string().max(50).required(),
  }),

  // Task
  createTask: Joi.object({
    title: Joi.string().trim().min(2).max(100).required(),
    description: Joi.string().max(500).allow('').optional(),
    emoji: Joi.string().optional(),
    category: Joi.string()
      .valid('kitchen', 'bathroom', 'living_room', 'bedroom', 'laundry', 'grocery', 'trash', 'garden', 'general')
      .optional(),
    assignedTo: Joi.string().hex().length(24).allow(null).optional(),
    dueDate: Joi.date().iso().required(),
    scheduledTime: Joi.string()
      .pattern(/^([01]\d|2[0-3]):([0-5]\d)$/)
      .allow(null)
      .optional(),
    points: Joi.number().min(0).max(200).optional(),
    isRecurring: Joi.boolean().optional(),
    recurrence: Joi.object({
      frequency: Joi.string().valid('daily', 'weekly', 'biweekly', 'monthly').optional(),
      daysOfWeek: Joi.array().items(Joi.number().min(0).max(6)).optional(),
      endDate: Joi.date().iso().allow(null).optional(),
    }).optional(),
    notes: Joi.string().max(500).allow('').optional(),
  }),

  updateTask: Joi.object({
    title: Joi.string().trim().min(2).max(100).optional(),
    description: Joi.string().max(500).allow('').optional(),
    emoji: Joi.string().optional(),
    category: Joi.string()
      .valid('kitchen', 'bathroom', 'living_room', 'bedroom', 'laundry', 'grocery', 'trash', 'garden', 'general')
      .optional(),
    assignedTo: Joi.string().hex().length(24).allow(null).optional(),
    dueDate: Joi.date().iso().optional(),
    points: Joi.number().min(0).max(200).optional(),
    status: Joi.string().valid('pending', 'in_progress', 'completed', 'skipped').optional(),
    notes: Joi.string().max(500).allow('').optional(),
  }),

  swapRequest: Joi.object({
    requestedTo: Joi.string().hex().length(24).required(),
    offeredPoints: Joi.number().min(0).max(100).optional(),
  }),

  sickLeave: Joi.object({
    reason: Joi.string().max(200).allow('').optional(),
    date: Joi.date().iso().optional(),
  }),

  // Expense
  createExpense: Joi.object({
    title: Joi.string().trim().min(2).max(100).required(),
    category: Joi.string()
      .valid('rent', 'groceries', 'utilities', 'gas', 'wifi', 'maintenance', 'entertainment', 'other')
      .optional(),
    emoji: Joi.string().optional(),
    amount: Joi.number().positive().required(),
    splitType: Joi.string().valid('equal', 'custom', 'percentage').optional(),
    splits: Joi.array()
      .items(
        Joi.object({
          user: Joi.string().hex().length(24).required(),
          amount: Joi.number().min(0).required(),
        })
      )
      .optional(),
    month: Joi.string()
      .pattern(/^\d{4}-\d{2}$/)
      .optional(),
    notes: Joi.string().max(300).allow('').optional(),
  }),

  // Inventory
  createInventory: Joi.object({
    name: Joi.string().trim().min(2).max(80).required(),
    category: Joi.string()
      .valid('groceries', 'cleaning', 'toiletries', 'kitchen', 'appliances', 'other')
      .optional(),
    emoji: Joi.string().optional(),
    quantity: Joi.object({
      current: Joi.number().min(0).required(),
      unit: Joi.string().optional(),
      minThreshold: Joi.number().min(0).optional(),
      maxCapacity: Joi.number().min(0).allow(null).optional(),
    }).required(),
    stockPercent: Joi.number().min(0).max(100).allow(null).optional(),
    notes: Joi.string().max(300).allow('').optional(),
  }),
};

module.exports = { validate, schemas };
