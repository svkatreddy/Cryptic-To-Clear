const express = require("express");
const subscriptionsController = require("./subscriptions.controller");
const { optionalAuth, requireAuth } = require("../auth/middleware/auth.middleware");

const router = express.Router();

router.get("/plans", subscriptionsController.getPlans);
router.get("/status", optionalAuth, subscriptionsController.getSubscriptionStatus);
router.post("/checkout-session", requireAuth, subscriptionsController.createCheckoutSession);
router.post("/webhook", subscriptionsController.handleWebhook);

module.exports = router;
