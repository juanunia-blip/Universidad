const router     = require('express').Router()
const controller = require('../controllers/product.controller')
const validator  = require('../middlewares/product.middleware')
const { uploadProductImage } = require('../middlewares/upload.middleware')
const { validationResult } = require('express-validator')

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

// Crear producto
router.post(
  '/',
  uploadProductImage.single('image'),
  validator.validateCreateProduct,
  validate,
  controller.create
)

// Listar productos con paginación
router.get('/', controller.getAll)

// Obtener producto por product_id
router.get(
  '/:product_id',
  validator.validateProductParam,
  validate,
  controller.getById
)

// Actualización parcial
router.patch(
  '/:product_id',
  validator.validateProductParam,
  validate,
  uploadProductImage.single('image'),
  validator.validateUpdateProduct,
  validate,
  controller.update
)

// Eliminar producto
router.delete(
  '/:product_id',
  validator.validateProductParam,
  validate,
  controller.remove
)

module.exports = router