const multer = require('multer')
const path = require('path')
const fs = require('fs')

const productsUploadDir = path.join(__dirname, '..', 'uploads', 'products')

if (!fs.existsSync(productsUploadDir)) {
  fs.mkdirSync(productsUploadDir, { recursive: true })
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, productsUploadDir)
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase()
    const uniqueName = `product-${Date.now()}-${Math.round(Math.random() * 1E9)}${ext}`
    cb(null, uniqueName)
  }
})

const fileFilter = (req, file, cb) => {
  const allowedMimeTypes = [
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/gif'
  ]

  if (!allowedMimeTypes.includes(file.mimetype)) {
    return cb(new Error('Solo se permiten imágenes JPG, PNG, WEBP o GIF'))
  }

  cb(null, true)
}

const uploadProductImage = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024
  }
})

module.exports = {
  uploadProductImage
}