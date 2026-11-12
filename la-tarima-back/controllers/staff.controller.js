const Staff      = require('../models/staff')
const generateId = require('../utils/generateId')

const ALLOWED_UPDATE_FIELDS = ['fullname', 'role', 'cellPhone', 'email']

/**
 * CREATE STAFF
 */
exports.create = async (req, res) => {
  try {
    const { fullname, role } = req.body

    if (!fullname || !role) {
      return res.status(400).json({
        message: 'fullname y role son obligatorios'
      })
    }

    const user_id = await generateId('staff', 'USR_')

    const staff = new Staff({ ...req.body, user_id })
    await staff.save()

    res.status(201).json(staff)
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        message: 'Ya existe un usuario con ese user_id'
      })
    }

    res.status(500).json({
      message: 'Error al crear usuario',
      error: error.message
    })
  }
}

/**
  * READ ALL STAFF
 */
exports.getAll = async (req, res) => {
  try {
    const page  = parseInt(req.query.page)  || 1
    const limit = Math.min(parseInt(req.query.limit) || 10, 100)
    const skip  = (page - 1) * limit
    const filter = {}

    if (req.query.active != null) {
      filter.active = req.query.active === 'true'
    }

    const [staff, total] = await Promise.all([
      Staff.find(filter)
        .sort({ fullname: 1 })
        .skip(skip)
        .limit(limit),
      Staff.countDocuments(filter)
    ])

    res.json({ total, page, pages: Math.ceil(total / limit), data: staff })
  } catch (error) {
    res.status(500).json({
      message: 'Error al obtener personal',
      error: error.message
    })
  }
}

/**
 * READ STAFF BY ID
 */
exports.getById = async (req, res) => {
  try {
    const staff = await Staff.findOne({ user_id: req.params.user_id })

    if (!staff) {
      return res.status(404).json({ message: 'Usuario no encontrado' })
    }

    res.json(staff)
  } catch (error) {
    res.status(500).json({
      message: 'Error al buscar usuario',
      error: error.message
    })
  }
}

/**
 * UPDATE STAFF (PATCH)
 */
exports.update = async (req, res) => {
  try {
    const updateData = {}
    ALLOWED_UPDATE_FIELDS.forEach(field => {
      if (req.body[field] !== undefined) updateData[field] = req.body[field]
    })

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({
        message: 'Debe enviar al menos un campo válido para actualizar'
      })
    }

    const staff = await Staff.findOneAndUpdate(
      { user_id: req.params.user_id },
      updateData,
      { new: true, runValidators: true }
    )

    if (!staff) {
      return res.status(404).json({ message: 'Usuario no encontrado' })
    }

    res.json(staff)
  } catch (error) {
    res.status(500).json({
      message: 'Error al actualizar usuario',
      error: error.message
    })
  }
}

/**
 * DELETE STAFF
 */
exports.remove = async (req, res) => {
  try {
    const staff = await Staff.findOneAndUpdate(
      { user_id: req.params.user_id },
      { active: false },
      { new: true }
    )

    if (!staff) {
      return res.status(404).json({ message: 'Usuario no encontrado' })
    }

    res.json({ message: 'Usuario marcado como inactivo', data: staff })
  } catch (error) {
    res.status(500).json({
      message: 'Error al eliminar usuario',
      error: error.message
    })
  }
}