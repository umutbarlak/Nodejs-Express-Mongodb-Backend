const express = require("express");
const {
  singUp,
  login,
  loguot,
  forgotPassword,
  resetPassword,
  updatePassword,
  protect,
  restricTo,
} = require("../controllers/authController");
const {
  getAllUsers,
  updateMe,
  deleteMe,
  getUser,
  createUser,
  updateUser,
  deleteUser,
  uploadUserPhoto,
  resize,
} = require("../controllers/userController");

const router = express.Router();

router.post("/signup", singUp);

router.post("/login", login);

router.post("/logout", loguot);

router.post("/forgot-password", forgotPassword);

router.patch("/reset-password/:token", resetPassword);

router.patch("/update-password", protect, updatePassword);
//
router.use(protect);

router.patch(
  "/update-me",
  uploadUserPhoto, // RAM de saklar
  resize, // yeniden boyutlanır
  updateMe
);

router.delete("/delete-me", deleteMe);
//_____
router.use(restricTo("admin"));

router.route("/").get(getAllUsers).post(createUser);

router
  .route("/:id")

  .get(getUser)
  .put(updateUser)
  .delete(deleteUser);

module.exports = router;
