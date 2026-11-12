const { Schema, model } = require('mongoose')

// Colección compartida que guarda el contador de cada entidad.
// Cada documento tiene como _id el nombre de la entidad (ej: 'order', 'payment')
// y un campo seq que se incrementa atómicamente con $inc.
const CounterSchema = new Schema({
  _id: { type: String, required: true },   // nombre de la entidad
  seq: { type: Number, default: 0 }
})

module.exports = model('Counter', CounterSchema)