const { PLANS } = require("../plans/plans.config");

/**
 * Placeholder Subscription Middleware: Validates that the current user has an active subscription.
 */
const requireActiveSubscription = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: "Authentication required." });
  }

  const activeStatuses = ["active", "trialing"];
  if (!activeStatuses.includes(req.user.subscriptionStatus)) {
    return res.status(402).json({
      success: false,
      message: "An active subscription is required to access this feature.",
      upgradeUrl: "/pricing",
    });
  }
  next();
};

/**
 * Placeholder Plan Validation Middleware: Restricts route access to specified plan tiers.
 * Example: requirePlan(['pro', 'team', 'enterprise'])
 */
const requirePlan = (allowedPlans = ["pro", "team", "enterprise"]) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: "Authentication required." });
    }

    const userPlan = req.user.plan || "free";
    if (!allowedPlans.includes(userPlan)) {
      return res.status(403).json({
        success: false,
        message: `This action requires a ${allowedPlans.join(" or ")} plan. Current plan: ${userPlan.toUpperCase()}`,
        currentPlan: userPlan,
        requiredPlans: allowedPlans,
      });
    }
    next();
  };
};

/**
 * Feature Access Control Helper / Middleware
 */
const checkFeatureAccess = (featureName) => {
  return (req, res, next) => {
    const userPlanId = req.user ? req.user.plan : "free";
    const userPlan = PLANS[userPlanId] || PLANS.free;

    if (!userPlan.features[featureName]) {
      return res.status(403).json({
        success: false,
        message: `Feature '${featureName}' is locked under your current plan (${userPlan.name}).`,
        upgradeRequired: true,
      });
    }
    next();
  };
};

/**
 * Usage Limits Helper / Middleware Placeholder
 */
const checkUsageLimit = (limitType) => {
  return (req, res, next) => {
    // Guest / Free users have generous default access; future usage metrics tracked here.
    next();
  };
};

module.exports = {
  requireActiveSubscription,
  requirePlan,
  checkFeatureAccess,
  checkUsageLimit,
};
