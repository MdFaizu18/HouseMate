const express = require('express');
const router = express.Router();

const {
  createTask,
  getTasks,
  getTodayTasks,
  getTask,
  updateTask,
  deleteTask,
  completeTask,
  requestAssist,
  acceptAssist,
  requestSwap,
  respondSwap,
  requestSickLeave,
  coverSickLeave,
  postToMarketplace,
  claimTask,
  getAnalytics,
} = require('../controllers/taskController');

const { protect, requireHouse } = require('../middleware/auth');
const { validate, schemas } = require('../middleware/validate');

router.use(protect, requireHouse);

// Analytics (before /:id to avoid conflicts)
router.get('/analytics', getAnalytics);
router.get('/today', getTodayTasks);

// CRUD
router.route('/')
  .get(getTasks)
  .post(validate(schemas.createTask), createTask);

router.route('/:id')
  .get(getTask)
  .put(validate(schemas.updateTask), updateTask)
  .delete(deleteTask);

// Actions
router.post('/:id/complete', completeTask);

// Assist
router.post('/:id/assist/request', requestAssist);
router.post('/:id/assist/accept', acceptAssist);

// Swap
router.post('/:id/swap/request', validate(schemas.swapRequest), requestSwap);
router.post('/:id/swap/respond', respondSwap);

// Sick Leave
router.post('/:id/sick', validate(schemas.sickLeave), requestSickLeave);
router.post('/:id/sick/cover', coverSickLeave);

// Marketplace
router.post('/:id/marketplace', postToMarketplace);
router.post('/:id/claim', claimTask);

module.exports = router;
