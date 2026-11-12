const router     = require('express').Router()
const controller = require('../controllers/staff.controller')
const validator  = require('../middlewares/staff.middleware')
const { validationResult } = require('express-validator')

// Middleware para manejar errores de validación

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

// Crear miembro del personal

router.post(
  '/',
  validator.validateCreateStaff,
  validate,
  controller.create
)

// Listar personal con paginación

router.get('/', controller.getAll)

// Obtener miembro por user_id

router.get(
  '/:user_id',
  validator.validateStaffParam,
  validate,
  controller.getById
)

// Actualización parcial

router.patch(
  '/:user_id',
  validator.validateStaffParam,
  validate,
  validator.validateUpdateStaff,
  validate,
  controller.update
)

// Eliminar miembro del personal

router.delete(
  '/:user_id',
  validator.validateStaffParam,
  validate,
  controller.remove
)

module.exports = router