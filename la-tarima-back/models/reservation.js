const { Schema, model } = require('mongoose')

/**
 * RESERVATION MODEL
 * 
 * IMPORTANTE:
 * - Un documento de reserva DEBE tener EXACTAMENTE UNO de los siguientes:
 *   - clientRef: para clientes registrados en el sistema (requiere docID válido)
 *   - guest: para clientes no registrados (requiere fullname)
 * 
 * - appliedCoupons: array de descuentos aplicados a la reserva
 *   - consumed: true cuando se ha pagado con este cupón
 * 
 * - Estados posibles:
 *   - 'pendiente': creada, no confirmada
 *   - 'confirmada': cliente confirmó, puede crear órdenes
 *   - 'en_curso': mesa activa, sirviendo
 *   - 'completada': reserva finalizada, cuentas pagadas
 *   - 'cancelada': reserva cancelada
 */

const ReservationSchema = new Schema({
  appliedCoupons: [{
    discount_id: {
      type: String,
      required: true,
      trim: true
    },

    code: {
      type: String,
      required: true,
      trim: true,
      uppercase: true
    },

    name: {
      type: String,
      required: true,
      trim: true
    },

    type: {
      type: String,
      enum: ['percentage', 'fixed'],
      required: true
    },

    value: {
      type: Number,
      required: true
    },

    stackable: {
      type: Boolean,
      default: false
    },

    consumed: {
      type: Boolean,
      default: false
    },

    appliedBy: {
      type: String,
      trim: true
    },

    appliedAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  reservation_id: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  table_id: {
    type: String,
    required: true,
    trim: true
  },
  date: {
    type: String,
    required: true
  },
  startTime: {
    type: String,
    required: true
  },
  endTime: {
    type: String,
    required: true
  },
  peopleCount: {
    type: Number,
    required: true,
    min: 1
  },
  status: {
    type: String,
    enum: ['pendiente', 'confirmada', 'en_curso', 'completada', 'cancelada'],
    default: 'pendiente'
  },
  channel: {
    type: String,
    trim: true,
    description: 'Canal por el cual se realizó la reserva (teléfono, whatsapp, presencial, etc.)'
  },

  waiter_id: {
    type: String,
    trim: true,
    description: 'ID del mesero/staff asignado a la reserva'
  },
  clientRef: {
    fullname: String,
    docID: {
      type: String,
      description: 'Documento de identidad del cliente registrado'
    }
  },
  guest: {
    fullname: {
      type: String,
      description: 'Nombre del cliente no registrado'
    },
    phone: String,
    notes: String
  },
  notes: {
    type: String,
    trim: true
  }
}, {
  timestamps: true,
  collection: 'reservations'
})

/**
 * VALIDACIONES PRE-SAVE
 * Asegurar que clientRef y guest sean mutuamente excluyentes
 */
ReservationSchema.pre('save', function(next) {
  const hasClientRef = !!(this.clientRef && (this.clientRef.docID || this.clientRef.fullname))
  const hasGuest = !!(this.guest && (this.guest.fullname || this.guest.phone))

  if (hasClientRef && hasGuest) {
    return next(new Error('La reserva no puede tener clientRef y guest simultáneamente'))
  }

  if (!hasClientRef && !hasGuest) {
    return next(new Error('La reserva debe tener clientRef o guest'))
  }

  next()
})


ReservationSchema.index({ reservation_id: 1 }, { unique: true })
ReservationSchema.index({ table_id: 1, date: 1, startTime: 1, endTime: 1 })
ReservationSchema.index({ status: 1 })
ReservationSchema.index({ 'clientRef.docID': 1 })

module.exports = model('Reservation', ReservationSchema)