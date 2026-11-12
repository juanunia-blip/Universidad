const { Schema, model } = require('mongoose')

const OrderSchema = new Schema({
  order_id: {
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
  clientHint: {
    type: String,
    trim: true,
    description: 'Nombre o descripción del cliente (para referencia rápida)'
  },
  status: {
    type: String,
    enum: [
      'abierto',
      'enviado_cocina',
      'en_preparacion',
      'listo',
      'servido',
      'cancelado'
    ],
    default: 'abierto'
  },
  items: [{
    product_id: { type: String, required: true },
    name:       { type: String, required: true, trim: true },
    quantity:   { type: Number, required: true, min: 1 },
    unitPrice:  { type: Number, required: true, min: 0 }
  }],
  totalAmount: {
    type: Number,
    default: 0,
    min: 0
  },
  subtotalAmount: {
    type: Number,
    default: 0,
    min: 0
  },
  notes: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
})

module.exports = model('Order', OrderSchema)