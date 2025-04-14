const express = require("express");
const {
  getAllTours,
  createTour,
  getTour,
  deleteTour,
  updateTour,
  aliasTopTours,
  getTourStats,
  getMonthlyPlan,
  getToursWithin,
  getDistances,
} = require("../controllers/tourController");
const formatQuery = require("../middleware/formatQuery");
const { protect, restricTo } = require("../controllers/authController");
const reviewController = require("../controllers/reviewController");

const router = express.Router();

router.route("/top-tours").get(aliasTopTours, getAllTours);

router.route("/tour-stats").get(protect, restricTo("admin"), getTourStats);

router
  .route("/monthly-plan/:year")
  .get(protect, restricTo("admin"), getMonthlyPlan);

router
  .route("/")
  .get(formatQuery, getAllTours)
  .post(protect, restricTo("admin", "lead-guide"), createTour);

router
  .route("/:id")
  .get(getTour)
  .delete(protect, restricTo("admin", "lead-guide"), deleteTour)
  .patch(protect, restricTo("admin", "lead-guide", "guide"), updateTour);

router
  .route("/:tourId/reviews")
  .get(reviewController.getAllReviews)
  .post(protect, reviewController.setRefIds, reviewController.createReview);

router
  .route("/tours-within/:distance/center/:latlng/unit/:unit")
  .get(getToursWithin);

router.route("/distances/:latlng/unit/:unit").get(getDistances);

module.exports = router;
