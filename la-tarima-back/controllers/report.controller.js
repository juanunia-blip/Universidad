const Order   = require('../models/order')
const Payment = require('../models/payment')

/**
 * REPORTE: Ventas por categoría
 */
exports.salesByCategory = async (req, res) => {
  try {
    const report = await Order.aggregate([
      { $match: { status: 'servido' } },
      { $unwind: '$items' },
      {
        $lookup: {
          from: 'products',
          localField: 'items.product_id',
          foreignField: 'product_id',
          as: 'product'
        }
      },
      { $unwind: '$product' },
      {
        $group: {
          _id: '$product.category',
          totalSold: {
            $sum: { $multiply: ['$items.quantity', '$items.unitPrice'] }
          },
          totalItems: { $sum: '$items.quantity' }
        }
      },
      { $sort: { totalSold: -1 } }
    ])

    res.json(report)
  } catch (error) {
    res.status(500).json({
      message: 'Error al generar reporte por categoría',
      error: error.message
    })
  }
}

/**
 * REPORTE: Top clientes por consumo
 */
exports.topClients = async (req, res) => {
  try {

    const limit = Math.min(Number(req.query.limit) || 5, 50)

    const report = await Payment.aggregate([
      { $match: { status: 'aprobado' } },
      {
        $lookup: {
          from: 'orders',
          localField: 'order_id',
          foreignField: 'order_id',
          as: 'order'
        }
      },
      { $unwind: '$order' },
      {
        $group: {
          _id: '$order.clientHint',
          totalPaid: { $sum: '$amount' },
          totalTip:  { $sum: '$tip' },
          ordersCount: { $sum: 1 }
        }
      },
      { $sort: { totalPaid: -1 } },
      { $limit: limit }
    ])

    res.json(report)
  } catch (error) {
    res.status(500).json({
      message: 'Error al generar top de clientes',
      error: error.message
    })
  }
}

/**
 * REPORTE: Pagos por rango de fechas (auditoría)
 */
exports.paymentsByDate = async (req, res) => {
  try {
    const { startDate, endDate } = req.query

    if (!startDate || !endDate) {
      return res.status(400).json({
        message: 'startDate y endDate son obligatorios'
      })
    }

    const start = new Date(startDate)
    const end   = new Date(endDate)

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return res.status(400).json({
        message: 'Las fechas proporcionadas no son válidas'
      })
    }

    if (start > end) {
      return res.status(400).json({
        message: 'startDate no puede ser mayor que endDate'
      })
    }

    const page  = parseInt(req.query.page)  || 1
    const limit = Math.min(parseInt(req.query.limit) || 20, 100)
    const skip  = (page - 1) * limit

    const [payments, total] = await Promise.all([
      Payment.find({
        createdAt: { $gte: start, $lte: end }
      })
        .sort({ createdAt: 1 })
        .skip(skip)
        .limit(limit),

      Payment.countDocuments({
        createdAt: { $gte: start, $lte: end }
      })
    ])

    res.json({
      total,
      page,
      pages: Math.ceil(total / limit),
      data: payments
    })
  } catch (error) {
    res.status(500).json({
      message: 'Error al generar reporte de pagos',
      error: error.message
    })
  }
}

/**
 * REPORTE: Consumo por producto
 */
exports.salesByProduct = async (req, res) => {
  try {
    const report = await Order.aggregate([
      { $match: { status: 'servido' } },
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.product_id',
          totalSold: {
            $sum: { $multiply: ['$items.quantity', '$items.unitPrice'] }
          },
          unitsSold: { $sum: '$items.quantity' }
        }
      },
      { $sort: { totalSold: -1 } }
    ])

    res.json(report)
  } catch (error) {
    res.status(500).json({
      message: 'Error al generar reporte por producto',
      error: error.message
    })
  }
}