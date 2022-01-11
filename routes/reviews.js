const express = require("express");
const {
  getAllReviews,
  getSingleReview,
  addReview,
  updateReview,
  deleteReview
} = require("../controllers/reviews");

const review = require("../models/Reviews");
const advancedResults = require("../middleware/advancedResults");
const { protect, authorize } = require("../middleware/auth");

const router = express.Router({ mergeParams: true });

router
  .route("/")
  .get(
    advancedResults(review, {
      path: "bootcamp",
      select: "name description",
    }),
    getAllReviews
  )
  .post(protect, authorize("user", "admin"), addReview);

router
  .route("/:id")
  .get(getSingleReview)
  .put(protect, authorize("user", "admin"), updateReview)
  .delete(protect, authorize("user", "admin"), deleteReview);

module.exports = router;
