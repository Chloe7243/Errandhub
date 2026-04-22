import { NextFunction, Request, Response, RequestHandler } from "express";

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
import { sendEmail } from "../lib/nodemailer";
import { welcomeEmail, resetPasswordEmail } from "../emails";

/**
 * POST /auth/signup — create a new user account.
 *
 * Validates the signup payload with the shared Zod schema, rejects duplicate
 * emails, bcrypt-hashes the password, creates the user plus a default
 * UserSettings row, and returns a 7-day JWT. A welcome email is dispatched
 * fire-and-forget so SMTP latency does not block the response.
 *
 * Note: the JWT minted here is role-less — the client must call
 * selectRole() afterwards to obtain a role-scoped token.
 */
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

    // Fire-and-forget: we do not await sendEmail so a slow/failed SMTP call
    // never blocks the signup response. Email delivery is non-critical here.
    sendEmail({
      to: user.email,
      subject: "Welcome to ErrandHub 🎉",
      html: welcomeEmail(firstName),
    });

    await prisma.userSettings.create({
      data: { userId: userData.userId },
    });

    res.status(201).json({
      token,
      user: userData,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /auth/login — exchange email + password for a JWT.
 *
 * Uses a constant-time bcrypt comparison and returns the same "Invalid
 * credentials" error for both "no such user" and "wrong password" to avoid
 * leaking which emails exist. Token lifetime is 7 days.
 */
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

/**
 * POST /auth/:userId/role — assign or switch the user's active role.
 *
 * Called immediately after signup, and again whenever the user toggles
 * between helper and requester in-app. Mints a fresh JWT whose payload
 * carries the chosen role so role guards can read it directly from the
 * token without hitting the DB.
 */
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

/**
 * POST /auth/forget-password — kick off the password-reset flow.
 *
 * Generates a UUID reset token with a 10-minute expiry, persists it on the
 * user, and fires off the reset email without awaiting delivery. The
 * current implementation returns 404 for unknown emails; tightening this
 * to a generic 200 would harden against user-enumeration attacks.
 */
export const forgetPassword = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const parsed = forgetPasswordSchema.safeParse(req.body);
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
    // 10-minute expiry balances security with the time it takes to open an email client.
    const resetTokenExpiry = new Date(Date.now() + 1000 * 60 * 10);

    await prisma.user.update({
      where: { id: user.id },
      data: { resetToken, resetTokenExpiry },
    });

    // Same fire-and-forget pattern as signup — SMTP latency must not stall the API response.
    sendEmail({
      to: user.email,
      subject: "Reset your ErrandHub password",
      html: resetPasswordEmail(resetToken),
    });

    res.status(200).json({ message: "Password reset email sent" });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /auth/reset-password — consume a reset token and set a new password.
 *
 * Looks up the user by an unexpired token, writes a fresh bcrypt hash, and
 * nulls out the token fields so the same link cannot be reused.
 */
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

    // Null out the token fields so the same link cannot be reused.
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
