const jwt = require('jsonwebtoken')
const Staff = require('../models/staff')
const generateId = require('../utils/generateId')
const { hashPassword, verifyPassword } = require('../utils/passwordHash')
const { sendEmail } = require('../utils/sendEmail')

const JWT_SECRET = process.env.JWT_SECRET || 'tarima-secret'
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '8h'
const EMAIL_VERIFICATION_EXPIRES_IN = process.env.EMAIL_VERIFICATION_EXPIRES_IN || '24h'
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173'

const createToken = (staff) => {
  return jwt.sign(
    {
      sub: staff.user_id,
      user_id: staff.user_id,
      name: staff.fullname,
      email: staff.email,
      role: staff.role
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  )
}

const createVerificationToken = (staff) => {
  return jwt.sign(
    {
      sub: staff.user_id,
      email: staff.email,
      type: 'verify-email'
    },
    JWT_SECRET,
    { expiresIn: EMAIL_VERIFICATION_EXPIRES_IN }
  )
}

exports.login = async (req, res) => {
  const { email, password } = req.body

  if (!email || !password) {
    return res.status(422).json({ message: 'Email y contraseña son obligatorios' })
  }

  try {
    const staff = await Staff.findOne({ email: email.toLowerCase(), active: true })

    if (!staff) {
      return res.status(401).json({ message: 'Usuario no encontrado' })
    }

    if (!staff.verified) {
      return res.status(403).json({ message: 'Cuenta no verificada. Revisa tu correo.' })
    }

    const hasPassword = Boolean(staff.passwordHash && staff.passwordSalt)
    const defaultPassword = process.env.ADMIN_PASSWORD || 'admin123'

    const passwordValid = hasPassword
      ? verifyPassword(password, staff.passwordSalt, staff.passwordHash)
      : password === defaultPassword

    if (!passwordValid) {
      return res.status(401).json({ message: 'Contraseña incorrecta' })
    }

    if (staff.role !== 'manager') {
      return res.status(401).json({ message: 'Solo el gerente puede iniciar sesión' })
    }

    const token = createToken(staff)
    const user = {
      user_id: staff.user_id,
      name: staff.fullname,
      email: staff.email,
      role: staff.role
    }

    res.json({
      token,
      user
    })
  } catch (error) {
    res.status(500).json({
      message: 'Error al procesar el inicio de sesión',
      error: error.message
    })
  }
}

exports.register = async (req, res) => {
  try {
    const { fullname, role, email, password, cellPhone } = req.body

    if (!fullname || !role || !email || !password) {
      return res.status(422).json({ message: 'fullname, role, email y password son obligatorios' })
    }

    const existingStaff = await Staff.findOne({ email: email.toLowerCase() })
    if (existingStaff) {
      return res.status(409).json({ message: 'Ya existe un usuario con ese email' })
    }

    const { salt, hash } = hashPassword(password)
    const user_id = await generateId('staff', 'USR_')

    const staff = new Staff({
      user_id,
      fullname,
      role,
      email: email.toLowerCase(),
      cellPhone,
      passwordHash: hash,
      passwordSalt: salt,
      verified: false
    })

    await staff.save()

    const verificationToken = createVerificationToken(staff)
    const verifyUrl = `${FRONTEND_URL}/verify?token=${encodeURIComponent(verificationToken)}`

    const emailSubject = 'Verifica tu cuenta en La Tarima'
    const emailText = `Hola ${fullname},\n\nGracias por registrarte en La Tarima. Haz clic en el siguiente enlace para verificar tu cuenta:\n\n${verifyUrl}\n\nSi no solicitaste este correo, ignóralo.`
    const emailHtml = `
      <p>Hola ${fullname},</p>
      <p>Gracias por registrarte en La Tarima. Haz clic en el siguiente enlace para verificar tu cuenta:</p>
      <p><a href="${verifyUrl}">Verificar mi cuenta</a></p>
      <p>Si no solicitaste este correo, ignóralo.</p>
    `

    const mailResult = await sendEmail({
      to: staff.email,
      subject: emailSubject,
      text: emailText,
      html: emailHtml
    })

    res.status(201).json({
      message: 'Cuenta creada. Revisa tu correo para verificar tu cuenta.',
      verificationUrl: mailResult.debug ? verifyUrl : undefined
    })
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        message: 'Ya existe un usuario con ese user_id o email'
      })
    }

    res.status(500).json({
      message: 'Error al crear usuario',
      error: error.message
    })
  }
}

exports.verifyEmail = async (req, res) => {
  const { token } = req.query

  if (!token) {
    return res.status(400).json({ message: 'Token de verificación requerido' })
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET)

    if (payload.type !== 'verify-email') {
      return res.status(401).json({ message: 'Token de verificación inválido' })
    }

    const staff = await Staff.findOne({ user_id: payload.sub, email: payload.email })
    if (!staff) {
      return res.status(404).json({ message: 'Usuario no encontrado' })
    }

    const authToken = createToken(staff)
    const user = {
      user_id: staff.user_id,
      name: staff.fullname,
      email: staff.email,
      role: staff.role
    }

    if (staff.verified) {
      return res.json({
        message: 'Cuenta ya estaba verificada',
        token: authToken,
        user
      })
    }

    staff.verified = true
    await staff.save()

    res.json({
      message: 'Cuenta verificada correctamente. Ahora puedes iniciar sesión.',
      token: authToken,
      user
    })
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'El token de verificación ha expirado.' })
    }
    res.status(401).json({ message: 'Token inválido o no autorizado' })
  }
}
