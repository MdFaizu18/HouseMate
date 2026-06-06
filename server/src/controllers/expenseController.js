const Expense = require('../models/Expense');
const User = require('../models/User');
const House = require('../models/House');
const Notification = require('../models/Notification');
const { successResponse, errorResponse, paginatedResponse } = require('../utils/response');
const { format } = require('date-fns');

const populateExpense = (query) =>
  query
    .populate('paidBy', 'name avatar')
    .populate('splits.user', 'name avatar');

/**
 * @desc    Add expense
 * @route   POST /api/expenses
 * @access  Private
 */
exports.createExpense = async (req, res, next) => {
  try {
    const { title, category, emoji, amount, splitType = 'equal', splits, notes } = req.body;

    const house = await House.findById(req.user.house).select('members');
    const activeMembers = house.members.filter((m) => m.isActive);

    // Build splits
    let expenseSplits;
    if (splitType === 'equal') {
      const perPerson = amount / activeMembers.length;
      expenseSplits = activeMembers.map((m) => ({
        user: m.user,
        amount: parseFloat(perPerson.toFixed(2)),
        isPaid: m.user.toString() === req.user._id.toString(),
      }));
    } else if (splitType === 'custom' && splits) {
      expenseSplits = splits.map((s) => ({
        ...s,
        isPaid: s.user.toString() === req.user._id.toString(),
      }));
    } else {
      return errorResponse(res, 'Invalid split configuration.', 400);
    }

    const month = req.body.month || format(new Date(), 'yyyy-MM');

    const expense = await Expense.create({
      house: req.user.house,
      title,
      category,
      emoji,
      amount,
      paidBy: req.user._id,
      month,
      splitType,
      splits: expenseSplits,
      notes,
    });

    // Notify all members
    const otherMembers = activeMembers
      .filter((m) => m.user.toString() !== req.user._id.toString())
      .map((m) => m.user);

    await Promise.all(
      otherMembers.map((id) =>
        Notification.notify({
          house: req.user.house,
          recipient: id,
          sender: req.user._id,
          type: 'expense_added',
          title: 'New Expense Added',
          message: `${req.user.name} added "${title}" — ₹${amount.toLocaleString('en-IN')}`,
          data: { expenseId: expense._id },
        })
      )
    );

    const populated = await populateExpense(Expense.findById(expense._id));
    return successResponse(res, populated, 'Expense added', 201);
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Get expenses for house
 * @route   GET /api/expenses
 * @access  Private
 */
exports.getExpenses = async (req, res, next) => {
  try {
    const { month, category, page = 1, limit = 20 } = req.query;

    const query = { house: req.user.house };
    if (month) query.month = month;
    if (category) query.category = category;

    const skip = (page - 1) * limit;
    const [expenses, total] = await Promise.all([
      populateExpense(
        Expense.find(query).sort({ createdAt: -1 }).skip(skip).limit(Number(limit))
      ),
      Expense.countDocuments(query),
    ]);

    return paginatedResponse(res, expenses, total, page, limit, 'Expenses fetched');
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Get monthly summary
 * @route   GET /api/expenses/summary
 * @access  Private
 */
exports.getMonthlySummary = async (req, res, next) => {
  try {
    const { month = format(new Date(), 'yyyy-MM') } = req.query;

    const expenses = await Expense.find({ house: req.user.house, month });
    const totalAmount = expenses.reduce((sum, e) => sum + e.amount, 0);

    // Category breakdown
    const categoryMap = {};
    expenses.forEach((e) => {
      const cat = e.category || 'other';
      categoryMap[cat] = (categoryMap[cat] || 0) + e.amount;
    });

    // Per-user balance (who owes whom)
    const house = await House.findById(req.user.house).select('members');
    const activeMembers = house.members.filter((m) => m.isActive).map((m) => m.user.toString());
    const balance = {};
    activeMembers.forEach((id) => (balance[id] = 0));

    for (const expense of expenses) {
      // Payer gets credit
      const payerId = expense.paidBy.toString();
      if (balance[payerId] !== undefined) balance[payerId] += expense.amount;

      // Each split user owes their amount
      expense.splits.forEach((s) => {
        const uid = s.user.toString();
        if (balance[uid] !== undefined) balance[uid] -= s.amount;
      });
    }

    // Get user names for balance display
    const userIds = Object.keys(balance);
    const users = await User.find({ _id: { $in: userIds } }).select('name avatar');
    const userMap = {};
    users.forEach((u) => (userMap[u._id.toString()] = u));

    const balanceWithNames = Object.entries(balance).map(([uid, amt]) => ({
      user: userMap[uid],
      balance: parseFloat(amt.toFixed(2)),
      owes: amt < 0,
      isOwed: amt > 0,
    }));

    return successResponse(
      res,
      {
        month,
        totalAmount,
        perPerson: parseFloat((totalAmount / activeMembers.length).toFixed(2)),
        categoryBreakdown: Object.entries(categoryMap).map(([cat, amt]) => ({ category: cat, amount: amt })),
        balances: balanceWithNames,
        expenseCount: expenses.length,
      },
      'Monthly summary fetched'
    );
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Mark split as paid
 * @route   POST /api/expenses/:id/settle
 * @access  Private
 */
exports.settleExpense = async (req, res, next) => {
  try {
    const expense = await Expense.findOne({ _id: req.params.id, house: req.user.house });
    if (!expense) return errorResponse(res, 'Expense not found.', 404);

    const { userId = req.user._id } = req.body;
    const split = expense.splits.find((s) => s.user.toString() === userId.toString());
    if (!split) return errorResponse(res, 'Split not found.', 404);

    split.isPaid = true;
    split.paidAt = new Date();

    // Check if all splits are paid
    const allPaid = expense.splits.every((s) => s.isPaid);
    if (allPaid) {
      expense.isSettled = true;
      expense.settledAt = new Date();
    }

    await expense.save();

    // Notify payer
    if (expense.paidBy.toString() !== userId.toString()) {
      await Notification.notify({
        house: req.user.house,
        recipient: expense.paidBy,
        sender: userId,
        type: 'expense_settled',
        title: 'Payment Received!',
        message: `Your share for "${expense.title}" has been marked as paid.`,
        data: { expenseId: expense._id },
      });
    }

    const populated = await populateExpense(Expense.findById(expense._id));
    return successResponse(res, populated, 'Expense settled');
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Delete expense
 * @route   DELETE /api/expenses/:id
 * @access  Private
 */
exports.deleteExpense = async (req, res, next) => {
  try {
    const expense = await Expense.findOne({ _id: req.params.id, house: req.user.house });
    if (!expense) return errorResponse(res, 'Expense not found.', 404);

    if (expense.paidBy.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return errorResponse(res, 'Not authorized to delete this expense.', 403);
    }

    await expense.deleteOne();
    return successResponse(res, null, 'Expense deleted');
  } catch (err) {
    next(err);
  }
};
