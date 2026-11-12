import { useState, useEffect, useCallback } from 'react'
import {
  Search, Plus, X, Edit2, Trash2,
  Package, Coffee, UtensilsCrossed, Tag,
  ToggleLeft, ToggleRight, ImageOff
} from 'lucide-react'
import api from '../Api/axios'

// ─── CONSTANTS ────────────────────────────────────────────────
const CATEGORY_CONFIG = {
  comida: { label: 'Comida',  color: '#92400E', bg: '#FEF3C7', icon: UtensilsCrossed },
  bebida: { label: 'Bebida',  color: '#1E40AF', bg: '#DBEAFE', icon: Coffee },
}

const SUBCATEGORY_OPTIONS = {
  comida: [
    { value: 'snack', label: 'Snack' },
    { value: 'entradas', label: 'Entradas' },
    { value: 'platos_fuertes', label: 'Platos fuertes' },
    { value: 'especialidades', label: 'Especialidades' },
    { value: 'otro', label: 'Otro' },
  ],
  bebida: [
    { value: 'coctel', label: 'Cóctel' },
    { value: 'cerveza', label: 'Cerveza' },
    { value: 'licor', label: 'Licor' },
    { value: 'vino', label: 'Vino' },
    { value: 'otro', label: 'Otro' },
  ],
  otro: [
    { value: 'otro', label: 'Otro' },
  ]
}

const SAMPLE_PRODUCTS = [
  { product_id: 'PROD_0001', name: 'Bandeja Paisa',      category: 'comida', subcategory: 'platos_fuertes', basePrice: 25000, active: true,  description: 'Plato típico colombiano con frijoles, arroz, chicharrón, huevo y aguacate.',  imageUrl: 'https://images.unsplash.com/photo-1565299507177-b0ac66763828?w=500&q=80' },
  { product_id: 'PROD_0002', name: 'Mojito Clásico',     category: 'bebida', subcategory: 'coctel',        basePrice: 32000, active: true,  description: 'Ron blanco, limón, menta fresca, azúcar y agua con gas.',                      imageUrl: 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?w=500&q=80' },
  { product_id: 'PROD_0003', name: 'Alitas BBQ',         category: 'comida', subcategory: 'snack',          basePrice: 24000, active: true,  description: 'Alitas de pollo bañadas en salsa BBQ artesanal, con aderezo ranch.',          imageUrl: 'https://images.unsplash.com/photo-1527477396000-e27163b481c2?w=500&q=80' },
  { product_id: 'PROD_0004', name: 'Cerveza Corona',     category: 'bebida', subcategory: 'cerveza',        basePrice: 12000, active: true,  description: 'Cerveza mexicana tipo lager, fría y refrescante.',                           imageUrl: 'https://images.unsplash.com/photo-1608270586620-248524c67de9?w=500&q=80' },
  { product_id: 'PROD_0005', name: 'Nachos Mixtos',      category: 'comida', subcategory: 'snack',          basePrice: 26000, active: true,  description: 'Totopos con queso fundido, guacamole, jalapeños y crema agria.',             imageUrl: 'https://images.unsplash.com/photo-1513456852971-30c0b8199d4d?w=500&q=80' },
  { product_id: 'PROD_0006', name: 'Limonada Natural',   category: 'bebida', subcategory: 'otro',           basePrice: 8000,  active: true,  description: 'Limonada hecha con limones frescos, azúcar y hielo.',                       imageUrl: 'https://images.unsplash.com/photo-1621263764928-df1444c5e859?w=500&q=80' },
  { product_id: 'PROD_0007', name: 'Tabla de Quesos',    category: 'comida', subcategory: 'especialidades', basePrice: 38000, active: false, description: 'Selección de quesos artesanales con miel, nueces y mermelada de higos.',     imageUrl: 'https://images.unsplash.com/photo-1452195100486-9cc805987862?w=500&q=80' },
  { product_id: 'PROD_0008', name: 'Whisky Old Fashioned',category:'bebida', subcategory: 'licor',           basePrice: 38000, active: true,  description: 'Whisky bourbon, azúcar, angostura y cáscara de naranja.',                   imageUrl: 'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?w=500&q=80' },
]

const EMPTY_FORM = {
  name: '',
  category: 'comida',
  subcategory: 'snack',
  basePrice: '',
  description: '',
  imageFile: null,
  imagePreview: ''
}

// ─── HELPERS ──────────────────────────────────────────────────
const fmt = (n) => '$ ' + Number(n).toLocaleString('es-CO')

const API_BASE_URL = 'http://localhost:3000'

const getImageSrc = (imageUrl) => {
  if (!imageUrl) return ''

  if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
    return imageUrl
  }

  if (imageUrl.startsWith('/uploads')) {
    return `${API_BASE_URL}${imageUrl}`
  }

  return imageUrl
}

