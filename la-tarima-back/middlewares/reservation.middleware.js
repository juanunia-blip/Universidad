const { body, param, query } = require('express-validator')

const timeToMinutes = (time) => {
  const [h, m] = String(time).split(':').map(Number)
  return h * 60 + m
}

const getDurationMinutes = (startTime, endTime) => {
  let start = timeToMinutes(startTime)
  let end = timeToMinutes(endTime)

  if (end <= start) {
    end += 24 * 60
  }

  return end - start
}

const parseLocalDateString = (value) => {
  const [year, month, day] = String(value).split('-').map(Number)
  return new Date(year, month - 1, day)
}

const isPastLocalDate = (value) => {
  const date = parseLocalDateString(value)
  if (isNaN(date.getTime())) return false
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return date < today
}

exports.validateCreateReservation = [
  body('table_id')
    .trim()
    .notEmpty().withMessage('table_id es obligatorio')
    .isString().withMessage('table_id debe ser string'),

  body('date')
    .notEmpty().withMessage('date es obligatorio')
    .matches(/^\d{4}-\d{2}-\d{2}$/).withMessage('Formato de fecha inválido (YYYY-MM-DD)')
    .custom((value) => {
      const date = parseLocalDateString(value)
      if (isNaN(date.getTime())) {
        throw new Error('Fecha inválida')
      }
      if (isPastLocalDate(value)) {
        throw new Error('No se puede reservar para fechas pasadas')
      }
      return true
    }),

  body('startTime')
    .notEmpty().withMessage('startTime es obligatorio')
    .matches(/^\d{2}:\d{2}$/).withMessage('Formato startTime inválido (HH:MM)')
    .custom((value) => {
      const [h, m] = value.split(':').map(Number)
      if (h < 0 || h > 23 || m < 0 || m > 59) {
        throw new Error('Hora inválida')
      }
      return true
    }),

  body('endTime')
    .notEmpty().withMessage('endTime es obligatorio')
    .matches(/^\d{2}:\d{2}$/).withMessage('Formato endTime inválido (HH:MM)')
    .custom((value) => {
      const [h, m] = value.split(':').map(Number)
      if (h < 0 || h > 23 || m < 0 || m > 59) {
        throw new Error('Hora inválida')
      }
      return true
    }),



body('endTime').custom((endTime, { req }) => {
  if (!req.body.startTime || !endTime) return true

  const duration = getDurationMinutes(req.body.startTime, endTime)

  if (duration < 30) {
    throw new Error('La reserva debe tener una duración mínima de 30 minutos')
  }

  if (duration > 480) {
    throw new Error('La reserva no puede exceder 8 horas')
  }

  return true


}),

  body('peopleCount')
    .isInt({ min: 1, max: 100 }).withMessage('peopleCount debe estar entre 1 y 100'),

  body('waiter_id')
    .optional()
    .trim()
    .notEmpty().withMessage('waiter_id no puede ser un string vacío'),

  body('channel')
    .optional()
    .trim()
    .isIn(['presencial', 'telefono', 'web', 'app'])
    .withMessage('channel debe ser presencial, telefono, web o app'),

  body('notes')
    .optional()
    .trim()
    .isLength({ max: 500 }).withMessage('notes no puede exceder 500 caracteres'),

  body().custom((value) => {
    const hasClientRef = value.clientRef && (value.clientRef.fullname || value.clientRef.docID)
    const hasGuest     = value.guest     && (value.guest.fullname || value.guest.phone)
    if (!hasClientRef && !hasGuest) {
      throw new Error('Debe incluir clientRef o guest con al menos un campo')
    }
    if (hasClientRef && hasGuest) {
      throw new Error('No puede incluir clientRef y guest simultáneamente')
    }
    return true
  }),

  body('clientRef.fullname').optional().trim().isLength({ min: 1, max: 100 }).withMessage('clientRef.fullname inválido'),
  body('clientRef.docID').optional().trim().isLength({ min: 1, max: 30 }).withMessage('clientRef.docID inválido'),
  body('guest.fullname').optional().trim().isLength({ min: 1, max: 100 }).withMessage('guest.fullname inválido'),
  body('guest.phone').optional().trim().matches(/^\d{7,15}$/).withMessage('guest.phone debe ser un número válido'),
  body('guest.notes').optional().trim().isLength({ max: 200 }).withMessage('guest.notes no puede exceder 200 caracteres')
]

