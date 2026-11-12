const { body, param } = require('express-validator')

const allowedFields = ['fullname', 'email', 'phone', 'address', 'notes']

/**
 * CREATE CLIENT
 */
exports.validateCreateClient = [
  body('fullname')
    .trim()
    .notEmpty().withMessage('fullname es obligatorio')
    .isLength({ min: 3 }).withMessage('fullname debe tener mínimo 3 caracteres'),

  body('docID')
    .trim()
    .notEmpty().withMessage('docID es obligatorio')
    .isLength({ min: 5 }).withMessage('docID inválido'),

  body('email')
    .optional()
    .trim()
    .isEmail().withMessage('email inválido'),

  body('phone')
    .optional()
    .trim()
    .isLength({ min: 7 }).withMessage('teléfono inválido'),

  body().custom((value) => {
    const invalid = Object.keys(value).filter(
      (k) => ![...allowedFields, 'docID'].includes(k)
    )
    if (invalid.length) {
      throw new Error(`Campos no permitidos: ${invalid.join(', ')}`)
    }
    return true
  })
]

/**
 * UPDATE CLIENT (PATCH)
 */
exports.validateUpdateClient = [
  body('docID')
    .not()
    .exists()
    .withMessage('No se puede modificar el docID'),

  body().custom((value) => {
    if (!value || Object.keys(value).length === 0) {
      throw new Error('Debe enviar al menos un campo para actualizar')
    }

    const invalid = Object.keys(value).filter((k) => !allowedFields.includes(k))
    if (invalid.length) {
      throw new Error(`Campos no permitidos: ${invalid.join(', ')}`)
    }

    return true
  }),

  body('fullname')
    .optional()
    .trim()
    .isLength({ min: 3 }).withMessage('fullname inválido'),

  body('email')
    .optional()
    .trim()
    .isEmail().withMessage('email inválido'),

  body('phone')
    .optional()
    .trim()
    .isLength({ min: 7 }).withMessage('teléfono inválido'),

  body('address').optional().trim(),
  body('notes').optional().trim()
]

/**
 * PARAM VALIDATION
 */
exports.validateDocParam = [
  param('docID')
    .trim()
    .notEmpty().withMessage('docID es obligatorio')
    .isLength({ min: 5 }).withMessage('docID inválido')
]