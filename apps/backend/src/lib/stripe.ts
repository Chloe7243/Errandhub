import Stripe from "stripe";

const stripeClient: InstanceType<typeof Stripe> = new Stripe(
  process.env.STRIPE_SECRET_KEY!,
);
export { stripeClient as stripe };
