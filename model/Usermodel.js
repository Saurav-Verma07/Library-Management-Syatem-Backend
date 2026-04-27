import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import crypto from "crypto";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: true,
      select: false,
    },
    otp:{
      type:String,
      
    },

  role: {
  type: String,
  enum: ["Admin", "User"],
  default: "User",
},

    accountVerified: {
      type: Boolean,
      default: false,
    },
    borrowedBooks: [
      {
        bookId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Borrow",
        },
        returned: {
          type: Boolean,
          default: false,
        },
        bookTitle: String,
        borrowDate: Date,
        dueDate: Date,
      },
    ],
    avatar: {
      public_Id: String,
      url: String,
    },
    verificationCode: String,
    verificationCodeExpire: Date,
    resetPasswordToken: String,
    resetPasswordExpire: Date,
  },
  {
    timestamps: true,
  }
);

userSchema.methods.generateVerificationCode = function () {
  function generateRandomFiveDigits() {
    const firstDigit = Math.floor(Math.random() * 9) + 1;
    const randomDigits = Math.floor(Math.random() * 1000)
      .toString()
      .padStart(4, 0);
    return parseInt(firstDigit + randomDigits);
  }

  const verificationCode = generateRandomFiveDigits();
  this.verificationCode = verificationCode;
  this.verificationCodeExpire = Date.now() + 15 * 60 * 1000;
  return verificationCode;
};

userSchema.methods.generateToken = function () {
  return jwt.sign({ id: this._id }, process.env.JWT_SECRET_KEY, {
    expiresIn: process.env.JWT_EXPIRE,
  });
};

userSchema.methods.getResetPasswordToken = function () {
  const resetToken = crypto.randomBytes(20).toString("hex");
  this.resetPasswordToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");
  this.resetPasswordExpire = Date.now() + 15 * 60 * 1000;
  return resetToken;
};

export const User=mongoose.model("User",userSchema)

// export const User =
//   mongoose.models.User || mongoose.model("User", userSchema);
