const Discount = require('../models/discount')
const generateId = require('../utils/generateId')

const ALLOWED_UPDATE_FIELDS = [
  'name',
  'type',
  'value',
  'clientDocID',
  'validFrom',
  'validUntil',
  'maxUses',
  'active',
  'stackable'
]

exports.create = async (req, res) => {
  try {
    const {
      name,
      kind,
      code,
      type,
      value,
      clientDocID,
      validFrom,
      validUntil,
      maxUses,
      stackable
    } = req.body

    if (!name || !kind || !type || value == null || !validFrom || !validUntil) {
      return res.status(400).json({
        message: 'name, kind, type, value, validFrom y validUntil son obligatorios'
      })
    }

    if (kind === 'coupon' && !code) {
      return res.status(400).json({
        message: 'Los cupones requieren code'
      })
    }

    if (kind === 'automatic' && !clientDocID) {
      return res.status(400).json({
        message: 'Los descuentos automáticos requieren clientDocID'
      })
    }

    const start = new Date(validFrom)
    const end = new Date(validUntil)

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return res.status(400).json({
        message: 'Fechas inválidas'
      })
    }

    if (start > end) {
      return res.status(400).json({
        message: 'validFrom no puede ser mayor que validUntil'
      })
    }

    const discount_id = await generateId('discount', 'DISC_')

    const discount = new Discount({
      discount_id,
      name,
      kind,
      code: code ? String(code).trim().toUpperCase() : undefined,
      type,
      value,
      clientDocID,
      validFrom: start,
      validUntil: end,
      maxUses,
      stackable: !!stackable
    })

    await discount.save()

    res.status(201).json(discount)
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        message: 'Ya existe un cupón con ese código'
      })
    }

    res.status(500).json({
      message: 'Error al crear descuento/cupón',
      error: error.message
    })
  }
}

exports.getAll = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1
    const limit = Math.min(parseInt(req.query.limit) || 10, 100)
    const skip = (page - 1) * limit

    const filter = {}

    if (req.query.kind) filter.kind = req.query.kind
    if (req.query.active != null) filter.active = req.query.active === 'true'
    if (req.query.clientDocID) filter.clientDocID = req.query.clientDocID
    if (req.query.code) filter.code = String(req.query.code).trim().toUpperCase()

    const [discounts, total] = await Promise.all([
      Discount.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
      Discount.countDocuments(filter)
    ])

    res.json({
      total,
      page,
      pages: Math.ceil(total / limit),
      data: discounts
    })
  } catch (error) {
    res.status(500).json({
      message: 'Error al obtener descuentos/cupones',
      error: error.message
    })
  }
}

exports.getById = async (req, res) => {
  try {
    const discount = await Discount.findOne({
      discount_id: req.params.discount_id
    })

    if (!discount) {
      return res.status(404).json({
        message: 'Descuento/cupón no encontrado'
      })
    }

    res.json(discount)
  } catch (error) {
    res.status(500).json({
      message: 'Error al buscar descuento/cupón',
      error: error.message
    })
  }
}

exports.update = async (req, res) => {
  try {
    const updateData = {}

    ALLOWED_UPDATE_FIELDS.forEach(field => {
      if (req.body[field] !== undefined) {
        updateData[field] = req.body[field]
      }
    })

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({
        message: 'Debe enviar al menos un campo válido para actualizar'
      })
    }

    const discount = await Discount.findOneAndUpdate(
      { discount_id: req.params.discount_id },
      updateData,
      { new: true, runValidators: true }
    )

    if (!discount) {
      return res.status(404).json({
        message: 'Descuento/cupón no encontrado'
      })
    }

    res.json(discount)
  } catch (error) {
    res.status(500).json({
      message: 'Error al actualizar descuento/cupón',
      error: error.message
    })
  }
}

exports.remove = async (req, res) => {
  try {
    const discount = await Discount.findOneAndUpdate(
      { discount_id: req.params.discount_id },
      { active: false },
      { new: true }
    )

    if (!discount) {
      return res.status(404).json({
        message: 'Descuento/cupón no encontrado'
      })
    }

    res.json({
      message: 'Descuento/cupón desactivado correctamente',
      discount
    })
  } catch (error) {
    res.status(500).json({
      message: 'Error al desactivar descuento/cupón',
      error: error.message
    })
  }
}