// ─── BADGE ────────────────────────────────────────────────────
function CategoryBadge({ category }) {
  const cfg = CATEGORY_CONFIG[category] || { label: category, color: '#666', bg: '#F3F4F6', icon: Tag }
  const Icon = cfg.icon
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      padding: '3px 10px', borderRadius: 99,
      background: cfg.bg, color: cfg.color,
      fontSize: 12, fontWeight: 600,
      border: `1px solid ${cfg.color}25`
    }}>
      <Icon size={11} />
      {cfg.label}
    </span>
  )
}

// ─── MODAL ────────────────────────────────────────────────────
function Modal({ title, onClose, children, maxWidth = 560 }) {
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      background: 'rgba(0,0,0,0.45)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 24, backdropFilter: 'blur(2px)'
    }} onClick={onClose}>
      <div style={{
        background: 'var(--bg-card)', borderRadius: 16,
        width: '100%', maxWidth,
        maxHeight: '90vh', overflowY: 'auto',
        boxShadow: '0 24px 64px rgba(0,0,0,0.18)',
        animation: 'modalIn 0.18s ease'
      }} onClick={e => e.stopPropagation()}>
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '22px 24px 18px', borderBottom: '1.5px solid var(--border)'
        }}>
          <span style={{ fontFamily: 'var(--font-display)', fontSize: 22, letterSpacing: 0.3 }}>
            {title}
          </span>
          <button onClick={onClose} style={{
            background: 'none', border: 'none', cursor: 'pointer',
            color: 'var(--text-secondary)', display: 'flex', padding: 4
          }}>
            <X size={18} />
          </button>
        </div>
        <div style={{ padding: '20px 24px 24px' }}>{children}</div>
      </div>
    </div>
  )
}

// ─── FIELD ────────────────────────────────────────────────────
function Field({ label, required, children }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={{
        display: 'block', fontSize: 11, fontWeight: 700,
        color: 'var(--text-secondary)', marginBottom: 5,
        textTransform: 'uppercase', letterSpacing: '0.5px'
      }}>
        {label}{required && <span style={{ color: 'var(--accent)', marginLeft: 2 }}>*</span>}
      </label>
      {children}
    </div>
  )
}

const inputStyle = {
  width: '100%', padding: '10px 12px',
  border: '1.5px solid var(--border)', borderRadius: 8,
  fontSize: 14, fontFamily: 'var(--font-body)',
  outline: 'none', background: 'var(--bg-panel)',
  color: 'var(--text-primary)', boxSizing: 'border-box',
  transition: 'border-color 0.15s'
}

