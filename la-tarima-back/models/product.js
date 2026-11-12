const { Schema, model } = require('mongoose')

const ProductSchema = new Schema({
  product_id: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },

  name: {
    type: String,
    required: true,
    trim: true,
    minlength: 2
  },

  category: {
    type: String,
    required: true,
    enum: ['bebida', 'comida', 'otro']
  },

  subcategory: {
    type: String,
    required: true,
    enum: [
      'coctel',
      'cerveza',
      'licor',
      'vino',
      'snack',
      'entradas',
      'platos_fuertes',
      'especialidades',
      'especial',
      'otro'
    ]
  },

  basePrice: {
    type: Number,
    required: true,
    min: 0
  },

  description: {
    type: String,
    trim: true
  },

  imageUrl: {
    type: String,
    trim: true
  },

  active: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
})

ProductSchema.index({ name: 1, active: 1 })
ProductSchema.index({ category: 1, subcategory: 1, active: 1 })

module.exports = model('Product', ProductSchema)