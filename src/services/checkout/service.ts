import { stripe } from '../../common/stripe';

// 1. Stok Güncelleme (Satın Alım Sonrası)
async function updateStockAfterPurchase(sessionId: string){
  // Stripe'tan satılan ürünlerin listesini ve miktarlarını (line_items) çekiyoruz
  const checkoutSession = await stripe.checkout.sessions.retrieve(sessionId, {
    expand: ['line_items'],
  })

  const lineItems = checkoutSession?.line_items?.data || []
  console.log(`Updating stock for session: ${sessionId}`);

  lineItems.forEach((item) => {
    console.log(`Product: ${item.description || item.price?.product} | Quantity Sold: ${item.quantity}`
    )
    // TODO: İleride MongoDB bağlantısı gelince:
    // await ProductModel.findByIdAndUpdate(productId, { $inc: { stock: -item.quantity } })
  })
}


// 2.Stok İade (Para İadesi Sonrası)
async function restockAfterRefund(chargeId: string){
  console.log(`Restocking items for refunded charge: ${chargeId}`);
  // TODO: İleride MongoDB bağlantısı gelince ilgili siparişi bulup stoğu geri artıracağız
}


// 3. Başarılı Ödeme
async function handleSuccessfullCheckout(checkoutSessionId: string) {
  console.log(`[SERVICE] 🛍️ Processing successful checkout: ${checkoutSessionId}`)

  // Stok düşme servisi buraya bağlandı
  await updateStockAfterPurchase(checkoutSessionId);

  // TODO: Send email and update DB stock once database/email service is ready
}


// 4. İade İşlemi (Charge Refunded)
async function handleRefund(chargeId: string) {
  console.log(`Charge ${chargeId} was refunded.`)

 await restockAfterRefund(chargeId);
  // TODO: İleride MongoDB'de ilgili siparişin durumunu "REFUNDED" olarak güncelle
}


// 5. Ürün Güncelleme (Admin Stripe'ta ürün değiştirdiğinde çalışacak taslak fonksiyon)
async function handleProductUpdated(productId: string){
  console.log(`Stripe product ${productId} updated.`)
  // TODO: İleride Stripe'taki ürün bilgisini yerel veritabanın ile senkronize et
}


// 6. Ürün Silindiğinde Çalışacak Taslak Fonksiyon
async function handleProductDeleted(productId: string){
  console.log(`Stripe product ${productId} was deleted.`);
  // TODO: İleride MongoDB'den bu ürünü sil veya status'unu "DELETED" yap
}


// 7. Fiyat Güncelleme/Ekleme
async function handlePriceCreatedOrUpdated(priceId: string){
  console.log(`Stripe price ${priceId} created or updated.`)
  // TODO: Veritabanındaki ürün fiyatını Stripe ile senkronize et
}


// 8. Müşteri Bilgisi Güncelleme
async function handleCustomerUpdated(customerId: string){
  console.log(`Customer ${customerId} profile updated.`)
  // TODO: Veritabanındaki müşteri bilgilerini güncelle
}


// 9. Ödeme İtirazı (Dispute/Chargeback) Servisi
async function handleDisputeCreated(disputeId: string){
  console.log(`Urgent: Chargeback/Dispute created: ${disputeId}`)
  // TODO: Admin paneline kritik uyarı düşür ve siparişi dondur
}


export default {
  handleSuccessfullCheckout,
  handleRefund,
  handleProductUpdated,
  handleProductDeleted,
  handlePriceCreatedOrUpdated,
  handleCustomerUpdated,
  handleDisputeCreated,
  updateStockAfterPurchase,
  restockAfterRefund,
}