// ─── PRODUCT FORM MODAL ───────────────────────────────────────
function ProductFormModal({ initial, onClose, onSave }) {
  const [form, setForm] = useState(() => {
  if (initial) {
    return {
      ...initial,
      imageFile: null,
      imagePreview: initial.imageUrl || ''
    }
  }

  return EMPTY_FORM
})
  const [saving, setSaving] = useState(false)
  const [error, setError]   = useState('')
  const isEdit = !!initial?.product_id

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))
  const handleCategoryChange = (category) => {
  const defaultSubcategory = SUBCATEGORY_OPTIONS[category]?.[0]?.value || 'otro'

  setForm(f => ({
    ...f,
    category,
    subcategory: defaultSubcategory
  }))
}

  const handleImageChange = (file) => {
    console.log('Archivo seleccionado:', file)
    if (!file) return

    if (!file.type.startsWith('image/')) {
      setError('El archivo debe ser una imagen')
      return
    }

    const previewUrl = URL.createObjectURL(file)

    setForm(f => ({
      ...f,
      imageFile: file,
      imagePreview: previewUrl
    }))
  }

  const handleSubmit = async () => {
    setError('')
    if (!form.name?.trim())    return setError('El nombre es obligatorio')
    if (!form.category) return setError('Selecciona una categoría')
    if (!form.subcategory) return setError('Selecciona una subcategoría')

    if (!form.basePrice || isNaN(Number(form.basePrice)) || Number(form.basePrice) < 0) {
      return setError('El precio debe ser un número mayor o igual a 0')
    }
    setSaving(true)
    try {
      await onSave(form)
      onClose()
    } catch (e) {
      const details = e.response?.data?.errors
        ?.map(error => `${error.field}: ${error.message}`)
        .join('\n')

      const msg =
        e.response?.data?.message ||
        e.message ||
        'Error al guardar'

      setError(details ? `${msg}\n${details}` : msg)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal title={isEdit ? 'Editar producto' : 'Nuevo producto'} onClose={onClose} maxWidth={600}>
      {error && (
        <div style={{
          background: '#FEE2E2', border: '1px solid #FECACA',
          borderRadius: 8, padding: '10px 14px', marginBottom: 16,
          fontSize: 13, color: '#B91C1C', display: 'flex', alignItems: 'center', gap: 8
        }}>
          <X size={13} /> {error}
        </div>
      )}

      {/* Preview de imagen */}
      <div style={{ marginBottom: 18 }}>
        <div style={{
          width: '100%', height: 180, borderRadius: 10,
          border: '1.5px dashed var(--border)',
          overflow: 'hidden', background: 'var(--bg-main)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          position: 'relative'
        }}>
          {form.imagePreview ? (
            <img
              src={getImageSrc(form.imagePreview)}
              alt="preview"
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              onError={e => { e.target.style.display = 'none' }}
            />
          ) : (
            <div style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>
              <ImageOff size={32} style={{ opacity: 0.3, marginBottom: 6 }} />
              <div style={{ fontSize: 12 }}>Sin imagen</div>
            </div>
          )}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
        <div style={{ gridColumn: '1 / -1' }}>
          <Field label="Nombre del producto" required>
            <input style={inputStyle} value={form.name}
              onChange={e => set('name', e.target.value)}
              placeholder="Ej: Bandeja Paisa" />
          </Field>
        </div>

        <Field label="Categoría" required>
          <select
            style={{ ...inputStyle, cursor: 'pointer', appearance: 'auto' }}
            value={form.category}
            onChange={e => handleCategoryChange(e.target.value)}
          >
            <option value="">Seleccionar...</option>
            <option value="comida">🍽️ Comida</option>
            <option value="bebida">🥤 Bebida</option>
          </select>
        </Field>
        <Field label="Subcategoría" required>
          <select
            style={{ ...inputStyle, cursor: 'pointer', appearance: 'auto' }}
            value={form.subcategory || ''}
            onChange={e => set('subcategory', e.target.value)}
          >
            <option value="">Seleccionar...</option>
            {(SUBCATEGORY_OPTIONS[form.category] || []).map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Precio base" required>
          <input style={inputStyle} type="number" min={0} value={form.basePrice}
            onChange={e => set('basePrice', e.target.value)}
            placeholder="25000" />
        </Field>

        <div style={{ gridColumn: '1 / -1' }}>
          <Field label="Imagen del producto">
            <input
              style={inputStyle}
              type="file"
              accept="image/png,image/jpeg,image/webp,image/gif"
              onChange={e => handleImageChange(e.target.files?.[0])}
            />
            <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 6 }}>
              Formatos permitidos: JPG, PNG, WEBP o GIF. Máximo 5 MB.
            </div>
          </Field>
        </div>

        <div style={{ gridColumn: '1 / -1' }}>
          <Field label="Descripción">
            <textarea
              style={{ ...inputStyle, resize: 'vertical', minHeight: 72 }}
              value={form.description || ''}
              onChange={e => set('description', e.target.value)}
              placeholder="Describe los ingredientes o características del producto..." />
          </Field>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
        <button className="btn-secondary" onClick={onClose} style={{ flex: 1 }}>
          Cancelar
        </button>
        <button className="btn-primary" onClick={handleSubmit}
          disabled={saving} style={{ flex: 2, opacity: saving ? 0.7 : 1 }}>
          {saving ? 'Guardando...' : isEdit ? 'Guardar cambios' : 'Crear producto'}
        </button>
      </div>
    </Modal>
  )
}

