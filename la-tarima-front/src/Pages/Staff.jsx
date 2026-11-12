import { useState, useEffect, useCallback } from 'react'
import {
  Search, Plus, X, Edit2, Trash2, Eye,
  User, Users, Mail, Phone, Briefcase, Calendar, Clock
} from 'lucide-react'
import api from '../Api/axios'

const ROLE_OPTIONS = [
  { value: 'waiter',  label: 'Mesero' },
  { value: 'manager', label: 'Gerente' },
  { value: 'chef',    label: 'Chef' }
]

const ROLE_FILTERS = [
  { key: 'todos',   label: 'Todos',    color: '#111',   bg: '#F3F4F6' },
  { key: 'waiter',  label: 'Meseros',  color: '#1E40AF', bg: '#DBEAFE' },
  { key: 'manager', label: 'Gerentes', color: '#BE185D', bg: '#FCE7F3' },
  { key: 'chef',    label: 'Chefs',    color: '#065F46', bg: '#D1FAE5' }
]

const STATUS_FILTERS = [
  { key: 'todos',    label: 'Todos',    color: '#111',   bg: '#F3F4F6' },
  { key: 'activos',  label: 'Activos',  color: '#065F46', bg: '#D1FAE5' },
  { key: 'inactivos',label: 'Inactivos',color: '#B45309', bg: '#FEF3C7' }
]

const STATUS_MAP = {
  true:  { label: 'Activo',   color: '#065F46', bg: '#D1FAE5', border: '#A7F3D0' },
  false: { label: 'Inactivo', color: '#B45309', bg: '#FEF3C7', border: '#FDE68A' }
}

const SAMPLE_STAFF = [
  { user_id: 'USR_0001', fullname: 'María Gómez', role: 'manager', cellPhone: '3001234567', email: 'maria.gomez@tarima.com' },
  { user_id: 'USR_0002', fullname: 'Carlos Ramírez', role: 'waiter', cellPhone: '3105551234', email: 'carlos.ramirez@tarima.com' },
  { user_id: 'USR_0003', fullname: 'Laura Sánchez', role: 'chef', cellPhone: '3157778899', email: 'laura.sanchez@tarima.com' }
]

const EMPTY_FORM = {
  user_id: '', fullname: '', role: 'waiter', cellPhone: '', email: ''
}

const roleLabel = (role) => ROLE_OPTIONS.find(option => option.value === role)?.label || role

const initials = (name) => {
  if (!name) return '?'
  return name.trim().split(' ').slice(0, 2).map(part => part[0]).join('').toUpperCase()
}

function Modal({ title, onClose, children, maxWidth = 580 }) {
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
        display: 'flex', alignItems: 'center', gap: 6,
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

function FilterPill({ label, active, activeColor, activeBg, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        border: '1.5px solid transparent',
        borderRadius: 999,
        background: active ? activeBg : 'var(--bg-panel)',
        color: active ? activeColor : 'var(--text-secondary)',
        padding: '10px 16px',
        fontSize: 13,
        cursor: 'pointer',
        fontWeight: active ? 700 : 500,
        boxShadow: active ? '0 10px 24px rgba(15, 23, 42, 0.06)' : 'none',
        transition: 'all 0.15s ease'
      }}
    >
      {label}
    </button>
  )
}

function Badge({ value, map }) {
  const cfg = map[value] || { label: value, color: '#666', bg: '#F3F4F6', border: '#E5E7EB' }
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      padding: '4px 10px', borderRadius: 999,
      background: cfg.bg, color: cfg.color,
      fontSize: 11, fontWeight: 700,
      border: `1px solid ${cfg.border}`
    }}>
      {cfg.label}
    </span>
  )
}

function ActionBtn({ icon: Icon, onClick, title, hoverColor }) {
  const [hover, setHover] = useState(false)
  return (
    <button title={title} onClick={onClick}
      onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
      style={{
        width: 32, height: 32, borderRadius: 8, cursor: 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        border: `1.5px solid ${hover ? hoverColor : 'var(--border)'}`,
        background: hover ? hoverColor + '15' : 'transparent',
        color: hover ? hoverColor : 'var(--text-secondary)',
        transition: 'all 0.12s'
      }}>
      <Icon size={14} />
    </button>
  )
}

