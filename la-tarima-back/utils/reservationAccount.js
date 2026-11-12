const Reservation = require('../models/reservation')
const Order = require('../models/order')
const Payment = require('../models/payment')
const Discount = require('../models/discount')

const MAX_DISCOUNT_PERCENT = 30

const toMoney = (value) => Math.max(0, Math.round(Number(value) || 0))

const calcDiscountAmount = (discount, subtotal) => {
  if (subtotal <= 0) return 0

  if (discount.type === 'percentage') {
    const percent = Math.min(Number(discount.value) || 0, MAX_DISCOUNT_PERCENT)
    return toMoney(subtotal * (percent / 100))
  }

  if (discount.type === 'fixed') {
    return Math.min(toMoney(discount.value), subtotal)
  }

  return 0
}

const isDiscountValidNow = (discount, now = new Date()) => {
  if (!discount || !discount.active) return false

  const from = new Date(discount.validFrom)
  const until = new Date(discount.validUntil)

  if (now < from || now > until) return false

  if (discount.maxUses != null && discount.usedCount >= discount.maxUses) {
    return false
  }

  return true
}

const getReservationAccount = async (reservation_id) => {
  const reservation = await Reservation.findOne({ reservation_id })

  if (!reservation) {
    const err = new Error('Reserva no encontrada')
    err.status = 404
    throw err
  }

  const orders = await Order.find({
    reservation_id,
    status: { $ne: 'cancelado' }
  }).sort({ createdAt: 1 })

  const payments = await Payment.find({
    reservation_id
  }).sort({ createdAt: 1 })

  const approvedPayments = payments.filter(p => p.status === 'aprobado')

  const subtotalAmount = toMoney(
    orders.reduce((sum, order) => sum + (Number(order.totalAmount) || 0), 0)
  )

  const now = new Date()
  const discountCandidates = []

  // Descuentos automáticos por cliente registrado
  if (reservation.clientRef?.docID) {
    const automaticDiscounts = await Discount.find({
      kind: 'automatic',
      clientDocID: reservation.clientRef.docID,
      active: true
    })

    automaticDiscounts.forEach(d => {
      if (isDiscountValidNow(d, now)) {
        discountCandidates.push({
          discount_id: d.discount_id,
          name: d.name,
          code: d.code,
          kind: d.kind,
          type: d.type,
          value: d.value,
          stackable: d.stackable,
          source: 'automatic'
        })
      }
    })
  }

  // Cupones aplicados manualmente a la reserva
  const appliedCoupons = reservation.appliedCoupons || []

  for (const couponSnapshot of appliedCoupons) {
    const currentCoupon = await Discount.findOne({
      discount_id: couponSnapshot.discount_id
    })

    if (!currentCoupon) continue
    if (!isDiscountValidNow(currentCoupon, now)) continue

    discountCandidates.push({
      discount_id: currentCoupon.discount_id,
      name: currentCoupon.name,
      code: currentCoupon.code,
      kind: currentCoupon.kind,
      type: currentCoupon.type,
      value: currentCoupon.value,
      stackable: currentCoupon.stackable,
      source: 'coupon'
    })
  }

  const calculatedDiscounts = discountCandidates.map(d => ({
    ...d,
    amountApplied: calcDiscountAmount(d, subtotalAmount)
  }))

  let selectedDiscounts = []
  let discountAmount = 0

  const stackableDiscounts = calculatedDiscounts.filter(d => d.stackable)
  const nonStackableDiscounts = calculatedDiscounts.filter(d => !d.stackable)

  if (stackableDiscounts.length > 0) {
    selectedDiscounts = stackableDiscounts
    discountAmount = stackableDiscounts.reduce((sum, d) => sum + d.amountApplied, 0)

    const maxAllowed = toMoney(subtotalAmount * (MAX_DISCOUNT_PERCENT / 100))
    if (discountAmount > maxAllowed) {
      discountAmount = maxAllowed
    }
  } else if (nonStackableDiscounts.length > 0) {
    const best = nonStackableDiscounts.sort((a, b) => b.amountApplied - a.amountApplied)[0]
    selectedDiscounts = [best]
    discountAmount = best.amountApplied
  }

  discountAmount = Math.min(discountAmount, toMoney(subtotalAmount * (MAX_DISCOUNT_PERCENT / 100)))

  const totalAmount = toMoney(subtotalAmount - discountAmount)

  const paidAmount = toMoney(
    approvedPayments.reduce((sum, payment) => sum + (Number(payment.amount) || 0), 0)
  )

  const pendingAmount = Math.max(0, totalAmount - paidAmount)

  return {
    reservation,
    orders,
    payments,
    subtotalAmount,
    discounts: selectedDiscounts,
    discountAmount,
    totalAmount,
    paidAmount,
    pendingAmount
  }
}

module.exports = {
  MAX_DISCOUNT_PERCENT,
  getReservationAccount,
  calcDiscountAmount,
  isDiscountValidNow,
  toMoney
}