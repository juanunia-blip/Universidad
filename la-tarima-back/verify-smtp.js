require('dotenv').config()
const nodemailer = require('nodemailer')

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT, 10),
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
})

transporter.verify((err, success) => {
  if (err) {
    console.error('VERIFY_ERROR', err.message)
    process.exit(1)
  }
  console.log('VERIFY_OK')
  process.exit(0)
})
