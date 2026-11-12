const Counter = require('../models/counter')

/**
 * Genera un ID autoincremental con prefijo y ceros a la izquierda.
 *
 * @param {string} entity  - Nombre del contador (ej: 'order', 'payment')
 * @param {string} prefix  - Prefijo del ID (ej: 'ORD_', 'PAY_')
 * @param {number} digits  - Longitud numérica con padding (default: 4)
 * @returns {Promise<string>} - Ej: 'ORD_0001', 'PAY_0023'
 *
 * Usa findOneAndUpdate con upsert:true para crear el contador
 * si no existe, e $inc para incrementar atómicamente — seguro
 * incluso con múltiples peticiones concurrentes.
 */
const generateId = async (entity, prefix, digits = 4) => {
  const counter = await Counter.findByIdAndUpdate(
    entity,
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  )
  return `${prefix}${String(counter.seq).padStart(digits, '0')}`
}

module.exports = generateId