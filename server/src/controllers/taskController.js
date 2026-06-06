const Task = require('../models/Task');
const User = require('../models/User');
const Notification = require('../models/Notification');
const { awardPoints, recalculateRanks } = require('../utils/gamification');
const { successResponse, errorResponse, paginatedResponse } = require('../utils/response');
const { format } = require('date-fns');

// ─── Helpers ──────────────────────────────────────────────────────────────────

const populateTask = (query) =>
  query
    .populate('assignedTo', 'name avatar points')
    .populate('createdBy', 'name avatar')
    .populate('completedBy', 'name avatar')
    .populate('assistRequest.acceptedBy', 'name avatar')
    .populate('swapRequest.requestedTo', 'name avatar')
    .populate('sickLeave.coveredBy', 'name avatar')
    .populate('marketplacePostedBy', 'name avatar');

// ─── CRUD ─────────────────────────────────────────────────────────────────────

/**
 * @desc    Create task
 * @route   POST /api/tasks
 * @access  Private
 */
exports.createTask = async (req, res, next) => {
  try {
    const task = await Task.create({
      ...req.body,
      house: req.user.house,
      createdBy: req.user._id,
    });

    // Notify assigned user
    if (task.assignedTo && task.assignedTo.toString() !== req.user._id.toString()) {
      await Notification.notify({
        house: req.user.house,
        recipient: task.assignedTo,
        sender: req.user._id,
        type: 'task_assigned',
        title: `New Task: ${task.title}`,
        message: `You have been assigned "${task.title}" due ${format(task.dueDate, 'dd MMM')}`,
        data: { taskId: task._id },
      });
    }

    const populated = await populateTask(Task.findById(task._id));
    return successResponse(res, populated, 'Task created', 201);
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Get tasks for current house
 * @route   GET /api/tasks
 * @access  Private
 */
exports.getTasks = async (req, res, next) => {
  try {
    const {
      status,
      assignedTo,
      category,
      isMarketplace,
      from,
      to,
      page = 1,
      limit = 20,
    } = req.query;

    const query = { house: req.user.house };
    if (status) query.status = status;
    if (assignedTo) query.assignedTo = assignedTo;
    if (category) query.category = category;
    if (isMarketplace !== undefined) query.isMarketplace = isMarketplace === 'true';
    if (from || to) {
      query.dueDate = {};
      if (from) query.dueDate.$gte = new Date(from);
      if (to) query.dueDate.$lte = new Date(to);
    }

    const skip = (page - 1) * limit;
    const [tasks, total] = await Promise.all([
      populateTask(
        Task.find(query).sort({ dueDate: 1, createdAt: -1 }).skip(skip).limit(Number(limit))
      ),
      Task.countDocuments(query),
    ]);

    return paginatedResponse(res, tasks, total, page, limit, 'Tasks fetched');
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Get today's tasks for current user
 * @route   GET /api/tasks/today
 * @access  Private
 */
exports.getTodayTasks = async (req, res, next) => {
  try {
    const today = new Date();
    const start = new Date(today.setHours(0, 0, 0, 0));
    const end = new Date(today.setHours(23, 59, 59, 999));

    const tasks = await populateTask(
      Task.find({
        house: req.user.house,
        assignedTo: req.user._id,
        dueDate: { $gte: start, $lte: end },
      }).sort({ status: 1, dueDate: 1 })
    );

    return successResponse(res, tasks, "Today's tasks fetched");
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Get single task
 * @route   GET /api/tasks/:id
 * @access  Private
 */
exports.getTask = async (req, res, next) => {
  try {
    const task = await populateTask(Task.findOne({ _id: req.params.id, house: req.user.house }));
    if (!task) return errorResponse(res, 'Task not found.', 404);
    return successResponse(res, task, 'Task fetched');
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Update task
 * @route   PUT /api/tasks/:id
 * @access  Private
 */
exports.updateTask = async (req, res, next) => {
  try {
    const task = await Task.findOne({ _id: req.params.id, house: req.user.house });
    if (!task) return errorResponse(res, 'Task not found.', 404);

    Object.assign(task, req.body);
    await task.save();

    const populated = await populateTask(Task.findById(task._id));
    return successResponse(res, populated, 'Task updated');
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Delete task
 * @route   DELETE /api/tasks/:id
 * @access  Private
 */
exports.deleteTask = async (req, res, next) => {
  try {
    const task = await Task.findOneAndDelete({ _id: req.params.id, house: req.user.house });
    if (!task) return errorResponse(res, 'Task not found.', 404);
    return successResponse(res, null, 'Task deleted');
  } catch (err) {
    next(err);
  }
};

// ─── Complete Task ─────────────────────────────────────────────────────────────

/**
 * @desc    Mark task as complete
 * @route   POST /api/tasks/:id/complete
 * @access  Private
 */
exports.completeTask = async (req, res, next) => {
  try {
    const task = await Task.findOne({ _id: req.params.id, house: req.user.house });
    if (!task) return errorResponse(res, 'Task not found.', 404);

    if (task.status === 'completed') {
      return errorResponse(res, 'Task already completed.', 400);
    }

    task.status = 'completed';
    task.completedAt = new Date();
    task.completedBy = req.user._id;
    if (req.body?.completionProof) task.completionProof = req.body.completionProof;
    await task.save();

    // Award points to assignee (or completer)
    const pointsRecipient = task.assignedTo || req.user._id;
    const user = await User.findById(pointsRecipient);
    user.stats.tasksCompleted += 1;
    user.updateStreak();
    await user.save();

    await awardPoints(pointsRecipient, task.points + task.bonusPoints, req.user.house);

    // If assist was active, award assist points to helper
    if (task.assistRequest.status === 'accepted' && task.assistRequest.acceptedBy) {
      const helper = await User.findById(task.assistRequest.acceptedBy);
      helper.stats.assistsGiven += 1;
      await helper.save();

      await awardPoints(task.assistRequest.acceptedBy, task.assistRequest.assistPoints, req.user.house);
      task.assistRequest.status = 'completed';
      await task.save();
    }

    await recalculateRanks(req.user.house);

    const populated = await populateTask(Task.findById(task._id));
    return successResponse(res, populated, 'Task completed! Points awarded 🎉');
  } catch (err) {
    next(err);
  }
};

// ─── Assist ───────────────────────────────────────────────────────────────────

/**
 * @desc    Request assistance on a task
 * @route   POST /api/tasks/:id/assist/request
 * @access  Private
 */
exports.requestAssist = async (req, res, next) => {
  try {
    const task = await Task.findOne({ _id: req.params.id, house: req.user.house });
    if (!task) return errorResponse(res, 'Task not found.', 404);
    if (task.assistRequest.isRequested) {
      return errorResponse(res, 'Assist already requested.', 400);
    }

    task.assistRequest.isRequested = true;
    task.assistRequest.requestedAt = new Date();
    task.assistRequest.status = 'pending';
    await task.save();

    // Notify all house members except requester
    const house = await require('../models/House').findById(req.user.house).select('members');
    const otherMembers = house.members
      .filter((m) => m.isActive && m.user.toString() !== req.user._id.toString())
      .map((m) => m.user);

    await Promise.all(
      otherMembers.map((id) =>
        Notification.notify({
          house: req.user.house,
          recipient: id,
          sender: req.user._id,
          type: 'assist_requested',
          title: 'Help Needed!',
          message: `${req.user.name} needs help with "${task.title}". Earn ${task.assistRequest.assistPoints} points!`,
          data: { taskId: task._id },
        })
      )
    );

    return successResponse(res, task, 'Assist request sent');
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Accept an assist request
 * @route   POST /api/tasks/:id/assist/accept
 * @access  Private
 */
exports.acceptAssist = async (req, res, next) => {
  try {
    const task = await Task.findOne({ _id: req.params.id, house: req.user.house });
    if (!task) return errorResponse(res, 'Task not found.', 404);
    if (task.assistRequest.status !== 'pending') {
      return errorResponse(res, 'No pending assist request.', 400);
    }
    if (task.assignedTo?.toString() === req.user._id.toString()) {
      return errorResponse(res, 'You cannot assist your own task.', 400);
    }

    task.assistRequest.acceptedBy = req.user._id;
    task.assistRequest.acceptedAt = new Date();
    task.assistRequest.status = 'accepted';
    await task.save();

    // Notify task owner
    if (task.assignedTo) {
      await Notification.notify({
        house: req.user.house,
        recipient: task.assignedTo,
        sender: req.user._id,
        type: 'assist_accepted',
        title: 'Help is on the way!',
        message: `${req.user.name} accepted your assist request for "${task.title}".`,
        data: { taskId: task._id },
      });
    }

    const populated = await populateTask(Task.findById(task._id));
    return successResponse(res, populated, 'Assist accepted');
  } catch (err) {
    next(err);
  }
};

// ─── Swap ─────────────────────────────────────────────────────────────────────

/**
 * @desc    Request a task swap
 * @route   POST /api/tasks/:id/swap/request
 * @access  Private
 */
exports.requestSwap = async (req, res, next) => {
  try {
    const task = await Task.findOne({
      _id: req.params.id,
      assignedTo: req.user._id,
      house: req.user.house,
    });
    if (!task) return errorResponse(res, 'Task not found or not assigned to you.', 404);
    if (task.swapRequest.isRequested) {
      return errorResponse(res, 'Swap already requested.', 400);
    }

    const { requestedTo, offeredPoints = 0 } = req.body;

    // Validate target member is in house
    const House = require('../models/House');
    const house = await House.findById(req.user.house);
    const targetMember = house.members.find(
      (m) => m.user.toString() === requestedTo && m.isActive
    );
    if (!targetMember) return errorResponse(res, 'Target member not found in house.', 404);

    task.swapRequest.isRequested = true;
    task.swapRequest.requestedTo = requestedTo;
    task.swapRequest.requestedAt = new Date();
    task.swapRequest.offeredPoints = offeredPoints;
    task.swapRequest.status = 'pending';
    await task.save();

    await Notification.notify({
      house: req.user.house,
      recipient: requestedTo,
      sender: req.user._id,
      type: 'swap_requested',
      title: 'Swap Request!',
      message: `${req.user.name} wants to swap "${task.title}" with you. Bonus: +${offeredPoints} pts`,
      data: { taskId: task._id },
    });

    const populated = await populateTask(Task.findById(task._id));
    return successResponse(res, populated, 'Swap request sent');
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Respond to a swap request
 * @route   POST /api/tasks/:id/swap/respond
 * @access  Private
 */
exports.respondSwap = async (req, res, next) => {
  try {
    const { accept } = req.body;
    const task = await Task.findOne({
      _id: req.params.id,
      house: req.user.house,
      'swapRequest.requestedTo': req.user._id,
      'swapRequest.status': 'pending',
    });

    if (!task) return errorResponse(res, 'No pending swap request found.', 404);

    task.swapRequest.status = accept ? 'accepted' : 'rejected';
    task.swapRequest.respondedAt = new Date();

    if (accept) {
      const originalAssignee = task.assignedTo;
      task.assignedTo = req.user._id;

      // Award swap bonus to new assignee
      if (task.swapRequest.offeredPoints > 0) {
        await awardPoints(req.user._id, task.swapRequest.offeredPoints, req.user.house);
      }

      await Notification.notify({
        house: req.user.house,
        recipient: originalAssignee,
        sender: req.user._id,
        type: 'swap_accepted',
        title: 'Swap Accepted!',
        message: `${req.user.name} accepted your swap for "${task.title}".`,
        data: { taskId: task._id },
      });
    } else {
      task.swapRequest.isRequested = false;
      await Notification.notify({
        house: req.user.house,
        recipient: task.assignedTo,
        sender: req.user._id,
        type: 'swap_rejected',
        title: 'Swap Declined',
        message: `${req.user.name} declined your swap for "${task.title}".`,
        data: { taskId: task._id },
      });
    }

    await task.save();
    const populated = await populateTask(Task.findById(task._id));
    return successResponse(res, populated, `Swap ${accept ? 'accepted' : 'rejected'}`);
  } catch (err) {
    next(err);
  }
};

// ─── Sick Leave ───────────────────────────────────────────────────────────────

/**
 * @desc    Request sick leave (task reassignment)
 * @route   POST /api/tasks/:id/sick
 * @access  Private
 */
exports.requestSickLeave = async (req, res, next) => {
  try {
    const task = await Task.findOne({
      _id: req.params.id,
      assignedTo: req.user._id,
      house: req.user.house,
    });
    if (!task) return errorResponse(res, 'Task not found.', 404);

    const { reason = 'Feeling unwell' } = req.body;

    task.sickLeave.isActive = true;
    task.sickLeave.reason = reason;
    await task.save();

    // Update user sick days
    await User.findByIdAndUpdate(req.user._id, {
      $inc: { 'stats.sickDaysTaken': 1 },
    });

    // Notify all members about the coverage opportunity
    const House = require('../models/House');
    const house = await House.findById(req.user.house).select('members');
    const otherMembers = house.members
      .filter((m) => m.isActive && m.user.toString() !== req.user._id.toString())
      .map((m) => m.user);

    await Promise.all(
      otherMembers.map((id) =>
        Notification.notify({
          house: req.user.house,
          recipient: id,
          sender: req.user._id,
          type: 'sick_leave',
          title: 'Coverage Needed!',
          message: `${req.user.name} is unwell. Cover "${task.title}" and earn +${task.sickLeave.bonusForCovering} points!`,
          data: { taskId: task._id },
        })
      )
    );

    return successResponse(res, task, 'Sick leave requested');
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Volunteer to cover a sick leave task
 * @route   POST /api/tasks/:id/sick/cover
 * @access  Private
 */
exports.coverSickLeave = async (req, res, next) => {
  try {
    const task = await Task.findOne({
      _id: req.params.id,
      house: req.user.house,
      'sickLeave.isActive': true,
    });
    if (!task) return errorResponse(res, 'No sick leave task found.', 404);
    if (task.assignedTo?.toString() === req.user._id.toString()) {
      return errorResponse(res, 'You cannot cover your own task.', 400);
    }

    task.sickLeave.coveredBy = req.user._id;
    task.assignedTo = req.user._id;
    task.bonusPoints = task.sickLeave.bonusForCovering;
    await task.save();

    await Notification.notify({
      house: req.user.house,
      recipient: task.sickLeave.coveredBy,
      sender: req.user._id,
      type: 'sick_cover_bonus',
      title: 'Task Covered!',
      message: `${req.user.name} will cover "${task.title}" for you. Get well soon!`,
      data: { taskId: task._id },
    });

    const populated = await populateTask(Task.findById(task._id));
    return successResponse(res, populated, 'You are now covering this task');
  } catch (err) {
    next(err);
  }
};

// ─── Marketplace ──────────────────────────────────────────────────────────────

/**
 * @desc    Post task to marketplace
 * @route   POST /api/tasks/:id/marketplace
 * @access  Private
 */
exports.postToMarketplace = async (req, res, next) => {
  try {
    const task = await Task.findOne({
      _id: req.params.id,
      house: req.user.house,
      assignedTo: req.user._id,
    });
    if (!task) return errorResponse(res, 'Task not found or not assigned to you.', 404);

    task.isMarketplace = true;
    task.marketplacePostedBy = req.user._id;
    task.assignedTo = null;
    await task.save();

    return successResponse(res, task, 'Task posted to marketplace');
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Claim a marketplace task
 * @route   POST /api/tasks/:id/claim
 * @access  Private
 */
exports.claimTask = async (req, res, next) => {
  try {
    const task = await Task.findOne({
      _id: req.params.id,
      house: req.user.house,
      isMarketplace: true,
      assignedTo: null,
    });
    if (!task) return errorResponse(res, 'Task not available.', 404);

    task.assignedTo = req.user._id;
    task.isMarketplace = false;
    task.status = 'pending';
    await task.save();

    // Notify marketplace poster
    if (task.marketplacePostedBy) {
      await Notification.notify({
        house: req.user.house,
        recipient: task.marketplacePostedBy,
        sender: req.user._id,
        type: 'task_assigned',
        title: 'Task Claimed',
        message: `${req.user.name} claimed "${task.title}" from the marketplace.`,
        data: { taskId: task._id },
      });
    }

    const populated = await populateTask(Task.findById(task._id));
    return successResponse(res, populated, 'Task claimed successfully');
  } catch (err) {
    next(err);
  }
};

// ─── Analytics ────────────────────────────────────────────────────────────────

/**
 * @desc    Get task analytics for a user
 * @route   GET /api/tasks/analytics
 * @access  Private
 */
exports.getAnalytics = async (req, res, next) => {
  try {
    const { userId = req.user._id, month } = req.query;

    let dateFilter = {};
    if (month) {
      const [year, m] = month.split('-');
      const start = new Date(year, m - 1, 1);
      const end = new Date(year, m, 0, 23, 59, 59);
      dateFilter = { dueDate: { $gte: start, $lte: end } };
    }

    const [completed, assists, swaps, skipped, totalTasks] = await Promise.all([
      Task.countDocuments({ house: req.user.house, assignedTo: userId, status: 'completed', ...dateFilter }),
      Task.countDocuments({ house: req.user.house, 'assistRequest.acceptedBy': userId, 'assistRequest.status': 'completed', ...dateFilter }),
      Task.countDocuments({ house: req.user.house, 'swapRequest.requestedTo': userId, 'swapRequest.status': 'accepted', ...dateFilter }),
      Task.countDocuments({ house: req.user.house, assignedTo: userId, status: 'skipped', ...dateFilter }),
      Task.countDocuments({ house: req.user.house, assignedTo: userId, ...dateFilter }),
    ]);

    // Category breakdown
    const categoryBreakdown = await Task.aggregate([
      {
        $match: {
          house: req.user.house,
          assignedTo: require('mongoose').Types.ObjectId(userId.toString()),
          status: 'completed',
          ...dateFilter,
        },
      },
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);

    // Weekly heatmap (last 8 weeks)
    const weeklyData = await Task.aggregate([
      {
        $match: {
          house: req.user.house,
          assignedTo: require('mongoose').Types.ObjectId(userId.toString()),
          status: 'completed',
          completedAt: { $gte: new Date(Date.now() - 56 * 24 * 60 * 60 * 1000) },
        },
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$completedAt' } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    const efficiency = totalTasks > 0 ? Math.round((completed / totalTasks) * 100) : 0;
    const favoriteTask = categoryBreakdown[0] || null;

    return successResponse(
      res,
      {
        summary: { completed, assists, swaps, skipped, total: totalTasks, efficiency },
        categoryBreakdown,
        weeklyHeatmap: weeklyData,
        favoriteCategory: favoriteTask?._id || null,
      },
      'Analytics fetched'
    );
  } catch (err) {
    next(err);
  }
};
