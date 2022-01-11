const crypto = require("crypto");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs"); // we are adding js extention as it`s been observed that sometimes it doesn`t work without it
const jwt = require("jsonwebtoken");
const UserSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: [true, "Please add Name"],
  },
  lastName: {
    type: String,
  },
  email: {
    type: String,
    required: [true, "Please enter email address"],
    unique: true,
    match: [
      /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,
      "Please add valid email address",
    ],
  },
  role: {
    type: String,
    enum: ["user", "publisher"],
    default: "user",
  },
  password: {
    type: String,
    required: [true, "Please add a password"],
    minlength: 6,
    select: false, // it will not show the password when we fetch the user details
  },
  resetPasswordToken: String, // coz we`ll have reset password functionality
  resetPasswordExpire: Date,
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Encrypt password using bcrypt
UserSchema.pre("save", async function (next) {
  if (!this.isModified("password")){
    next()
  }; // we`ve done it to prevent it from running when we run forgot password API
  const salt = await bcrypt.genSalt(10); // 10 is basically number of rounds for security as you guessed more the better but heavier on the system and 10 is recommended
  this.password = await bcrypt.hash(this.password, salt);
});

// Sign JWT and return
UserSchema.methods.getSignedJwtToken = function () {
  return jwt.sign({ id: this._id }, process.env.JWT_SECRET, {
    expiresIn: "1d",
  }); // we will add secret key in the config file
};

// Match user entered password to the hashed password
UserSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password); // this is the method which is gonna be called on actual user so it has access to the password
};

// Generate and hash password token
UserSchema.methods.getResetPasswordToken = function () {
  // Generate token
  const resetToken = crypto.randomBytes(20).toString("hex");

  // has token and set to resetPasswordToken field
  this.resetPasswordToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex"); //update will have value which we wanna hash //this is being called on the actual user so we have access to the user`s properties

  // Set expire
  this.resetPasswordExpire = Date.now() + 10 * 60 * 1000;

  return resetToken;
};

module.exports = mongoose.model("User", UserSchema);
