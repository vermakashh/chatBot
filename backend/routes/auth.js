const express = require("express");
const router = express.Router();
const { login, register } = require("../controllers/authController");
const User = require("../models/User");

router.post("/register", register);
router.post("/login", login);

router.post("/contacts/:userId/:contactId", async (req, res) => {
  const { userId, contactId } = req.params;

  try {
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: "User not found" });

    if (!user.contacts.includes(contactId)) {
      user.contacts.push(contactId);
      await user.save();
    }

    res.status(200).json({ message: "Contact added" });
  } catch (err) {
    console.error("Add contact error:", err);
    res.status(500).json({ error: "Failed to add contact" });
  }
});

router.get("/contacts/:userId", async (req, res) => {
  try {
    const user = await User.findById(req.params.userId).populate("contacts", "-password");
    if (!user) return res.status(404).json({ error: "User not found" });

    res.json(user.contacts);
  } catch (err) {
    console.error("Fetch contacts error:", err);
    res.status(500).json({ error: "Failed to fetch contacts" });
  }
});

router.get("/users", async (req, res) => {
  try {
    const users = await User.find().select("-password");
    res.json(users);
  } catch (err) {
    console.error("Fetch users error:", err);
    res.status(500).json({ error: "Failed to fetch users" });
  }
});

router.delete("/contacts/:userId/:contactId", async (req, res) => {
  const { userId, contactId } = req.params;

  try {
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: "User not found" });

    user.contacts = user.contacts?.filter(
      (id) => id.toString() !== contactId
    );

    await user.save();

    res.status(200).json({ message: "Contact deleted" });
  } catch (err) {
    console.error("Delete contact error:", err);
    res.status(500).json({ error: "Failed to delete contact" });
  }
});

module.exports = router;
