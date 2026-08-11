const express = require("express");
const facultyController = require("./faculty.controller");
const { optionalAuth, requireAuth, requireFaculty } = require("../auth/middleware/auth.middleware");

const router = express.Router();

// Student-accessible assignment routes (optionalAuth so guest students can also attempt/submit)
router.get("/student-assignments", optionalAuth, facultyController.getStudentAssignments);
router.post("/assignments/:assignmentId/submit", optionalAuth, facultyController.submitAssignment);

// Faculty-restricted endpoints
router.use(requireAuth);
router.use(requireFaculty);

router.get("/overview", facultyController.getOverview);
router.get("/students", facultyController.getStudents);
router.get("/students/:studentId", facultyController.getStudentDetail);
router.get("/error-analytics", facultyController.getErrorAnalytics);
router.get("/language-analytics", facultyController.getLanguageAnalytics);
router.get("/classes", facultyController.getClasses);
router.post("/classes", facultyController.addClass);
router.get("/assignments", facultyController.getAssignments);
router.post("/assignments", facultyController.createAssignment);
router.put("/assignments/:assignmentId", facultyController.updateAssignment);
router.get("/assignments/:assignmentId/analytics", facultyController.getAssignmentAnalytics);
router.get("/reports", facultyController.getReports);
router.get("/subscription", facultyController.getSubscription);

module.exports = router;
