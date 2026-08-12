const express = require("express");
const router = express.Router();

const {
    createSession
} = require("../controllers/sessionController");

const protect = require("../middleware/authMiddleware");
const authorizeRoles = require("../middleware/roleMiddleware");

router.post(
    "/",
    protect,
    authorizeRoles("lecturer"),
    createSession
);

module.exports = router;