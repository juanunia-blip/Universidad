const Order = require('../models/order')
const Payment = require('../models/payment')
const Reservation = require('../models/reservation')
const Product = require('../models/product')
const generateId = require('../utils/generateId')

const ALLOWED_UPDATE_FIELDS = ['clientHint', 'notes', 'status']

const FINAL_ORDER_STATUSES = ['servido', 'cancelado']

const ALLOWED_TRANSITIONS = {
  abierto: ['enviado_cocina', 'cancelado'],
  enviado_cocina: ['en_preparacion', 'listo', 'cancelado'],
  en_preparacion: ['listo', 'cancelado'],
  listo: ['servido', 'cancelado'],
  servido: [],
  cancelado: []
}

const calcTotal = (items) =>
  items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0)

const hasApprovedPayments = async (order_id) => {
  const payment = await Payment.findOne({ order_id, status: 'aprobado' })
  return !!payment
}

const isOrderLocked = async (order) => {
  if (!order) return false
  if (FINAL_ORDER_STATUSES.includes(order.status)) return true
  return await hasApprovedPayments(order.order_id)
}

const validateReservationForOrder = async (reservation_id) => {
  const reservation = await Reservation.findOne({ reservation_id })

  if (!reservation) {
    const err = new Error('La reserva indicada no existe')
    err.status = 404
    throw err
  }

  if (!['confirmada', 'en_curso'].includes(reservation.status)) {
    const err = new Error(
      'Solo se pueden crear pedidos sobre reservas confirmadas o en curso'
    )
    err.status = 409
    throw err
  }

  return reservation
}

const buildItemsFromProducts = async (items) => {
  const productIds = items.map(i => i.product_id)

  const products = await Product.find({
    product_id: { $in: productIds },
    active: true
  })

  const productMap = new Map(products.map(p => [p.product_id, p]))

  const normalized = []

  for (const item of items) {
    const product = productMap.get(item.product_id)

    if (!product) {
      const err = new Error(`Producto no encontrado o inactivo: ${item.product_id}`)
      err.status = 404
      throw err
    }

    const existing = normalized.find(i => i.product_id === product.product_id)

    if (existing) {
      existing.quantity += Number(item.quantity)
    } else {
      normalized.push({
        product_id: product.product_id,
        name: product.name,
        quantity: Number(item.quantity),
        unitPrice: product.basePrice
      })
    }
  }

  return normalized
}

exports.create = async (req, res) => {
  try {
    const { reservation_id, items } = req.body

    if (!reservation_id || !items || items.length === 0) {
      return res.status(400).json({
        message: 'reservation_id e items son obligatorios'
      })
    }

    const reservation = await validateReservationForOrder(reservation_id)
    const normalizedItems = await buildItemsFromProducts(items)

    const order_id = await generateId('order', 'ORD_')
    const subtotalAmount = calcTotal(normalizedItems)

    const order = new Order({
      order_id,
      reservation_id,
      clientHint:
        req.body.clientHint ||
        reservation.clientRef?.fullname ||
        reservation.guest?.fullname ||
        '',
      notes: req.body.notes,
      items: normalizedItems,
      subtotalAmount,
      totalAmount: subtotalAmount
    })

    await order.save()

    if (reservation.status === 'confirmada') {
      await Reservation.findOneAndUpdate(
        { reservation_id },
        { status: 'en_curso' }
      )
    }

    res.status(201).json(order)
  } catch (error) {
    res.status(error.status || 500).json({
      message: error.message || 'Error al crear el pedido'
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
    if (req.query.status) filter.status = req.query.status
    if (req.query.clientHint) {
      filter.clientHint = {
        $regex: req.query.clientHint.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'),
        $options: 'i'
      }
    }

    const [orders, total] = await Promise.all([
      Order.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
      Order.countDocuments(filter)
    ])

    res.json({
      total,
      page,
      pages: Math.ceil(total / limit),
      data: orders
    })
  } catch (error) {
    res.status(500).json({
      message: 'Error al obtener pedidos',
      error: error.message
    })
  }
}

exports.getById = async (req, res) => {
  try {
    const order = await Order.findOne({ order_id: req.params.order_id })

    if (!order) {
      return res.status(404).json({
        message: 'Pedido no encontrado'
      })
    }

    res.json(order)
  } catch (error) {
    res.status(500).json({
      message: 'Error al buscar pedido',
      error: error.message
    })
  }
}

exports.addItem = async (req, res) => {
  try {
    const { order_id } = req.params
    const { items } = req.body

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        message: 'Debe enviar un arreglo de items'
      })
    }

    const order = await Order.findOne({ order_id })

    if (!order) {
      return res.status(404).json({
        message: 'Pedido no encontrado'
      })
    }

    if (await isOrderLocked(order)) {
      return res.status(409).json({
        message: 'No se puede modificar el pedido: está pagado, servido o cancelado'
      })
    }

    await validateReservationForOrder(order.reservation_id)

    const newItems = await buildItemsFromProducts(items)

    for (const newItem of newItems) {
      const existing = order.items.find(i => i.product_id === newItem.product_id)

      if (existing) {
        existing.quantity += newItem.quantity
      } else {
        order.items.push(newItem)
      }
    }

    order.subtotalAmount = calcTotal(order.items)
    order.totalAmount = order.subtotalAmount

    await order.save()

    res.json(order)
  } catch (error) {
    res.status(error.status || 500).json({
      message: error.message || 'Error al agregar items al pedido'
    })
  }
}

