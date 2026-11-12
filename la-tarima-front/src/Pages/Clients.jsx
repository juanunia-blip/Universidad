import { useState, useEffect, useCallback } from 'react'
import {
  Search, Plus, X, Edit2, Trash2,
  User, Mail, Phone, MapPin, FileText,
  Hash, Users, UserCheck, UserX, ChevronUp, ChevronDown
} from 'lucide-react'
import api from '../Api/axios'

// ─── SAMPLE DATA ──────────────────────────────────────────────
const SAMPLE_CLIENTS = [
  { _id: '1', fullname: 'Juan Pérez',     docID: '123456789', email: 'juan@email.com',   phone: '3001234567', address: 'Calle 10 #5-20, Popayán',  notes: 'Cliente frecuente, prefiere mesa junto a la ventana', createdAt: '2025-03-12T10:00:00Z' },
  { _id: '2', fullname: 'María López',    docID: '987654321', email: 'maria@email.com',  phone: '3109876543', address: 'Carrera 5 #12-30, Popayán', notes: '', createdAt: '2025-04-01T09:00:00Z' },
  { _id: '3', fullname: 'Carlos Ruiz',    docID: '456789123', email: 'carlos@gmail.com', phone: '3205551234', address: '', notes: 'Alérgico al mariscos', createdAt: '2025-04-15T14:00:00Z' },
  { _id: '4', fullname: 'Ana Torres',     docID: '321654987', email: '',                 phone: '3157778899', address: 'Av. Panamericana #40-10',    notes: '', createdAt: '2025-05-02T11:00:00Z' },
  { _id: '5', fullname: 'Pedro Gómez',    docID: '654321789', email: 'pedro@work.com',   phone: '3001112233', address: 'Calle 3 #8-15, Popayán',     notes: 'Viene con grupo corporativo los viernes', createdAt: '2025-05-20T16:00:00Z' },
  { _id: '6', fullname: 'Laura Martínez', docID: '789123456', email: 'laura@email.com',  phone: '',           address: '',                           notes: 'Cumpleaños en junio', createdAt: '2025-06-01T08:00:00Z' },
]

const EMPTY_FORM = {
  fullname: '', docID: '', email: '', phone: '', address: '', notes: ''
}

// ─── HELPERS ──────────────────────────────────────────────────
const fmtDate = (iso) => {
  if (!iso) return '—'
  const d = new Date(iso)
  return d.toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' })
}

const initials = (name) => {
  if (!name) return '?'
  return name.trim().split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase()
}

// Paleta de colores para los avatares
const AVATAR_COLORS = [
  { bg: '#DBEAFE', color: '#1D4ED8' },
  { bg: '#FCE7F3', color: '#BE185D' },
  { bg: '#D1FAE5', color: '#065F46' },
  { bg: '#FEF3C7', color: '#92400E' },
  { bg: '#EDE9FE', color: '#5B21B6' },
  { bg: '#FEE2E2', color: '#B91C1C' },
]