// ─── CONFIRM MODAL ────────────────────────────────────────────
function ConfirmModal({ product, onClose, onConfirm }) {
  const [loading, setLoading] = useState(false)
  return (
    <Modal title="Desactivar producto" onClose={onClose} maxWidth={420}>
      <div style={{ textAlign: 'center', padding: '8px 0 20px' }}>
        {product.imageUrl && (
          <img
            src={getImageSrc(product.imageUrl)}
            alt={product.name}
            style={{ width: 80, height: 80, borderRadius: 12, objectFit: 'cover', marginBottom: 14 }}
            onError={e => { e.target.style.display = 'none' }}
          />
        )}
        <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 6 }}>
          ¿Desactivar <span style={{ color: 'var(--accent)' }}>{product.name}</span>?
        </div>
        <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
          El producto no aparecerá en el catálogo de órdenes, pero los reportes históricos se conservan.
        </div>
      </div>
      <div style={{ display: 'flex', gap: 10 }}>
        <button className="btn-secondary" onClick={onClose} style={{ flex: 1 }}>Cancelar</button>
        <button
          onClick={async () => { setLoading(true); await onConfirm(); setLoading(false) }}
          disabled={loading}
          style={{
            flex: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            background: '#EF4444', color: '#fff', border: 'none',
            borderRadius: 8, padding: '13px 20px', fontSize: 15, fontWeight: 600,
            cursor: 'pointer', opacity: loading ? 0.7 : 1
          }}>
          <Trash2 size={15} />
          {loading ? 'Desactivando...' : 'Sí, desactivar'}
        </button>
      </div>
    </Modal>
  )
}

// ─── FILTER PILL ──────────────────────────────────────────────
function FilterPill({ value, label, active, activeColor, activeBg, onClick }) {
  return (
    <button onClick={onClick} style={{
      padding: '8px 16px', borderRadius: 8, cursor: 'pointer',
      fontFamily: 'var(--font-body)', fontSize: 13,
      fontWeight: active ? 600 : 400, transition: 'all 0.12s',
      border: active ? `1.5px solid ${activeColor}` : '1.5px solid var(--border)',
      background: active ? activeBg : 'var(--bg-panel)',
      color: active ? activeColor : 'var(--text-secondary)',
    }}>
      {label}
    </button>
  )
}