exports.removeItem = async (req, res) => {
  try {
    const { order_id } = req.params
    const { product_ids } = req.body

    if (!product_ids || !Array.isArray(product_ids) || product_ids.length === 0) {
      return res.status(400).json({
        message: 'Debe enviar un array de product_ids'
      })
    }

    const order = await Order.findOne({ order_id })

    if (!order) {
      return res.status(404).json({
        message: 'Pedido no encontrado'
      })
    }

    if (await isOrderLocked(order)) {
      return res.status(409).json({
        message: 'No se pueden eliminar items: el pedido está pagado, servido o cancelado'
      })
    }

    order.items = order.items.filter(
      item => !product_ids.includes(item.product_id)
    )

    order.subtotalAmount = calcTotal(order.items)
    order.totalAmount = order.subtotalAmount

    await order.save()

    res.json(order)
  } catch (error) {
    res.status(500).json({
      message: 'Error al eliminar items del pedido',
      error: error.message
    })
  }
}

exports.update = async (req, res) => {
  try {
    const { order_id } = req.params

    const order = await Order.findOne({ order_id })

    if (!order) {
      return res.status(404).json({
        message: 'Pedido no encontrado'
      })
    }

    if (await isOrderLocked(order)) {
      return res.status(409).json({
        message: 'No se puede modificar el pedido: está pagado, servido o cancelado'
      })
    }

    const updateData = {}

    ALLOWED_UPDATE_FIELDS.forEach(field => {
      if (req.body[field] !== undefined) {
        updateData[field] = req.body[field]
      }
    })

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({
        message: 'Debe enviar al menos un campo válido para actualizar'
      })
    }

    Object.assign(order, updateData)

    await order.save()

    res.json(order)
  } catch (error) {
    res.status(500).json({
      message: 'Error al actualizar pedido',
      error: error.message
    })
  }
}

exports.updateStatus = async (req, res) => {
  try {
    const { status } = req.body
    const { order_id } = req.params

    const order = await Order.findOne({ order_id })

    if (!order) {
      return res.status(404).json({
        message: 'Pedido no encontrado'
      })
    }

    const allowedNext = ALLOWED_TRANSITIONS[order.status] || []

    if (!allowedNext.includes(status)) {
      return res.status(409).json({
        message: `Transición inválida: ${order.status} → ${status}`,
        currentStatus: order.status,
        allowedNext
      })
    }

    if (status === 'cancelado' && await hasApprovedPayments(order_id)) {
      return res.status(409).json({
        message: 'No se puede cancelar una orden con pagos aprobados'
      })
    }

    order.status = status
    await order.save()

    res.json(order)
  } catch (error) {
    res.status(500).json({
      message: 'Error al actualizar estado',
      error: error.message
    })
  }
}

exports.remove = async (req, res) => {
  try {
    const { order_id } = req.params

    const order = await Order.findOne({ order_id })

    if (!order) {
      return res.status(404).json({
        message: 'Pedido no encontrado'
      })
    }

    if (await hasApprovedPayments(order_id)) {
      return res.status(409).json({
        message: 'No se puede eliminar/cancelar un pedido con pagos aprobados'
      })
    }

    if (order.status === 'servido') {
      return res.status(409).json({
        message: 'No se puede cancelar un pedido ya servido'
      })
    }

    order.status = 'cancelado'
    await order.save()

    res.json({
      message: 'Pedido cancelado correctamente',
      order
    })
  } catch (error) {
    res.status(500).json({
      message: 'Error al cancelar pedido',
      error: error.message
    })
  }
}
