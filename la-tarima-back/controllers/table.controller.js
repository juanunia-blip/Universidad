const Table      = require('../models/table')
const Reservation = require('../models/reservation')
const generateId = require('../utils/generateId')

const ALLOWED_UPDATE_FIELDS = ['tableNumber', 'capacity', 'zone']

/**
 * CREATE TABLE
 */
exports.create = async (req, res) => {
  try {
    const { tableNumber, capacity, zone } = req.body

    if (tableNumber == null || capacity == null || !zone) {
      return res.status(400).json({ message: 'tableNumber, capacity y zone son obligatorios' })
    }

    const table_id = await generateId('table', 'TBL_')
    const table = new Table({ ...req.body, table_id })
    await table.save()

    res.status(201).json(table)
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ message: 'Ya existe una mesa con ese table_id' })
    }
    res.status(500).json({ message: 'Error al crear la mesa', error: error.message })
  }
}

/**
 * READ ALL TABLES
 */
exports.getAll = async (req, res) => {
  try {
    const page  = parseInt(req.query.page)  || 1
    const limit = Math.min(parseInt(req.query.limit) || 10, 100)
    const skip  = (page - 1) * limit

    const filter = req.query.showInactive === 'true' ? {} : { active: true }

    const [tables, total] = await Promise.all([
      Table.find(filter).sort({ tableNumber: 1 }).skip(skip).limit(limit),
      Table.countDocuments(filter)
    ])

    res.json({ total, page, pages: Math.ceil(total / limit), data: tables })
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener mesas', error: error.message })
  }
}

/**
 * READ TABLE BY ID
 */
exports.getById = async (req, res) => {
  try {
    const table = await Table.findOne({ table_id: req.params.table_id, active: true })
    if (!table) return res.status(404).json({ message: 'Mesa no encontrada' })
    res.json(table)
  } catch (error) {
    res.status(500).json({ message: 'Error al buscar mesa', error: error.message })
  }
}

/**
 * UPDATE TABLE
 */
exports.update = async (req, res) => {
  try {
    const updateData = {}
    ALLOWED_UPDATE_FIELDS.forEach(field => {
      if (req.body[field] !== undefined) updateData[field] = req.body[field]
    })

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ message: 'Debe enviar al menos un campo válido para actualizar' })
    }

    const table = await Table.findOneAndUpdate(
      { table_id: req.params.table_id, active: true },
      updateData,
      { new: true, runValidators: true }
    )

    if (!table) return res.status(404).json({ message: 'Mesa no encontrada' })
    res.json(table)
  } catch (error) {
    res.status(500).json({ message: 'Error al actualizar mesa', error: error.message })
  }
}

/**
 * DEACTIVATE TABLE (soft delete)
 */
exports.remove = async (req, res) => {
  try {
    const { table_id } = req.params

    const today = new Date().toISOString().split('T')[0]
    const activeReservation = await Reservation.findOne({
      table_id,
      date: { $gte: today },
      status: { $in: ['pendiente', 'confirmada', 'en_curso'] }
    })

    if (activeReservation) {
      return res.status(409).json({
        message: 'No se puede desactivar la mesa: tiene reservas futuras activas',
        nextReservation: {
          reservation_id: activeReservation.reservation_id,
          date: activeReservation.date,
          startTime: activeReservation.startTime,
          status: activeReservation.status
        }
      })
    }

    const table = await Table.findOneAndUpdate(
      { table_id, active: true },
      { active: false },
      { new: true }
    )

    if (!table) return res.status(404).json({ message: 'Mesa no encontrada' })

    res.json({ message: 'Mesa desactivada correctamente', table })
  } catch (error) {
    res.status(500).json({ message: 'Error al desactivar mesa', error: error.message })
  }
}