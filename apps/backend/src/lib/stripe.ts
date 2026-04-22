import Stripe from "stripe";

// Singleton Stripe client shared across payment flows (setup intents, payment
// intents, customers). Using one instance avoids reinitialising the HTTP
// agent on every request.
const stripeClient: InstanceType<typeof Stripe> = new Stripe(
  process.env.STRIPE_SECRET_KEY!,
);
export { stripeClient as stripe };
