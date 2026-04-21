import nodemailer from "nodemailer";
import { AppError } from "../middleware/errors";

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true, // STARTTLS — required for port 587
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

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
