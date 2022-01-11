const express = require("express");
const {
  register,
  login,
  getUser,
  forgotPassword,
  resetPassword,
  updateUser,
  updatePassword
} = require("../controllers/auth");
const { protect } = require("../middleware/auth");

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.get("/getUser", protect, getUser);
router.post("/forgotPassword", forgotPassword);
router.put("/resetPassword/:resettoken", resetPassword);
router.put("/updateUser", protect, updateUser);
router.put("/updatePassword", protect, updatePassword);

module.exports = router;
