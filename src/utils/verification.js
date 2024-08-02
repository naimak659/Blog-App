import nodemailer from "nodemailer";
import crypto from "crypto";
import dotenv from "dotenv";
import { ApiError } from "./ApiError.js";

dotenv.config();

function generateVerificationCode(length) {
  return (crypto.randomInt(0, 1000000) + "").padStart(6, "0");
}

async function sendVerificationEmail(user) {
  const transporter = nodemailer.createTransport({
    service: "gmail", // or another email service
    auth: {
      user: `${process.env.MAILER_USER}`, // your email
      pass: `${process.env.MAILER_PASS}`, // your app specific password
    },
  });
  try {
    // Generate a verification token
    const verificationCode = generateVerificationCode(6);
    user.otp = verificationCode;
    user.verificationTokenExpires = Date.now() + 600000; // 10 min

    // Save the user with the verification token
    const verifyCodeSet = await user.save();

    if (!verifyCodeSet) {
      throw new ApiError(
        400,
        "Code is not generated. Sorry for the inconvenience."
      );
    }

    // Set up email options
    const mailOptions = {
      from: process.env.MAILER_USER,
      to: user.email,
      subject: "Email Verification",
      text: `Please verify your email by code: ${verificationCode}`,
    };

    // Send the email
    const info = await transporter.sendMail(mailOptions);

    // console.log("email send", info);

    // console.log("Verification email sent successfully.");
    return info;
  } catch (error) {
    console.error("Error sending verification email:", error);
  }
}

export { sendVerificationEmail };
