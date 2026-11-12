const nodemailer = require('nodemailer')

const SMTP_HOST = process.env.SMTP_HOST
const SMTP_PORT = parseInt(process.env.SMTP_PORT, 10) || 587
const SMTP_SECURE = process.env.SMTP_SECURE === 'true'
const SMTP_USER = process.env.SMTP_USER
const SMTP_PASS = process.env.SMTP_PASS
const EMAIL_FROM = process.env.EMAIL_FROM || 'no-reply@la-tarima.com'

const createTransporter = () => {
  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) {
    return null
  }

  return nodemailer.createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT,
    secure: SMTP_SECURE,
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASS
    }
  })
}

exports.sendEmail = async ({ to, subject, text, html }) => {
  const transporter = createTransporter()
  const mailOptions = {
    from: EMAIL_FROM,
    to,
    subject,
    text,
    html
  }

  if (!transporter) {
    console.warn('SMTP no configurado. Email simulado:')
    console.warn(mailOptions)
    return {
      success: true,
      debug: true,
      mailOptions
    }
  }

  const info = await transporter.sendMail(mailOptions)
  return { success: true, info }
}
