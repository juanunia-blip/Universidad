import { useState, useEffect, useCallback } from 'react'
import {
  Search, Plus, X, Edit2, Trash2, Eye,
  ShoppingBag, CalendarDays, User, Hash, ChevronUp, ChevronDown
} from 'lucide-react'
import api from '../Api/axios'

// ─── SAMPLE DATA ──────────────────────────────────────────────
const SAMPLE_ORDERS = [
  {
    order_id: 'ORD_0001',
    reservation_id: 'RES_0001',
    clientHint: 'Juan Pérez',
    status: 'abierto',
    totalAmount: 45000,
    subtotalAmount: 40000,
    items: [
      { product_id: 'PROD_0001', name: 'Bandeja Paisa', quantity: 1, unitPrice: 25000 },
      { product_id: 'PROD_0002', name: 'Mojito Clásico', quantity: 2, unitPrice: 10000 }
    ],
    createdAt: '2025-01-15T14:30:00Z'
  },
  {
    order_id: 'ORD_0002',
    reservation_id: 'RES_0002',
    clientHint: 'María López',
    status: 'servido',
    totalAmount: 32000,
    subtotalAmount: 28000,
    items: [
      { product_id: 'PROD_0003', name: 'Alitas BBQ', quantity: 1, unitPrice: 24000 },
      { product_id: 'PROD_0004', name: 'Cerveza Corona', quantity: 1, unitPrice: 8000 }
    ],
    createdAt: '2025-01-16T19:15:00Z'
  },
  {
    order_id: 'ORD_0003',
    reservation_id: 'RES_0003',
    clientHint: 'Carlos Ruiz',
    status: 'en_preparacion',
    totalAmount: 18000,
    subtotalAmount: 16000,
    items: [
      { product_id: 'PROD_0006', name: 'Limonada Natural', quantity: 2, unitPrice: 8000 }
    ],
    createdAt: '2025-01-17T12:45:00Z'
  }
]

const ORDER_STATUS = {
  abierto: { label: 'Abierto', color: '#1D4ED8', bg: '#DBEAFE' },
  enviado_cocina: { label: 'Enviado', color: '#B45309', bg: '#FEF3C7' },
  en_preparacion: { label: 'Preparando', color: '#F59E0B', bg: '#FEF3C7' },
  listo: { label: 'Listo', color: '#065F46', bg: '#D1FAE5' },
  servido: { label: 'Servido', color: '#374151', bg: '#F3F4F6' },
  cancelado: { label: 'Cancelado', color: '#B91C1C', bg: '#FEE2E2' },
}

const EMPTY_FORM = {
  clientHint: '',
  notes: ''
}

// ─── HELPERS ──────────────────────────────────────────────────
const fmt = (n) => '$ ' + Number(n).toLocaleString('es-CO')

const fmtDate = (iso) => {
  if (!iso) return '—'
  const d = new Date(iso)
  return d.toLocaleDateString('es-CO', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  })
}

// ─── STATUS BADGE ─────────────────────────────────────────────
function StatusBadge({ status }) {
  const cfg = ORDER_STATUS[status] || { label: status, color: '#666', bg: '#F3F4F6' }
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      padding: '4px 10px', borderRadius: 99,
      background: cfg.bg, color: cfg.color,
      fontSize: 12, fontWeight: 600,
      border: `1px solid ${cfg.color}25`
    }}>
      {cfg.label}
    </span>
  )
}

// ─── MODAL ────────────────────────────────────────────────────
function Modal({ title, onClose, children, maxWidth = 560 }) {
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(2px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24
    }} onClick={onClose}>
      <div style={{
        background: '#fff', borderRadius: 16,
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
const inputStyle = {
  width: '100%', padding: '10px 12px',
  border: '1.5px solid var(--border)', borderRadius: 8,
  fontSize: 14, fontFamily: 'var(--font-body)',
  outline: 'none', background: '#fff',
  color: 'var(--text-primary)', boxSizing: 'border-box',
  transition: 'border-color 0.15s'
}

function Field({ label, required, icon: Icon, children }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={{
        display: 'flex', alignItems: 'center', gap: 5,
        fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)',
        marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.5px'
      }}>
        {Icon && <Icon size={11} />}
        {label}{required && <span style={{ color: 'var(--accent)' }}>*</span>}
      </label>
      {children}
    </div>
  )
}

