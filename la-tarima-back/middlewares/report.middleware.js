const { query } = require('express-validator')

exports.validateDateRange = [
  query('startDate')
    .notEmpty()
    .withMessage('startDate es obligatorio')
    .isISO8601()
    .withMessage('startDate debe ser una fecha válida (ISO8601: YYYY-MM-DD)'),

  query('endDate')
    .notEmpty()
    .withMessage('endDate es obligatorio')
    .isISO8601()
    .withMessage('endDate debe ser una fecha válida (ISO8601: YYYY-MM-DD)'),

  // Validación cruzada: startDate no puede ser mayor que endDate
  query('endDate').custom((endDate, { req }) => {
    const start = new Date(req.query.startDate)
    const end   = new Date(endDate)

    if (!isNaN(start.getTime()) && !isNaN(end.getTime()) && start > end) {
      throw new Error('startDate no puede ser mayor que endDate')
    }

    return true
  }),

  // Paginación opcional
  query('page')
    .optional()
    .isInt({ min: 1 }).withMessage('page debe ser un entero >= 1'),

  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 }).withMessage('limit debe ser un entero entre 1 y 100')
]

exports.validateTopClients = [
  query('limit')
    .optional()
    .isInt({ min: 1, max: 50 })
    .withMessage('limit debe ser un entero entre 1 y 50')
]