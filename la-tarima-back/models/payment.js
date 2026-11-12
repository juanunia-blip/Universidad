const { Schema, model } = require('mongoose')

const PaymentSchema = new Schema({
  payment_id: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },

  reservation_id: {
    type: String,
    required: true,
    trim: true
  },

  order_id: {
    type: String,
    trim: true
  },

  scope: {
    type: String,
    required: true,
    enum: ['order', 'reservation'],
    default: 'reservation'
  },

  amount: {
    type: Number,
    required: true,
    min: 0
  },

  method: {
    type: String,
    required: true,
    enum: ['efectivo', 'tarjeta', 'nequi', 'daviplata']
  },

  tip: {
    type: Number,
    default: 0,
    min: 0
  },

  status: {
    type: String,
    enum: ['aprobado', 'pendiente'],
    default: 'pendiente'
  },

  split: {
    part: {
      type: Number,
      min: 1
    },
    totalParts: {
      type: Number,
      min: 1
    }
  }
}, {
  timestamps: true
})

// Validaciones personalizadas
PaymentSchema.pre('save', function(next) {
  // Validar que si existe split, part <= totalParts
  if (this.split && this.split.part && this.split.totalParts) {
    if (this.split.part > this.split.totalParts) {
      return next(new Error('El "part" no puede ser mayor que "totalParts"'))
    }
  }
  
  // Validar que si scope es 'order', order_id debe existir
  if (this.scope === 'order' && !this.order_id) {
    return next(new Error('order_id es obligatorio cuando scope es "order"'))
  }
  
  next()
})

PaymentSchema.index({ reservation_id: 1, status: 1 })
PaymentSchema.index({ order_id: 1, status: 1 })
PaymentSchema.index({ payment_id: 1 }, { unique: true })

module.exports = model('Payment', PaymentSchema)