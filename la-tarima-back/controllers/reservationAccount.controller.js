const Reservation = require('../models/reservation')
const Discount = require('../models/discount')
const { getReservationAccount, isDiscountValidNow } = require('../utils/reservationAccount')

exports.getAccount = async (req, res) => {
  try {
    const account = await getReservationAccount(req.params.reservation_id)
    res.json(account)
  } catch (error) {
    res.status(error.status || 500).json({
      message: error.message || 'Error al obtener cuenta de reserva'
    })
  }
}

exports.applyCoupon = async (req, res) => {
  try {
    const { reservation_id } = req.params
    const { code, appliedBy } = req.body

    if (!code) {
      return res.status(400).json({
        message: 'code es obligatorio'
      })
    }

    const reservation = await Reservation.findOne({ reservation_id })

    if (!reservation) {
      return res.status(404).json({
        message: 'Reserva no encontrada'
      })
    }

    if (['completada', 'cancelada'].includes(reservation.status)) {
      return res.status(409).json({
        message: 'No se puede aplicar cupón a una reserva completada o cancelada'
      })
    }

    const normalizedCode = String(code).trim().toUpperCase()

    const coupon = await Discount.findOne({
      kind: 'coupon',
      code: normalizedCode
    })

    if (!coupon) {
      return res.status(404).json({
        message: 'Cupón no encontrado'
      })
    }

    if (!isDiscountValidNow(coupon)) {
      return res.status(409).json({
        message: 'El cupón no está activo, está vencido o ya agotó sus usos'
      })
    }

    const alreadyApplied = reservation.appliedCoupons?.some(
      c => c.discount_id === coupon.discount_id || c.code === normalizedCode
    )

    if (alreadyApplied) {
      return res.status(409).json({
        message: 'Este cupón ya fue aplicado a esta reserva'
      })
    }

    reservation.appliedCoupons.push({
      discount_id: coupon.discount_id,
      code: coupon.code,
      name: coupon.name,
      type: coupon.type,
      value: coupon.value,
      stackable: coupon.stackable,
      appliedBy
    })

    await reservation.save()

    const account = await getReservationAccount(reservation_id)

    res.json({
      message: 'Cupón aplicado correctamente',
      account
    })
  } catch (error) {
    res.status(500).json({
      message: 'Error al aplicar cupón',
      error: error.message
    })
  }
}