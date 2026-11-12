import { useState, useEffect, useCallback } from 'react'
import { Plus, Edit2, Trash2, X, Search, Filter, MapPin, Users, Clock, AlertCircle, Eye } from 'lucide-react'
import api from '../Api/axios'

// ─── CONSTANTS ────────────────────────────────────────────────
const STATUS_CONFIG = {
  libre: { label: 'Libre', color: '#10B981', bg: '#D1FAE5', border: '#A7F3D0' },
  reservada: { label: 'Reservada', color: '#3B82F6', bg: '#DBEAFE', border: '#BFDBFE' },
  en_atencion: { label: 'En atención', color: '#F59E0B', bg: '#FEF3C7', border: '#FDE68A' },
  limpieza: { label: 'Limpieza', color: '#8B5CF6', bg: '#EDE9FE', border: '#DDD6FE' }
}

const EMPTY_FORM = {
  tableNumber: '',
  capacity: '',
  zone: '',
  currentStatus: 'libre'
}

const SAMPLE_TABLES = [
  {
    table_id: 'TBL_001',
    tableNumber: 1,
    capacity: 4,
    zone: 'Terraza',
    currentStatus: 'libre',
    active: true,
    createdAt: new Date().toISOString()
  },
  {
    table_id: 'TBL_002',
    tableNumber: 2,
    capacity: 6,
    zone: 'Interior',
    currentStatus: 'reservada',
    active: true,
    createdAt: new Date().toISOString()
  }
]

