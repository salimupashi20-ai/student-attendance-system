const express = require("express");
const router = express.Router();

const {
    createSession,
    getMySessions,
    closeSession
} = require("../controllers/sessionController");

const protect = require("../middleware/authMiddleware");
const authorizeRoles = require("../middleware/roleMiddleware");

router.post(
    "/",
    protect,
    authorizeRoles("lecturer"),
    createSession
);

router.get(
    "/",
    protect,
    authorizeRoles("lecturer"),
    getMySessions
);

router.patch(
    "/:sessionId/close",
    protect,
    authorizeRoles("lecturer"),
    closeSession
);

module.exports = router;