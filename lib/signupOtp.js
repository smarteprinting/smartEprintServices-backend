import bcrypt from "bcryptjs";
import nodemailer from "nodemailer";
import { connectDB } from "@/lib/db";
import SignupVerification from "@/lib/models/SignupVerification";

const OTP_EXPIRY_MINUTES = 10;

function createOtp() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

function getTransporter() {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT || 587);
  const user = process.env.SMTP_USER || process.env.SMTP_FROM;
  const password = process.env.SMTP_PASSWORD;

  if (!host || !user || !password) {
    throw new Error("Email service is not configured. Add the SMTP environment variables.");
  }

  return {
    transporter: nodemailer.createTransport({
      host,
      port,
      secure: process.env.SMTP_SECURE === "true",
      auth: { user, pass: password },
      tls: { rejectUnauthorized: false },
      connectionTimeout: 10000,
      greetingTimeout: 10000,
      socketTimeout: 15000,
    }),
    from: process.env.SMTP_FROM || user,
  };
}

export async function createSignupVerification({ name, email, password, isAdmin }) {
  const otp = createOtp();
  const otpHash = await bcrypt.hash(otp, 10);
  const passwordHash = await bcrypt.hash(password, 10);
  const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);
  const { transporter, from } = getTransporter();

  await connectDB();
  await SignupVerification.deleteMany({ email });
  await SignupVerification.create({
    name,
    email,
    password: passwordHash,
    isAdmin,
    otpHash,
    expiresAt,
  });

  await transporter.sendMail({
    from: `"Smart ePrint Services" <${from}>`,
    replyTo: from,
    to: email,
    subject: "Your Smart ePrint Services verification code",
    text: `Your Smart ePrint Services verification code is ${otp}. It expires in ${OTP_EXPIRY_MINUTES} minutes.`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:560px;margin:auto;padding:24px;color:#172033">
        <h2 style="margin:0 0 12px;color:#0b5c91">Verify your Smart ePrint Services account</h2>
        <p>Use this one-time code to finish creating your account:</p>
        <p style="font-size:32px;font-weight:700;letter-spacing:8px;margin:24px 0;color:#024ad8">${otp}</p>
        <p style="color:#64748b">This code expires in ${OTP_EXPIRY_MINUTES} minutes. If you did not request an account, you can ignore this email.</p>
      </div>
    `,
  });
}

export async function verifySignupCode(email, otp) {
  await connectDB();
  const pending = await SignupVerification.findOne({ email }).sort({ createdAt: -1 });

  if (!pending || pending.expiresAt.getTime() < Date.now()) {
    return { error: "This verification code has expired. Please request a new one." };
  }

  if (!(await bcrypt.compare(otp, pending.otpHash))) {
    return { error: "The verification code is incorrect." };
  }

  return { pending };
}
