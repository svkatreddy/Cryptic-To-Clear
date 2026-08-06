const { PLANS } = require("../plans/plans.config");
const userModel = require("../models/user.model");

/**
 * @route GET /api/subscriptions/plans
 * @desc Get available subscription plans and pricing
 */
exports.getPlans = (req, res) => {
  return res.status(200).json({
    success: true,
    plans: Object.values(PLANS),
  });
};

/**
 * @route GET /api/subscriptions/status
 * @desc Get current user's subscription status and limits
 */
exports.getSubscriptionStatus = async (req, res) => {
  const user = req.user;
  if (!user) {
    return res.status(200).json({
      success: true,
      isGuest: true,
      plan: PLANS.free,
    });
  }

  const userPlan = PLANS[user.plan] || PLANS.free;

  return res.status(200).json({
    success: true,
    isGuest: false,
    subscription: {
      plan: user.plan,
      planDetails: userPlan,
      status: user.subscriptionStatus,
      expiry: user.subscriptionExpiry,
      credits: user.credits,
    },
  });
};

/**
 * @route POST /api/subscriptions/checkout-session
 * @desc Payment Gateway Integration Placeholder (Stripe, Razorpay, Lemon Squeezy)
 */
exports.createCheckoutSession = async (req, res) => {
  const { planId, provider = "stripe" } = req.body;

  if (!PLANS[planId]) {
    return res.status(400).json({ success: false, message: "Invalid plan selected." });
  }

  // Placeholder responses for future payment gateways
  return res.status(200).json({
    success: true,
    message: `Checkout session initialized for ${PLANS[planId].name} via ${provider}.`,
    provider,
    planId,
    mode: "placeholder",
    checkoutUrl: `/billing/checkout-mock?plan=${planId}&provider=${provider}`,
  });
};

/**
 * @route POST /api/subscriptions/webhook
 * @desc Payment Gateway Webhook Handler Placeholder
 */
exports.handleWebhook = async (req, res) => {
  // Real payment gateway events (e.g. invoice.payment_succeeded) handled here in production
  return res.status(200).json({ received: true, mode: "placeholder" });
};
