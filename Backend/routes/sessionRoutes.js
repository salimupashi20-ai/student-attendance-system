const express = require("express");

const router = express.Router();

const {
    createSession,
    getActiveSession,
    getMySessions,
    closeSession
} = require("../controllers/sessionController");

const protect =
    require("../middleware/authMiddleware");

const authorizeRoles =
    require("../middleware/roleMiddleware");


// ========================================
// CREATE SESSION
// ========================================

router.post(
    "/",
    protect,
    authorizeRoles("lecturer"),
    createSession
);


// ========================================
// GET CURRENT ACTIVE SESSION
// ========================================

router.get(
    "/active",
    protect,
    authorizeRoles("lecturer"),
    getActiveSession
);


// ========================================
// GET LECTURER SESSION HISTORY
// ========================================

router.get(
    "/",
    protect,
    authorizeRoles("lecturer"),
    getMySessions
);


// ========================================
// CLOSE SESSION
// ========================================

router.patch(
    "/:sessionId/close",
    protect,
    authorizeRoles("lecturer"),
    closeSession
);


module.exports = router;