// ─── MODAL ────────────────────────────────────────────────────
function Modal({ title, onClose, children, maxWidth = 500 }) {
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'rgba(0,0,0,0.4)',
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

// ─── TABLE FORM MODAL ──────────────────────────────────────────
function TableFormModal({ initial, onClose, onSave }) {
  const [form, setForm] = useState(initial || EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const isEdit = !!initial?.table_id

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleSubmit = async () => {
    setError('')
    if (!form.tableNumber || isNaN(Number(form.tableNumber)) || Number(form.tableNumber) < 1) {
      return setError('El número de mesa debe ser mayor a 0')
    }
    if (!form.capacity || isNaN(Number(form.capacity)) || Number(form.capacity) < 1) {
      return setError('La capacidad debe ser mayor a 0')
    }
    if (!form.zone?.trim()) return setError('La zona es obligatoria')

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
    <Modal title={isEdit ? 'Editar mesa' : 'Nueva mesa'} onClose={onClose} maxWidth={500}>
      {error && (
        <div style={{
          background: '#FEE2E2', border: '1px solid #FECACA',
          borderRadius: 8, padding: '10px 14px', marginBottom: 16,
          fontSize: 13, color: '#B91C1C', display: 'flex', alignItems: 'center', gap: 8
        }}>
          <AlertCircle size={13} /> {error}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
        <Field label="Número de mesa" required>
          <input
            style={inputStyle}
            type="number"
            min={1}
            value={form.tableNumber}
            onChange={e => set('tableNumber', e.target.value)}
            placeholder="1"
          />
        </Field>

        <Field label="Capacidad" required>
          <input
            style={inputStyle}
            type="number"
            min={1}
            value={form.capacity}
            onChange={e => set('capacity', e.target.value)}
            placeholder="4"
          />
        </Field>

        <div style={{ gridColumn: '1 / -1' }}>
          <Field label="Zona" required>
            <input
              style={inputStyle}
              value={form.zone}
              onChange={e => set('zone', e.target.value)}
              placeholder="Ej: Terraza, Interior, Barra"
            />
          </Field>
        </div>

        {isEdit && (
          <div style={{ gridColumn: '1 / -1' }}>
            <Field label="Estado actual">
              <select
                style={{ ...inputStyle, cursor: 'pointer', appearance: 'auto' }}
                value={form.currentStatus}
                onChange={e => set('currentStatus', e.target.value)}
              >
                <option value="libre">Libre</option>
                <option value="reservada">Reservada</option>
                <option value="en_atencion">En atención</option>
                <option value="limpieza">Limpieza</option>
              </select>
            </Field>
          </div>
        )}
      </div>

      <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
        <button className="btn-secondary" onClick={onClose} style={{ flex: 1 }}>
          Cancelar
        </button>
        <button className="btn-primary" onClick={handleSubmit}
          disabled={saving} style={{ flex: 2, opacity: saving ? 0.7 : 1 }}>
          {saving ? 'Guardando...' : isEdit ? 'Guardar cambios' : 'Crear mesa'}
        </button>
      </div>
    </Modal>
  )
}

// ─── DETAIL MODAL ──────────────────────────────────────────────
function TableDetailModal({ table, reservations, onClose }) {
  return (
    <Modal title={`Mesa ${table.tableNumber}`} onClose={onClose} maxWidth={600}>
      {/* Información de la mesa */}
      <div style={{
        background: 'var(--bg-main)', borderRadius: 12, padding: 16,
        marginBottom: 20, display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12
      }}>
        <div>
          <div style={{ fontSize: 11, color: 'var(--text-secondary)', fontWeight: 600, marginBottom: 4 }}>
            MESA ID
          </div>
          <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>
            {table.table_id}
          </div>
        </div>
        <div>
          <div style={{ fontSize: 11, color: 'var(--text-secondary)', fontWeight: 600, marginBottom: 4 }}>
            NÚMERO
          </div>
          <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>
            {table.tableNumber}
          </div>
        </div>
        <div>
          <div style={{ fontSize: 11, color: 'var(--text-secondary)', fontWeight: 600, marginBottom: 4 }}>
            CAPACIDAD
          </div>
          <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>
            {table.capacity} personas
          </div>
        </div>
        <div>
          <div style={{ fontSize: 11, color: 'var(--text-secondary)', fontWeight: 600, marginBottom: 4 }}>
            ZONA
          </div>
          <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>
            {table.zone}
          </div>
        </div>
        <div style={{ gridColumn: '1 / -1' }}>
          <div style={{ fontSize: 11, color: 'var(--text-secondary)', fontWeight: 600, marginBottom: 4 }}>
            ESTADO
          </div>
          <div style={{
            display: 'inline-block',
            background: STATUS_CONFIG[table.currentStatus]?.bg,
            border: `1.5px solid ${STATUS_CONFIG[table.currentStatus]?.border}`,
            color: STATUS_CONFIG[table.currentStatus]?.color,
            padding: '6px 12px', borderRadius: 6, fontSize: 12, fontWeight: 600
          }}>
            {STATUS_CONFIG[table.currentStatus]?.label}
          </div>
        </div>
      </div>

      {/* Reservas asociadas */}
      <div>
        <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 12, color: 'var(--text-primary)' }}>
          Reservas Asociadas
        </div>
        {reservations && reservations.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {reservations.slice(0, 5).map(res => (
              <div key={res.reservation_id} style={{
                background: 'var(--bg-main)', border: '1px solid var(--border)',
                borderRadius: 8, padding: 12
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span style={{ fontWeight: 600, fontSize: 13 }}>
                    {res.reservation_id}
                  </span>
                  <span style={{
                    background: res.status === 'confirmada' ? '#D1FAE5' : '#FEF3C7',
                    color: res.status === 'confirmada' ? '#065F46' : '#92400E',
                    padding: '2px 8px', borderRadius: 4, fontSize: 10, fontWeight: 600
                  }}>
                    {res.status}
                  </span>
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                  📅 {res.date} - ⏰ {res.startTime}
                </div>
              </div>
            ))}
            {reservations.length > 5 && (
              <div style={{ fontSize: 12, color: 'var(--text-secondary)', textAlign: 'center', padding: 8 }}>
                +{reservations.length - 5} reservas más
              </div>
            )}
          </div>
        ) : (
          <div style={{
            background: 'var(--bg-main)', borderRadius: 8, padding: 16, textAlign: 'center',
            color: 'var(--text-secondary)'
          }}>
            Sin reservas asociadas
          </div>
        )}
      </div>

      <div style={{ marginTop: 20 }}>
        <button className="btn-primary" onClick={onClose} style={{ width: '100%' }}>
          Cerrar
        </button>
      </div>
    </Modal>
  )
}

// ─── DELETE CONFIRM MODAL ──────────────────────────────────────
function DeleteConfirmModal({ table, onClose, onConfirm }) {
  const [loading, setLoading] = useState(false)
  return (
    <Modal title="Desactivar mesa" onClose={onClose} maxWidth={420}>
      <div style={{ textAlign: 'center', padding: '8px 0 20px' }}>
        <div style={{
          width: 60, height: 60, borderRadius: 12,
          background: '#FEE2E2', display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 16px', fontSize: 28
        }}>
          🪑
        </div>
        <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 6 }}>
          ¿Desactivar mesa <span style={{ color: 'var(--accent)' }}>#{table.tableNumber}</span>?
        </div>
        <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
          La mesa no estará disponible para reservas, pero los historiales se conservan.
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

// ─── TABLE CARD ────────────────────────────────────────────────
function TableCard({ table, onEdit, onDelete, onDetail, index }) {
  const status = STATUS_CONFIG[table.currentStatus] || STATUS_CONFIG.libre

  return (
    <div style={{
      background: 'var(--bg-card)',
      border: '1.5px solid var(--border-light)',
      borderRadius: 14, overflow: 'hidden',
      display: 'flex', flexDirection: 'column',
      opacity: table.active === false ? 0.56 : 1,
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
      {table.active === false && (
        <div style={{
          position: 'absolute', top: 10, left: 10, zIndex: 2,
          background: '#374151', color: '#fff',
          fontSize: 10, fontWeight: 700, padding: '2px 8px',
          borderRadius: 99, textTransform: 'uppercase', letterSpacing: '0.5px'
        }}>
          Inactiva
        </div>
      )}

      {/* Action buttons */}
      <div style={{
        position: 'absolute', top: 10, right: 10, zIndex: 2,
        display: 'flex', gap: 6
      }}>
        <CardActionBtn icon={Eye} onClick={() => onDetail(table)} bg="var(--bg-panel)" color="#3B82F6" title="Ver detalle" />
        <CardActionBtn icon={Edit2} onClick={() => onEdit(table)} bg="var(--bg-panel)" color="#F59E0B" title="Editar" />
        <CardActionBtn icon={Trash2} onClick={() => onDelete(table)} bg="var(--bg-panel)" color="#EF4444" title="Desactivar" />
      </div>

      {/* Content */}
      <div style={{ padding: '16px', flex: 1, display: 'flex', flexDirection: 'column', gap: 12 }}>
        {/* Header: Número */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div>
            <div style={{ fontSize: 13, color: 'var(--text-secondary)', fontWeight: 600, marginBottom: 2 }}>
              MESA
            </div>
            <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--text-primary)' }}>
              #{table.tableNumber}
            </div>
          </div>

          <div style={{
            alignSelf: 'flex-start',
            background: status.bg,
            border: `1.5px solid ${status.border}`,
            color: status.color,
            padding: '8px 12px', borderRadius: 8,
            fontSize: 11, fontWeight: 600, textAlign: 'center', minWidth: 70
          }}>
            {status.label}
          </div>
        </div>

        {/* Separador */}
        <div style={{ height: 1, background: 'var(--border-light)' }} />

        {/* Info grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Users size={16} style={{ color: 'var(--text-secondary)' }} />
            <div>
              <div style={{ fontSize: 10, color: 'var(--text-secondary)', fontWeight: 600 }}>CAPACIDAD</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>
                {table.capacity}
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <MapPin size={16} style={{ color: 'var(--text-secondary)' }} />
            <div>
              <div style={{ fontSize: 10, color: 'var(--text-secondary)', fontWeight: 600 }}>ZONA</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>
                {table.zone}
              </div>
            </div>
          </div>
        </div>

        {/* Footer: ID */}
        <div style={{ fontSize: 10, color: 'var(--text-secondary)', marginTop: 'auto', fontFamily: 'monospace' }}>
          {table.table_id}
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

// ─── MAIN PAGE ────────────────────────────────────────────────
export default function Tables() {
  const [tables, setTables] = useState([])
  const [reservations, setReservations] = useState({})
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('todos')
  const [activeFilter, setActiveFilter] = useState('activas')
  const [showForm, setShowForm] = useState(false)
  const [editTarget, setEditTarget] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [detailTarget, setDetailTarget] = useState(null)

  const load = useCallback(() => {
    setLoading(true)
    api.get('/tables?showInactive=true')
      .then(res => {
        const d = res.data?.data || res.data
        setTables(Array.isArray(d) && d.length > 0 ? d : SAMPLE_TABLES)
      })
      .catch(() => setTables(SAMPLE_TABLES))
      .finally(() => setLoading(false))
  }, [])

  // Cargar reservas para la mesa
  const loadReservationsForTable = useCallback(async (table) => {
    try {
      const res = await api.get(`/reservations?table_id=${table.table_id}`)
      const data = res.data?.data || res.data || []
      setReservations(prev => ({
        ...prev,
        [table.table_id]: Array.isArray(data) ? data : []
      }))
    } catch {
      setReservations(prev => ({
        ...prev,
        [table.table_id]: []
      }))
    }
  }, [])

  useEffect(() => { load() }, [load])

  // Filtrar mesas
  const filtered = tables.filter(t => {
    const matchSearch = t.tableNumber.toString().includes(search)
      || t.zone.toLowerCase().includes(search.toLowerCase())
      || t.table_id.toLowerCase().includes(search.toLowerCase())
    const matchStatus = statusFilter === 'todos' || t.currentStatus === statusFilter
    const matchActive =
      activeFilter === 'todos' ? true :
        activeFilter === 'activas' ? t.active !== false :
          t.active === false
    return matchSearch && matchStatus && matchActive
  })

  // Estadísticas
  const activas = tables.filter(t => t.active !== false).length
  const inactivas = tables.filter(t => t.active === false).length
  const libres = tables.filter(t => t.currentStatus === 'libre' && t.active !== false).length
  const reservadas = tables.filter(t => t.currentStatus === 'reservada' && t.active !== false).length

  // ── CREATE ──
  const handleCreate = async (form) => {
    try {
      await api.post('/tables', form)
      load()
    } catch (e) {
      throw e
    }
  }

  // ── EDIT ──
  const handleEdit = async (form) => {
    try {
      const { table_id, ...data } = form
      await api.patch(`/tables/${table_id}`, data)
      load()
    } catch (e) {
      throw e
    }
  }

  // ── DELETE ──
  const handleDelete = async () => {
    try {
      await api.delete(`/tables/${deleteTarget.table_id}`)
      load()
    } catch {
      // Fallback demo
      setTables(prev => prev.map(t =>
        t.table_id === deleteTarget.table_id ? { ...t, active: false } : t
      ))
    }
    setDeleteTarget(null)
  }

  // ── DETAIL ──
  const handleDetail = async (table) => {
    await loadReservationsForTable(table)
    setDetailTarget(table)
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
            Mesas
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>
            Administra el inventario de mesas y su disponibilidad
          </p>
        </div>
        <button
          className="btn-primary"
          style={{ width: 'auto', padding: '11px 20px' }}
          onClick={() => { setEditTarget(null); setShowForm(true) }}>
          <Plus size={16} /> Nueva mesa
        </button>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14, marginBottom: 24 }}>
        {[
          { label: 'Activas', val: activas, color: 'var(--text-primary)', bg: '#fff', border: 'var(--border)' },
          { label: 'Libres', val: libres, color: '#10B981', bg: '#D1FAE5', border: '#A7F3D0' },
          { label: 'Reservadas', val: reservadas, color: '#3B82F6', bg: '#DBEAFE', border: '#BFDBFE' },
          { label: 'Inactivas', val: inactivas, color: '#374151', bg: '#F3F4F6', border: '#E5E7EB' },
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

      {/* Search + Filters */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 20, alignItems: 'center', flexWrap: 'wrap' }}>
        <div className="search-bar" style={{ flex: 1, minWidth: 240 }}>
          <Search size={15} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar por número, zona o ID..."
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
        <div style={{ display: 'flex', gap: 6 }}>
          <FilterPill value="todos" label="Todos" active={statusFilter === 'todos'} activeColor="#111" activeBg="#F3F4F6" onClick={() => setStatusFilter('todos')} />
          <FilterPill value="libre" label="🟢 Libre" active={statusFilter === 'libre'} activeColor="#10B981" activeBg="#D1FAE5" onClick={() => setStatusFilter('libre')} />
          <FilterPill value="reservada" label="🔵 Reservada" active={statusFilter === 'reservada'} activeColor="#3B82F6" activeBg="#DBEAFE" onClick={() => setStatusFilter('reservada')} />
          <FilterPill value="en_atencion" label="🟠 En atención" active={statusFilter === 'en_atencion'} activeColor="#F59E0B" activeBg="#FEF3C7" onClick={() => setStatusFilter('en_atencion')} />
          <FilterPill value="limpieza" label="🟣 Limpieza" active={statusFilter === 'limpieza'} activeColor="#8B5CF6" activeBg="#EDE9FE" onClick={() => setStatusFilter('limpieza')} />
        </div>

        {/* Separator */}
        <div style={{ width: 1, height: 28, background: 'var(--border)' }} />

        {/* Filtro activas/inactivas */}
        <div style={{ display: 'flex', gap: 6 }}>
          <FilterPill value="activas" label="✓ Activas" active={activeFilter === 'activas'} activeColor="#111" activeBg="#F3F4F6" onClick={() => setActiveFilter('activas')} />
          <FilterPill value="inactivas" label="✗ Inactivas" active={activeFilter === 'inactivas'} activeColor="#666" activeBg="#E5E7EB" onClick={() => setActiveFilter('inactivas')} />
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-secondary)' }}>
          Cargando mesas...
        </div>
      )}

      {/* Grid */}
      {!loading && filtered.length > 0 && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: 16,
          animation: 'fadeIn 0.3s ease'
        }}>
          {filtered.map((table, idx) => (
            <TableCard
              key={table.table_id}
              table={table}
              index={idx}
              onEdit={t => { setEditTarget(t); setShowForm(true) }}
              onDelete={setDeleteTarget}
              onDetail={handleDetail}
            />
          ))}
        </div>
      )}

      {/* Empty state */}
      {!loading && filtered.length === 0 && (
        <div style={{
          textAlign: 'center', padding: '40px 20px',
          color: 'var(--text-secondary)'
        }}>
          <Filter size={40} style={{ opacity: 0.2, marginBottom: 12 }} />
          <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 4 }}>
            No se encontraron mesas
          </div>
          <div style={{ fontSize: 13 }}>
            Intenta ajustar los filtros de búsqueda
          </div>
        </div>
      )}

      {/* Modals */}
      {showForm && (
        <TableFormModal
          initial={editTarget}
          onClose={() => { setShowForm(false); setEditTarget(null) }}
          onSave={editTarget ? handleEdit : handleCreate}
        />
      )}

      {deleteTarget && (
        <DeleteConfirmModal
          table={deleteTarget}
          onClose={() => setDeleteTarget(null)}
          onConfirm={handleDelete}
        />
      )}

      {detailTarget && (
        <TableDetailModal
          table={detailTarget}
          reservations={reservations[detailTarget.table_id] || []}
          onClose={() => setDetailTarget(null)}
        />
      )}
    </div>
  )
}
