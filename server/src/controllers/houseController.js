  const House = require('../models/House');
  const User = require('../models/User');
  const Notification = require('../models/Notification');
  const { successResponse, errorResponse } = require('../utils/response');
  const { recalculateRanks } = require('../utils/gamification');

  /**
   * @desc    Create a new house
   * @route   POST /api/houses
   * @access  Private
   */
  exports.createHouse = async (req, res, next) => {
    try {
      if (req.user.house) {
        return errorResponse(res, 'You are already in a house. Leave it first.', 400);
      }

      const house = await House.create({
        ...req.body,
        admin: req.user._id,
        members: [{ user: req.user._id, customRole: 'House Admin' }],
      });

      // Update user
      await User.findByIdAndUpdate(req.user._id, {
        house: house._id,
        role: 'admin',
      });

      return successResponse(res, house, 'House created successfully', 201);
    } catch (err) {
      next(err);
    }
  };

  /**
   * @desc    Join house via invite code
   * @route   POST /api/houses/join
   * @access  Private
   */
  exports.joinHouse = async (req, res, next) => {
    try {
      const { inviteCode } = req.body;

      if (req.user.house) {
        return errorResponse(res, 'You are already in a house.', 400);
      }

      const house = await House.findOne({ inviteCode: inviteCode.toUpperCase(), isActive: true });
      if (!house) {
        return errorResponse(res, 'Invalid invite code.', 404);
      }

      const activeMembers = house.members.filter((m) => m.isActive).length;
      if (activeMembers >= house.maxMembers) {
        return errorResponse(res, 'House is full.', 400);
      }

      // Check if user was already a member (re-joining)
      const existingMember = house.members.find((m) => m.user.toString() === req.user._id.toString());
      if (existingMember) {
        existingMember.isActive = true;
      } else {
        house.members.push({ user: req.user._id, customRole: 'Member' });
      }

      await house.save();

      await User.findByIdAndUpdate(req.user._id, {
        house: house._id,
        role: 'member',
      });

      // Notify all house members
      const memberIds = house.members
        .filter((m) => m.isActive && m.user.toString() !== req.user._id.toString())
        .map((m) => m.user);

      await Promise.all(
        memberIds.map((memberId) =>
          Notification.notify({
            house: house._id,
            recipient: memberId,
            sender: req.user._id,
            type: 'member_joined',
            title: 'New Member Joined!',
            message: `${req.user.name} joined the house.`,
            data: { userId: req.user._id },
          })
        )
      );

      const populated = await House.findById(house._id).populate('members.user', 'name avatar points rank');
      return successResponse(res, populated, 'Joined house successfully');
    } catch (err) {
      next(err);
    }
  };

  /**
   * @desc    Get current user's house details
   * @route   GET /api/houses/me
   * @access  Private
   */
  exports.getMyHouse = async (req, res, next) => {
    try {
      if (!req.user.house) {
        return errorResponse(res, 'You are not in a house.', 404);
      }

      const house = await House.findById(req.user.house)
        .populate('admin', 'name avatar')
        .populate('members.user', 'name avatar points rank streak stats badges isActive lastSeen');

      if (!house) {
        return errorResponse(res, 'House not found.', 404);
      }

      return successResponse(res, house, 'House fetched');
    } catch (err) {
      next(err);
    }
  };

  /**
   * @desc    Update house info
   * @route   PUT /api/houses/me
   * @access  Private (admin)
   */
  exports.updateHouse = async (req, res, next) => {
    try {
      const { name, description, avatar } = req.body;
      const updates = {};
      if (name) updates.name = name;
      if (description !== undefined) updates.description = description;
      if (avatar) updates.avatar = avatar;

      const house = await House.findByIdAndUpdate(req.user.house, updates, {
        new: true,
        runValidators: true,
      });

      return successResponse(res, house, 'House updated');
    } catch (err) {
      next(err);
    }
  };

  /**
   * @desc    Update house settings
   * @route   PUT /api/houses/me/settings
   * @access  Private (admin)
   */
  exports.updateSettings = async (req, res, next) => {
    try {
      const house = await House.findById(req.user.house);
      if (!house) return errorResponse(res, 'House not found.', 404);

      Object.assign(house.settings, req.body);
      await house.save();

      return successResponse(res, house.settings, 'Settings updated');
    } catch (err) {
      next(err);
    }
  };

  /**
   * @desc    Regenerate invite code
   * @route   POST /api/houses/me/invite
   * @access  Private (admin)
   */
  exports.regenerateInvite = async (req, res, next) => {
    try {
      const house = await House.findById(req.user.house);
      const newCode = house.regenerateInviteCode();
      await house.save();

      return successResponse(res, { inviteCode: newCode }, 'Invite code regenerated');
    } catch (err) {
      next(err);
    }
  };

  /**
   * @desc    Update a member's custom role label
   * @route   PUT /api/houses/members/:memberId/role
   * @access  Private (admin)
   */
  exports.updateMemberRole = async (req, res, next) => {
    try {
      const { memberId } = req.params;
      const { customRole } = req.body;

      const house = await House.findById(req.user.house);
      const member = house.members.find((m) => m.user.toString() === memberId);
      if (!member) return errorResponse(res, 'Member not found.', 404);

      member.customRole = customRole;
      await house.save();

      return successResponse(res, null, 'Role updated');
    } catch (err) {
      next(err);
    }
  };

  /**
   * @desc    Remove a member from house
   * @route   DELETE /api/houses/members/:memberId
   * @access  Private (admin)
   */
  exports.removeMember = async (req, res, next) => {
    try {
      const { memberId } = req.params;

      if (memberId === req.user._id.toString()) {
        return errorResponse(res, 'Admin cannot remove themselves.', 400);
      }

      const house = await House.findById(req.user.house);
      const member = house.members.find((m) => m.user.toString() === memberId);
      if (!member) return errorResponse(res, 'Member not found.', 404);

      member.isActive = false;
      await house.save();

      await User.findByIdAndUpdate(memberId, { house: null, role: 'member', rank: null });

      return successResponse(res, null, 'Member removed');
    } catch (err) {
      next(err);
    }
  };

  /**
   * @desc    Leave house
   * @route   POST /api/houses/me/leave
   * @access  Private
   */
  exports.leaveHouse = async (req, res, next) => {
    try {
      if (req.user.role === 'admin') {
        return errorResponse(res, 'Admin cannot leave. Transfer admin first or dissolve the house.', 400);
      }

      const house = await House.findById(req.user.house);
      const member = house.members.find((m) => m.user.toString() === req.user._id.toString());
      if (member) member.isActive = false;
      await house.save();

      await User.findByIdAndUpdate(req.user._id, { house: null, rank: null });

      // Notify other members
      const otherMembers = house.members
        .filter((m) => m.isActive && m.user.toString() !== req.user._id.toString())
        .map((m) => m.user);

      await Promise.all(
        otherMembers.map((id) =>
          Notification.notify({
            house: house._id,
            recipient: id,
            type: 'member_left',
            title: 'A Member Left',
            message: `${req.user.name} left the house.`,
          })
        )
      );

      return successResponse(res, null, 'Left house successfully');
    } catch (err) {
      next(err);
    }
  };

  /**
   * @desc    Get house leaderboard
   * @route   GET /api/houses/me/leaderboard
   * @access  Private
   */
  exports.getLeaderboard = async (req, res, next) => {
    try {
      const { getLeaderboard } = require('../utils/gamification');
      const board = await getLeaderboard(req.user.house);
      await recalculateRanks(req.user.house);
      return successResponse(res, board, 'Leaderboard fetched');
    } catch (err) {
      next(err);
    }
  };
