const Payment = require('../models/payment')
const Order = require('../models/order')
const Reservation = require('../models/reservation')
const Discount = require('../models/discount')
const Table = require('../models/table')
const generateId = require('../utils/generateId')
const { getReservationAccount } = require('../utils/reservationAccount')

const consumeSelectedCouponsIfFirstApprovedPayment = async (reservation_id, selectedDiscounts) => {
  const reservation = await Reservation.findOne({ reservation_id })

  if (!reservation) return

  const couponsToConsume = selectedDiscounts.filter(
    d => d.source === 'coupon'
  )

  if (couponsToConsume.length === 0) return

  for (const coupon of couponsToConsume) {
    const localCoupon = reservation.appliedCoupons.find(
      c => c.discount_id === coupon.discount_id && !c.consumed
    )

    if (!localCoupon) continue

    const discount = await Discount.findOne({
      discount_id: coupon.discount_id
    })

    if (!discount) continue

    const alreadyRegistered = discount.appliedReservations.some(
      r => r.reservation_id === reservation_id
    )

    if (!alreadyRegistered) {
      discount.appliedReservations.push({
        reservation_id,
        consumed: true,
        consumedAt: new Date()
      })

      discount.usedCount += 1
      await discount.save()
    }

    localCoupon.consumed = true
  }

  await reservation.save()
}

const closeReservationIfFullyPaidAndServed = async (reservation_id) => {
  const account = await getReservationAccount(reservation_id)

  const activeOrders = account.orders.filter(o => o.status !== 'cancelado')
  const allOrdersServed =
    activeOrders.length > 0 &&
    activeOrders.every(o => o.status === 'servido')

  if (account.pendingAmount <= 0 && allOrdersServed) {
    const reservation = await Reservation.findOneAndUpdate(
      {
        reservation_id,
        status: { $nin: ['completada', 'cancelada'] }
      },
      { status: 'completada' },
      { new: true }
    )

    if (reservation) {
      await Table.findOneAndUpdate(
        { table_id: reservation.table_id },
        { currentStatus: 'limpieza' }
      )
    }

    return {
      closed: true,
      message: 'Reserva completamente pagada y órdenes servidas — reserva cerrada'
    }
  }

  if (account.pendingAmount <= 0 && !allOrdersServed) {
    return {
      closed: false,
      message: 'Cuenta saldada, pero aún existen órdenes no servidas'
    }
  }

  return {
    closed: false,
    message: 'La reserva aún tiene saldo pendiente'
  }
}

const validatePaymentTarget = async ({ reservation_id, order_id, scope }) => {
  const reservation = await Reservation.findOne({ reservation_id })

  if (!reservation) {
    const err = new Error('La reserva indicada no existe')
    err.status = 404
    throw err
  }

  if (['cancelada', 'completada'].includes(reservation.status)) {
    const err = new Error('No se pueden registrar pagos sobre una reserva cancelada o completada')
    err.status = 409
    throw err
  }

  if (scope === 'order') {
    const order = await Order.findOne({ order_id })

    if (!order) {
      const err = new Error('La orden indicada no existe')
      err.status = 404
      throw err
    }

    if (order.reservation_id !== reservation_id) {
      const err = new Error('La orden no pertenece a la reserva indicada')
      err.status = 409
      throw err
    }

    if (order.status === 'cancelado') {
      const err = new Error('No se puede registrar pago sobre una orden cancelada')
      err.status = 409
      throw err
    }
  }

  return reservation
}

exports.create = async (req, res) => {
  try {
    const {
      reservation_id,
      order_id,
      amount,
      method
    } = req.body

    const scope = req.body.scope || (order_id ? 'order' : 'reservation')
    const status = req.body.status || 'pendiente'

    if (!reservation_id || amount == null || !method) {
      return res.status(400).json({
        message: 'reservation_id, amount y method son obligatorios'
      })
    }

    await validatePaymentTarget({ reservation_id, order_id, scope })

    const accountBefore = await getReservationAccount(reservation_id)

    if (amount > accountBefore.pendingAmount) {
      return res.status(409).json({
        message: 'El monto excede el saldo pendiente de la reserva',
        totalAmount: accountBefore.totalAmount,
        paidAmount: accountBefore.paidAmount,
        pendingAmount: accountBefore.pendingAmount,
        attempted: amount
      })
    }

    if (req.body.split?.part != null) {
      const { part, totalParts } = req.body.split

      const partExists = await Payment.findOne({
        reservation_id,
        'split.part': part,
        'split.totalParts': totalParts,
        status: { $ne: 'rechazado' }
      })

      if (partExists) {
        return res.status(409).json({
          message: `La parte ${part}/${totalParts} de esta reserva ya fue registrada`
        })
      }
    }

    const payment_id = await generateId('payment', 'PAY_')

    const payment = new Payment({
      ...req.body,
      payment_id,
      scope,
      status
    })

    await payment.save()

    let closeInfo = null

    if (status === 'aprobado') {
      await consumeSelectedCouponsIfFirstApprovedPayment(
        reservation_id,
        accountBefore.discounts
      )

      closeInfo = await closeReservationIfFullyPaidAndServed(reservation_id)
    }

    const accountAfter = await getReservationAccount(reservation_id)

    res.status(201).json({
      payment,
      account: accountAfter,
      closeInfo
    })
  } catch (error) {
    res.status(error.status || 500).json({
      message: error.message || 'Error al registrar el pago'
    })
  }
}

