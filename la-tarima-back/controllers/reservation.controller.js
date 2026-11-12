const Reservation = require('../models/reservation')
const Table       = require('../models/table')
const Staff       = require('../models/staff')
const Client      = require('../models/client')
const generateId  = require('../utils/generateId')

const escapeRegex = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

const ALLOWED_FIELDS = [
  'table_id', 'date', 'startTime', 'endTime',
  'peopleCount', 'status', 'channel', 'clientRef',
  'guest', 'notes', 'waiter_id'
]

const timeToMinutes = (time) => {
  const [h, m] = String(time).split(':').map(Number)
  return h * 60 + m
}

const normalizeRange = (startTime, endTime) => {
  const start = timeToMinutes(startTime)
  let end = timeToMinutes(endTime)

  if (end <= start) {
    end += 24 * 60
  }

  return { start, end }
}

const rangesOverlap = (startA, endA, startB, endB) => {
  return startA < endB && endA > startB
}

const syncTableStatusByReservation = async (reservation) => {
  if (!reservation?.table_id) return

  let currentStatus = null

  if (reservation.status === 'confirmada') {
    currentStatus = 'reservada'
  }

  if (reservation.status === 'en_curso') {
    currentStatus = 'en_atencion'
  }

  if (reservation.status === 'completada') {
    currentStatus = 'limpieza'
  }

  if (reservation.status === 'cancelada') {
    currentStatus = 'libre'
  }

  if (currentStatus) {
    await Table.findOneAndUpdate(
      { table_id: reservation.table_id },
      { currentStatus }
    )
  }
}

const validateClientOrGuest = async ({ clientRef, guest }) => {
  const hasClientRef = !!(clientRef && (clientRef.docID || clientRef.fullname))
  const hasGuest = !!(guest && (guest.fullname || guest.phone))

  if (!hasClientRef && !hasGuest) {
    const err = new Error('Debe existir clientRef o guest')
    err.status = 400
    throw err
  }

  if (hasClientRef && hasGuest) {
    const err = new Error('La reserva no puede tener clientRef y guest al mismo tiempo')
    err.status = 400
    throw err
  }

  if (hasClientRef) {
    if (!clientRef.docID) {
      const err = new Error('clientRef.docID es obligatorio para cliente registrado')
      err.status = 400
      throw err
    }

    const client = await Client.findOne({ docID: clientRef.docID })

    if (!client) {
      const err = new Error('El cliente registrado no existe')
      err.status = 404
      throw err
    }

    return {
      clientRef: {
        fullname: client.fullname,
        docID: client.docID
      },
      guest: undefined
    }
  }

  return {
    clientRef: undefined,
    guest
  }
}

/**
 * CHECK TABLE AVAILABILITY
 */
exports.checkAvailability = async (req, res) => {
  try {
    const { table_id, date, startTime, endTime } = req.query

    if (!table_id || !date || !startTime || !endTime) {
      return res.status(400).json({ message: 'table_id, date, startTime y endTime son obligatorios' })
    }

    const table = await Table.findOne({ table_id, active: true })
    if (!table) {
      return res.status(404).json({ message: 'Mesa no encontrada o inactiva' })
    }

const requestedRange = normalizeRange(startTime, endTime)

const sameDayReservations = await Reservation.find({
  table_id,
  date,
  status: { $ne: 'cancelada' }
})

const conflict = sameDayReservations.find(existingReservation => {
  const existingRange = normalizeRange(
    existingReservation.startTime,
    existingReservation.endTime
  )

  return rangesOverlap(
    requestedRange.start,
    requestedRange.end,
    existingRange.start,
    existingRange.end
  )
})

    if (conflict) {
      return res.json({
        table_id, date, startTime, endTime,
        available: false,
        reason: 'La mesa está reservada en ese horario',
        conflictWith: {
          reservation_id: conflict.reservation_id,
          startTime: conflict.startTime,
          endTime: conflict.endTime,
          status: conflict.status
        }
      })
    }

    res.json({
      table_id, date, startTime, endTime,
      available: true,
      tableInfo: { capacity: table.capacity, zone: table.zone }
    })
  } catch (error) {
    res.status(500).json({ message: 'Error al verificar disponibilidad', error: error.message })
  }
}

/**
 * CREATE RESERVATION
 */
