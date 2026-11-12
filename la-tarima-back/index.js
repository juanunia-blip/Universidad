require('dotenv').config()
const mongoose = require('mongoose')
const app = require('./app')

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/La_Tarima'
const PORT = process.env.PORT || 3000

mongoose.connect(MONGO_URI)
  .then(() => {
    console.log('✅ Database connected successfully')

    app.listen(PORT, () => {
      console.log(`🚀 Server running at http://localhost:${PORT}`)
      console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`)
    })
  })
  .catch(err => {
    console.error('❌ Database connection error:', err.message)
    process.exit(1)
  })