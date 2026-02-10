import mongoose, { Schema } from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new Schema(
  {
    email: {
      type: String,
      trim: true,
      lowercase: true,
      unique: true,
      required: true,
    },

    password: {
      type: String,
      select: false,
      required: true,
    },

    name: {
      type: String,
      trim: true,
      maxlength: 50,
    },

   
    role: {
      type: String,
      enum: ["user", "admin", "provider"],
      default: "user",
    },

    isEmailVerified: {
      type: Boolean,
      default: false,
    },

    emailVerifyOtpHash: {
      type: String,
      select: false,
    },
    emailVerifyOtpExpiry: {
      type: Date,
    },

    passwordResetOtpHash: {
      type: String,
      select: false,
    },
    passwordResetOtpExpiry: {
      type: Date,
    },

    refreshTokenHash: {
      type: String,
      select: false,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform(doc, ret) {
        delete ret.password;
        delete ret.passwordResetOtpHash;
        delete ret.refreshTokenHash;
        delete ret.emailVerifyOtpHash;
        delete ret.emailVerifyOtpExpiry;
        delete ret.__v;
        return ret;
      },
    },
    toObject: {
      transform(doc, ret) {
        delete ret.password;
        delete ret.passwordResetOtpHash;
        delete ret.refreshTokenHash;
        delete ret.emailVerifyOtpHash;
        delete ret.emailVerifyOtpExpiry;
        delete ret.__v;
        return ret;
      },
    },
  }
);


userSchema.pre("save", async function () {
  if (!this.isModified("password")) return;
  this.password = await bcrypt.hash(this.password, 12);
});


userSchema.statics.isUserExistsByEmail = function (email) {
  return this.findOne({ email: email.trim().toLowerCase() }).select("+password +refreshTokenHash");
};

userSchema.statics.isPasswordMatched = function (plain, hash) {
  return bcrypt.compare(plain, hash);
};

export const User = mongoose.model("User", userSchema);
