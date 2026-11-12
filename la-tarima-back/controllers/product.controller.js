const Product    = require('../models/product')
const Order      = require('../models/order')
const generateId = require('../utils/generateId')

const ALLOWED_UPDATE_FIELDS = [
  'name',
  'category',
  'subcategory',
  'basePrice',
  'description',
  'imageUrl'
]

/**
 * CREATE PRODUCT
 */

exports.create = async (req, res) => {
  try {
    console.log('BODY PRODUCT:', req.body)
    console.log('FILE PRODUCT:', req.file)
    const { name, category, subcategory, basePrice, description } = req.body

    if (!name || !category || !subcategory || basePrice == null) {
      return res.status(400).json({
        message: 'name, category, subcategory y basePrice son obligatorios'
      })
    }

    const product_id = await generateId('product', 'PROD_')

    const imageUrl = req.file
      ? `/uploads/products/${req.file.filename}`
      : undefined

    const product = new Product({
      product_id,
      name,
      category,
      subcategory,
      basePrice: Number(basePrice),
      description,
      imageUrl
    })

    await product.save()
    res.status(201).json(product)

  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        message: 'Ya existe un producto con ese product_id'
      })
    }

    res.status(500).json({
      message: 'Error al crear el producto',
      error: error.message
    })
  }
}

/**
 * READ ALL PRODUCTS
 */
exports.getAll = async (req, res) => {
  try {
    const page  = parseInt(req.query.page) || 1
    const limit = Math.min(parseInt(req.query.limit) || 10, 100)
    const skip  = (page - 1) * limit

    const filter = req.query.showInactive === 'true' ? {} : { active: true }

    if (req.query.category) {
      filter.category = req.query.category
    }

    if (req.query.subcategory) {
      filter.subcategory = req.query.subcategory
    }

    if (req.query.search) {
      filter.name = {
        $regex: req.query.search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'),
        $options: 'i'
      }
    }

    const [products, total] = await Promise.all([
      Product.find(filter).sort({ name: 1 }).skip(skip).limit(limit),
      Product.countDocuments(filter)
    ])

    res.json({
      total,
      page,
      pages: Math.ceil(total / limit),
      data: products
    })
  } catch (error) {
    res.status(500).json({
      message: 'Error al obtener productos',
      error: error.message
    })
  }
}

/**
 * READ PRODUCT BY ID
 */
exports.getById = async (req, res) => {
  try {
    const product = await Product.findOne({ product_id: req.params.product_id, active: true })
    if (!product) return res.status(404).json({ message: 'Producto no encontrado' })
    res.json(product)
  } catch (error) {
    res.status(500).json({ message: 'Error al buscar producto', error: error.message })
  }
}

/**
 * UPDATE PRODUCT
 */
exports.update = async (req, res) => {
  try {
    const updateData = {}

    ALLOWED_UPDATE_FIELDS.forEach(field => {
      if (req.body[field] !== undefined) {
        updateData[field] = req.body[field]
      }
    })

    if (updateData.basePrice !== undefined) {
      updateData.basePrice = Number(updateData.basePrice)
    }

    if (req.file) {
      updateData.imageUrl = `/uploads/products/${req.file.filename}`
    }

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({
        message: 'Debe enviar al menos un campo válido para actualizar'
      })
    }

    const product = await Product.findOneAndUpdate(
      { product_id: req.params.product_id, active: true },
      updateData,
      { new: true, runValidators: true }
    )

    if (!product) return res.status(404).json({ message: 'Producto no encontrado' })

    res.json(product)
  } catch (error) {
    res.status(500).json({
      message: 'Error al actualizar producto',
      error: error.message
    })
  }
}

/**
 * DEACTIVATE PRODUCT (soft delete)
 */
exports.remove = async (req, res) => {
  try {
    const { product_id } = req.params

    const activeOrder = await Order.findOne({
      status: 'abierto',
      'items.product_id': product_id
    })

    if (activeOrder) {
      return res.status(409).json({
        message: 'No se puede desactivar el producto: está en pedidos actualmente abiertos',
        order_id: activeOrder.order_id
      })
    }

    const product = await Product.findOneAndUpdate(
      { product_id, active: true },
      { active: false },
      { new: true }
    )

    if (!product) return res.status(404).json({ message: 'Producto no encontrado' })

    res.json({ message: 'Producto desactivado correctamente', product })
  } catch (error) {
    res.status(500).json({ message: 'Error al desactivar producto', error: error.message })
  }
}