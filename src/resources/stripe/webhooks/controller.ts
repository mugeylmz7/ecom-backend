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
    // 🟢 Başarılı Ödeme
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session;
      console.log(`✅ Checkout Session ${session.id} was successful!`);

      // Servisi çağırıp başarılı ödeme mantığını yürütüyoruz
      await checkoutService.handleSuccessfullCheckout(session.id);
      break;
    }

    // ⏳ Süresi Dolan Ödeme Oturumu
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

    // 🔴 Para İadesi İşlemi
    case 'charge.refunded': {
      const charge = event.data.object as Stripe.Charge;
      console.log(`💸 Charge ${charge.id} was refunded.`)

      // service.ts dosyasındaki handleRefund fonksiyonumuzu çağırıyoruz
      await checkoutService.handleRefund(charge.id);
      break;
    }

    // 📦 Ürün Güncelleme / Ekleme İşlemi
    case 'product.created':
    case 'product.updated':
    case 'product.deleted': {
      const product = event.data.object as Stripe.Product;
      console.log(`📦 Product event received for ID: ${product.id}`);
      await checkoutService.handleProductUpdated(product.id);
      break;
    }

    // 🗑️ Ürün Silme Olayı
    case 'product.deleted': {
      const deletedProduct = event.data.object as unknown as Stripe.DeletedProduct;
      console.log(`🗑️ Product deleted event received for ID: ${deletedProduct.id}`);
      await checkoutService.handleProductDeleted(deletedProduct.id);
      break;
    }

    // 🏷️ Fiyat Değişikliği / Yeni Fiyat Ekleme
    case 'price.created':
    case 'price.updated':{
      const price = event.data.object as Stripe.Price;
      console.log(`Price update event received for ID: ${price.id}`);
      await checkoutService.handlePriceCreatedOrUpdated(price.id);
      break;
    }

    // 👤 Müşteri Bilgisi Güncelleme
    case 'customer.updated':{
      const customer = event.data.object as Stripe.Customer;
      console.log(`👤 Customer update event received for ID: ${customer.id}`);
      await checkoutService.handleCustomerUpdated(customer.id);
      break;
    }

    // ⚠️ Ödeme İtirazı / Chargeback (Admin için kritik)
    case 'charge.dispute.created': {
      const dispute = event.data.object as Stripe.Dispute;
      console.log(`⚠️ Dispute created event received for ID: ${dispute.id}`);
      await checkoutService.handleDisputeCreated(dispute.id);
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