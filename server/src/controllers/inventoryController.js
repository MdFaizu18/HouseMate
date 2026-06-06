const Inventory = require('../models/Inventory');
const House = require('../models/House');
const Notification = require('../models/Notification');
const { successResponse, errorResponse, paginatedResponse } = require('../utils/response');

/**
 * @desc    Add inventory item
 * @route   POST /api/inventory
 * @access  Private
 */
exports.createItem = async (req, res, next) => {
  try {
    const item = await Inventory.create({
      ...req.body,
      house: req.user.house,
      addedBy: req.user._id,
    });

    const populated = await Inventory.findById(item._id)
      .populate('addedBy', 'name')
      .populate('lastRestockedBy', 'name')
      .populate('refillRequest.requestedBy', 'name')
      .populate('refillRequest.fulfilledBy', 'name');

    return successResponse(res, populated, 'Item added to inventory', 201);
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Get all inventory items
 * @route   GET /api/inventory
 * @access  Private
 */
exports.getInventory = async (req, res, next) => {
  try {
    const { category, status, page = 1, limit = 30 } = req.query;

    const query = { house: req.user.house };
    if (category) query.category = category;
    if (status) query.status = status;

    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      Inventory.find(query)
        .populate('addedBy', 'name avatar')
        .populate('lastRestockedBy', 'name avatar')
        .populate('refillRequest.requestedBy', 'name avatar')
        .sort({ status: 1, name: 1 })
        .skip(skip)
        .limit(Number(limit)),
      Inventory.countDocuments(query),
    ]);

    return paginatedResponse(res, items, total, page, limit, 'Inventory fetched');
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Update inventory item
 * @route   PUT /api/inventory/:id
 * @access  Private
 */
exports.updateItem = async (req, res, next) => {
  try {
    const item = await Inventory.findOne({ _id: req.params.id, house: req.user.house });
    if (!item) return errorResponse(res, 'Item not found.', 404);

    // If quantity was updated, log restock
    if (req.body.quantity?.current && req.body.quantity.current > item.quantity.current) {
      item.lastRestockedAt = new Date();
      item.lastRestockedBy = req.user._id;

      // Clear refill request if restocked
      if (item.refillRequest.isRequested) {
        item.refillRequest.isRequested = false;
        item.refillRequest.fulfilledBy = req.user._id;
        item.refillRequest.fulfilledAt = new Date();
      }
    }

    Object.assign(item, req.body);
    await item.save();

    const populated = await Inventory.findById(item._id)
      .populate('addedBy', 'name avatar')
      .populate('lastRestockedBy', 'name avatar');

    return successResponse(res, populated, 'Item updated');
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Request refill for an item
 * @route   POST /api/inventory/:id/refill
 * @access  Private
 */
exports.requestRefill = async (req, res, next) => {
  try {
    const item = await Inventory.findOne({ _id: req.params.id, house: req.user.house });
    if (!item) return errorResponse(res, 'Item not found.', 404);
    if (item.refillRequest.isRequested) {
      return errorResponse(res, 'Refill already requested.', 400);
    }

    item.refillRequest.isRequested = true;
    item.refillRequest.requestedBy = req.user._id;
    item.refillRequest.requestedAt = new Date();
    item.status = 'refill_requested';
    await item.save();

    // Notify all house members
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
          type: 'refill_requested',
          title: 'Refill Needed!',
          message: `${req.user.name} flagged "${item.name}" for refill.`,
          data: { itemId: item._id },
        })
      )
    );

    return successResponse(res, item, 'Refill requested');
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Delete inventory item
 * @route   DELETE /api/inventory/:id
 * @access  Private
 */
exports.deleteItem = async (req, res, next) => {
  try {
    const item = await Inventory.findOneAndDelete({ _id: req.params.id, house: req.user.house });
    if (!item) return errorResponse(res, 'Item not found.', 404);
    return successResponse(res, null, 'Item deleted');
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Get low stock / out of stock items
 * @route   GET /api/inventory/alerts
 * @access  Private
 */
exports.getAlerts = async (req, res, next) => {
  try {
    const alerts = await Inventory.find({
      house: req.user.house,
      status: { $in: ['low', 'out_of_stock', 'refill_requested'] },
    }).sort({ status: 1 });

    return successResponse(res, alerts, 'Inventory alerts fetched');
  } catch (err) {
    next(err);
  }
};
