import ErrorHandler from "../middlewares/errorMiddleware.js";
import catchAsyncErrors from "../middlewares/catchAsyncErrors.js";
import { User } from "../model/Usermodel.js";
import sendVerificationCode from "../utils/sendVerificationCode.js";
import bcrypt from "bcrypt";
import { sendToken } from "../utils/sendToken.js";
import {sendEmail} from "../utils/sendEmail.js";
import { generateFogotPasswordEmailTemplate } from "../utils/emailTemplate.js";
import crypto from "crypto";

export const register = catchAsyncErrors(async (req, res, next) => {
  try {
    const { name, email, password, role } = req.body; // <-- ADD role here

    if (!name || !email || !password ||!role) {
      return next(new ErrorHandler("Please enter all fields", 400));
    }

    const isRegistered = await User.findOne({ email, accountVerified: true });
    if (isRegistered) {
      return next(new ErrorHandler("User already registered", 400));
    }

    const registerationAttemptByUser = await User.find({
      email,
      accountVerified: false,
    });

    if (registerationAttemptByUser.length >= 500) {
      return next(
        new ErrorHandler(
          "You have exceeded the number of registration attempts. Please try again later or contact support.",
          400
        )
      );
    }

    if (password.length < 6 || password.length > 16) {
      return next(
        new ErrorHandler("Password must be between 6 and 16 characters", 400)
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      role: role || "User", // <-- SAVE ROLE HERE (default: User)
    });

    const verificationCode = user.generateVerificationCode();
    await user.save();

    sendVerificationCode(verificationCode, email, res);
    
  } catch (error) {
    next(error);
  }
});

//verify OTP

export const verifyOTP = catchAsyncErrors(async (req, res, next) => {
  const { email, otp } = req.body;

  if (!email || !otp) {
    return next(new ErrorHandler("Email or OTP is missing", 400));
  }

  try {
    const userAllEntries = await User.find({
      email,
      accountVerified: false,
    }).sort({ createdAt: -1 });

    if (!userAllEntries) {
      return next(new ErrorHandler("User not found", 404));
    }

    let user;

    if (userAllEntries.length > 1) {
      user=userAllEntries[0]
      await User.deleteMany({
        _id: { $ne: user._id },
        email,
        accountVerified: false,
      });
    }else{
      user=userAllEntries[0]
    }

 if (user.verificationCode !== otp.toString()) {
  return next(new ErrorHandler("Invalid OTP", 400));
  }

   const currentTime = Date.now();
    const verificationCodeExpire = new Date(
      user.verificationCodeExpire
    ).getTime();

    if (currentTime > verificationCodeExpire) {
      return next(new ErrorHandler("OTP expired", 400));
    }

    user.accountVerified = true;


    await user.save({ validateModifiedOnly: true });

    sendToken(user, 200, "Account verified successfully", res);
  } catch (error) {
    // console.error("SERVER ERROR → ", error);
    return next(new ErrorHandler("Internal Server Error", 500));
  }
});

//Login
export const login = catchAsyncErrors(async (req, res, next) => {
  //Login
  const { email, password } = req.body;
  if (!email || !password) {
    return next(new ErrorHandler("Please Enter all Fields", 400));
  }
  const user = await User.findOne({ email, accountVerified: true }).select(
    "+password"
  );
  if (!user) {
    return next(new ErrorHandler("Invalid Email or Password", 400));
  }
  const isPasswordMatched = await bcrypt.compare(password, user.password);
  if (!isPasswordMatched) {
    return next(new ErrorHandler("Invalid Email Or Password", 400));
  }
  sendToken(user, 200, "User login Successfully", res);
});
//Logout
export const logout = catchAsyncErrors(async (req, res, next) => {
  res
    .status(200)
    .cookie("token", "", {
      expires: new Date(Date.now()),
      httpOnly: true,
    })
    .json({
      success: true,
      Message: "Logged out Successfully",
    });
});

//getUser
export const getUser = catchAsyncErrors(async (req, res) => {
  const user = req.user;
  res.status(200).json({
    success: true,
    user,
  });
});
//forgotPassword
export const forgotPassword = catchAsyncErrors(async(req, res, next) => {
  const user = await User.findOne({
    email: req.body.email,
    accountVerified: true,
  });

  if (!user) {
    return next(new ErrorHandler("Invaid Email", 400));
  }
  const resetToken = user.getResetPasswordToken();
  await user.save({ validateBeforeSave: false });
  const resetPasswordUrl = `${process.env.FRONTEND_URL}/password/reset/${resetToken}`;
  const message = generateFogotPasswordEmailTemplate(resetPasswordUrl);
  try {
    await sendEmail({
      email: user.email,
      subject: "Book Library Management System Password Recovery",
      message,
    });
    res.status(200).json({
      success: true,
      message: `Email Sent to ${user.email} Successfully`,
    });
  } catch (error) {
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save({ validateBeforeSave: false });
    return next(new ErrorHandler(error.message, 500));
  }
});

//ResetPassword
export const resetPassword = catchAsyncErrors(async (req, res, next) => {
  const { token } = req.params;
  const resetPasswordToken = crypto
    .createHash("sha256")
    .update(token)
    .digest("hex");

  const user = await User.findOne({
    resetPasswordToken,
    resetPasswordExpire: { $gt: Date.now() },
  });

  if (!user) {
    return next(
      new ErrorHandler(
        "Reset Password token is invalid or has been Expired",
        400
      )
    );
  }

  if (req.body.password !== req.body.confirmPassword) {
    return next(
      new ErrorHandler("Password Or Confirm Password do not Match", 400)
    );
  }

  if (
    req.body.password.length < 6 ||
    req.body.password.length > 16 ||
    req.body.confirmPassword.length < 6 ||
    req.body.confirmPassword.length > 16
  ) {
    return next(
      new ErrorHandler("Password must be between 8 and 16 Characters", 400)
    );
  }

  const hashedPassword = await bcrypt.hash(req.body.password, 10);
  user.password = hashedPassword;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpire = undefined;

  await user.save();
  sendToken(user, 200, "Password Reset Successfully", res);
});



//updatePassword
export const updatePassword = catchAsyncErrors(async (req, res, next) => {
  const user = await User.findById(req.user.id).select("+password");
  const { currentPassword, newPassword, confirmnewpassword } = req.body;

  if (!currentPassword || !newPassword || !confirmnewpassword) {
    return next(new ErrorHandler("Please enter all fields", 400));
  }

  const isPasswordMatched = await bcrypt.compare(
    currentPassword,
    user.password
  );
  if (!isPasswordMatched) {
    return next(new ErrorHandler("Current password is incorrect", 400));
  }

  if (
    newPassword.length < 6 ||
    newPassword.length > 16 ||
    confirmnewpassword.length < 6 ||
    confirmnewpassword.length > 16
  ) {
    return next(
      new ErrorHandler("Password must be between 8 and 16 characters", 400)
    );
  }

  if (newPassword !== confirmnewpassword) {
    return next(
      new ErrorHandler("New password and confirm password do not match", 400)
    );
  }

  user.password = await bcrypt.hash(newPassword, 10);
  await user.save();

  res.status(200).json({
    success: true,
    message: "Password updated successfully",
  });
});
