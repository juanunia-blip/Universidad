const { Schema, model } = require('mongoose')

const StaffSchema = new Schema({
  user_id: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  fullname: {
    type: String,
    required: true,
    trim: true,
    minlength: 3
  },
  role: {
    type: String,
    required: true,
    enum: ['waiter', 'manager', 'chef']
  },
  cellPhone: {
    type: String,
    trim: true
  },
  email: {
    type: String,
    trim: true,
    lowercase: true,
    unique: true,
    sparse: true,
    validate: {
      validator: function(v) {
        if (!v) return true // Email es opcional
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)
      },
      message: 'Email debe ser un formato válido'
    }
  },
  passwordHash: {
    type: String,
    trim: true
  },
  passwordSalt: {
    type: String,
    trim: true
  },
  verified: {
    type: Boolean,
    default: false
  },
  active: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true,
  collection: 'staff'
})

module.exports = model('Staff', StaffSchema)