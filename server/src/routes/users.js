const express = require('express');
const router = express.Router();

const {
  getUserProfile,
  getMyProfile,
  getHouseMembers,
} = require('../controllers/userController');

const { protect, requireHouse } = require('../middleware/auth');

router.use(protect);

router.get('/me/profile', getMyProfile);
router.get('/house-members', requireHouse, getHouseMembers);
router.get('/:id', requireHouse, getUserProfile);

module.exports = router;
