import nodemailer from "nodemailer";
import { AppError } from "../middleware/errors";

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

/**
 * Send a transactional email via the configured Gmail SMTP transport.
 *
 * Fills in the default From header (ErrandHub <SMTP_USER>) and wraps the
 * callback-based nodemailer API in a promise. Rejects with an AppError on
 * failure so callers can surface the error through the usual next(err) path;
 * most callers (signup, password reset) invoke this fire-and-forget so SMTP
 * latency doesn't block the HTTP response.
 */
export const sendEmail = async (mailOptions: nodemailer.SendMailOptions) => {
  if (!mailOptions) {
    throw new AppError("Failed to send email", 400);
  }
  return new Promise((resolve, reject) => {
    transporter.sendMail(
      { from: `ErrandHub <${process.env.SMTP_USER}>`, ...mailOptions },
      (error, info) => {
        if (error) {
          reject(new AppError("Failed to send email", 400));
        } else {
          console.log("Email sent: ", info.response);
          resolve(info);
        }
      },
    );
  });
};