const avatarColor = (str) => {
  let hash = 0
  for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash)
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length]
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
const inputStyle = {
  width: '100%', padding: '10px 12px',
  border: '1.5px solid var(--border)', borderRadius: 8,
  fontSize: 14, fontFamily: 'var(--font-body)',
  outline: 'none', background: 'var(--bg-panel)',
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

// ─── CLIENT FORM ──────────────────────────────────────────────
function ClientFormModal({ initial, onClose, onSave }) {
  const [form, setForm]     = useState(initial ? { ...initial } : EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [error, setError]   = useState('')
  const isEdit = !!initial?.docID

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleSubmit = async () => {
    setError('')
    if (!form.fullname?.trim()) return setError('El nombre completo es obligatorio')
    if (!form.docID?.trim())    return setError('El número de documento es obligatorio')
    if (form.docID.length < 5)  return setError('El documento debe tener mínimo 5 caracteres')
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      return setError('El email no tiene un formato válido')

    setSaving(true)
    try {
      await onSave(form)
      onClose()
    } catch (e) {
      const msg = e.response?.data?.message
        || e.response?.data?.errors?.[0]?.message
        || e.message || 'Error al guardar'
      setError(msg)
    } finally {
      setSaving(false)
    }
  }

  const av = avatarColor(form.fullname || 'X')

  return (
    <Modal title={isEdit ? 'Editar cliente' : 'Nuevo cliente'} onClose={onClose}>
      {error && (
        <div style={{
          background: '#FEE2E2', border: '1px solid #FECACA',
          borderRadius: 8, padding: '10px 14px', marginBottom: 16,
          fontSize: 13, color: '#B91C1C', display: 'flex', alignItems: 'center', gap: 8
        }}>
          <X size={13} /> {error}
        </div>
      )}

      {/* Avatar preview */}
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 20 }}>
        <div style={{
          width: 64, height: 64, borderRadius: '50%',
          background: av.bg, color: av.color,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 22, fontWeight: 700, border: `2px solid ${av.color}30`
        }}>
          {initials(form.fullname) || <User size={26} />}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
        <div style={{ gridColumn: '1 / -1' }}>
          <Field label="Nombre completo" required icon={User}>
            <input style={inputStyle} value={form.fullname}
              onChange={e => set('fullname', e.target.value)}
              placeholder="Ej: Juan Carlos Pérez" />
          </Field>
        </div>

        <Field label="Número de documento" required icon={Hash}>
          <input style={inputStyle} value={form.docID}
            onChange={e => set('docID', e.target.value)}
            placeholder="Ej: 1234567890"
            disabled={isEdit}
            title={isEdit ? 'El documento no se puede modificar' : ''}
            style={{ ...inputStyle, background: isEdit ? '#F9FAFB' : '#fff', cursor: isEdit ? 'not-allowed' : 'text' }}
          />
          {isEdit && (
            <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 4 }}>
              El documento no se puede modificar
            </div>
          )}
        </Field>

        <Field label="Teléfono" icon={Phone}>
          <input style={inputStyle} value={form.phone || ''}
            onChange={e => set('phone', e.target.value)}
            placeholder="3001234567" />
        </Field>

        <div style={{ gridColumn: '1 / -1' }}>
          <Field label="Email" icon={Mail}>
            <input style={inputStyle} type="email" value={form.email || ''}
              onChange={e => set('email', e.target.value)}
              placeholder="cliente@email.com" />
          </Field>
        </div>

        <div style={{ gridColumn: '1 / -1' }}>
          <Field label="Dirección" icon={MapPin}>
            <input style={inputStyle} value={form.address || ''}
              onChange={e => set('address', e.target.value)}
              placeholder="Calle 10 #5-20, Popayán" />
          </Field>
        </div>

        <div style={{ gridColumn: '1 / -1' }}>
          <Field label="Notas" icon={FileText}>
            <textarea
              style={{ ...inputStyle, resize: 'vertical', minHeight: 72 }}
              value={form.notes || ''}
              onChange={e => set('notes', e.target.value)}
              placeholder="Preferencias, alergias, información adicional..." />
          </Field>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
        <button className="btn-secondary" onClick={onClose} style={{ flex: 1 }}>Cancelar</button>
        <button className="btn-primary" onClick={handleSubmit}
          disabled={saving} style={{ flex: 2, opacity: saving ? 0.7 : 1 }}>
          {saving ? 'Guardando...' : isEdit ? 'Guardar cambios' : 'Crear cliente'}
        </button>
      </div>
    </Modal>
  )
}

// ─── CONFIRM DELETE ───────────────────────────────────────────
function ConfirmDeleteModal({ client, onClose, onConfirm }) {
  const [loading, setLoading] = useState(false)
  const av = avatarColor(client.fullname)
  return (
    <Modal title="Eliminar cliente" onClose={onClose} maxWidth={420}>
      <div style={{ textAlign: 'center', padding: '8px 0 20px' }}>
        <div style={{
          width: 60, height: 60, borderRadius: '50%',
          background: av.bg, color: av.color,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 20, fontWeight: 700, margin: '0 auto 14px'
        }}>
          {initials(client.fullname)}
        </div>
        <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 6 }}>
          ¿Eliminar a <span style={{ color: 'var(--accent)' }}>{client.fullname}</span>?
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
      background: active ? activeBg : 'var(--bg-panel)',
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

