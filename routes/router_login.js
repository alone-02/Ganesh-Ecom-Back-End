const express = require("express");
const bcrypt = require("bcryptjs");
const User = require("../models/model_user");
const jwt = require("jsonwebtoken");
const env = require("dotenv");

const router = express.Router();
env.config();
const secret = process.env.JWT_SECRET;
const saltRounds = 10;
//console.log("SECRET", secret);

router.post("/authenticate", async (req, res) => {
  const { email, password } = req.body;
  // console.log(email);
  try {
    const user = await User.findOne({ email }).select("password isadmin");
    if (!user) {
      return res.status(401).json({ message: "Invalid email" });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid password" });
    }
    //console.log(user);

    const token = jwt.sign({ userId: user._id, isAdmin: user.isadmin }, secret, {
      expiresIn: "1d",
    });

    //console.log("Token :", token);
    if (!token) {
      return res.status(401).json({ message: "Token not generated" });
    }
    return res.status(200).json({
      message: "Login successful",
      user: email,
      userId: user._id,
      token,
      admin: user.isadmin,
    });
  } catch (error) {
    return res.status(500).json({ message: "Internal Server Error", error });
  }
});


router.put("/resetPassword", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and new password are required." });
    }

    console.log("Reset password request received for:", email);

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User with this email does not exist." });
    }

    console.log(" User found:", user.email);

    const hashedPassword = await bcrypt.hash(password, saltRounds);

    const updatedUser = await User.findOneAndUpdate(
      { email },
      { $set: { password: hashedPassword } },
      { new: true } 
    );

    if (!updatedUser) {
      return res.status(500).json({ message: "Failed to update password. Try again later." });
    }

    console.log("Password updated successfully for:", email);

    return res.status(200).json({
      message: "Password updated successfully!",
    });
  } catch (error) {
    console.error("Error during password reset:", error);
    return res.status(500).json({
      message: "Internal Server Error",
      error: error.message,
    });
  }
});

router.get("/userlist/:id", async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("-password");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ message: "Internal Server Error", error });
  }
});

router.get("/userlist", async (req, res) => {
  try {
    const users = await User.find().select("-password");
    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ message: "Internal Server Error", error });
  }
});

router.delete("/delete/:id", async (req, res) => {
  try {
    const response = await User.findByIdAndDelete(req.params.id);
    if (!response) {
      return res.status(404).json({ success: false, message: "User not found" });
    }
    res.status(200).json({ success: true, message: "User deleted" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Internal Server Error", error });
  }
});

module.exports = router;
