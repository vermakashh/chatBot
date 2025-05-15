const express = require("express");
const router = express.Router();
const { login, register } = require("../controllers/authController");
const User = require("../models/User");

router.post("/register", register);
router.post("/login", login);

router.get("/users", async (req, res) => {
  const users = await User.find().select("-password");
  res.json(users);
});

module.exports = router;
