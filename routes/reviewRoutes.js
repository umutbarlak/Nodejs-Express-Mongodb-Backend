const express = require("express");
const {
  getAllReviews,
  createReview,
  getReview,
  updateReview,
  deleteReview,
} = require("../controllers/reviewController");

const router = express.Router();

router.route("/").get(getAllReviews).post(createReview);

router.route("/:id").get(getReview).delete(deleteReview).patch(updateReview);

module.exports = router;
