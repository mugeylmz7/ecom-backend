import stripeLibrary from 'stripe';
import './env'

export const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;
export const stripeApiKey = process.env.STRIPE_API_KEY || '';

if (!endpointSecret || !stripeApiKey) {
  console.warn('Stripe keys are missing, check the setup and try again.')
}

export const stripe = new stripeLibrary(stripeApiKey, {
  apiVersion: '2023-10-16' as any,
})
