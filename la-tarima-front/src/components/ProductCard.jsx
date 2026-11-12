import { Plus } from 'lucide-react'

const API_BASE_URL = 'http://localhost:3000'

const PLACEHOLDER = 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?w=400&q=80'

const getImageSrc = (imageUrl) => {
  if (!imageUrl) return PLACEHOLDER

  if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
    return imageUrl
  }

  if (imageUrl.startsWith('/uploads')) {
    return `${API_BASE_URL}${imageUrl}`
  }

  return imageUrl
}

export default function ProductCard({ product, onAdd }) {
  const fmt = (n) =>
    '$ ' + Number(n).toLocaleString('es-CO')

  return (
    <div className="product-card" onClick={() => onAdd(product)}>
      <img
        className="product-card-img"
        src={getImageSrc(product.imageUrl)}
        alt={product.name}
        onError={e => {
          e.currentTarget.onerror = null
          e.currentTarget.src = PLACEHOLDER
        }}
      />

      <div className="product-card-body">
        <div className="product-card-info">
          <div className="product-card-name">{product.name}</div>
          <div className="product-card-price">{fmt(product.basePrice)}</div>
        </div>

        <button
          className="btn-accent"
          onClick={e => {
            e.stopPropagation()
            onAdd(product)
          }}
          title="Agregar al pedido"
        >
          <Plus size={16} />
        </button>
      </div>
    </div>
  )
}