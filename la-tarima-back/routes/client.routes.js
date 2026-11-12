const router  = require('express').Router()
const controller = require('../controllers/client.controller')
const validator  = require('../middlewares/client.middleware')
const { validationResult } = require('express-validator')

const validate = (req, res, next) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(422).json({ errors: errors.array() })
  }
  next()
}

// Crear cliente
router.post(
  '/',
  validator.validateCreateClient,
  validate,
  controller.create
)

// Listar clientes con filtros y paginación
router.get('/', controller.getAll)

// Obtener cliente por docID
router.get(
  '/:docID',
  validator.validateDocParam,
  validate,
  controller.getByDoc
)

// Actualizar cliente por docID
router.patch(
  '/:docID',
  validator.validateDocParam,
  validate,
  validator.validateUpdateClient,
  validate,
  controller.update
)

// Eliminar cliente por docID
router.delete(
  '/:docID',
  validator.validateDocParam,
  validate,
  controller.remove
)

module.exports = router