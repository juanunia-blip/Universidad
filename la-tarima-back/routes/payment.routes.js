const router     = require('express').Router()
const controller = require('../controllers/payment.controller')
const validator  = require('../middlewares/payment.middleware')
const { validationResult } = require('express-validator')

const validate = (req, res, next) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(422).json({
      message: 'Faltan campos obligatorios o los datos son inválidos',
      errors: errors.array().map(e => ({
        field: e.path,
        message: e.msg
      }))
    })
  }
  next()
}

// Crear pago
router.post(
  '/',
  validator.validateCreatePayment,
  validate,
  controller.create
)

// Listar pagos con paginación
router.get('/', controller.getAll)

// Obtener pago por payment_id
router.get(
  '/:payment_id',
  validator.validatePaymentParam,
  validate,
  controller.getById
)

// Cambiar estado — ruta específica antes del catch-all
router.patch(
  '/:payment_id/status',
  validator.validatePaymentParam,
  validate,
  validator.validateUpdateStatus,
  validate,
  controller.updateStatus
)

// Eliminar pago
router.delete(
  '/:payment_id',
  validator.validatePaymentParam,
  validate,
  controller.remove
)

module.exports = router