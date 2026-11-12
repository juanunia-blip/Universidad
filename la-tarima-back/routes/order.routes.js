const router     = require('express').Router()
const controller = require('../controllers/order.controller')
const validator  = require('../middlewares/order.middleware')
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

// Crear pedido
router.post(
  '/',
  validator.validateCreateOrder,
  validate,
  controller.create
)

// Listar pedidos con paginación
router.get('/', controller.getAll)

// Obtener pedido por order_id
router.get(
  '/:order_id',
  validator.validateOrderParam,
  validate,
  controller.getById
)

// Cambiar estado
router.patch(
  '/:order_id/status',
  validator.validateOrderParam,
  validate,
  validator.validateUpdateStatus,
  validate,
  controller.updateStatus
)



// Agregar items
router.patch(
  '/:order_id/add-item',
  validator.validateOrderParam,
  validate,
  validator.validateAddItem,
  validate,
  controller.addItem
)

// Eliminar items
router.patch(
  '/:order_id/remove-item',
  validator.validateOrderParam,
  validate,
  validator.validateRemoveItem,
  validate,
  controller.removeItem
)

// Actualización general — siempre al final para no interceptar rutas específicas
router.patch(
  '/:order_id',
  validator.validateOrderParam,
  validate,
  controller.update
)

// Eliminar pedido
router.delete(
  '/:order_id',
  validator.validateOrderParam,
  validate,
  controller.remove
)


module.exports = router