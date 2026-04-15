const express = require("express");
const authRoutes = require("./auth.routes");
const usersRoutes = require("./users.routes");
const announcementsRoutes = require("./announcements.routes");
const eventsRoutes = require("./events.routes");
const studentsRoutes = require("./students.routes");
const parentsRoutes = require("./parents.routes");
const classesRoutes = require("./classes.routes");
const predefinedSubjectsRoutes = require("./predefined-subjects.routes");
const libraryRoutes = require("./library.routes");
const pagesRoutes = require("./pages.routes");
const templatesRoutes = require("./templates.routes");
const {
  globalLimiter,
  authLimiter,
  otpSendLimiter,
  registrationLimiter,
  passwordResetLimiter,
  writeLimiter,
  uploadLimiter,
  gradeLimiter,
  readLimiter,
} = require("../middlewares/rateLimiter");

const router = express.Router();

// ─── Auth routes ─────────────────────────────────────────────────────────────
router.use("/auth/register", registrationLimiter);
router.use("/auth/verify-registration-otp", authLimiter);
router.use("/auth/verify-otp-code", authLimiter);
router.use("/auth/login", authLimiter);
router.use("/auth/send-otp", otpSendLimiter);
router.use("/auth/verify-otp", authLimiter);
router.use("/auth/forgot-password", passwordResetLimiter);
router.use("/auth/reset-password", passwordResetLimiter);
router.use("/auth", globalLimiter); // /me, /logout, /trusted-devices

// ─── Users ───────────────────────────────────────────────────────────────────
router.use("/users/:id/account", writeLimiter); // account_status + roles update
router.use("/users", globalLimiter);

// ─── Students ────────────────────────────────────────────────────────────────
router.use("/students", readLimiter);

// ─── Parents ─────────────────────────────────────────────────────────────────
router.use("/parents/register", uploadLimiter); // file uploads
router.use("/parents/registrations", globalLimiter); // admin review
router.use("/parents", readLimiter); // my-children, grades, attendance

// ─── Classes ─────────────────────────────────────────────────────────────────
router.use(
  "/classes/subjects/:subjectId/students/:studentId/grades",
  gradeLimiter,
);
router.use("/classes/students/:studentId/attendance", gradeLimiter);
router.use("/classes", globalLimiter);
router.use("/predefined-subjects", globalLimiter);

// ─── Announcements ───────────────────────────────────────────────────────────
router.use("/announcements", globalLimiter);

// ─── Events ──────────────────────────────────────────────────────────────────
router.use("/events", globalLimiter);

// ─── Library ─────────────────────────────────────────────────────────────────
router.use("/library/borrow", writeLimiter); // borrow / return actions
router.use("/library/materials", writeLimiter); // create / update / delete materials
router.use("/library", readLimiter); // browsing materials, categories

// ─── Mount routers ────────────────────────────────────────────────────────────
router.use("/auth", authRoutes);
router.use("/users", usersRoutes);
router.use("/announcements", announcementsRoutes);
router.use("/events", eventsRoutes);
router.use("/students", studentsRoutes);
router.use("/parents", parentsRoutes);
router.use("/classes", classesRoutes);
router.use("/predefined-subjects", predefinedSubjectsRoutes);
router.use("/library", libraryRoutes);
router.use("/pages", pagesRoutes);
router.use("/templates", templatesRoutes);

module.exports = router;
