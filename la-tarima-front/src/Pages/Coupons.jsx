import { useState, useEffect, useCallback } from 'react'
import { Search, Plus, X, Edit2, Trash2, Eye, Percent, Ticket, CalendarDays, Tag } from 'lucide-react'
import api from '../Api/axios'

const EMPTY_FORM = {
  name: '', code: '', type: 'percentage', value: 10,
  maxUses: '', validFrom: '', validUntil: '', stackable: false,
  active: true, kind: 'coupon', creationMode: 'uses'
}

const fmtDate = (iso) => {
  if (!iso) return '—'
  const d = new Date(iso)
  return d.toLocaleDateString('es-CO', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

const toInputDate = (value) => {
  if (!value) return ''
  const date = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return date.toISOString().slice(0, 10)
}

function Badge({ label, color, bg }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 6,
      padding: '4px 10px', borderRadius: 999,
      background: bg, color, fontSize: 11, fontWeight: 700,
      textTransform: 'uppercase', letterSpacing: 0.5
    }}>
      {label}
    </span>
  )
}

function Modal({ title, onClose, children, maxWidth = 640 }) {
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(2px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 20
    }} onClick={onClose}>
      <div style={{
        width: '100%', maxWidth, borderRadius: 18,
        background: 'var(--bg-card)', overflow: 'hidden', boxShadow: '0 24px 64px rgba(0,0,0,0.18)'
      }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '22px 24px', borderBottom: '1.5px solid var(--border)' }}>
          <h2 style={{ margin: 0, fontFamily: 'var(--font-display)', fontSize: 22 }}>{title}</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}><X size={18} /></button>
        </div>
        <div style={{ padding: '20px 24px 24px' }}>{children}</div>
      </div>
    </div>
  )
}

function Field({ label, required, children, icon: Icon }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 }}>
        {Icon && <Icon size={12} />}
        {label}{required && <span style={{ color: 'var(--accent)' }}>*</span>}
      </label>
      {children}
    </div>
  )
}

const inputStyle = {
  width: '100%', padding: '10px 12px', borderRadius: 10,
  border: '1.5px solid var(--border)', outline: 'none',
  fontSize: 14, fontFamily: 'var(--font-body)',
  color: 'var(--text-primary)', background: 'var(--bg-panel)',
  transition: 'border-color 0.15s', boxSizing: 'border-box'
}

