import mongoose, { Schema } from "mongoose";

const signupVerificationSchema = new Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    password: { type: String, required: true },
    isAdmin: { type: Boolean, default: false },
    otpHash: { type: String, required: true },
    expiresAt: { type: Date, required: true, index: { expires: 0 } },
  },
  { timestamps: true }
);

export default
  mongoose.models.SignupVerification ||
  mongoose.model("SignupVerification", signupVerificationSchema);
