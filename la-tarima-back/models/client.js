const { Schema, model } = require('mongoose')

const ClientSchema = new Schema({
  fullname: {
    type: String,
    required: true,
    trim: true,
    minlength: 3
  },
  phone: {
    type: String,
    trim: true,
    minlength: 7
  },
  address: {
    type: String,
    trim: true
  },
  docID: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    index: true
  },
  email: {
    type: String,
    trim: true,
    lowercase: true,
    validate: {
      validator: function(v) {
        if (!v) return true // Email es opcional
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)
      },
      message: 'Email debe ser un formato válido'
    }
  },
  notes: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
})

module.exports = model('Client', ClientSchema)