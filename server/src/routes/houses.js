const express = require('express');
const router = express.Router();

const {
  createHouse,
  joinHouse,
  getMyHouse,
  updateHouse,
  updateSettings,
  regenerateInvite,
  updateMemberRole,
  removeMember,
  leaveHouse,
  getLeaderboard,
} = require('../controllers/houseController');

const { protect, requireHouse, requireAdmin } = require('../middleware/auth');
const { validate, schemas } = require('../middleware/validate');

router.use(protect);

// House management
router.post('/', validate(schemas.createHouse), createHouse);
router.post('/join', joinHouse);

// Require house membership from here on
router.use(requireHouse);

router.get('/me', getMyHouse);
router.put('/me', requireAdmin, updateHouse);
router.put('/me/settings', requireAdmin, validate(schemas.updateHouseSettings), updateSettings);
router.post('/me/invite', requireAdmin, regenerateInvite);
router.post('/me/leave', leaveHouse);
router.get('/me/leaderboard', getLeaderboard);

// Member management (admin only)
router.put('/members/:memberId/role', requireAdmin, validate(schemas.updateMemberRole), updateMemberRole);
router.delete('/members/:memberId', requireAdmin, removeMember);

module.exports = router;
