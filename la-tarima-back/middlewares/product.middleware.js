const { body, param } = require('express-validator')

const categories = ['bebida', 'comida', 'otro']

const subcategories = [
  'coctel',
  'cerveza',
  'licor',
  'vino',
  'snack',
  'entradas',
  'platos_fuertes',
  'especialidades',
  'especial',
  'otro'
]
exports.validateCreateProduct = [
  body('product_id')
    .not()
    .exists()
    .withMessage('No se debe enviar product_id'),

  body('name')
    .trim()
    .notEmpty().withMessage('name es obligatorio')
    .isLength({ min: 2 }).withMessage('name muy corto'),

  body('category')
    .isIn(categories)
    .withMessage(`category inválida — valores: ${categories.join(', ')}`),

  body('subcategory')
    .isIn(subcategories)
    .withMessage(`subcategory inválida — valores: ${subcategories.join(', ')}`),

  body('basePrice')
    .isFloat({ min: 0 }).withMessage('basePrice inválido'),

  body('description')
    .optional()
    .trim(),

  body('imageUrl')
    .optional()
    .trim()
    .isURL()
    .withMessage('imageUrl debe ser una URL válida')
]

exports.validateUpdateProduct = [
  body('product_id')
    .not()
    .exists()
    .withMessage('No se puede modificar el product_id'),

  body().custom((value) => {
    if (!value || Object.keys(value).length === 0) {
      throw new Error('Debe enviar al menos un campo para actualizar')
    }
    return true
  }),

  body('name')
    .optional()
    .trim()
    .isLength({ min: 2 }).withMessage('name muy corto'),

  body('category')
    .optional()
    .isIn(categories)
    .withMessage(`category inválida — valores: ${categories.join(', ')}`),

  body('subcategory')
    .optional()
    .isIn(subcategories)
    .withMessage(`subcategory inválida — valores: ${subcategories.join(', ')}`),

  body('basePrice')
    .optional()
    .isFloat({ min: 0 }).withMessage('basePrice inválido'),

  body('description')
    .optional()
    .trim(),

  body('imageUrl')
    .optional()
    .trim()
    .isURL()
    .withMessage('imageUrl debe ser una URL válida')
]

exports.validateProductParam = [
  param('product_id')
    .notEmpty()
    .withMessage('product_id es obligatorio en la URL')
]