const { body, param } = require('express-validator')

exports.validateCreateDiscount = [
  body('name')
    .trim()
    .notEmpty().withMessage('name es obligatorio'),

  body('kind')
    .isIn(['automatic', 'coupon'])
    .withMessage('kind inválido — valores: automatic, coupon'),

  body('code')
    .optional()
    .trim(),

  body('type')
    .isIn(['percentage', 'fixed'])
    .withMessage('type inválido — valores: percentage, fixed'),

  body('value')
    .isFloat({ min: 0.01 })
    .withMessage('value debe ser mayor a 0'),

  body('clientDocID')
    .optional()
    .trim(),

  body('validFrom')
    .isISO8601()
    .withMessage('validFrom debe ser una fecha válida'),

  body('validUntil')
    .isISO8601()
    .withMessage('validUntil debe ser una fecha válida'),

  body('maxUses')
    .optional()
    .isInt({ min: 1 })
    .withMessage('maxUses debe ser entero >= 1'),

  body('stackable')
    .optional()
    .isBoolean()
    .withMessage('stackable debe ser boolean')
]

exports.validateUpdateDiscount = [
  body('discount_id')
    .not()
    .exists()
    .withMessage('No se puede modificar discount_id'),

  body('kind')
    .not()
    .exists()
    .withMessage('No se puede modificar kind'),

  body('code')
    .not()
    .exists()
    .withMessage('No se puede modificar code'),

  body('name').optional().trim(),

  body('type')
    .optional()
    .isIn(['percentage', 'fixed'])
    .withMessage('type inválido'),

  body('value')
    .optional()
    .isFloat({ min: 0.01 })
    .withMessage('value debe ser mayor a 0'),

  body('validFrom')
    .optional()
    .isISO8601()
    .withMessage('validFrom debe ser una fecha válida'),

  body('validUntil')
    .optional()
    .isISO8601()
    .withMessage('validUntil debe ser una fecha válida'),

  body('maxUses')
    .optional()
    .isInt({ min: 1 })
    .withMessage('maxUses debe ser entero >= 1'),

  body('active')
    .optional()
    .isBoolean()
    .withMessage('active debe ser boolean'),

  body('stackable')
    .optional()
    .isBoolean()
    .withMessage('stackable debe ser boolean')
]

exports.validateDiscountParam = [
  param('discount_id')
    .notEmpty()
    .withMessage('discount_id es obligatorio en la URL')
]