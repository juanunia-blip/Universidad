const { body } = require('express-validator')

exports.validateLogin = [
  body('email')
    .trim()
    .notEmpty().withMessage('email es obligatorio')
    .isEmail().withMessage('email inválido'),

  body('password')
    .notEmpty().withMessage('password es obligatorio')
]

exports.validateRegister = [
  body('fullname')
    .trim()
    .notEmpty().withMessage('fullname es obligatorio')
    .isLength({ min: 3 }).withMessage('fullname debe tener mínimo 3 caracteres'),

  body('role')
    .notEmpty().withMessage('role es obligatorio')
    .isIn(['waiter', 'manager', 'chef']).withMessage('role inválido — valores: waiter, manager, chef'),

  body('email')
    .trim()
    .notEmpty().withMessage('email es obligatorio')
    .isEmail().withMessage('email inválido'),

  body('password')
    .notEmpty().withMessage('password es obligatorio')
    .isLength({ min: 6 }).withMessage('password debe tener mínimo 6 caracteres'),

  body('cellPhone')
    .optional()
    .trim()
    .isLength({ min: 7 }).withMessage('cellPhone inválido')
]
