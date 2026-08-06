const express = require("express");
const usersController = require("./users.controller");
const { requireAuth } = require("../auth/middleware/auth.middleware");

const router = express.Router();

router.use(requireAuth);
router.get("/profile", usersController.getProfile);
router.put("/profile", usersController.updateProfile);
router.get("/dashboard", usersController.getDashboard);

module.exports = router;
