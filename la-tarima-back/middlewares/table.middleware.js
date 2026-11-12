const { body, param } = require('express-validator')

/**
  * VALIDADORES PARA TABLE
 */
exports.validateCreateTable = [
  body('tableNumber')
    .isInt({ min: 1 }).withMessage('tableNumber debe ser un entero >= 1'),

  body('capacity')
    .isInt({ min: 1 }).withMessage('capacity debe ser un entero >= 1'),

  body('zone')
    .trim()
    .notEmpty().withMessage('zone es obligatoria')
]

/**
  * UPDATE TABLE
 */

exports.validateUpdateTable = [
  body('table_id')
    .not().exists()
    .withMessage('No se puede modificar el table_id'),

  body().custom((value) => {
    if (!value || Object.keys(value).length === 0) {
      throw new Error('Debe enviar al menos un campo para actualizar')
    }
    return true
  }),

  body('tableNumber')
    .optional()
    .isInt({ min: 1 }).withMessage('tableNumber debe ser un entero >= 1'),

  body('capacity')
    .optional()
    .isInt({ min: 1 }).withMessage('capacity debe ser un entero >= 1'),

  body('zone')
    .optional()
    .trim()
    .notEmpty().withMessage('zone no puede ser un string vacío')
]

exports.validateTableParam = [
  param('table_id')
    .notEmpty()
    .withMessage('table_id es obligatorio en la URL')
]