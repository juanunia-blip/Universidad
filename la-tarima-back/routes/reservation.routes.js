const router     = require('express').Router()
const controller = require('../controllers/reservation.controller')
const validator  = require('../middlewares/reservation.middleware')
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

// Verificar disponibilidad de mesa — ruta específica antes del catch-all /:reservation_id

router.get(
  '/availability',
  validator.validateAvailabilityQuery,
  validate,
  controller.checkAvailability
)

// Crear reserva

router.post(
  '/',
  validator.validateCreateReservation,
  validate,
  controller.create
)

// Listar reservas con filtros y paginación

router.get('/', controller.getAll)

// Obtener reserva por reservation_id

router.get(
  '/:reservation_id',
  validator.validateReservationParam,
  validate,
  controller.getById
)

// Actualización completa (PUT)

router.put(
  '/:reservation_id',
  validator.validateReservationParam,
  validate,
  validator.validateUpdateReservation,
  validate,
  controller.update
)

// Actualización parcial (PATCH)

router.patch(
  '/:reservation_id',
  validator.validateReservationParam,
  validate,
  validator.validateUpdateReservation,
  validate,
  controller.updatePartial
)

// Cancelación lógica (DELETE)

router.delete(
  '/:reservation_id',
  validator.validateReservationParam,
  validate,
  controller.remove
)

module.exports = router