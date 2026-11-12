const { body, param } = require('express-validator')

/**
  * VALIDADORES PARA STAFF
 */
exports.validateCreateStaff = [
  body('fullname')
    .trim()
    .notEmpty().withMessage('fullname es obligatorio')
    .isLength({ min: 3 }).withMessage('fullname debe tener mínimo 3 caracteres'),

  body('role')
    .notEmpty().withMessage('role es obligatorio')
    .isIn(['waiter', 'manager', 'chef']).withMessage('role inválido — valores: waiter, manager, chef'),

  body('email')
    .optional()
    .trim()
    .isEmail().withMessage('email inválido'),

  body('cellPhone')
    .optional()
    .trim()
    .isLength({ min: 7 }).withMessage('cellPhone inválido')
]

/**
  * UPDATE STAFF (PATCH)
 */
exports.validateUpdateStaff = [
  body('user_id')
    .not().exists()
    .withMessage('No se puede modificar el user_id'),

  body().custom((value) => {
    if (!value || Object.keys(value).length === 0) {
      throw new Error('Debe enviar al menos un campo para actualizar')
    }
    return true
  }),

  body('fullname')
    .optional()
    .trim()
    .isLength({ min: 3 }).withMessage('fullname debe tener mínimo 3 caracteres'),

  body('role')
    .optional()
    .isIn(['waiter', 'manager', 'chef'])
    .withMessage('role inválido — valores: waiter, manager, chef'),

  body('email')
    .optional()
    .trim()
    .isEmail().withMessage('email inválido'),

  body('cellPhone')
    .optional()
    .trim()
    .isLength({ min: 7 }).withMessage('cellPhone inválido')
]

exports.validateStaffParam = [
  param('user_id')
    .notEmpty()
    .withMessage('user_id es obligatorio en la URL')
]