// ─── PRODUCT CARD ─────────────────────────────────────────────
function ProductCard({ product, onEdit, onDelete, index }) {
  const [imgErr, setImgErr] = useState(false)
  const cfg = CATEGORY_CONFIG[product.category] || CATEGORY_CONFIG.comida

  return (
    <div style={{
      background: 'var(--bg-card)',
      border: '1.5px solid var(--border-light)',
      borderRadius: 14, overflow: 'hidden',
      display: 'flex', flexDirection: 'column',
      opacity: product.active === false ? 0.55 : 1,
      transition: 'box-shadow 0.15s, transform 0.15s',
      animation: `fadeIn 0.2s ease ${index * 0.04}s both`,
      position: 'relative'
    }}
      onMouseEnter={e => {
        e.currentTarget.style.boxShadow = '0 6px 24px rgba(0,0,0,0.10)'
        e.currentTarget.style.transform = 'translateY(-2px)'
      }}
      onMouseLeave={e => {
        e.currentTarget.style.boxShadow = 'none'
        e.currentTarget.style.transform = 'none'
      }}
    >
      {/* Inactive badge */}
      {product.active === false && (
        <div style={{
          position: 'absolute', top: 10, left: 10, zIndex: 2,
          background: '#374151', color: '#fff',
          fontSize: 10, fontWeight: 700, padding: '2px 8px',
          borderRadius: 99, textTransform: 'uppercase', letterSpacing: '0.5px'
        }}>
          Inactivo
        </div>
      )}

      {/* Botones de acción sobre la imagen */}
      <div style={{
        position: 'absolute', top: 10, right: 10, zIndex: 2,
        display: 'flex', gap: 6
      }}>
        <CardActionBtn icon={Edit2}  onClick={() => onEdit(product)}   bg="var(--bg-panel)" color="#F59E0B" title="Editar" />
        <CardActionBtn icon={Trash2} onClick={() => onDelete(product)} bg="var(--bg-panel)" color="#EF4444" title="Desactivar" />
      </div>

      {/* Imagen */}
      <div style={{
        width: '100%', aspectRatio: '4/3',
        background: 'var(--bg-main)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        overflow: 'hidden'
      }}>
        {product.imageUrl && !imgErr ? (
          <img
            src={getImageSrc(product.imageUrl)}
            alt={product.name}
            onError={() => setImgErr(true)}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        ) : (
          <div style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>
            <ImageOff size={36} style={{ opacity: 0.25 }} />
          </div>
        )}
      </div>

      {/* Info */}
      <div style={{ padding: '12px 14px 14px', flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.3 }}>
            {product.name}
          </div>
          <CategoryBadge category={product.category} />
        </div>

        {product.description && (
          <div style={{
            fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.4,
            display: '-webkit-box', WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical', overflow: 'hidden'
          }}>
            {product.description}
          </div>
        )}

        <div style={{ marginTop: 'auto', paddingTop: 8, borderTop: '1px solid var(--border-light)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 1 }}>Precio</div>
            <div style={{ fontSize: 17, fontWeight: 700, color: 'var(--text-primary)' }}>
              {fmt(product.basePrice)}
            </div>
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-secondary)', textAlign: 'right' }}>
            {product.product_id}
          </div>
        </div>
      </div>
    </div>
  )
}

function CardActionBtn({ icon: Icon, onClick, bg, color, title }) {
  const [hover, setHover] = useState(false)
  return (
    <button
      title={title}
      onClick={e => { e.stopPropagation(); onClick() }}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        width: 30, height: 30, borderRadius: 7,
        border: 'none', cursor: 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: hover ? color : bg,
        color: hover ? '#fff' : color,
        boxShadow: '0 2px 6px rgba(0,0,0,0.12)',
        transition: 'all 0.12s'
      }}>
      <Icon size={13} />
    </button>
  )
}