// ─── ORDER FORM MODAL ─────────────────────────────────────────
function OrderFormModal({ initial, onClose, onSave }) {
  const [form, setForm]     = useState(initial ? { ...initial } : EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [error, setError]   = useState('')
  const isEdit = !!initial?.order_id

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleSubmit = async () => {
    setError('')
    if (!form.clientHint?.trim()) return setError('La referencia del cliente es obligatoria')

    setSaving(true)
    try {
      await onSave(form)
      onClose()
    } catch (e) {
      const msg = e.response?.data?.message || e.message || 'Error al guardar'
      setError(msg)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal title="Editar orden" onClose={onClose}>
      {error && (
        <div style={{
          background: '#FEE2E2', border: '1px solid #FECACA',
          borderRadius: 8, padding: '10px 14px', marginBottom: 16,
          fontSize: 13, color: '#B91C1C', display: 'flex', alignItems: 'center', gap: 8
        }}>
          <X size={13} /> {error}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '0 16px' }}>
        <Field label="Referencia del cliente" required icon={User}>
          <input style={inputStyle} value={form.clientHint}
            onChange={e => set('clientHint', e.target.value)}
            placeholder="Ej: Juan Pérez" />
        </Field>

        <Field label="Estado" required>
          <select
            style={{ ...inputStyle, cursor: 'pointer', appearance: 'auto' }}
            value={form.status || 'abierto'}
            onChange={e => set('status', e.target.value)}
          >
            <option value="abierto">Abierto</option>
            <option value="enviado_cocina">Enviado a cocina</option>
            <option value="en_preparacion">En preparación</option>
            <option value="listo">Listo</option>
            <option value="servido">Servido</option>
            <option value="cancelado">Cancelado</option>
          </select>
        </Field>

        <Field label="Notas" icon={Hash}>
          <textarea
            style={{ ...inputStyle, resize: 'vertical', minHeight: 72 }}
            value={form.notes || ''}
            onChange={e => set('notes', e.target.value)}
            placeholder="Notas adicionales de la orden..." />
        </Field>
      </div>

      <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
        <button className="btn-secondary" onClick={onClose} style={{ flex: 1 }}>Cancelar</button>
        <button className="btn-primary" onClick={handleSubmit}
          disabled={saving} style={{ flex: 2, opacity: saving ? 0.7 : 1 }}>
          {saving ? 'Guardando...' : 'Guardar cambios'}
        </button>
      </div>
    </Modal>
  )
}

// ─── ORDER DETAIL MODAL ───────────────────────────────────────
function OrderDetailModal({ order, onClose }) {
  if (!order) return null

  return (
    <Modal title={`Orden ${order.order_id}`} onClose={onClose} maxWidth={700}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
        <div>
          <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 4 }}>Reserva</div>
          <div style={{ fontSize: 14, fontWeight: 600 }}>{order.reservation_id}</div>
        </div>
        <div>
          <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 4 }}>Cliente</div>
          <div style={{ fontSize: 14, fontWeight: 600 }}>{order.clientHint || 'Sin referencia'}</div>
        </div>
        <div>
          <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 4 }}>Estado</div>
          <StatusBadge status={order.status} />
        </div>
        <div>
          <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 4 }}>Fecha</div>
          <div style={{ fontSize: 14 }}>{fmtDate(order.createdAt)}</div>
        </div>
      </div>

      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>Items de la orden</div>
        <div style={{ border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden' }}>
          {order.items?.map((item, i) => (
            <div key={i} style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '12px 16px', borderBottom: i < order.items.length - 1 ? '1px solid var(--border-light)' : 'none'
            }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600 }}>{item.name}</div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                  {item.quantity} × {fmt(item.unitPrice)}
                </div>
              </div>
              <div style={{ fontSize: 14, fontWeight: 600 }}>{fmt(item.quantity * item.unitPrice)}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', background: 'var(--bg-main)', borderRadius: 8 }}>
        <div style={{ fontSize: 16, fontWeight: 600 }}>Total</div>
        <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--accent)' }}>{fmt(order.totalAmount)}</div>
      </div>

      {order.notes && (
        <div style={{ marginTop: 16 }}>
          <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 4 }}>Notas</div>
          <div style={{ fontSize: 14, padding: '8px 12px', background: 'var(--bg-main)', borderRadius: 6 }}>
            {order.notes}
          </div>
        </div>
      )}
    </Modal>
  )
}

