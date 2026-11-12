const router = require('express').Router()
const controller = require('../controllers/discount.controller')
const validator = require('../middlewares/discount.middleware')
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

router.post(
  '/',
  validator.validateCreateDiscount,
  validate,
  controller.create
)

router.get('/', controller.getAll)

router.get(
  '/:discount_id',
  validator.validateDiscountParam,
  validate,
  controller.getById
)

router.patch(
  '/:discount_id',
  validator.validateDiscountParam,
  validate,
  validator.validateUpdateDiscount,
  validate,
  controller.update
)

router.delete(
  '/:discount_id',
  validator.validateDiscountParam,
  validate,
  controller.remove
)

module.exports = router