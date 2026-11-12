const { body, param } = require('express-validator')

exports.validateCreatePayment = [
  body('reservation_id')
    .trim()
    .notEmpty().withMessage('reservation_id es obligatorio'),

  body('scope')
    .optional()
    .isIn(['order', 'reservation'])
    .withMessage('scope inválido — valores: order, reservation'),

  body('order_id')
    .optional()
    .trim()
    .notEmpty().withMessage('order_id no puede estar vacío'),

  body('amount')
    .isFloat({ min: 0.01 }).withMessage('amount debe ser mayor a 0'),

  body('method')
    .isIn(['efectivo', 'tarjeta', 'nequi', 'daviplata'])
    .withMessage('method inválido — valores: efectivo, tarjeta, nequi, daviplata'),

  body('tip')
    .optional()
    .isFloat({ min: 0 }).withMessage('tip inválido'),

  body('status')
    .optional()
    .isIn(['aprobado', 'pendiente'])
    .withMessage('status inválido — valores: aprobado, pendiente'),

  body('split.part')
    .optional()
    .isInt({ min: 1 }).withMessage('split.part debe ser un entero >= 1'),

  body('split.totalParts')
    .optional()
    .isInt({ min: 1 }).withMessage('split.totalParts debe ser un entero >= 1'),

  body('split').optional().custom((value) => {
    if (!value) return true

    const { part, totalParts } = value

    if ((part == null) !== (totalParts == null)) {
      throw new Error('split requiere tanto part como totalParts')
    }

    if (part != null && totalParts != null && part > totalParts) {
      throw new Error('split.part no puede ser mayor que split.totalParts')
    }

    return true
  }),

  body().custom((value) => {
    const scope = value.scope || 'reservation'

    if (scope === 'order' && !value.order_id) {
      throw new Error('order_id es obligatorio cuando scope es order')
    }

    return true
  })
]

exports.validatePaymentParam = [
  param('payment_id')
    .notEmpty()
    .withMessage('payment_id es obligatorio en la URL')
]

exports.validateUpdateStatus = [
  body('status')
    .isIn(['aprobado', 'pendiente'])
    .withMessage('Estado inválido — valores: aprobado, pendiente')
]
