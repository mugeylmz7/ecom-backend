import { Request, Response } from 'express'
import { endpointSecret, stripe } from '../../../common/stripe'
import checkoutService from '../../../services/checkout/service';
import Stripe from 'stripe'

async function receiveUpdates(req: Request, res: Response) {
  console.log('Reached Stripe Webhoooks receive updates function')

  let event: Stripe.Event = req.body; // Koda Stripe standartlarına uygunluk kazandırdık.

  // 1. Signature Verification
  if (endpointSecret) {
    const signature = req.headers['stripe-signature'] as string;

    if (!signature) {
      console.log('⚠️ Stripe signature missing in request headers.')
      return res.status(400).send('Missing signature')
    }

    try {
      event = stripe.webhooks.constructEvent(
        req.body,
        signature,
        endpointSecret
      )
    } catch (err:any) {
      console.log(`⚠️  Webhook signature verification failed.`, err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }
  }

  // 2. Handle Events (Olayları İşleme)
  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session;
      console.log(`✅ Checkout Session ${session.id} was successful!`);

      // Servisi çağırıp başarılı ödeme mantığını yürütüyoruz
      await checkoutService.handleSuccessfullCheckout(session.id);
      break;
    }

    case 'checkout.session.expired': {
      const session = event.data.object as Stripe.Checkout.Session;
      console.log(`⏳ Checkout Session ${session.id} expired.`)
      // İleride buraya expired servisi eklenebilir
      break;
    }
    
    case 'checkout.session.async_payment_failed': {
      const session = event.data.object as Stripe.Checkout.Session;
      console.log(`❌ Async Payment failed for Checkout Session ${session.id}.`)
      // İleride buraya payment failed servisi eklenebilir
      break;
    }
    case 'checkout.session.async_payment_succeeded': {
      const session = event.data.object as Stripe.Checkout.Session;
      console.log(`✅ Async Payment succeeded for Checkout Session ${session.id}.`)
      // İleride buraya payment succeeded servisi eklenebilir
      break;
    }
    default:
      // Unexpected event type
      console.log(`ℹ️ Unhandled event type ${event.type}.`);
  }

  // Return a 200 response to acknowledge receipt of the event
  return res.status(200).json({ received: true })
}

// Frontend'deki "Pay Total" Butonuna Basılınca Ödeme Linki Üreten Fonksiyon
async function createCheckout(req: Request, res: Response) {
  try {
    const {cartItems} = req.body;

    if (!cartItems || cartItems.length === 0){
      return res.status(400).json({ error: 'Cart is empty'});
    }

    // Stripe üzerinde güvenli ödeme oturumu başlatıyoruz
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: cartItems.map((item:any) => ({
        price: item.stripePriceId, // Sepetteki ürünün Stripe Price ID'si
        quantity: item.quantity,
      })),
      mode: 'payment',
      success_url: 'http://localhost:3000/checkout/success', // Ödeme bitince gidilecek sayfa
      cancel_url: 'http://localhost:3000',
    });

    // Stripe Ödeme Linkini Front-end'e Döneceğiz
    return res.status(200).json({ url: session.url });
    } catch (error: any) {
      console.error('Checkout error:', error.message);
      return res.status(500).json({ error: error.message });
  }
}

export default {
  receiveUpdates,
  createCheckout,
}