// ─── CONFIRM DELETE ───────────────────────────────────────────
function ConfirmDeleteModal({ order, onClose, onConfirm }) {
  const [loading, setLoading] = useState(false)
  return (
    <Modal title="Eliminar orden" onClose={onClose} maxWidth={420}>
      <div style={{ textAlign: 'center', padding: '8px 0 20px' }}>
        <ShoppingBag size={48} style={{ color: 'var(--text-secondary)', marginBottom: 14 }} />
        <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 6 }}>
          ¿Eliminar orden <span style={{ color: 'var(--accent)' }}>{order.order_id}</span>?
        </div>
        <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
          Esta acción es permanente y no se puede deshacer.
        </div>
      </div>
      <div style={{ display: 'flex', gap: 10 }}>
        <button className="btn-secondary" onClick={onClose} style={{ flex: 1 }}>Cancelar</button>
        <button
          disabled={loading}
          onClick={async () => { setLoading(true); await onConfirm(); setLoading(false) }}
          style={{
            flex: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            background: '#EF4444', color: '#fff', border: 'none',
            borderRadius: 8, padding: '13px 20px', fontSize: 15, fontWeight: 600,
            cursor: 'pointer', opacity: loading ? 0.7 : 1
          }}>
          <Trash2 size={15} />
          {loading ? 'Eliminando...' : 'Sí, eliminar'}
        </button>
      </div>
    </Modal>
  )
}

// ─── FILTER PILL ──────────────────────────────────────────────
function FilterPill({ label, active, activeColor, activeBg, onClick }) {
  return (
    <button onClick={onClick} style={{
      padding: '8px 14px', borderRadius: 8, cursor: 'pointer',
      fontFamily: 'var(--font-body)', fontSize: 13,
      fontWeight: active ? 600 : 400, transition: 'all 0.12s',
      border: active ? `1.5px solid ${activeColor}` : '1.5px solid var(--border)',
      background: active ? activeBg : '#fff',
      color: active ? activeColor : 'var(--text-secondary)',
    }}>
      {label}
    </button>
  )
}

// ─── ACTION BTN ───────────────────────────────────────────────
function ActionBtn({ icon: Icon, onClick, title, hoverColor }) {
  const [h, setH] = useState(false)
  return (
    <button title={title} onClick={onClick}
      onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)}
      style={{
        width: 30, height: 30, borderRadius: 7, cursor: 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        border: `1.5px solid ${h ? hoverColor : 'var(--border)'}`,
        background: h ? hoverColor + '15' : 'transparent',
        color: h ? hoverColor : 'var(--text-secondary)',
        transition: 'all 0.12s'
      }}>
      <Icon size={13} />
    </button>
  )
}

// ─── SORT HEADER ──────────────────────────────────────────────
function SortHeader({ label, field, sort, onSort }) {
  const active = sort.field === field
  return (
    <div
      onClick={() => onSort(field)}
      style={{
        fontSize: 11, fontWeight: 700, color: active ? 'var(--accent)' : 'var(--text-secondary)',
        textTransform: 'uppercase', letterSpacing: '0.5px',
        display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer',
        userSelect: 'none', transition: 'color 0.12s'
      }}>
      {label}
      {active
        ? (sort.dir === 'asc' ? <ChevronUp size={11} /> : <ChevronDown size={11} />)
        : <ChevronDown size={11} style={{ opacity: 0.3 }} />}
    </div>
  )
}

// ─── ORDER ROW ────────────────────────────────────────────────
function OrderRow({ order, onView, onEdit, onDelete, index }) {
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: '1.5fr 1.5fr 2fr 1fr 1.2fr 120px',
      alignItems: 'center', gap: 12,
      padding: '13px 20px', background: '#fff',
      borderBottom: '1.5px solid var(--border-light)',
      animation: `fadeIn 0.2s ease ${index * 0.03}s both`,
      transition: 'background 0.1s'
    }}
      onMouseEnter={e => e.currentTarget.style.background = '#FAFAF9'}
      onMouseLeave={e => e.currentTarget.style.background = '#fff'}
    >
      {/* Order ID */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
        <ShoppingBag size={11} color="var(--text-secondary)" style={{ flexShrink: 0 }} />
        <span style={{ fontSize: 13, fontFamily: 'monospace', letterSpacing: '0.5px', fontWeight: 600 }}>
          {order.order_id}
        </span>
      </div>

      {/* Reservation ID */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
        <Hash size={11} color="var(--text-secondary)" style={{ flexShrink: 0 }} />
        <span style={{ fontSize: 13 }}>{order.reservation_id}</span>
      </div>

      {/* Client Hint */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 5, minWidth: 0 }}>
        <User size={11} color="var(--text-secondary)" style={{ flexShrink: 0 }} />
        <span style={{ fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {order.clientHint || 'Sin referencia'}
        </span>
      </div>

      {/* Status */}
      <StatusBadge status={order.status} />

      {/* Total */}
      <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>
        {fmt(order.totalAmount)}
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: 5, justifyContent: 'flex-end' }}>
        <ActionBtn icon={Eye}   onClick={() => onView(order)}   title="Ver detalle" hoverColor="#3B82F6" />
        <ActionBtn icon={Edit2} onClick={() => onEdit(order)}   title="Editar"     hoverColor="#F59E0B" />
        <ActionBtn icon={Trash2} onClick={() => onDelete(order)} title="Eliminar"   hoverColor="#EF4444" />
      </div>
    </div>
  )
}