function StaffFormModal({ initial, onClose, onSave }) {
  const [form, setForm] = useState(initial ? { ...initial } : EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const isEdit = !!initial?.user_id

  const setField = (key, value) => setForm(prev => ({ ...prev, [key]: value }))

  const handleSubmit = async () => {
    setError('')

    if (!form.fullname?.trim()) return setError('El nombre completo es obligatorio')
    if (!form.role) return setError('La función es obligatoria')
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      return setError('El email no tiene un formato válido')
    }

    setSaving(true)
    try {
      await onSave({ ...form })
      onClose()
    } catch (e) {
      const msg = e.response?.data?.message || e.message || 'Error al guardar'
      setError(msg)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal title={isEdit ? 'Editar miembro de staff' : 'Nuevo miembro de staff'} onClose={onClose}>
      {error && (
        <div style={{
          background: '#FEE2E2', border: '1px solid #FECACA',
          borderRadius: 8, padding: '10px 14px', marginBottom: 16,
          fontSize: 13, color: '#B91C1C', display: 'flex', alignItems: 'center', gap: 8
        }}>
          <X size={13} /> {error}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
        <div style={{ gridColumn: '1 / -1' }}>
          <Field label="Nombre completo" required icon={User}>
            <input
              style={inputStyle}
              value={form.fullname}
              onChange={e => setField('fullname', e.target.value)}
              placeholder="Ej: Ana María Pérez"
            />
          </Field>
        </div>

        <Field label="Función" required icon={Briefcase}>
          <select
            style={inputStyle}
            value={form.role}
            onChange={e => setField('role', e.target.value)}
          >
            {ROLE_OPTIONS.map(option => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </Field>

        <Field label="Celular" icon={Phone}>
          <input
            style={inputStyle}
            value={form.cellPhone || ''}
            onChange={e => setField('cellPhone', e.target.value)}
            placeholder="3001234567"
          />
        </Field>

        <Field label="Email" icon={Mail}>
          <input
            style={inputStyle}
            type="email"
            value={form.email || ''}
            onChange={e => setField('email', e.target.value)}
            placeholder="usuario@ejemplo.com"
          />
        </Field>
      </div>

      <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
        <button className='btn-secondary' onClick={onClose} style={{ flex: 1 }}>Cancelar</button>
        <button
          className='btn-primary'
          onClick={handleSubmit}
          disabled={saving}
          style={{ flex: 2, opacity: saving ? 0.7 : 1 }}
        >
          {saving ? 'Guardando...' : isEdit ? 'Guardar cambios' : 'Crear staff'}
        </button>
      </div>
    </Modal>
  )
}

function DetailModal({ staff, onClose }) {
  const roleLabel = (role) => ROLE_OPTIONS.find(option => option.value === role)?.label || role
  const roleColors = {
    waiter: { bg: '#DBEAFE', color: '#1D4ED8' },
    manager: { bg: '#FCE7F3', color: '#BE185D' },
    chef: { bg: '#D1FAE5', color: '#065F46' }
  }
  const roleStyle = roleColors[staff.role] || { bg: '#E5E7EB', color: '#374151' }
  const isActive = staff.active !== false

  const InfoChip = ({ icon: Icon, label, val }) => (
    <div style={{
      background: 'var(--bg-main)', borderRadius: 8, padding: '10px 12px',
      display: 'flex', alignItems: 'center', gap: 10
    }}>
      <Icon size={14} color="var(--text-secondary)" style={{ flexShrink: 0 }} />
      <div>
        <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 1 }}>{label}</div>
        <div style={{ fontSize: 13, fontWeight: 600 }}>{val || '—'}</div>
      </div>
    </div>
  )

  return (
    <Modal title="Detalle del miembro de staff" onClose={onClose} maxWidth={520}>
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        background: 'var(--bg-main)', borderRadius: 12, padding: '16px 18px', marginBottom: 20
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{
            width: 48, height: 48, borderRadius: 12,
            background: roleStyle.bg,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: roleStyle.color, fontWeight: 700, fontSize: 16
          }}>
            {initials(staff.fullname)}
          </div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 2 }}>{staff.fullname}</div>
            <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{staff.user_id}</div>
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <Badge value={isActive} map={STATUS_MAP} />
        </div>
      </div>

      <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 10 }}>
        Información
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <InfoChip icon={Briefcase} label="Función" val={roleLabel(staff.role)} />
        <InfoChip icon={Mail} label="Email" val={staff.email} />
        <InfoChip icon={Phone} label="Celular" val={staff.cellPhone} />
        <InfoChip icon={User} label="ID" val={staff.user_id} />
      </div>
    </Modal>
  )
}

