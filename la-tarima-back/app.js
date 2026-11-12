require('dotenv').config()
const express = require('express')
const cors = require('cors')
const path = require('path')
const errorHandler = require('./middlewares/errorHandler.middleware')

const app = express()

/**
 * ===== SETTINGS =====
 */
app.set('port', process.env.PORT || 3000)

/**
 * ===== CORS =====
 */
const corsOrigin = process.env.CORS_ORIGIN || 'http://localhost:5173'
app.use(cors({ 
  origin: corsOrigin,
  credentials: true
}))

/**
 * ===== MIDDLEWARES =====
 */
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))
app.use('/uploads', express.static(path.join(__dirname, 'uploads')))

/**
 * ===== ROUTES =====
 */

// Authentication
app.use('/api/auth', require('./routes/auth.routes'))

// JWT Middleware - protege todas las rutas /api/* excepto /api/auth/*
const jwtMiddleware = require('./middlewares/jwt.middleware')
app.use('/api', jwtMiddleware)

// Business logic / reports
app.use('/api/reports', require('./routes/report.routes'))

// Core entities protegidas
app.use('/api/clients', require('./routes/client.routes'))
app.use('/api/products', require('./routes/product.routes'))
app.use('/api/tables', require('./routes/table.routes'))
app.use('/api/staff', require('./routes/staff.routes'))
app.use('/api/reservations', require('./routes/reservation.routes'))
app.use('/api/reservations-account', require('./routes/reservationAccount.routes'))
app.use('/api/orders', require('./routes/order.routes'))
app.use('/api/payments', require('./routes/payment.routes'))
app.use('/api/discounts', require('./routes/discount.routes'))

/**
 * ===== 404 HANDLER =====
 */
app.use((req, res) => {
  res.status(404).json({
    message: 'Recurso no encontrado'
  })
})

/**
 * ===== ERROR HANDLER (debe ser el último middleware) =====
 */
app.use(errorHandler)

module.exports = app