exports.validateUpdateReservation = [
  body('reservation_id')
    .not().exists()
    .withMessage('No se puede modificar el reservation_id'),

  body().custom((value) => {
    if (!value || Object.keys(value).length === 0) {
      throw new Error('Debe enviar al menos un campo para actualizar')
    }
    return true
  }),

  body('date')
    .optional()
    .matches(/^\d{4}-\d{2}-\d{2}$/).withMessage('Formato de fecha inválido (YYYY-MM-DD)')
    .custom((value) => {
      if (value) {
        const date = parseLocalDateString(value)
        if (isNaN(date.getTime())) {
          throw new Error('Fecha inválida')
        }
        if (isPastLocalDate(value)) {
          throw new Error('No se puede reservar para fechas pasadas')
        }
      }
      return true
    }),

  body('startTime')
    .optional()
    .matches(/^\d{2}:\d{2}$/).withMessage('Formato startTime inválido (HH:MM)')
    .custom((value) => {
      if (value) {
        const [h, m] = value.split(':').map(Number)
        if (h < 0 || h > 23 || m < 0 || m > 59) {
          throw new Error('Hora inválida')
        }
      }
      return true
    }),

  body('endTime')
    .optional()
    .matches(/^\d{2}:\d{2}$/).withMessage('Formato endTime inválido (HH:MM)')
    .custom((value) => {
      if (value) {
        const [h, m] = value.split(':').map(Number)
        if (h < 0 || h > 23 || m < 0 || m > 59) {
          throw new Error('Hora inválida')
        }
      }
      return true
    }),

  body('peopleCount')
    .optional()
    .isInt({ min: 1, max: 100 }).withMessage('peopleCount debe estar entre 1 y 100'),

  body('status')
    .optional()
    .isIn(['pendiente', 'confirmada', 'en_curso', 'completada', 'cancelada'])
    .withMessage('status inválido'),

  body('channel')
    .optional()
    .trim()
    .isIn(['presencial', 'telefono', 'web', 'app'])
    .withMessage('channel debe ser presencial, telefono, web o app'),

  body('waiter_id')
    .optional()
    .trim()
    .notEmpty().withMessage('waiter_id no puede ser un string vacío'),

  body('notes')
    .optional()
    .trim()
    .isLength({ max: 500 }).withMessage('notes no puede exceder 500 caracteres'),

  body('clientRef.fullname').optional().trim().isLength({ min: 1, max: 100 }).withMessage('clientRef.fullname inválido'),
  body('clientRef.docID').optional().trim().isLength({ min: 1, max: 30 }).withMessage('clientRef.docID inválido'),
  body('guest.fullname').optional().trim().isLength({ min: 1, max: 100 }).withMessage('guest.fullname inválido'),
  body('guest.phone').optional().trim().matches(/^\d{7,15}$/).withMessage('guest.phone debe ser un número válido'),
  body('guest.notes').optional().trim().isLength({ max: 200 }).withMessage('guest.notes no puede exceder 200 caracteres')
]

exports.validateReservationParam = [
  param('reservation_id')
    .notEmpty().withMessage('reservation_id es obligatorio en la URL')
    .matches(/^RES_\d+$/).withMessage('Formato de reservation_id inválido')
]

exports.validateAvailabilityQuery = [
  query('table_id')
    .notEmpty().withMessage('table_id es obligatorio')
    .isString().withMessage('table_id debe ser string'),

  query('date')
    .notEmpty().withMessage('date es obligatorio')
    .matches(/^\d{4}-\d{2}-\d{2}$/).withMessage('Formato de fecha inválido (YYYY-MM-DD)'),

  query('startTime')
    .notEmpty().withMessage('startTime es obligatorio')
    .matches(/^\d{2}:\d{2}$/).withMessage('Formato startTime inválido (HH:MM)'),

  query('endTime')
    .notEmpty().withMessage('endTime es obligatorio')
    .matches(/^\d{2}:\d{2}$/).withMessage('Formato endTime inválido (HH:MM)')
    .custom((value, { req }) => {
      if (!req.query.startTime || !value) return true

      const duration = getDurationMinutes(req.query.startTime, value)

      if (duration < 30) {
        throw new Error('La reserva debe tener una duración mínima de 30 minutos')
      }

      if (duration > 480) {
        throw new Error('La reserva no puede exceder 8 horas')
      }

      return true
    })
]