function ConfirmDeleteModal({ staff, onClose, onConfirm }) {
  const [loading, setLoading] = useState(false)
  const colors = {
    waiter: { bg: '#DBEAFE', color: '#1D4ED8' },
    manager: { bg: '#FCE7F3', color: '#BE185D' },
    chef: { bg: '#D1FAE5', color: '#065F46' }
  }
  const style = colors[staff.role] || { bg: '#E5E7EB', color: '#374151' }

  return (
    <Modal title='Inactivar miembro de staff' onClose={onClose} maxWidth={480}>
      <div style={{ textAlign: 'center', padding: '8px 0 20px' }}>
        <div style={{
          width: 60, height: 60, borderRadius: '50%',
          background: style.bg, color: style.color,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 20, fontWeight: 700, margin: '0 auto 14px'
        }}>
          {initials(staff.fullname)}
        </div>
        <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 6 }}>
          ¿Inactivar a <span style={{ color: 'var(--accent)' }}>{staff.fullname}</span>?
        </div>
        <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
          Esta acción cambiará el estado a inactivo, pero conservará el registro de personal.
        </div>
      </div>

      <div style={{ display: 'flex', gap: 10 }}>
        <button className='btn-secondary' onClick={onClose} style={{ flex: 1 }}>Cancelar</button>
        <button
          onClick={async () => { setLoading(true); await onConfirm(); setLoading(false) }}
          disabled={loading}
          style={{
            flex: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            background: '#EF4444', color: '#fff', border: 'none',
            borderRadius: 8, padding: '13px 20px', fontSize: 15, fontWeight: 600,
            cursor: 'pointer', opacity: loading ? 0.7 : 1
          }}
        >
          <Trash2 size={15} />
          {loading ? 'Inactivando...' : 'Inactivar'}
        </button>
      </div>
    </Modal>
  )
}