exports.create = async (req, res) => {
  try {
    const { table_id, date, startTime, endTime, peopleCount, clientRef, guest, waiter_id } = req.body

    const normalizedCustomer = await validateClientOrGuest({ clientRef, guest })

    const timeToMinutes = (time) => {
      const [h, m] = String(time).split(':').map(Number)
      return h * 60 + m
    }

    const normalizeRange = (startTime, endTime) => {
      const start = timeToMinutes(startTime)
      let end = timeToMinutes(endTime)

      if (end <= start) {
        end += 24 * 60
      }

      return { start, end }
    }

    const rangesOverlap = (startA, endA, startB, endB) => {
      return startA < endB && endA > startB
    }


    const table = await Table.findOne({ table_id, active: true })
    if (!table) {
      return res.status(404).json({ message: 'Mesa no encontrada o inactiva' })
    }

    if (peopleCount > table.capacity) {
      return res.status(400).json({
        message: `La cantidad de personas (${peopleCount}) excede la capacidad de la mesa (${table.capacity})`
      })
    }

    const { start, end } = normalizeRange(startTime, endTime)
    const duration = end - start

    if (duration < 30) {
      return res.status(400).json({
        message: 'La reserva debe tener una duración mínima de 30 minutos'
      })
    }

    if (duration > 480) {
      return res.status(400).json({
        message: 'La reserva no puede exceder 8 horas'
      })
    }

    if (waiter_id) {
      const staff = await Staff.findOne({ user_id: waiter_id })
      if (!staff) {
        return res.status(404).json({ message: 'El mesero indicado no existe' })
      }
      if (staff.role !== 'waiter') {
        return res.status(400).json({
          message: `El usuario ${waiter_id} tiene rol '${staff.role}', no puede ser asignado como mesero`
        })
      }
    }

    const sameDayReservations = await Reservation.find({
      table_id,
      date,
      status: { $ne: 'cancelada' }
    })

    const conflict = sameDayReservations.find(existingReservation => {
      const existingRange = normalizeRange(
        existingReservation.startTime,
        existingReservation.endTime
      )

      return rangesOverlap(start, end, existingRange.start, existingRange.end)
    })

    if (conflict) {
      return res.status(409).json({
        message: 'La mesa ya está reservada en ese horario',
        conflictWith: {
          reservation_id: conflict.reservation_id,
          startTime: conflict.startTime,
          endTime: conflict.endTime,
          status: conflict.status
        }
      })
    }

    const reservation_id = await generateId('reservation', 'RES_')
    const reservation = new Reservation({
      table_id,
      date,
      startTime,
      endTime,
      peopleCount,
      channel: req.body.channel,
      notes: req.body.notes,
      waiter_id,
      ...normalizedCustomer,
      reservation_id
    })
    await reservation.save()
    await syncTableStatusByReservation(reservation)

    res.status(201).json(reservation)
  } catch (error) {
    res.status(500).json({ message: 'Error al crear la reserva', error: error.message })
  }
}

/**
 * READ ALL + FILTERS
 */
exports.getAll = async (req, res) => {
  try {
    const filters = {}

    if (req.query.table_id)    filters.table_id    = req.query.table_id
    if (req.query.date)        filters.date        = req.query.date
    if (req.query.startTime)   filters.startTime   = req.query.startTime
    if (req.query.endTime)     filters.endTime     = req.query.endTime
    if (req.query.peopleCount) filters.peopleCount = Number(req.query.peopleCount)
    if (req.query.status)      filters.status      = req.query.status
    if (req.query.channel)     filters.channel     = req.query.channel
    if (req.query.waiter_id)   filters.waiter_id   = req.query.waiter_id

    if (req.query.notes) {
      filters.notes = { $regex: escapeRegex(req.query.notes), $options: 'i' }
    }

    const page  = parseInt(req.query.page)  || 1
    const limit = Math.min(parseInt(req.query.limit) || 10, 100)
    const skip  = (page - 1) * limit

    const [reservations, total] = await Promise.all([
      Reservation.find(filters).sort({ date: 1, startTime: 1 }).skip(skip).limit(limit),
      Reservation.countDocuments(filters)
    ])

    res.json({ total, page, pages: Math.ceil(total / limit), data: reservations })
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener reservas', error: error.message })
  }
}

/**
 * READ ONE
 */
exports.getById = async (req, res) => {
  try {
    const reservation = await Reservation.findOne({ reservation_id: req.params.reservation_id })
    if (!reservation) return res.status(404).json({ message: 'Reserva no encontrada' })
    res.json(reservation)
  } catch (error) {
    res.status(500).json({ message: 'Error al buscar reserva', error: error.message })
  }
}

/**
 * UPDATE FULL (PUT) / PARTIAL (PATCH)
 */
