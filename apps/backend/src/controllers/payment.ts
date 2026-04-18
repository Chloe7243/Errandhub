import { Response, NextFunction } from "express";
import { AuthRequest } from "../types/auth";
import { stripe } from "../lib/stripe";
import { prisma } from "../lib/prisma";
import { AppError } from "../middleware/errors";
import { Errand } from "../../generated/prisma";

const getOrCreateCustomer = async (userId: string): Promise<string> => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      email: true,
      firstName: true,
      lastName: true,
      stripeAccountId: true,
    },
  });
  if (!user) throw new AppError("User not found", 404);

  if (user.stripeAccountId) return user.stripeAccountId;

  const customer = await stripe.customers.create({
    email: user.email,
    name: `${user.firstName} ${user.lastName}`,
    metadata: { userId },
  });

  await prisma.user.update({
    where: { id: userId },
    data: { stripeAccountId: customer.id },
  });

  return customer.id;
};

export const authorizeErrandPayment = async (
  errand: Pick<
    Errand,
    | "id"
    | "requesterId"
    | "type"
    | "agreedPrice"
    | "suggestedPrice"
    | "estimatedDuration"
    | "paymentMethodId"
    | "stripePaymentIntentId"
  >,
): Promise<void> => {
  if (!errand.paymentMethodId) return; // no card saved yet — skip silently
  if (errand.stripePaymentIntentId) return; // already authorized

  const customerId = await getOrCreateCustomer(errand.requesterId);
  const agreedRate = errand.agreedPrice ?? errand.suggestedPrice!;

  let amountPence: number;
  if (errand.type === "HANDS_ON_HELP") {
    const bufferHours = (errand.estimatedDuration ?? 2) * 1.5;
    amountPence = Math.round(bufferHours * agreedRate * 100);
  } else {
    amountPence = Math.round(agreedRate * 100);
  }

  amountPence = Math.max(amountPence, 50);

  const paymentIntent = await stripe.paymentIntents.create({
    amount: amountPence,
    currency: "gbp",
    customer: customerId,
    payment_method: errand.paymentMethodId,
    capture_method: "manual",
    confirm: true,
    return_url: "errandhub://payment-complete",
  });

  await prisma.errand.update({
    where: { id: errand.id },
    data: { stripePaymentIntentId: paymentIntent.id },
  });
};

export const createPaymentIntent = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  const customerId = await getOrCreateCustomer(req.userId!);

  try {
    const paymentIntent = await stripe.setupIntents.create({
      customer: customerId,
      payment_method_types: ["card"],
    });

    res.status(200).json({ clientSecret: paymentIntent.client_secret });
  } catch (error) {
    next(error);
  }
};

export const getPaymentMethods = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const customerId = await getOrCreateCustomer(req.userId!);
    const methods = await stripe.paymentMethods.list({
      customer: customerId,
      type: "card",
    });
    res.status(200).json({ paymentMethods: methods.data });
  } catch (error) {
    next(error);
  }
};

export const deletePaymentMethod = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    await stripe.paymentMethods.detach(req.params.methodId);
    res.status(200).json({ message: "Card removed" });
  } catch (error) {
    next(error);
  }
};