export default function Staff() {
  const [staffList, setStaffList] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('todos')
  const [statusFilter, setStatusFilter] = useState('activos')
  const [showForm, setShowForm] = useState(false)
  const [editTarget, setEditTarget] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [detailTarget, setDetailTarget] = useState(null)
  const [error, setError] = useState('')

  const loadStaff = useCallback(() => {
    setLoading(true)
    api.get('/staff?limit=100')
      .then(res => {
        const data = res.data?.data || res.data
        setStaffList(Array.isArray(data) ? data : SAMPLE_STAFF)
      })
      .catch(() => {
        setError('No se pudo cargar el personal, usando datos de ejemplo.')
        setStaffList(SAMPLE_STAFF)
      })
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { loadStaff() }, [loadStaff])

  const filtered = staffList.filter(member => {
    const term = search.toLowerCase()
    const fullname = String(member?.fullname || '').toLowerCase()
    const email = String(member?.email || '').toLowerCase()
    const role = String(member?.role || '').toLowerCase()
    const userId = String(member?.user_id || '').toLowerCase()
    const isActive = member?.active !== false
    const passesRole = roleFilter === 'todos' || role === roleFilter
    const passesStatus = statusFilter === 'todos'
      || (statusFilter === 'activos' && isActive)
      || (statusFilter === 'inactivos' && !isActive)

    return (
      passesRole && passesStatus && (
        fullname.includes(term)
        || email.includes(term)
        || role.includes(term)
        || userId.includes(term)
      )
    )
  })

  const totalByRole = ROLE_FILTERS.filter(f => f.key !== 'todos').map(role => ({
    ...role,
    count: staffList.filter(member => member.role === role.key).length
  }))

  const handleCreate = async (form) => {
    await api.post('/staff', {
      fullname: form.fullname.trim(),
      role: form.role,
      cellPhone: form.cellPhone?.trim(),
      email: form.email?.trim() || undefined
    })
    loadStaff()
  }

  const handleEdit = async (form) => {
    await api.patch(`/staff/${form.user_id}`, {
      fullname: form.fullname.trim(),
      role: form.role,
      cellPhone: form.cellPhone?.trim(),
      email: form.email?.trim() || ''
    })
    loadStaff()
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    await api.delete(`/staff/${deleteTarget.user_id}`)
    setDeleteTarget(null)
    loadStaff()
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-main)', padding: 28 }}>
      <style>{`
        @keyframes fadeIn  { from { opacity:0; transform:translateY(5px) } to { opacity:1; transform:none } }
        @keyframes modalIn { from { opacity:0; transform:scale(0.97) } to { opacity:1; transform:none } }
      `}</style>

      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 36, letterSpacing: 0.5, marginBottom: 4 }}>
            Personal
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>
            Administra el equipo de trabajo y sus roles
          </p>
        </div>
        <button
          className='btn-primary'
          style={{ width: 'auto', padding: '11px 20px' }}
          onClick={() => { setEditTarget(null); setShowForm(true) }}
        >
          <Plus size={16} /> Nuevo miembro
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 14, marginBottom: 24 }}>
        {[
          { label: 'Total de personal', value: staffList.length, color: '#111', bg: '#F3F4F6', border: '#E5E7EB', icon: Users },
          { label: 'Meseros', value: totalByRole.find(r => r.key === 'waiter')?.count || 0, color: '#1E40AF', bg: '#DBEAFE', border: '#BFDBFE', icon: User },
          { label: 'Gerentes', value: totalByRole.find(r => r.key === 'manager')?.count || 0, color: '#BE185D', bg: '#FCE7F3', border: '#FBCFE8', icon: Briefcase },
          { label: 'Chefs', value: totalByRole.find(r => r.key === 'chef')?.count || 0, color: '#065F46', bg: '#D1FAE5', border: '#A7F3D0', icon: User }
        ].map(({ label, value, color, bg, border, icon: Icon }) => (
          <div key={label} style={{
            background: bg, border: `1.5px solid ${border}`,
            borderRadius: 12, padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 14,
            animation: 'fadeIn 0.25s ease both'
          }}>
            <div style={{
              width: 40, height: 40, borderRadius: 10,
              background: color + '20',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
            }}>
              <Icon size={18} color={color} />
            </div>
            <div>
              <div style={{ fontSize: typeof value === 'string' ? 17 : 26, fontFamily: 'var(--font-display)', color, lineHeight: 1, marginBottom: 2, fontWeight: 700 }}>{value}</div>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{label}</div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 12, marginBottom: 20, alignItems: 'center', flexWrap: 'wrap' }}>
        <div className='search-bar' style={{ flex: 1, minWidth: 280 }}>
          <Search size={15} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder='Buscar por nombre, email, rol o ID...'
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

        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {ROLE_FILTERS.map(filter => (
            <FilterPill
              key={filter.key}
              label={filter.label}
              active={roleFilter === filter.key}
              activeColor={filter.color}
              activeBg={filter.bg}
              onClick={() => setRoleFilter(filter.key)}
            />
          ))}
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 20 }}>
        {STATUS_FILTERS.map(filter => (
          <FilterPill
            key={filter.key}
            label={filter.label}
            active={statusFilter === filter.key}
            activeColor={filter.color}
            activeBg={filter.bg}
            onClick={() => setStatusFilter(filter.key)}
          />
        ))}
      </div>

      {error && (
        <div style={{
          marginBottom: 18, padding: 16, borderRadius: 14,
          background: '#FEF3C7', border: '1.5px solid #FDE68A', color: '#92400E'
        }}>
          {error}
        </div>
      )}

      <div style={{ background: 'var(--bg-card)', border: '1.5px solid var(--border)', borderRadius: 16, overflow: 'hidden', boxShadow: 'var(--shadow-card)' }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: '2.5fr 1fr 1.5fr 1fr 1fr 1fr 1fr',
          gap: 12, padding: '14px 18px',
          background: 'var(--bg-main)', borderBottom: '1.5px solid var(--border)'
        }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Nombre</div>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Rol</div>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Email</div>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Celular</div>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Estado</div>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>ID</div>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px', textAlign: 'right' }}>Acciones</div>
        </div>

        {loading ? (
          <div style={{ padding: 52, textAlign: 'center', color: 'var(--text-secondary)', fontSize: 14 }}>
            Cargando personal...
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: 56, textAlign: 'center', color: 'var(--text-secondary)', fontSize: 14 }}>
            No se encontraron resultados
          </div>
        ) : (
          filtered.map((member, index) => (
            <div key={member.user_id || index} style={{
              display: 'grid',
              gridTemplateColumns: '2.5fr 1fr 1.5fr 1fr 1fr 1fr 1fr',
              gap: 12,
              alignItems: 'center',
              padding: '13px 20px',
              background: 'var(--bg-card)',
              borderBottom: index < filtered.length - 1 ? '1.5px solid var(--border-light)' : 'none',
              animation: `fadeIn 0.2s ease ${index * 0.03}s both`,
              transition: 'background 0.1s'
            }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-panel)'}
              onMouseLeave={e => e.currentTarget.style.background = 'var(--bg-card)'}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{
                  width: 34, height: 34, borderRadius: 10,
                  background: '#EEF2FF', color: '#4338CA',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontWeight: 700, fontSize: 14
                }}>
                  {initials(member.fullname)}
                </div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#111' }}>{member.fullname || 'Sin nombre'}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{member.user_id}</div>
                </div>
              </div>
              <div style={{ fontSize: 14, color: '#111' }}>{roleLabel(member.role)}</div>
              <div style={{ fontSize: 14, color: 'var(--text-secondary)' }}>{member.email || '—'}</div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Badge value={member.active !== false} map={STATUS_MAP} />
              </div>
              <div style={{ fontSize: 14, color: 'var(--text-secondary)' }}>{member.cellPhone || '—'}</div>
              <div style={{ fontSize: 14, color: 'var(--text-secondary)' }}>{member.user_id}</div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 6 }}>
                <ActionBtn icon={Eye} onClick={() => setDetailTarget(member)} title="Ver detalle" hoverColor="#3B82F6" />
                <ActionBtn icon={Edit2} onClick={() => { setEditTarget(member); setShowForm(true) }} title="Editar" hoverColor="#F59E0B" />
                <ActionBtn icon={Trash2} onClick={() => setDeleteTarget(member)} title="Inactivar" hoverColor="#EF4444" />
              </div>
            </div>
          ))
        )}

        {!loading && filtered.length > 0 && (
          <div style={{ padding: '14px 18px', background: 'var(--bg-main)', borderTop: '1.5px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
              {filtered.length} miembro{filtered.length !== 1 ? 's' : ''} mostrado{filtered.length !== 1 ? 's' : ''}
            </span>
          </div>
        )}
      </div>

      {showForm && (
        <StaffFormModal
          initial={editTarget}
          onClose={() => { setShowForm(false); setEditTarget(null) }}
          onSave={editTarget ? handleEdit : handleCreate}
        />
      )}

      {deleteTarget && (
        <ConfirmDeleteModal
          staff={deleteTarget}
          onClose={() => setDeleteTarget(null)}
          onConfirm={handleDelete}
        />
      )}

      {detailTarget && (
        <DetailModal
          staff={detailTarget}
          onClose={() => setDetailTarget(null)}
        />
      )}
    </div>
  )
}
