import { NextFunction, Request, Response } from "express";

import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { prisma } from "../lib/prisma";
import { AppError } from "../middleware/errors";
import {
  signUpSchema,
  loginSchema,
  forgetPasswordSchema,
  roleSelectionSchema,
  resetPasswordSchema,
} from "@errandhub/shared";
import resend from "../lib/resend";

export const signUp = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const { firstName, lastName, email, phone, password } = req.body;

  try {
    const parsed = signUpSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new AppError(parsed.error.errors[0].message, 400);
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      throw new AppError("Email already in use", 400);
    }

    const verificationToken = crypto.randomUUID();
    const passwordHash = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        firstName,
        lastName,
        email,
        phone,
        passwordHash,
      },
    });

    const userData = {
      userId: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      avatarUrl: user.avatarUrl,
    };

    const token = jwt.sign(userData, process.env.JWT_SECRET as string, {
      expiresIn: "7d",
    });

    const { data, error } = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL as string,
      to: process.env.RESEND_TEMP_TO_EMAIL as string,
      subject: "Welcome to ErrandHub 🎉",
      html: `
        <h2>Welcome to ErrandHub, ${firstName}!</h2>
        <p>We're excited to have you on board.</p>
        <p>If you didn't create an account, ignore this email.</p>
      `,
    });

    console.log({ data, error });

    res.status(201).json({
      token,
      user: userData,
    });
  } catch (error) {
    next(error);
  }
};

export const login = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const { email, password } = req.body;

  try {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new AppError(parsed.error.errors[0].message, 400);
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      throw new AppError("Invalid credentials", 401);
    }

    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      throw new AppError("Invalid credentials", 401);
    }

    const userData = {
      userId: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      avatarUrl: user.avatarUrl,
    };

    const token = jwt.sign(userData, process.env.JWT_SECRET as string, {
      expiresIn: "7d",
    });

    res.status(200).json({
      token,
      user: userData,
    });
  } catch (error) {
    next(error);
  }
};

export const selectRole = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { role } = req.body;
    const { userId } = req.params as { userId: string };

    const parsed = roleSelectionSchema.safeParse({ userId, role });
    if (!parsed.success) throw new AppError("Invalid role", 400);

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new AppError("Invalid user", 401);
    }

    const userData = {
      userId: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      avatarUrl: user.avatarUrl,
    };

    const token = jwt.sign(
      { ...userData, role },
      process.env.JWT_SECRET as string,
      {
        expiresIn: "7d",
      },
    );

    res.status(200).json({
      token,
      user: { ...userData, role },
      message: "Role selected successfully",
    });
  } catch (error) {
    next(error);
  }
};

export const forgetPassword = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const parsed = forgetPasswordSchema.safeParse(req.body);
    console.log({ parsed });

    if (!parsed.success) {
      throw new AppError(parsed.error.errors[0].message, 400);
    }
    const { email } = req.body;

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });
    if (!user) {
      throw new AppError("User not found", 404);
    }

    const resetToken = crypto.randomUUID();
    const resetTokenExpiry = new Date(Date.now() + 1000 * 60 * 10);

    await prisma.user.update({
      where: { id: user.id },
      data: { resetToken, resetTokenExpiry },
    });

    await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL as string,
      to: process.env.RESEND_TEMP_TO_EMAIL as string,
      subject: "Reset your ErrandHub password",
      html: `
        <h2>Reset your password</h2>
        <p>Click the link below to reset your password. This link expires in 10 minutes.</p>
        <a href="errandhub://reset-password?token=${resetToken}">
          Reset Password
        </a>
        <p>If you didn't request this, ignore this email.</p>
      `,
    });

    res.status(200).json({ message: "Password reset email sent" });
  } catch (error) {
    next(error);
  }
};

export const resetPassword = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const parsed = resetPasswordSchema.safeParse(req.body);
    if (!parsed.success)
      throw new AppError(parsed.error.errors[0].message, 400);

    const { token, password } = parsed.data;

    const user = await prisma.user.findFirst({
      where: {
        resetToken: token,
        resetTokenExpiry: { gt: new Date() },
      },
    });

    if (!user) throw new AppError("Invalid or expired reset token", 400);

    const passwordHash = await bcrypt.hash(password, 10);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        resetToken: null,
        resetTokenExpiry: null,
      },
    });

    res.status(200).json({ message: "Password reset successfully" });
  } catch (error) {
    next(error);
  }
};
