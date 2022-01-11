const ErrorResponse = require("../utils/errorResponse");
const crypto = require("crypto");
const asyncHandler = require("../middleware/async");
const User = require("../models/User");
const sendEmail = require("../utils/sendEmail");

// Get  token from model , create cookie and send response
const sendTokenResponse = (user, statusCode, res) => {
  // Create Token
  const token = user.getSignedJwtToken();

  const options = {
    // expires: new Date(
    //   Date.now() + '1d' * 24 * 60 * 60 * 1000 // this will give us expiration date one day from creation
    // ),
    expires: new Date(
      Date.now() + 24 * 60 * 60 * 1000 // this will give us expiration date one day from creation
    ),
    httpOnly: true, // we want the cookie to be accessed through the client side script
  };

  if (process.env.NODE_ENV === "production") {
    options.secure = true; // this way cookie will be sent with https
  }

  res
    .status(statusCode)
    .cookie("token", token, options)
    .json({ success: true, token });
};

//@desc    Register User
//@route   POST /api/v1/auth/register
//@access  Public

exports.register = asyncHandler(async (req, res, next) => {
  const { firstName, lastName, email, password, role } = req.body;

  //   Create User
  const user = await User.create({
    firstName,
    lastName,
    email,
    password,
    role,
  });

  // Create token
  // const token = user.getSignedJwtToken();

  // res.status(200).json({
  //   success: true,
  //   message: "User added successfully",
  //   token,
  //   data: {
  //     firstName,
  //     lastName,
  //     email,
  //     role,
  //   },
  // });
  sendTokenResponse(user, 200, res);
});

//@desc    Login User
//@route   POST /api/v1/auth/login
//@access  Public

exports.login = asyncHandler(async (req, res, next) => {
  const { email, password } = req.body;

  //   Validate email and password
  if (!email || !password) {
    return next(new ErrorResponse("Please provide email and password", 400));
  }

  // Check for user
  const user = await User.findOne({ email }).select("+password"); // we need to specify select password here as it was excluded in the model

  if (!user) {
    return next(new ErrorResponse(`User not found with email: ${email}`, 401));
  }

  // Check if password matches
  const isMatch = await user.matchPassword(password);
  if (!isMatch) {
    return next(new ErrorResponse("Password is invalid ", 401));
  }

  // Create token
  // const token = user.getSignedJwtToken();

  // res.status(200).json({
  //   success: true,
  //   message: "Login successful",
  //   token,
  // });
  sendTokenResponse(user, 200, res);
});

//@desc    Get current  User
//@route   POST /api/v1/auth/getUser
//@access  Private

exports.getUser = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user.id);

  res.status(200).json({
    success: true,
    data: user,
  });
});

//@desc    Update current  User
//@route   PUT /api/v1/auth/updateUser
//@access  Private

exports.updateUser = asyncHandler(async (req, res, next) => {
  const fieldsToUpdate = {
    // we are doing it because we dont want to update the password just the name and the email
    firstName: req.body.firstName,
    lastName: req.body.lastName,
    email: req.body.email,
  };
  const user = await User.findByIdAndUpdate(req.user.id, fieldsToUpdate, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({
    success: true,
    data: user,
  });
});

//@desc    Update Password
//@route   POST /api/v1/auth/updatePassword
//@access  Private

exports.updatePassword = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user.id).select("+password"); // we have to select it deliberately as it is select false by default

  // Check current password
  if (!(await user.matchPassword(req.body.currentPassword))) {
    return next(new ErrorResponse("Current password is incorrect", 401));
  } else if (await user.matchPassword(req.body.currentPassword) && req.body.currentPassword==req.body.newPassword ) {
    return next(
      new ErrorResponse("New Password cannot be same as previous password", 401)
    );
  }
  user.password = req.body.newPassword;
  await user.save({ validateBeforeSave: false });

  sendTokenResponse(user, 200, res);
});

//@desc    Forgot password
//@route   POST /api/v1/auth/forgotPassword
//@access  Public

exports.forgotPassword = asyncHandler(async (req, res, next) => {
  const user = await User.findOne({ email: req.body.email });

  if (!user) {
    return next(new ErrorResponse("There is no user with that email", 404));
  }

  // Get reset token
  const resetToken = user.getResetPasswordToken();
  // we`ll create a utility under utils to send email
  await user.save({ validateBeforeSave: false });

  // create reset url
  const resetUrl = `${req.protocol}://${req.get(
    "host"
  )}/api/v1/auth/resetPassword/${resetToken}`;

  const message = `Youve received this email as you have requested the reset of a password. Please put your request to: ${resetUrl}`; // it must usually contain url that leads to some front end page but we dont have it as of now so..

  try {
    await sendEmail({
      email: user.email,
      subject: "Password reset Token",
      message,
    });
    res.status(200).json({ success: true, data: "Email sent" });
  } catch (err) {
    console.log(err);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save({ validateBeforeSave: false });

    return next(new ErrorResponse("Email cannot be sent", 500));
  }

  console.log(resetToken);

  res.status(200).json({
    success: true,
    resetPasswordToken: user.resetPasswordToken,
    resetPasswordExpire: user.resetPasswordExpire,
  });
});

//@desc    Reset password
//@route   PUT /api/v1/auth/resetPassword/:resettoken
//@access  Public

exports.resetPassword = asyncHandler(async (req, res, next) => {
  // get hashed token
  const resetPasswordToken = crypto
    .createHash("sha256")
    .update(req.params.resettoken)
    .digest("hex");
  const user = await User.findOne({
    resetPasswordToken,
    resetPasswordExpire: { $gt: Date.now() }, //gt stands for greater than
  });
  if (!user) {
    return next(new ErrorResponse("Invalid Token", 400));
  }

  // Set new password

  user.password = req.body.password;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpire = undefined;
  user.save({ validateBeforeSave: false });

  sendTokenResponse(user, 200, res);
});
