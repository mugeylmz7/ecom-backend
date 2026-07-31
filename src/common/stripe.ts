import stripeLibrary from 'stripe';
import './env';

export const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;
export const stripeApiKey = process.env.STRIPE_API_KEY;


if (!endpointSecret || !stripeApiKey) {
  throw new Error('Stripe keys are missing, check the setup and try again.');
}

export const stripe = stripeLibrary(stripeApiKey);
