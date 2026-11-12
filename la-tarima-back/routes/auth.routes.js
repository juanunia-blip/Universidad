const router = require('express').Router()
const controller = require('../controllers/auth.controller')
const validator = require('../middlewares/auth.middleware')
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

router.post('/login', validator.validateLogin, validate, controller.login)
router.post('/register', validator.validateRegister, validate, controller.register)
router.get('/verify', controller.verifyEmail)

module.exports = router