// ─── CLIENT ROW ───────────────────────────────────────────────
function ClientRow({ client, onEdit, onDelete, index }) {
  const av = avatarColor(client.fullname)
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: '2.2fr 140px 170px 130px 1fr 100px',
      alignItems: 'center', gap: 12,
      padding: '13px 20px', background: 'var(--bg-card)',
      borderBottom: '1.5px solid var(--border-light)',
      animation: `fadeIn 0.2s ease ${index * 0.03}s both`,
      transition: 'background 0.1s'
    }}
      onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-panel)'}
      onMouseLeave={e => e.currentTarget.style.background = 'var(--bg-card)'}
    >
      {/* Nombre + avatar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
        <div style={{
          width: 38, height: 38, borderRadius: '50%', flexShrink: 0,
          background: av.bg, color: av.color,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 13, fontWeight: 700, border: `1.5px solid ${av.color}20`
        }}>
          {initials(client.fullname)}
        </div>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {client.fullname}
          </div>
          {client.notes && (
            <div style={{ fontSize: 11, color: 'var(--text-secondary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 220 }}>
              📝 {client.notes}
            </div>
          )}
        </div>
      </div>

      {/* Documento */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
        <Hash size={11} color="var(--text-secondary)" style={{ flexShrink: 0 }} />
        <span style={{ fontSize: 13, fontFamily: 'monospace', letterSpacing: '0.5px' }}>{client.docID}</span>
      </div>

      {/* Email */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 5, minWidth: 0 }}>
        <Mail size={11} color="var(--text-secondary)" style={{ flexShrink: 0 }} />
        {client.email
          ? <span style={{ fontSize: 13, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{client.email}</span>
          : <span style={{ fontSize: 12, color: '#CBD5E1' }}>Sin email</span>}
      </div>

      {/* Teléfono */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
        <Phone size={11} color="var(--text-secondary)" style={{ flexShrink: 0 }} />
        {client.phone
          ? <span style={{ fontSize: 13 }}>{client.phone}</span>
          : <span style={{ fontSize: 12, color: '#CBD5E1' }}>Sin teléfono</span>}
      </div>

      {/* Dirección */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 5, minWidth: 0 }}>
        <MapPin size={11} color="var(--text-secondary)" style={{ flexShrink: 0 }} />
        {client.address
          ? <span style={{ fontSize: 12, color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{client.address}</span>
          : <span style={{ fontSize: 12, color: '#CBD5E1' }}>Sin dirección</span>}
      </div>

      {/* Acciones */}
      <div style={{ display: 'flex', gap: 5, justifyContent: 'flex-end' }}>
        <ActionBtn icon={Edit2}  onClick={() => onEdit(client)}   title="Editar"   hoverColor="#F59E0B" />
        <ActionBtn icon={Trash2} onClick={() => onDelete(client)} title="Eliminar" hoverColor="#EF4444" />
      </div>
    </div>
  )
}

// ─── MAIN PAGE ────────────────────────────────────────────────
export default function Clients() {
  const [clients, setClients]       = useState([])
  const [loading, setLoading]       = useState(true)
  const [search, setSearch]         = useState('')
  const [infoFilter, setInfoFilter] = useState('todos') // todos | con_email | con_telefono | con_notas
  const [sort, setSort]             = useState({ field: 'fullname', dir: 'asc' })
  const [showForm, setShowForm]     = useState(false)
  const [editTarget, setEditTarget] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [page, setPage]             = useState(1)
  const PAGE_SIZE = 10

  const load = useCallback(() => {
    setLoading(true)
    api.get('/clients?limit=100')
      .then(res => {
        const d = res.data?.data || res.data
        setClients(Array.isArray(d) && d.length > 0 ? d : SAMPLE_CLIENTS)
      })
      .catch(() => setClients(SAMPLE_CLIENTS))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { load() }, [load])

  // Filtrar
  const filtered = clients
    .filter(c => {
      const q = search.toLowerCase()
      const matchSearch =
        c.fullname.toLowerCase().includes(q) ||
        c.docID.includes(q) ||
        (c.email  || '').toLowerCase().includes(q) ||
        (c.phone  || '').includes(q) ||
        (c.address|| '').toLowerCase().includes(q)
      const matchInfo =
        infoFilter === 'todos'         ? true :
        infoFilter === 'con_email'     ? !!c.email :
        infoFilter === 'con_telefono'  ? !!c.phone :
        infoFilter === 'con_notas'     ? !!c.notes :
        true
      return matchSearch && matchInfo
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
    total:       clients.length,
    conEmail:    clients.filter(c => !!c.email).length,
    conTelefono: clients.filter(c => !!c.phone).length,
    conNotas:    clients.filter(c => !!c.notes).length,
  }

  // ── CREATE ──
  const handleCreate = async (form) => {
    const payload = {
      fullname: form.fullname.trim(),
      docID:    form.docID.trim(),
      ...(form.email   && { email:   form.email.trim() }),
      ...(form.phone   && { phone:   form.phone.trim() }),
      ...(form.address && { address: form.address.trim() }),
      ...(form.notes   && { notes:   form.notes.trim() }),
    }
    await api.post('/clients', payload)
    load()
  }

  // ── EDIT ──
  const handleEdit = async (form) => {
    const payload = {
      fullname: form.fullname.trim(),
      ...(form.email   !== undefined && { email:   form.email }),
      ...(form.phone   !== undefined && { phone:   form.phone }),
      ...(form.address !== undefined && { address: form.address }),
      ...(form.notes   !== undefined && { notes:   form.notes }),
    }
    await api.patch(`/clients/${form.docID}`, payload)
    load()
  }

  // ── DELETE ──
  const handleDelete = async () => {
    try {
      await api.delete(`/clients/${deleteTarget.docID}`)
      load()
    } catch {
      setClients(prev => prev.filter(c => c.docID !== deleteTarget.docID))
    }
    setDeleteTarget(null)
  }

  const INFO_FILTERS = [
    { key: 'todos',        label: 'Todos',         color: '#111',    bg: '#F3F4F6' },
    { key: 'con_email',    label: '✉️ Con email',   color: '#1D4ED8', bg: '#DBEAFE' },
    { key: 'con_telefono', label: '📞 Con teléfono',color: '#065F46', bg: '#D1FAE5' },
    { key: 'con_notas',    label: '📝 Con notas',   color: '#5B21B6', bg: '#EDE9FE' },
  ]

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
            Clientes
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>
            Directorio de clientes registrados
          </p>
        </div>
        <button
          className="btn-primary"
          style={{ width: 'auto', padding: '11px 20px' }}
          onClick={() => { setEditTarget(null); setShowForm(true) }}>
          <Plus size={16} /> Nuevo cliente
        </button>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14, marginBottom: 24 }}>
        {[
          { label: 'Total clientes', val: stats.total,       color: 'var(--text-primary)', bg: 'var(--bg-card)',    border: 'var(--border)',  icon: Users },
          { label: 'Con email',      val: stats.conEmail,    color: '#1D4ED8',             bg: '#DBEAFE', border: '#BFDBFE',        icon: Mail },
          { label: 'Con teléfono',   val: stats.conTelefono, color: '#065F46',             bg: '#D1FAE5', border: '#A7F3D0',        icon: Phone },
          { label: 'Con notas',      val: stats.conNotas,    color: '#5B21B6',             bg: '#EDE9FE', border: '#DDD6FE',        icon: FileText },
        ].map(({ label, val, color, bg, border, icon: Icon }) => (
          <div key={label} style={{
            background: bg, border: `1.5px solid ${border}`,
            borderRadius: 12, padding: '16px 20px',
            display: 'flex', alignItems: 'center', gap: 14,
            animation: 'fadeIn 0.25s ease both'
          }}>
            <div style={{
              width: 40, height: 40, borderRadius: 10,
              background: color + '18',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
            }}>
              <Icon size={18} color={color} />
            </div>
            <div>
              <div style={{ fontSize: 26, fontFamily: 'var(--font-display)', color, lineHeight: 1, marginBottom: 2 }}>{val}</div>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Search + Filtros */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 20, alignItems: 'center', flexWrap: 'wrap' }}>
        <div className="search-bar" style={{ flex: 1, minWidth: 260 }}>
          <Search size={15} />
          <input
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1) }}
            placeholder="Buscar por nombre, documento, email o teléfono..."
          />
          {search && (
            <button onClick={() => { setSearch(''); setPage(1) }} style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: 'var(--text-secondary)', display: 'flex'
            }}>
              <X size={14} />
            </button>
          )}
        </div>

        <div style={{ display: 'flex', gap: 6 }}>
          {INFO_FILTERS.map(f => (
            <FilterPill
              key={f.key}
              label={f.label}
              active={infoFilter === f.key}
              activeColor={f.color}
              activeBg={f.bg}
              onClick={() => { setInfoFilter(f.key); setPage(1) }}
            />
          ))}
        </div>
      </div>

      {/* Tabla */}
      <div style={{
        background: 'var(--bg-card)', border: '1.5px solid var(--border)',
        borderRadius: 14, overflow: 'hidden', boxShadow: 'var(--shadow-card)'
      }}>
        {/* Cabecera con sort */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '2.2fr 140px 170px 130px 1fr 100px',
          gap: 12, padding: '11px 20px',
          background: 'var(--bg-main)', borderBottom: '1.5px solid var(--border)'
        }}>
          <SortHeader label="Nombre"    field="fullname" sort={sort} onSort={handleSort} />
          <SortHeader label="Documento" field="docID"    sort={sort} onSort={handleSort} />
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Email</div>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Teléfono</div>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Dirección</div>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px', textAlign: 'right' }}>Acciones</div>
        </div>

        {/* Rows */}
        {loading ? (
          <div style={{ padding: 48, textAlign: 'center', color: 'var(--text-secondary)', fontSize: 14 }}>
            Cargando clientes...
          </div>
        ) : paginated.length === 0 ? (
          <div style={{ padding: 56, textAlign: 'center' }}>
            <UserX size={48} style={{ color: '#CBD5E1', marginBottom: 12 }} />
            <div style={{ fontSize: 14, color: 'var(--text-secondary)' }}>No se encontraron clientes</div>
          </div>
        ) : (
          paginated.map((c, i) => (
            <ClientRow
              key={c.docID}
              client={c}
              index={i}
              onEdit={cl => { setEditTarget(cl); setShowForm(true) }}
              onDelete={cl => setDeleteTarget(cl)}
            />
          ))
        )}

        {/* Footer con paginación */}
        <div style={{
          padding: '12px 20px', background: 'var(--bg-main)',
          borderTop: '1.5px solid var(--border)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between'
        }}>
          <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
            {filtered.length} cliente{filtered.length !== 1 ? 's' : ''} encontrado{filtered.length !== 1 ? 's' : ''}
          </span>

          {totalPages > 1 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                style={{
                  padding: '4px 10px', borderRadius: 6,
                  border: '1.5px solid var(--border)', background: 'var(--bg-panel)',
                  cursor: page === 1 ? 'not-allowed' : 'pointer',
                  fontSize: 13, color: page === 1 ? '#CBD5E1' : 'var(--text-primary)'
                }}>
                ←
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                    style={{
                    width: 30, height: 30, borderRadius: 6,
                    border: `1.5px solid ${page === p ? 'var(--text-primary)' : 'var(--border)'}`,
                    background: page === p ? 'var(--text-primary)' : 'var(--bg-panel)',
                    color: page === p ? '#fff' : 'var(--text-primary)',
                    cursor: 'pointer', fontSize: 13, fontWeight: page === p ? 600 : 400
                  }}>
                  {p}
                </button>
              ))}
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                style={{
                  padding: '4px 10px', borderRadius: 6,
                  border: '1.5px solid var(--border)', background: 'var(--bg-panel)',
                  cursor: page === totalPages ? 'not-allowed' : 'pointer',
                  fontSize: 13, color: page === totalPages ? '#CBD5E1' : 'var(--text-primary)'
                }}>
                →
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      {showForm && (
        <ClientFormModal
          initial={editTarget}
          onClose={() => { setShowForm(false); setEditTarget(null) }}
          onSave={editTarget ? handleEdit : handleCreate}
        />
      )}
      {deleteTarget && (
        <ConfirmDeleteModal
          client={deleteTarget}
          onClose={() => setDeleteTarget(null)}
          onConfirm={handleDelete}
        />
      )}
    </div>
  )
}