function CouponFormModal({ initial, onClose, onSave }) {
  const isEdit = !!initial?.discount_id
  const [form, setForm] = useState(() => ({
    ...EMPTY_FORM,
    ...(initial || {}),
    validFrom: toInputDate(initial?.validFrom),
    validUntil: toInputDate(initial?.validUntil),
    creationMode: initial?.maxUses ? 'uses' : 'time'
  }))
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  const set = (key, value) => setForm(f => ({ ...f, [key]: value }))

  const handleSubmit = async () => {
    setError('')
    if (!form.name.trim()) return setError('El nombre del cupón es obligatorio')
    if (!form.code.trim()) return setError('El código es obligatorio')
    if (!form.value || Number(form.value) <= 0) return setError('Define un porcentaje mayor a 0')

    if (form.creationMode === 'uses') {
      if (!form.maxUses || Number(form.maxUses) < 1) return setError('Define un límite de usos válido')
    }

    if (form.creationMode === 'time') {
      if (!form.validFrom) return setError('Define la fecha de inicio')
      if (!form.validUntil) return setError('Define la fecha de finalización')
      if (new Date(form.validFrom) > new Date(form.validUntil)) return setError('La fecha de inicio no puede ser posterior a la fecha final')
    }

    const payload = {
      name: form.name.trim(),
      type: 'percentage',
      value: Number(form.value),
      stackable: Boolean(form.stackable),
      active: Boolean(form.active)
    }

    if (!isEdit) {
      payload.kind = 'coupon'
      payload.code = form.code.trim().toUpperCase()
    }

    if (form.creationMode === 'uses') {
      payload.maxUses = Number(form.maxUses)

      const today = new Date()
      const nextYear = new Date(today)
      nextYear.setFullYear(today.getFullYear() + 1)

      payload.validFrom = form.validFrom || today.toISOString().slice(0, 10)
      payload.validUntil = form.validUntil || nextYear.toISOString().slice(0, 10)
    } else {
      payload.validFrom = form.validFrom
      payload.validUntil = form.validUntil
    }

    setSaving(true)
    try {
      await onSave(payload, initial)
      onClose()
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Error al guardar cupón')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal title={isEdit ? 'Editar cupón' : 'Crear cupón'} onClose={onClose} maxWidth={720}>
      {error && (
        <div style={{ background: '#FEE2E2', border: '1px solid #FECACA', borderRadius: 10, padding: 12, marginBottom: 16, color: '#B91C1C' }}>
          {error}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
        <div style={{ gridColumn: '1 / -1', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
          <button type="button" onClick={() => set('creationMode', 'uses')} style={{ padding: '12px 14px', borderRadius: 10, border: form.creationMode === 'uses' ? '2px solid #2563EB' : '1.5px solid var(--border)', background: form.creationMode === 'uses' ? '#DBEAFE' : 'var(--bg-panel)', cursor: 'pointer', fontWeight: 700 }}>
            Crear por límite de usos
          </button>
          <button type="button" onClick={() => set('creationMode', 'time')} style={{ padding: '12px 14px', borderRadius: 10, border: form.creationMode === 'time' ? '2px solid #2563EB' : '1.5px solid var(--border)', background: form.creationMode === 'time' ? '#DBEAFE' : 'var(--bg-panel)', cursor: 'pointer', fontWeight: 700 }}>
            Crear por límite de tiempo
          </button>
        </div>

        <Field label="Nombre del cupón" required>
          <input style={inputStyle} value={form.name} onChange={e => set('name', e.target.value)} placeholder="Ej: PROMO10" />
        </Field>

        <Field label="Código" required>
          <input
            style={{ ...inputStyle, background: 'var(--bg-panel)' }}
            value={form.code}
            onChange={e => set('code', e.target.value)}
            placeholder="Ej: TARIMA10"
            disabled={isEdit}
          />
          {isEdit && (
            <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 6 }}>
              El código no puede modificarse después de crear el cupón.
            </div>
          )}
        </Field>

        <Field label="Porcentaje de descuento" required icon={Percent}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <input style={{ ...inputStyle, flex: 1 }} type="number" min="1" max="100" value={form.value} onChange={e => set('value', e.target.value)} placeholder="10" />
            <span style={{ fontSize: 14, fontWeight: 700 }}>%</span>
          </div>
        </Field>

        {form.creationMode === 'uses' ? (
          <Field label="Límite de usos" required>
            <input style={inputStyle} type="number" min="1" value={form.maxUses} onChange={e => set('maxUses', e.target.value)} placeholder="Cantidad máxima de usos" />
          </Field>
        ) : (
          <>
            <Field label="Fecha de inicio" required icon={CalendarDays}>
              <input style={inputStyle} type="date" value={form.validFrom} onChange={e => set('validFrom', e.target.value)} />
            </Field>
            <Field label="Fecha de finalización" required icon={CalendarDays}>
              <input style={inputStyle} type="date" value={form.validUntil} onChange={e => set('validUntil', e.target.value)} />
            </Field>
          </>
        )}

        <Field label="Opciones" style={{ gridColumn: '1 / -1' }}>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
              <input type="checkbox" checked={form.stackable} onChange={e => set('stackable', e.target.checked)} />
              Cupón acumulable con otros descuentos
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
              <input type="checkbox" checked={form.active} onChange={e => set('active', e.target.checked)} />
              Activar cupón
            </label>
          </div>
        </Field>
      </div>

      <div style={{ display: 'flex', gap: 10, marginTop: 18 }}>
        <button className="btn-secondary" type="button" onClick={onClose} style={{ flex: 1 }}>Cancelar</button>
        <button className="btn-primary" type="button" onClick={handleSubmit} disabled={saving} style={{ flex: 2, opacity: saving ? 0.7 : 1 }}>
          {saving ? 'Guardando...' : isEdit ? 'Guardar cambios' : 'Crear cupón'}
        </button>
      </div>
    </Modal>
  )
}

function CouponDetailModal({ coupon, onClose }) {
  if (!coupon) return null
  const validFrom = fmtDate(coupon.validFrom)
  const validUntil = fmtDate(coupon.validUntil)

  return (
    <Modal title={`Detalle de cupón`} onClose={onClose} maxWidth={640}>
      <div style={{ display: 'grid', gap: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 42, height: 42, borderRadius: 12, background: '#DBEAFE', color: '#1D4ED8', display: 'grid', placeItems: 'center' }}><Ticket size={22} /></div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 18 }}>{coupon.name}</div>
            <div style={{ color: 'var(--text-secondary)', fontSize: 13 }}>Código: {coupon.code}</div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div style={{ padding: 16, borderRadius: 14, background: '#F8FAFC' }}>
            <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 8 }}>Tipo</div>
            <div style={{ fontSize: 14, fontWeight: 700 }}>{coupon.title || 'Cupón'}</div>
          </div>
          <div style={{ padding: 16, borderRadius: 14, background: '#F8FAFC' }}>
            <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 8 }}>Descuento</div>
            <div style={{ fontSize: 14, fontWeight: 700 }}>{coupon.value}%</div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div style={{ padding: 16, borderRadius: 14, background: '#F8FAFC' }}>
            <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 8 }}>Válido desde</div>
            <div style={{ fontSize: 14, fontWeight: 700 }}>{validFrom}</div>
          </div>
          <div style={{ padding: 16, borderRadius: 14, background: '#F8FAFC' }}>
            <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 8 }}>Válido hasta</div>
            <div style={{ fontSize: 14, fontWeight: 700 }}>{validUntil}</div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div style={{ padding: 16, borderRadius: 14, background: '#F8FAFC' }}>
            <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 8 }}>Límite de usos</div>
            <div style={{ fontSize: 14, fontWeight: 700 }}>{coupon.maxUses || 'N/A'}</div>
          </div>
          <div style={{ padding: 16, borderRadius: 14, background: '#F8FAFC' }}>
            <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 8 }}>Estado</div>
            <Badge label={coupon.active ? 'Activo' : 'Inactivo'} color={coupon.active ? '#065F46' : '#B91C1C'} bg={coupon.active ? '#D1FAE5' : '#FEE2E2'} />
          </div>
        </div>

        <div style={{ padding: 16, borderRadius: 14, background: '#F8FAFC' }}>
          <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 8 }}>Acumulable</div>
          <div style={{ fontSize: 14, fontWeight: 700 }}>{coupon.stackable ? 'Sí' : 'No'}</div>
        </div>
      </div>
    </Modal>
  )
}

