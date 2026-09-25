const express = require("express");

const router =
  express.Router();

const protect =
  require("../middleware/authMiddleware");

const authorizeRoles =
  require("../middleware/roleMiddleware");

const {
  createLocationRequest,
  submitMobileLocation,
  getLocationRequestStatus,
  markLocationRequestUsed
} = require(
  "../controllers/locationRequestController"
);

// ============================================
// PUBLIC PHONE ENDPOINT
//
// Security comes from the random,
// short-lived request token.
// ============================================

router.post(
  "/:requestId/location",
  submitMobileLocation
);

// ============================================
// LECTURER ENDPOINTS
// ============================================

router.post(
  "/",
  protect,
  authorizeRoles("lecturer"),
  createLocationRequest
);

router.get(
  "/:requestId/status",
  protect,
  authorizeRoles("lecturer"),
  getLocationRequestStatus
);

router.patch(
  "/:requestId/used",
  protect,
  authorizeRoles("lecturer"),
  markLocationRequestUsed
);

module.exports = router;