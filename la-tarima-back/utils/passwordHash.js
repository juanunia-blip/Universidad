const crypto = require('crypto')

const ITERATIONS = 120000
const KEYLEN = 64
const DIGEST = 'sha512'

exports.hashPassword = (password) => {
  const salt = crypto.randomBytes(16).toString('hex')
  const hash = crypto.pbkdf2Sync(password, salt, ITERATIONS, KEYLEN, DIGEST).toString('hex')
  return { salt, hash }
}

exports.verifyPassword = (password, salt, hash) => {
  if (!password || !salt || !hash) return false
  const computedHash = crypto.pbkdf2Sync(password, salt, ITERATIONS, KEYLEN, DIGEST).toString('hex')
  return crypto.timingSafeEqual(Buffer.from(computedHash, 'hex'), Buffer.from(hash, 'hex'))
}