function ConfirmDeleteModal({ coupon, onClose, onConfirm }) {
  return (
    <Modal title="Eliminar cupón" onClose={onClose} maxWidth={460}>
      <div style={{ marginBottom: 18 }}>
        <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 10 }}>¿Estás seguro de eliminar este cupón?</div>
        <div style={{ fontWeight: 700, fontSize: 15 }}>{coupon.name} ({coupon.code})</div>
      </div>
      <div style={{ display: 'flex', gap: 10 }}>
        <button className="btn-secondary" onClick={onClose} style={{ flex: 1 }}>Cancelar</button>
        <button className="btn-primary" onClick={onConfirm} style={{ flex: 1 }}>Eliminar</button>
      </div>
    </Modal>
  )
}

export default function Coupons() {
  const [coupons, setCoupons] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editTarget, setEditTarget] = useState(null)
  const [detailTarget, setDetailTarget] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [statusFilter, setStatusFilter] = useState('todos')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await api.get('/discounts')
      const data = Array.isArray(res.data) ? res.data : res.data?.data || []
      setCoupons(data)
    } catch (err) {
      setCoupons([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const filtered = coupons.filter(c => {
    const term = search.toLowerCase().trim()
    const matchSearch = !term || c.name.toLowerCase().includes(term) || c.code.toLowerCase().includes(term)
    const matchStatus = statusFilter === 'todos' || (statusFilter === 'activas' ? c.active : !c.active)
    return matchSearch && matchStatus
  })

  const handleSave = async (payload, initial) => {
    if (initial?.discount_id) {
      await api.patch(`/discounts/${initial.discount_id}`, payload)
    } else {
      await api.post('/discounts', payload)
    }
    await load()
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    await api.delete(`/discounts/${deleteTarget.discount_id}`)
    setDeleteTarget(null)
    await load()
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-main)', padding: 28 }}>
      <style>{`
        @keyframes modalIn { from { opacity: 0; transform: scale(0.97) } to { opacity: 1; transform: scale(1) } }
      `}</style>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, gap: 12 }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 36, letterSpacing: 0.5, marginBottom: 4 }}>Cupones</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>Gestiona cupones disponibles, crea promociones por uso o por tiempo.</p>
        </div>
        <button className="btn-primary" style={{ padding: '11px 20px' }} onClick={() => { setEditTarget(null); setShowForm(true) }}>
          <Plus size={16} /> Crear cupón
        </button>
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center', marginBottom: 20 }}>
        <div className="search-bar" style={{ flex: 1, minWidth: 240 }}>
          <Search size={15} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar por nombre o código..." />
          {search && <button onClick={() => setSearch('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}><X size={14} /></button>}
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {['todos', 'activas', 'inactivas'].map(value => (
            <button key={value} onClick={() => setStatusFilter(value)} style={{
              padding: '8px 14px', borderRadius: 10, border: statusFilter === value ? '1.5px solid #2563EB' : '1.5px solid var(--border)',
              background: statusFilter === value ? '#DBEAFE' : 'var(--bg-panel)', color: statusFilter === value ? '#1D4ED8' : 'var(--text-secondary)', cursor: 'pointer'
            }}>
              {value === 'todos' ? 'Todos' : value === 'activas' ? 'Activos' : 'Inactivos'}
            </button>
          ))}
        </div>
      </div>

      <div style={{ background: 'var(--bg-card)', borderRadius: 16, border: '1.5px solid var(--border)', overflow: 'hidden' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1.8fr 1.2fr 1fr 1fr 1fr 120px', gap: 12, padding: '14px 20px', background: 'var(--bg-main)', borderBottom: '1.5px solid var(--border)' }}>
          {['Nombre', 'Código', 'Descuento', 'Válido', 'Estado', 'Acciones'].map(title => (
            <div key={title} style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: 0.5 }}>{title}</div>
          ))}
        </div>

        {loading ? (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-secondary)' }}>Cargando cupones...</div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-secondary)' }}>No hay cupones que coincidan.</div>
        ) : filtered.map((coupon, index) => (
          <div key={coupon.discount_id} style={{ display: 'grid', gridTemplateColumns: '1.8fr 1.2fr 1fr 1fr 1fr 120px', gap: 12, padding: '16px 20px', borderBottom: index === filtered.length - 1 ? 'none' : '1px solid var(--border-light)', alignItems: 'center' }}>
            <div>
              <div style={{ fontWeight: 700, marginBottom: 4 }}>{coupon.name}</div>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{coupon.kind === 'coupon' ? 'Cupón' : coupon.kind}</div>
            </div>
            <div style={{ fontSize: 14, fontWeight: 600 }}>{coupon.code}</div>
            <div style={{ fontSize: 14, color: '#065F46', fontWeight: 700 }}>{coupon.value}%</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2, fontSize: 12, color: 'var(--text-secondary)' }}>
              <span>{coupon.maxUses ? `${coupon.maxUses} usos` : 'Sin límite por usos'}</span>
              <span>{coupon.validFrom ? `${fmtDate(coupon.validFrom)} → ${fmtDate(coupon.validUntil)}` : 'Sin límite de tiempo'}</span>
            </div>
            <div>
              <Badge label={coupon.active ? 'Activo' : 'Inactivo'} color={coupon.active ? '#065F46' : '#B91C1C'} bg={coupon.active ? '#D1FAE5' : '#FEE2E2'} />
            </div>
            <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
              <button title="Ver detalle" onClick={() => setDetailTarget(coupon)} style={{ border: '1.5px solid var(--border)', borderRadius: 8, width: 34, height: 34, display: 'grid', placeItems: 'center', background: 'transparent', cursor: 'pointer' }}><Eye size={14} /></button>
              <button title="Editar" onClick={() => { setEditTarget(coupon); setShowForm(true) }} style={{ border: '1.5px solid var(--border)', borderRadius: 8, width: 34, height: 34, display: 'grid', placeItems: 'center', background: 'transparent', cursor: 'pointer' }}><Edit2 size={14} /></button>
              <button title="Eliminar" onClick={() => setDeleteTarget(coupon)} style={{ border: '1.5px solid var(--border)', borderRadius: 8, width: 34, height: 34, display: 'grid', placeItems: 'center', background: 'transparent', cursor: 'pointer' }}><Trash2 size={14} /></button>
            </div>
          </div>
        ))}
      </div>

      {showForm && (
        <CouponFormModal initial={editTarget} onClose={() => { setShowForm(false); setEditTarget(null) }} onSave={handleSave} />
      )}

      {detailTarget && (
        <CouponDetailModal coupon={detailTarget} onClose={() => setDetailTarget(null)} />
      )}

      {deleteTarget && (
        <ConfirmDeleteModal coupon={deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete} />
      )}
    </div>
  )
}
