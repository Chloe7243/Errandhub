import { Response, NextFunction } from "express";
import { AuthRequest } from "../types/auth";
import { stripe } from "../lib/stripe";
import { prisma } from "../lib/prisma";
import { AppError } from "../middleware/errors";
import { Errand } from "../../generated/prisma";

/**
 * Lazily provision a Stripe customer for the given user.
 *
 * On first call for a user this hits the Stripe API; the resulting
 * customer id is cached on the user row so repeat flows reuse the same
 * Stripe object (required to attach saved cards / payment methods).
 * Returns the Stripe customer id.
 */
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

/**
 * Place a manual-capture authorisation hold on the requester's card.
 *
 * Called from the matching service once a helper is confirmed. Capture
 * happens later when the errand moves to COMPLETED; if the errand is
 * cancelled or disputed the uncaptured intent expires naturally. For
 * HANDS_ON_HELP the hold is 1.5x the estimated duration so the helper can
 * extend without a second authorisation round-trip. Idempotent — returns
 * early if an intent already exists on the errand.
 */
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
  if (!errand.paymentMethodId) return;
  // Idempotency: don't create a second intent if one was already authorised
  // for this errand (e.g. on a retried accept).
  if (errand.stripePaymentIntentId) return;

  const customerId = await getOrCreateCustomer(errand.requesterId);
  const agreedRate = errand.agreedPrice ?? errand.suggestedPrice!;

  let amountPence: number;
  if (errand.type === "HANDS_ON_HELP") {
    // Hands-on-help is billed hourly — hold 1.5x the estimate so the helper
    // has headroom to extend without a second authorisation round-trip.
    const bufferHours = errand.estimatedDuration * 1.5;
    amountPence = Math.round(bufferHours * agreedRate * 100);
  } else {
    // Fixed-price errands: hold exactly the agreed amount.
    amountPence = Math.round(agreedRate * 100);
  }
  amountPence = Math.max(amountPence, 30);

  const paymentIntent = await stripe.paymentIntents.create({
    amount: amountPence,
    currency: "gbp",
    customer: customerId,
    payment_method: errand.paymentMethodId,
    capture_method: "manual",
    confirm: true,
    return_url: "",
  });

  await prisma.errand.update({
    where: { id: errand.id },
    data: { stripePaymentIntentId: paymentIntent.id },
  });
};

/**
 * POST /payments/setup — return a client secret for adding a new card.
 *
 * Despite the legacy name, this issues a SetupIntent (not a PaymentIntent);
 * the client uses the returned secret with Stripe Elements to collect and
 * save a card without charging it. The card is then reusable for future
 * errand authorisations.
 */
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

/**
 * GET /payments/methods — list the user's saved Stripe card payment methods.
 */
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

/**
 * DELETE /payments/methods/:methodId — detach a saved card from the customer.
 *
 * Uses Stripe's detach semantics — the method stays in Stripe for historical
 * payments but is no longer usable for new charges.
 */
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
