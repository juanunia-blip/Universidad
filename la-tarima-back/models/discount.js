const { Schema, model } = require('mongoose')

const AppliedReservationSchema = new Schema({
  reservation_id: {
    type: String,
    required: true,
    trim: true
  },

  consumed: {
    type: Boolean,
    default: false
  },

  consumedAt: {
    type: Date
  }
}, { _id: false })

const DiscountSchema = new Schema({
  discount_id: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },

  name: {
    type: String,
    required: true,
    trim: true
  },

  kind: {
    type: String,
    required: true,
    enum: ['automatic', 'coupon']
  },

  code: {
    type: String,
    trim: true,
    uppercase: true,
    sparse: true
  },

  type: {
    type: String,
    required: true,
    enum: ['percentage', 'fixed']
  },

  value: {
    type: Number,
    required: true,
    min: 0
  },

  clientDocID: {
    type: String,
    trim: true
  },

  validFrom: {
    type: Date,
    required: true
  },

  validUntil: {
    type: Date,
    required: true
  },

  maxUses: {
    type: Number,
    min: 1
  },

  usedCount: {
    type: Number,
    default: 0,
    min: 0
  },

  active: {
    type: Boolean,
    default: true
  },

  stackable: {
    type: Boolean,
    default: false
  },

  appliedReservations: [AppliedReservationSchema]
}, {
  timestamps: true
})

DiscountSchema.index({ code: 1 }, { unique: true, sparse: true })
DiscountSchema.index({ kind: 1, clientDocID: 1, active: 1 })
DiscountSchema.index({ validFrom: 1, validUntil: 1 })

module.exports = model('Discount', DiscountSchema)