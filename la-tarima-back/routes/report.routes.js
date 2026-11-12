const router     = require('express').Router()
const controller = require('../controllers/report.controller')
const validator  = require('../middlewares/report.middleware')
const { validationResult } = require('express-validator')

const validate = (req, res, next) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(422).json({
      message: 'Parámetros inválidos o faltantes',
      errors: errors.array().map(e => ({
        field: e.path,
        message: e.msg
      }))
    })
  }
  next()
}

// Ventas agrupadas por categoría (solo órdenes servidas)
router.get('/sales-by-category', controller.salesByCategory)

// Top clientes por consumo
router.get(
  '/top-clients',
  validator.validateTopClients,
  validate,
  controller.topClients
)

// Pagos por rango de fechas con paginación
router.get(
  '/payments-by-date',
  validator.validateDateRange,
  validate,
  controller.paymentsByDate
)

// Ventas agrupadas por producto (solo órdenes servidas)
router.get('/sales-by-product', controller.salesByProduct)

module.exports = router