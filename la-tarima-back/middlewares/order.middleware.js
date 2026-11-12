const { body, param } = require('express-validator')

const VALID_ORDER_STATUSES = [
  'abierto',
  'enviado_cocina',
  'en_preparacion',
  'listo',
  'servido',
  'cancelado'
]

exports.validateCreateOrder = [
  body('reservation_id')
    .trim()
    .notEmpty().withMessage('reservation_id es obligatorio'),

  body('items')
    .isArray({ min: 1 }).withMessage('items debe ser un arreglo no vacio'),

  body('items.*.product_id')
    .notEmpty().withMessage('product_id es obligatorio en cada item'),

  body('items.*.name')
    .trim()
    .notEmpty().withMessage('name es obligatorio en cada item'),

  body('items.*.quantity')
    .isInt({ min: 1 }).withMessage('quantity debe ser >= 1'),

  body('items.*.unitPrice')
    .isFloat({ min: 0 }).withMessage('unitPrice debe ser >= 0')
]

exports.validateAddItem = [
  body('items')
    .isArray({ min: 1 }).withMessage('items debe ser un arreglo no vacio'),

  body('items.*.product_id')
    .notEmpty().withMessage('product_id es obligatorio en cada item'),

  body('items.*.name')
    .trim()
    .notEmpty().withMessage('name es obligatorio en cada item'),

  body('items.*.quantity')
    .isInt({ min: 1 }).withMessage('quantity debe ser un entero >= 1'),

  body('items.*.unitPrice')
    .isFloat({ min: 0 }).withMessage('unitPrice debe ser un numero >= 0')
]

exports.validateRemoveItem = [
  body('product_ids')
    .isArray({ min: 1 }).withMessage('product_ids debe ser un arreglo no vacio'),

  body('product_ids.*')
    .notEmpty().withMessage('Cada product_id debe ser un string no vacio')
]

exports.validateUpdateStatus = [
  body('status')
    .isIn(VALID_ORDER_STATUSES)
    .withMessage(`Estado invalido - valores: ${VALID_ORDER_STATUSES.join(', ')}`)
]

exports.validateOrderParam = [
  param('order_id')
    .notEmpty()
    .withMessage('order_id es obligatorio en la URL')
]
