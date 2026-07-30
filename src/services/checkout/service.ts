import { stripe } from '../../common/stripe';

async function handleSuccessfullCheckout(checkoutSessionId: string) {
  const checkoutSessionWithLineItems = await stripe.checkout.sessions.retrieve(checkoutSessionId, {
    expand: ['line_items'],
  })
  console.log('Checkout Session with line items:')
  console.log(checkoutSessionWithLineItems?.line_items?.data)

  // Once you get product id, use it to call Mongo and retrieve product information on our side so we can add product images to the email
  // Update stock on the product once a checkout session is successful
}

export default {
  handleSuccessfullCheckout,
}