const userModel = require("../models/user.model");

/**
 * @route GET /api/users/profile
 * @desc Get user profile
 */
exports.getProfile = (req, res) => {
  return res.status(200).json({
    success: true,
    user: req.user,
  });
};

/**
 * @route PUT /api/users/profile
 * @desc Update user profile
 */
exports.updateProfile = async (req, res, next) => {
  try {
    const { name, avatar } = req.body;
    const user = await userModel.findById(req.user.id);
    if (!user) {
      return res.status(444).json({ success: false, message: "User not found." });
    }

    if (name) user.name = name.trim();
    if (avatar) user.avatar = avatar;

    user.updatedAt = new Date().toISOString();
    return res.status(200).json({
      success: true,
      message: "Profile updated successfully.",
      user: userModel.sanitizeUser(user),
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @route GET /api/users/dashboard
 * @desc Dashboard data placeholder (User Profile, Saved Projects, History, AI Chats, Settings, Subscription Info)
 */
exports.getDashboard = async (req, res) => {
  return res.status(200).json({
    success: true,
    user: req.user,
    stats: {
      totalCompilations: 42,
      savedProjectsCount: 5,
      aiChatsCount: 12,
      activePlan: req.user.plan.toUpperCase(),
      creditsRemaining: req.user.credits,
    },
    savedProjects: [],
    recentHistory: [],
  });
};