const performUpdate = async (req, res) => {
  try {
    if (req.body.reservation_id) {
      return res.status(400).json({ message: 'No se puede modificar el reservation_id' })
    }

    const updateData = {}
    ALLOWED_FIELDS.forEach(field => {
      if (req.body[field] !== undefined) updateData[field] = req.body[field]
    })

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ message: 'Debe enviar al menos un campo válido' })
    }

    const start = updateData.startTime
    const end = updateData.endTime

    if (start && end) {
      const updatedRange = normalizeRange(start, end)
      const duration = updatedRange.end - updatedRange.start

      if (duration < 30) {
        return res.status(400).json({
          message: 'La reserva debe tener una duración mínima de 30 minutos'
        })
      }

      if (duration > 480) {
        return res.status(400).json({
          message: 'La reserva no puede exceder 8 horas'
        })
      }
    }

    if (updateData.waiter_id) {
      const staff = await Staff.findOne({ user_id: updateData.waiter_id })
      if (!staff) {
        return res.status(404).json({ message: 'El mesero indicado no existe' })
      }
      if (staff.role !== 'waiter') {
        return res.status(400).json({
          message: `El usuario ${updateData.waiter_id} tiene rol '${staff.role}', no puede ser asignado como mesero`
        })
      }
    }
    const currentReservation = await Reservation.findOne({
  reservation_id: req.params.reservation_id
})

    if (!currentReservation) {
      return res.status(404).json({
        message: 'Reserva no encontrada'
      })
    }

    if (['completada', 'cancelada'].includes(currentReservation.status)) {
      return res.status(409).json({
        message: 'No se puede modificar una reserva completada o cancelada'
      })
    }
  const finalTableId = updateData.table_id || currentReservation.table_id
const finalDate = updateData.date || currentReservation.date
const finalStartTime = updateData.startTime || currentReservation.startTime
const finalEndTime = updateData.endTime || currentReservation.endTime

const finalRange = normalizeRange(finalStartTime, finalEndTime)
const finalDuration = finalRange.end - finalRange.start

if (finalDuration < 30) {
  return res.status(400).json({
    message: 'La reserva debe tener una duración mínima de 30 minutos'
  })
}

if (finalDuration > 480) {
  return res.status(400).json({
    message: 'La reserva no puede exceder 8 horas'
  })
}

const conflictingReservations = await Reservation.find({
  reservation_id: { $ne: req.params.reservation_id },
  table_id: finalTableId,
  date: finalDate,
  status: { $ne: 'cancelada' }
})

const conflict = conflictingReservations.find(existingReservation => {
  const existingRange = normalizeRange(
    existingReservation.startTime,
    existingReservation.endTime
  )

  return rangesOverlap(
    finalRange.start,
    finalRange.end,
    existingRange.start,
    existingRange.end
  )
})

if (conflict) {
  return res.status(409).json({
    message: 'La mesa ya está reservada en ese horario',
    conflictWith: {
      reservation_id: conflict.reservation_id,
      startTime: conflict.startTime,
      endTime: conflict.endTime,
      status: conflict.status
    }
  })
}

    if (updateData.clientRef || updateData.guest) {
      const normalizedCustomer = await validateClientOrGuest({
        clientRef: updateData.clientRef,
        guest: updateData.guest
      })

      updateData.clientRef = normalizedCustomer.clientRef
      updateData.guest = normalizedCustomer.guest
    }

    const reservation = await Reservation.findOneAndUpdate(
      { reservation_id: req.params.reservation_id },
      updateData,
      { new: true, runValidators: true }
    )

    if (!reservation) return res.status(404).json({ message: 'Reserva no encontrada' })

    await syncTableStatusByReservation(reservation)

    res.json(reservation)
  } catch (error) {
    res.status(500).json({ message: 'Error al actualizar reserva', error: error.message })
  }
}

exports.update        = performUpdate
exports.updatePartial = performUpdate

/**
 * DELETE = cancelación lógica
 */
exports.remove = async (req, res) => {
  try {
    const reservation = await Reservation.findOneAndUpdate(
      { reservation_id: req.params.reservation_id },
      { status: 'cancelada' },
      { new: true }
    )

    if (!reservation) return res.status(404).json({ message: 'Reserva no encontrada' })

    await syncTableStatusByReservation(reservation)

    res.json({ message: 'Reserva cancelada correctamente', reservation })
  } catch (error) {
    res.status(500).json({ message: 'Error al cancelar reserva', error: error.message })
  }
}