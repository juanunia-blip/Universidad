/**
 * Middleware global para manejo de errores
 * Debe ser el último middleware en app.js
 */
const errorHandler = (err, req, res, next) => {
  // Status code
  const statusCode = err.status || err.statusCode || 500

  // Mensaje de error
  let message = err.message || 'Error interno del servidor'

  // En producción, no mostrar detalles técnicos
  if (process.env.NODE_ENV === 'production') {
    if (statusCode === 500) {
      message = 'Error interno del servidor'
    }
  }

  // Validación de Mongoose
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      message: 'Error de validación',
      errors: Object.values(err.errors).map(e => ({
        field: e.path,
        message: e.message
      }))
    })
  }

  // Duplicate key (unique constraint)
  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern)[0]
    return res.status(409).json({
      message: `El valor de ${field} ya existe`,
      field
    })
  }

  // CastError (ID inválido)
  if (err.name === 'CastError') {
    return res.status(400).json({
      message: 'ID inválido'
    })
  }

  // Respuesta estándar
  res.status(statusCode).json({
    message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  })
}

module.exports = errorHandler
