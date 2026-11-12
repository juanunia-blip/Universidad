const router     = require('express').Router()
const controller = require('../controllers/table.controller')
const validator  = require('../middlewares/table.middleware')
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

// Crear mesa

router.post(
  '/',
  validator.validateCreateTable,
  validate,
  controller.create
)

// Listar mesas con paginación

router.get('/', controller.getAll)

// Obtener mesa por table_id

router.get(
  '/:table_id',
  validator.validateTableParam,
  validate,
  controller.getById
)

// Actualización parcial

router.patch(
  '/:table_id',
  validator.validateTableParam,
  validate,
  validator.validateUpdateTable,
  validate,
  controller.update
)

// Eliminar mesa
router.delete(
  '/:table_id',
  validator.validateTableParam,
  validate,
  controller.remove
)

module.exports = router