exports.getAll = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1
    const limit = Math.min(parseInt(req.query.limit) || 10, 100)
    const skip = (page - 1) * limit

    const filter = {}

    if (req.query.reservation_id) filter.reservation_id = req.query.reservation_id
    if (req.query.order_id) filter.order_id = req.query.order_id
    if (req.query.status) filter.status = req.query.status
    if (req.query.scope) filter.scope = req.query.scope
    if (req.query.method) filter.method = req.query.method

    const [payments, total] = await Promise.all([
      Payment.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
      Payment.countDocuments(filter)
    ])

    res.json({
      total,
      page,
      pages: Math.ceil(total / limit),
      data: payments
    })
  } catch (error) {
    res.status(500).json({
      message: 'Error al obtener pagos',
      error: error.message
    })
  }
}

exports.getById = async (req, res) => {
  try {
    const payment = await Payment.findOne({
      payment_id: req.params.payment_id
    })

    if (!payment) {
      return res.status(404).json({
        message: 'Pago no encontrado'
      })
    }

    res.json(payment)
  } catch (error) {
    res.status(500).json({
      message: 'Error al buscar pago',
      error: error.message
    })
  }
}

exports.updateStatus = async (req, res) => {
  try {
    const { status } = req.body
    const { payment_id } = req.params

    const payment = await Payment.findOne({ payment_id })

    if (!payment) {
      return res.status(404).json({
        message: 'Pago no encontrado'
      })
    }

    if (payment.status === 'aprobado' && status !== 'aprobado') {
      return res.status(409).json({
        message: 'No se puede revertir un pago aprobado'
      })
    }

    if (payment.status === status) {
      return res.json({
        payment,
        message: 'El pago ya tenía ese estado'
      })
    }

    if (status === 'aprobado') {
      await validatePaymentTarget({
        reservation_id: payment.reservation_id,
        order_id: payment.order_id,
        scope: payment.scope
      })

      const accountBefore = await getReservationAccount(payment.reservation_id)

      if (payment.amount > accountBefore.pendingAmount) {
        return res.status(409).json({
          message: 'No se puede aprobar el pago: excede el saldo pendiente de la reserva',
          totalAmount: accountBefore.totalAmount,
          paidAmount: accountBefore.paidAmount,
          pendingAmount: accountBefore.pendingAmount,
          attempted: payment.amount
        })
      }

      payment.status = 'aprobado'
      await payment.save()

      await consumeSelectedCouponsIfFirstApprovedPayment(
        payment.reservation_id,
        accountBefore.discounts
      )

      const closeInfo = await closeReservationIfFullyPaidAndServed(payment.reservation_id)
      const accountAfter = await getReservationAccount(payment.reservation_id)

      return res.json({
        payment,
        account: accountAfter,
        closeInfo
      })
    }

    payment.status = status
    await payment.save()

    res.json(payment)
  } catch (error) {
    res.status(error.status || 500).json({
      message: error.message || 'Error al actualizar estado del pago'
    })
  }
}

exports.remove = async (req, res) => {
  try {
    const payment = await Payment.findOne({
      payment_id: req.params.payment_id
    })

    if (!payment) {
      return res.status(404).json({
        message: 'Pago no encontrado'
      })
    }

    if (payment.status === 'aprobado') {
      return res.status(409).json({
        message: 'No se puede eliminar un pago ya aprobado'
      })
    }

    await payment.deleteOne()

    const account = await getReservationAccount(payment.reservation_id)

    res.json({
      message: 'Pago eliminado correctamente',
      account
    })
  } catch (error) {
    res.status(500).json({
      message: 'Error al eliminar pago',
      error: error.message
    })
  }
}