// ─── MAIN PAGE ────────────────────────────────────────────────
export default function Products() {
  const [products, setProducts]     = useState([])
  const [loading, setLoading]       = useState(true)
  const [search, setSearch]         = useState('')
  const [catFilter, setCatFilter]   = useState('todos')
  const [subcatFilter, setSubcatFilter] = useState('todos')
  const [activeFilter, setActiveFilter] = useState('activos')
  const [showForm, setShowForm]     = useState(false)
  const [editTarget, setEditTarget] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)

  const load = useCallback(() => {
    setLoading(true)
    api.get('/products?showInactive=true')
      .then(res => {
        const d = res.data?.data || res.data
        setProducts(Array.isArray(d) && d.length > 0 ? d : SAMPLE_PRODUCTS)
      })
      .catch(() => setProducts(SAMPLE_PRODUCTS))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { load() }, [load])

  useEffect(() => {
    setSubcatFilter('todos')
  }, [catFilter])

  const subcategoryOptions = (() => {
    if (catFilter === 'comida' || catFilter === 'bebida') {
      return SUBCATEGORY_OPTIONS[catFilter] || []
    }

    return Object.values(SUBCATEGORY_OPTIONS)
      .flat()
      .reduce((unique, item) => {
        if (!unique.some(entry => entry.value === item.value)) {
          unique.push(item)
        }
        return unique
      }, [])
  })()

  // Filtrar
  const filtered = products.filter(p => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase())
      || (p.description || '').toLowerCase().includes(search.toLowerCase())
      || p.product_id.toLowerCase().includes(search.toLowerCase())
    const matchCat = catFilter === 'todos' || p.category === catFilter
    const matchSubcat = subcatFilter === 'todos' || p.subcategory === subcatFilter
    const matchActive =
      activeFilter === 'todos'   ? true :
      activeFilter === 'activos' ? p.active !== false :
                                   p.active === false
    return matchSearch && matchCat && matchSubcat && matchActive
  })

  // Stats
  const activos   = products.filter(p => p.active !== false).length
  const inactivos = products.filter(p => p.active === false).length
  const comidas   = products.filter(p => p.category === 'comida' && p.active !== false).length
  const bebidas   = products.filter(p => p.category === 'bebida' && p.active !== false).length

  // ── CREATE ──
  const handleCreate = async (form) => {
    const payload = new FormData()

    payload.append('name', form.name.trim())
    payload.append('category', form.category)
    payload.append('subcategory', form.subcategory)
    payload.append('basePrice', Number(form.basePrice))

    if (form.description) {
      payload.append('description', form.description.trim())
    }

    if (form.imageFile) {
      payload.append('image', form.imageFile)
    }

    await api.post('/products', payload)

    load()
  }

  // ── EDIT ──
  const handleEdit = async (form) => {
    const { product_id } = form

    const payload = new FormData()

    payload.append('name', form.name?.trim())
    payload.append('category', form.category)
    payload.append('subcategory', form.subcategory)
    payload.append('basePrice', Number(form.basePrice))

    if (form.description !== undefined) {
      payload.append('description', form.description || '')
    }

    if (form.imageFile) {
      payload.append('image', form.imageFile)
    }

    await api.patch(`/products/${product_id}`, payload)

    load()
  }

  // ── DELETE (soft) ──
  const handleDelete = async () => {
    try {
      await api.delete(`/products/${deleteTarget.product_id}`)
      load()
    } catch {
      // Fallback demo
      setProducts(prev => prev.map(p =>
        p.product_id === deleteTarget.product_id ? { ...p, active: false } : p
      ))
    }
    setDeleteTarget(null)
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-main)', padding: 28 }}>
      <style>{`
        @keyframes fadeIn  { from { opacity:0; transform:translateY(5px) } to { opacity:1; transform:none } }
        @keyframes modalIn { from { opacity:0; transform:scale(0.97) }     to { opacity:1; transform:none } }
      `}</style>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 36, letterSpacing: 0.5, marginBottom: 4 }}>
            Productos
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>
            Administra el catálogo de comidas y bebidas
          </p>
        </div>
        <button
          className="btn-primary"
          style={{ width: 'auto', padding: '11px 20px' }}
          onClick={() => { setEditTarget(null); setShowForm(true) }}>
          <Plus size={16} /> Nuevo producto
        </button>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14, marginBottom: 24 }}>
        {[
          { label: 'Activos',   val: activos,   color: 'var(--text-primary)', bg: 'var(--bg-card)',    border: 'var(--border)' },
          { label: 'Comidas',   val: comidas,   color: '#92400E',             bg: '#FEF3C7', border: '#FDE68A' },
          { label: 'Bebidas',   val: bebidas,   color: '#1E40AF',             bg: '#DBEAFE', border: '#BFDBFE' },
          { label: 'Inactivos', val: inactivos, color: '#374151',             bg: '#F3F4F6', border: '#E5E7EB' },
        ].map(({ label, val, color, bg, border }) => (
          <div key={label} style={{
            background: bg, border: `1.5px solid ${border}`,
            borderRadius: 12, padding: '16px 20px',
            animation: 'fadeIn 0.25s ease both'
          }}>
            <div style={{ fontSize: 30, fontFamily: 'var(--font-display)', color, lineHeight: 1, marginBottom: 4 }}>
              {val}
            </div>
            <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{label}</div>
          </div>
        ))}
      </div>

      {/* Buscador + Filtros */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 20, alignItems: 'center', flexWrap: 'wrap' }}>
        <div className="search-bar" style={{ flex: 1, minWidth: 240 }}>
          <Search size={15} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar por nombre, descripción o ID..."
          />
          {search && (
            <button onClick={() => setSearch('')} style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: 'var(--text-secondary)', display: 'flex'
            }}>
              <X size={14} />
            </button>
          )}
        </div>

        {/* Filtro categoría */}
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          <FilterPill value="todos"  label="Todos"  active={catFilter === 'todos'}  activeColor="#111"    activeBg="#F3F4F6" onClick={() => setCatFilter('todos')} />
          <FilterPill value="comida" label="🍽️ Comida" active={catFilter === 'comida'} activeColor="#92400E" activeBg="#FEF3C7" onClick={() => setCatFilter('comida')} />
          <FilterPill value="bebida" label="🥤 Bebida" active={catFilter === 'bebida'} activeColor="#1E40AF" activeBg="#DBEAFE" onClick={() => setCatFilter('bebida')} />
        </div>

        {/* Filtro subcategoría */}
        {subcategoryOptions.length > 0 && (
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 8 }}>
            <FilterPill
              value="todos"
              label="Todas"
              active={subcatFilter === 'todos'}
              activeColor="#111"
              activeBg="#F3F4F6"
              onClick={() => setSubcatFilter('todos')}
            />
            {subcategoryOptions.map(option => (
              <FilterPill
                key={option.value}
                value={option.value}
                label={option.label}
                active={subcatFilter === option.value}
                activeColor="#111"
                activeBg="#F3F4F6"
                onClick={() => setSubcatFilter(option.value)}
              />
            ))}
          </div>
        )}

        {/* Separador */}
        <div style={{ width: 1, height: 28, background: 'var(--border)' }} />

        {/* Filtro activos/inactivos */}
        <div style={{ display: 'flex', gap: 6 }}>
          <FilterPill value="activos"   label="Activos"   active={activeFilter === 'activos'}   activeColor="#065F46" activeBg="#D1FAE5" onClick={() => setActiveFilter('activos')} />
          <FilterPill value="inactivos" label="Inactivos" active={activeFilter === 'inactivos'} activeColor="#374151" activeBg="#F3F4F6" onClick={() => setActiveFilter('inactivos')} />
          <FilterPill value="todos"     label="Todos"     active={activeFilter === 'todos'}     activeColor="#111"    activeBg="#F3F4F6" onClick={() => setActiveFilter('todos')} />
        </div>
      </div>

      {/* Grid de productos */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: 64, color: 'var(--text-secondary)', fontSize: 14 }}>
          Cargando productos...
        </div>
      ) : filtered.length === 0 ? (
        <div style={{
          textAlign: 'center', padding: 64,
          color: 'var(--text-secondary)', fontSize: 14
        }}>
          <Package size={48} style={{ opacity: 0.2, marginBottom: 12 }} />
          <div>No se encontraron productos</div>
        </div>
      ) : (
        <>
          <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 14 }}>
            {filtered.length} producto{filtered.length !== 1 ? 's' : ''} encontrado{filtered.length !== 1 ? 's' : ''}
          </div>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
            gap: 18
          }}>
            {filtered.map((product, i) => (
              <ProductCard
                key={product.product_id}
                product={product}
                index={i}
                onEdit={p => { setEditTarget(p); setShowForm(true) }}
                onDelete={p => setDeleteTarget(p)}
              />
            ))}
          </div>
        </>
      )}

      {/* Modals */}
      {showForm && (
        <ProductFormModal
          initial={editTarget}
          onClose={() => { setShowForm(false); setEditTarget(null) }}
          onSave={editTarget ? handleEdit : handleCreate}
        />
      )}
      {deleteTarget && (
        <ConfirmModal
          product={deleteTarget}
          onClose={() => setDeleteTarget(null)}
          onConfirm={handleDelete}
        />
      )}
    </div>
  )
}