// ─── MAIN PAGE ────────────────────────────────────────────────
export default function Orders() {
  const [orders, setOrders]       = useState([])
  const [loading, setLoading]     = useState(true)
  const [search, setSearch]       = useState('')
  const [statusFilter, setStatusFilter] = useState('todos')
  const [sort, setSort]           = useState({ field: 'createdAt', dir: 'desc' })
  const [showForm, setShowForm]   = useState(false)
  const [editTarget, setEditTarget] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [viewTarget, setViewTarget] = useState(null)
  const [page, setPage]           = useState(1)
  const PAGE_SIZE = 10

  const load = useCallback(() => {
    setLoading(true)
    api.get('/orders?limit=100')
      .then(res => {
        const d = res.data?.data || res.data
        setOrders(Array.isArray(d) && d.length > 0 ? d : SAMPLE_ORDERS)
      })
      .catch(() => setOrders(SAMPLE_ORDERS))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { load() }, [load])

  // Filtrar
  const filtered = orders
    .filter(o => {
      const q = search.toLowerCase()
      const matchSearch =
        o.order_id.toLowerCase().includes(q) ||
        o.reservation_id.toLowerCase().includes(q) ||
        (o.clientHint || '').toLowerCase().includes(q)
      const matchStatus = statusFilter === 'todos' || o.status === statusFilter
      return matchSearch && matchStatus
    })
    .sort((a, b) => {
      let va = a[sort.field] || '', vb = b[sort.field] || ''
      if (typeof va === 'string') va = va.toLowerCase()
      if (typeof vb === 'string') vb = vb.toLowerCase()
      return sort.dir === 'asc' ? (va > vb ? 1 : -1) : (va < vb ? 1 : -1)
    })

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE)
  const paginated  = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const handleSort = (field) => {
    setSort(s => s.field === field ? { field, dir: s.dir === 'asc' ? 'desc' : 'asc' } : { field, dir: 'asc' })
    setPage(1)
  }

  // Stats
  const stats = {
    total: orders.length,
    abiertos: orders.filter(o => o.status === 'abierto').length,
    enProceso: orders.filter(o => ['enviado_cocina', 'en_preparacion', 'listo'].includes(o.status)).length,
    completados: orders.filter(o => o.status === 'servido').length,
    cancelados: orders.filter(o => o.status === 'cancelado').length,
  }

  // ── EDIT ──
  const handleEdit = async (form) => {
    const payload = {
      clientHint: form.clientHint?.trim(),
      status: form.status,
      notes: form.notes?.trim()
    }
    await api.patch(`/orders/${form.order_id}`, payload)
    load()
  }

  // ── DELETE ──
  const handleDelete = async () => {
    await api.delete(`/orders/${deleteTarget.order_id}`)
    load()
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
            Órdenes
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>
            Gestiona los pedidos y su estado en el restaurante
          </p>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 14, marginBottom: 24 }}>
        {[
          { label: 'Total',      val: stats.total,      color: 'var(--text-primary)', bg: '#fff',    border: 'var(--border)' },
          { label: 'Abiertos',   val: stats.abiertos,   color: '#1D4ED8',             bg: '#DBEAFE', border: '#BFDBFE' },
          { label: 'En proceso', val: stats.enProceso,  color: '#F59E0B',             bg: '#FEF3C7', border: '#FDE68A' },
          { label: 'Completados',val: stats.completados,color: '#065F46',             bg: '#D1FAE5', border: '#A7F3D0' },
          { label: 'Cancelados', val: stats.cancelados, color: '#B91C1C',             bg: '#FEE2E2', border: '#FECACA' },
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
            placeholder="Buscar por ID de orden, reserva o cliente..."
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

        {/* Filtro estado */}
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          <FilterPill value="todos" label="Todos" active={statusFilter === 'todos'} activeColor="#111" activeBg="#F3F4F6" onClick={() => setStatusFilter('todos')} />
          <FilterPill value="abierto" label="Abiertos" active={statusFilter === 'abierto'} activeColor="#1D4ED8" activeBg="#DBEAFE" onClick={() => setStatusFilter('abierto')} />
          <FilterPill value="enviado_cocina" label="En proceso" active={statusFilter === 'enviado_cocina'} activeColor="#F59E0B" activeBg="#FEF3C7" onClick={() => setStatusFilter('enviado_cocina')} />
          <FilterPill value="servido" label="Completados" active={statusFilter === 'servido'} activeColor="#065F46" activeBg="#D1FAE5" onClick={() => setStatusFilter('servido')} />
          <FilterPill value="cancelado" label="Cancelados" active={statusFilter === 'cancelado'} activeColor="#B91C1C" activeBg="#FEE2E2" onClick={() => setStatusFilter('cancelado')} />
        </div>
      </div>

      {/* Tabla */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: 64, color: 'var(--text-secondary)', fontSize: 14 }}>
          Cargando órdenes...
        </div>
      ) : paginated.length === 0 ? (
        <div style={{
          textAlign: 'center', padding: 64,
          color: 'var(--text-secondary)', fontSize: 14
        }}>
          <ShoppingBag size={48} style={{ opacity: 0.2, marginBottom: 12 }} />
          <div>No se encontraron órdenes</div>
        </div>
      ) : (
        <>
          <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 14 }}>
            {filtered.length} orden{filtered.length !== 1 ? 'es' : ''} encontrado{filtered.length !== 1 ? 's' : ''}
          </div>

          {/* Header de tabla */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1.5fr 1.5fr 2fr 1fr 1.2fr 120px',
            gap: 12, padding: '12px 20px',
            background: 'var(--bg-main)', borderRadius: '12px 12px 0 0',
            border: '1.5px solid var(--border)', borderBottom: 'none'
          }}>
            <SortHeader label="Orden" field="order_id" sort={sort} onSort={handleSort} />
            <SortHeader label="Reserva" field="reservation_id" sort={sort} onSort={handleSort} />
            <SortHeader label="Cliente" field="clientHint" sort={sort} onSort={handleSort} />
            <SortHeader label="Estado" field="status" sort={sort} onSort={handleSort} />
            <SortHeader label="Total" field="totalAmount" sort={sort} onSort={handleSort} />
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Acciones
            </div>
          </div>

          {/* Filas */}
          <div style={{
            border: '1.5px solid var(--border)',
            borderTop: 'none', borderRadius: '0 0 12px 12px',
            overflow: 'hidden'
          }}>
            {paginated.map((order, i) => (
              <OrderRow
                key={order.order_id}
                order={order}
                index={i}
                onView={o => setViewTarget(o)}
                onEdit={o => { setEditTarget(o); setShowForm(true) }}
                onDelete={o => setDeleteTarget(o)}
              />
            ))}
          </div>

          {/* Paginación */}
          {totalPages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 20 }}>
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                style={{
                  padding: '8px 12px', border: '1px solid var(--border)', borderRadius: 6,
                  background: page === 1 ? '#F3F4F6' : '#fff', cursor: page === 1 ? 'not-allowed' : 'pointer'
                }}>
                Anterior
              </button>
              <span style={{ padding: '8px 12px', color: 'var(--text-secondary)' }}>
                Página {page} de {totalPages}
              </span>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                style={{
                  padding: '8px 12px', border: '1px solid var(--border)', borderRadius: 6,
                  background: page === totalPages ? '#F3F4F6' : '#fff', cursor: page === totalPages ? 'not-allowed' : 'pointer'
                }}>
                Siguiente
              </button>
            </div>
          )}
        </>
      )}

      {/* Modals */}
      {showForm && (
        <OrderFormModal
          initial={editTarget}
          onClose={() => { setShowForm(false); setEditTarget(null) }}
          onSave={handleEdit}
        />
      )}
      {deleteTarget && (
        <ConfirmDeleteModal
          order={deleteTarget}
          onClose={() => setDeleteTarget(null)}
          onConfirm={handleDelete}
        />
      )}
      {viewTarget && (
        <OrderDetailModal
          order={viewTarget}
          onClose={() => setViewTarget(null)}
        />
      )}
    </div>
  )
}


