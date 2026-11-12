import { useState, useEffect, useCallback, useMemo } from 'react'
import {
  Search, Plus, X, Edit2, Trash2,
  CalendarDays, Clock, Users, MapPin,
  ShoppingBag, CreditCard, CheckCircle2,
  Circle, XCircle, RefreshCw, Eye, Phone, User
} from 'lucide-react'
import api from '../Api/axios'

// ─── CONSTANTES ───────────────────────────────────────────────
const STATUS_CONFIG = {
  pendiente:  { label: 'Pendiente',  color: '#B45309', bg: '#FEF3C7' },
  confirmada: { label: 'Confirmada', color: '#1D4ED8', bg: '#DBEAFE' },
  en_curso:   { label: 'En curso',   color: '#065F46', bg: '#D1FAE5' },
  completada: { label: 'Completada', color: '#374151', bg: '#F3F4F6' },
  cancelada:  { label: 'Cancelada',  color: '#B91C1C', bg: '#FEE2E2' },
}

const PAY_STATUS = {
  pendiente: { label: 'Pendiente', color: '#B45309', bg: '#FEF3C7' },
  aprobado:  { label: 'Aprobado',  color: '#065F46', bg: '#D1FAE5' },
}

const ORDER_STATUS = {
  abierto: { label: 'Abierto', color: '#1D4ED8', bg: '#DBEAFE' },
  servido: { label: 'Servido', color: '#065F46', bg: '#D1FAE5' },
}

const EMPTY_FORM = {
  table_id: '', date: '', startTime: '', endTime: '',
  peopleCount: 1, channel: 'presencial', notes: '', status: 'pendiente',
  guest: { fullname: '', phone: '', notes: '' },
  appliedCoupons: []
}

// ─── SAMPLE DATA ──────────────────────────────────────────────
const SAMPLE_RESERVATIONS = [
  {
    reservation_id: 'RES_0001', table_id: 'TBL_0001',
    date: '2026-06-15', startTime: '19:00', endTime: '21:00',
    peopleCount: 4, status: 'confirmada', channel: 'telefono',
    guest: { fullname: 'Juan Pérez', phone: '3001234567' },
    orders: [
      {
        order_id: 'ORD_0001', status: 'abierto', totalAmount: 110000,
        payments: [{ payment_id: 'PAY_0001', amount: 60000, method: 'nequi', status: 'aprobado' }]
      }
    ]
  },
  {
    reservation_id: 'RES_0002', table_id: 'TBL_0002',
    date: '2026-06-16', startTime: '12:00', endTime: '14:00',
    peopleCount: 2, status: 'pendiente', channel: 'web',
    guest: { fullname: 'María López', phone: '3109876543' },
    orders: []
  },
  {
    reservation_id: 'RES_0003', table_id: 'TBL_0001',
    date: '2026-06-14', startTime: '20:00', endTime: '22:30',
    peopleCount: 6, status: 'completada', channel: 'presencial',
    guest: { fullname: 'Carlos Grupo', phone: '3205555555' },
    orders: [
      {
        order_id: 'ORD_0002', status: 'servido', totalAmount: 245000,
        payments: [
          { payment_id: 'PAY_0002', amount: 122500, method: 'efectivo', status: 'aprobado' },
          { payment_id: 'PAY_0003', amount: 122500, method: 'tarjeta',  status: 'aprobado' }
        ]
      }
    ]
  },
  {
    reservation_id: 'RES_0004', table_id: 'TBL_0003',
    date: '2026-06-17', startTime: '18:00', endTime: '20:00',
    peopleCount: 3, status: 'cancelada', channel: 'telefono',
    guest: { fullname: 'Ana Torres', phone: '' },
    orders: []
  },
]

const SAMPLE_TABLES = [
  { table_id: 'TBL_0001', tableNumber: 1, capacity: 4, zone: 'Interior' },
  { table_id: 'TBL_0002', tableNumber: 2, capacity: 6, zone: 'Terraza' },
  { table_id: 'TBL_0003', tableNumber: 3, capacity: 2, zone: 'Bar' },
  { table_id: 'TBL_0004', tableNumber: 4, capacity: 8, zone: 'VIP' },
]

const SAMPLE_CLIENTS = [
  { docID: 'CC123456', fullname: 'Juan Pérez', phone: '3001234567', address: 'Calle 12 #34-56' },
  { docID: 'CC234567', fullname: 'María López', phone: '3109876543', address: 'Carrera 5 #8-90' },
  { docID: 'CC345678', fullname: 'Carlos Gómez', phone: '3155556666', address: 'Av. Bolívar #45-12' },
]

// ─── HELPERS ──────────────────────────────────────────────────
const fmt = (n) => '$ ' + Number(n).toLocaleString('es-CO')
const fmtDate = (d) => {
  if (!d) return ''
  const [y, m, day] = d.split('-')
  return `${day}/${m}/${y}`
}

const normalizeTimeTo24h = (value) => {
  if (!value) return value

  const cleanValue = String(value).trim()

  if (/^\d{2}:\d{2}$/.test(cleanValue)) {
    return cleanValue
  }

  const match = cleanValue.match(/^(\d{1,2}):(\d{2})\s?(AM|PM)$/i)

  if (!match) {
    return cleanValue
  }

  let [, hour, minute, period] = match
  hour = Number(hour)
  period = period.toUpperCase()

  if (period === 'PM' && hour !== 12) {
    hour += 12
  }

  if (period === 'AM' && hour === 12) {
    hour = 0
  }

  return `${String(hour).padStart(2, '0')}:${minute}`
}

const timeToMinutes = (time) => {
  const [h, m] = String(time).split(':').map(Number)
  return h * 60 + m
}

const getDurationMinutes = (startTime, endTime) => {
  let start = timeToMinutes(startTime)
  let end = timeToMinutes(endTime)

  if (end <= start) {
    end += 24 * 60
  }

  return end - start
}

const getApiErrorMessage = (err, fallback = 'Error inesperado') => {
  const data = err.response?.data

  const details = data?.errors
    ?.map(e => `${e.field}: ${e.message}`)
    .join('\n')

  return `${data?.message || err.message || fallback}${details ? `\n\nDetalles:\n${details}` : ''}`
}

// Dado un table_id, devuelve "Mesa 3 — Terraza" usando la lista de mesas
const tableLabel = (tableId, tables) => {
  const t = tables.find(t => t.table_id === tableId)
  if (!t) return tableId
  return `Mesa ${t.tableNumber}${t.zone ? ` — ${t.zone}` : ''}`
}

const tableNumber = (tableId, tables) => {
  const t = tables.find(t => t.table_id === tableId)
  return t ? `Mesa ${t.tableNumber}` : tableId
}

// ─── BADGE ────────────────────────────────────────────────────
function Badge({ status, map }) {
  const s = map[status] || { label: status, color: '#666', bg: '#F3F4F6' }
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      padding: '3px 10px', borderRadius: 99,
      background: s.bg, color: s.color,
      fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap',
      border: `1px solid ${s.color}30`
    }}>
      {s.label}
    </span>
  )
}

// ─── MODAL WRAPPER ────────────────────────────────────────────
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
        boxShadow: '0 24px 64px rgba(0, 0, 0, 0.18)',
        animation: 'modalIn 0.18s ease'
      }} onClick={e => e.stopPropagation()}>
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '22px 24px 18px',
          borderBottom: '1.5px solid var(--border)'
        }}>
          <span style={{ fontFamily: 'var(--font-display)', fontSize: 22, letterSpacing: 0.3 }}>
            {title}
          </span>
          <button onClick={onClose} style={{
            background: 'none', border: 'none', cursor: 'pointer',
            color: 'var(--text-secondary)', display: 'flex', padding: 4, borderRadius: 6
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
  color: 'var(--text-primary)', transition: 'border-color 0.15s',
  boxSizing: 'border-box'
}

// ─── DETAIL MODAL ─────────────────────────────────────────────
function DetailModal({ res, tables, orders = [], onClose }) {
  const paid = (orders || []).reduce((s, o) =>
    s + (o.payments || []).filter(p => p.status === 'aprobado')
      .reduce((ps, p) => ps + p.amount, 0), 0)
  const total = (orders || []).reduce((s, o) => s + (o.totalAmount || 0), 0)
  const name  = res.guest?.fullname || res.clientRef?.fullname || '—'

  // Calcular descuento total de cupones
  const coupons = res.appliedCoupons || []
  let totalDiscount = 0
  coupons.forEach(coupon => {
    if (coupon.type === 'percentage') {
      totalDiscount += (total * coupon.value) / 100
    } else {
      totalDiscount += coupon.value
    }
  })
  const discountedTotal = Math.max(0, total - totalDiscount)

  return (
    <Modal title={`Detalle — ${res.reservation_id}`} onClose={onClose}>

      {/* Info chips */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 20 }}>
        {[
          { icon: CalendarDays, label: 'Fecha',    val: fmtDate(res.date) },
          { icon: Clock,        label: 'Horario',  val: `${res.startTime} – ${res.endTime}` },
          { icon: MapPin,       label: 'Mesa',     val: tableLabel(res.table_id, tables) },
          { icon: Users,        label: 'Personas', val: `${res.peopleCount} personas` },
          { icon: User,         label: 'Cliente',  val: name },
          { icon: Phone,        label: 'Teléfono', val: res.guest?.phone || '—' },
        ].map(({ icon: Icon, label, val }) => (
          <div key={label} style={{
            background: 'var(--bg-main)', borderRadius: 8,
            padding: '10px 12px', display: 'flex', alignItems: 'center', gap: 10
          }}>
            <Icon size={14} color="var(--text-secondary)" style={{ flexShrink: 0 }} />
            <div>
              <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 1 }}>{label}</div>
              <div style={{ fontSize: 13, fontWeight: 600 }}>{val}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Cupones aplicados */}
      {coupons.length > 0 && (
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 10 }}>
            Cupones aplicados
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {coupons.map(coupon => (
              <div key={coupon.discount_id} style={{
                background: '#F0FDF4', border: '1.5px solid #86EFAC',
                borderRadius: 10, padding: 12
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', gap: 10 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: 13, color: '#166534', marginBottom: 4 }}>
                      {coupon.name}
                    </div>
                    <div style={{ fontSize: 12, color: '#4ADE80' }}>
                      Código: <strong>{coupon.code}</strong> • Estado: {coupon.consumed ? 'Consumido' : 'Pendiente'}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#16A34A' }}>
                      -{coupon.type === 'percentage' ? `${coupon.value}%` : fmt(coupon.value)}
                    </div>
                    <div style={{ fontSize: 12, color: '#86EFAC' }}>
                      {coupon.type === 'percentage' ? fmt((total * coupon.value) / 100) : 'Fijo'}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 10 }}>
        Órdenes asociadas
      </div>

      {!(orders || res.orders)?.length ? (
        <p style={{ fontSize: 13, color: 'var(--text-secondary)', padding: '12px 0' }}>Sin órdenes registradas</p>
      ) : (
        (orders || res.orders).map(order => (
          <div key={order.order_id} style={{
            border: '1.5px solid var(--border)', borderRadius: 10, marginBottom: 12, overflow: 'hidden'
          }}>
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '10px 14px', background: 'var(--bg-main)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <ShoppingBag size={14} color="var(--text-secondary)" />
                <span style={{ fontSize: 13, fontWeight: 700 }}>{order.order_id}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 13, fontWeight: 700 }}>{fmt(order.totalAmount)}</span>
                <Badge status={order.status} map={ORDER_STATUS} />
              </div>
            </div>

            {order.payments?.length > 0 && (
              <div style={{ padding: '6px 14px' }}>
                {order.payments.map(pay => (
                  <div key={pay.payment_id} style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '7px 0', borderBottom: '1px solid var(--border-light)'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <CreditCard size={13} color="var(--text-secondary)" />
                      <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{pay.payment_id}</span>
                      <span style={{
                        fontSize: 11, padding: '2px 8px', background: '#F3F4F6',
                        borderRadius: 99, color: 'var(--text-secondary)', textTransform: 'capitalize'
                      }}>{pay.method}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{ fontSize: 13, fontWeight: 600 }}>{fmt(pay.amount)}</span>
                      <Badge status={pay.status} map={PAY_STATUS} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))
      )}

      {total > 0 && (
        <div style={{
          marginTop: 8, padding: '12px 16px', background: 'var(--bg-main)',
          borderRadius: 10, display: 'flex', justifyContent: 'space-between'
        }}>
          {[
            { label: 'Subtotal',  val: fmt(total),                                    color: 'var(--text-secondary)' },
            totalDiscount > 0 && { label: 'Descuento', val: `-${fmt(totalDiscount)}`, color: '#16A34A' },
            { label: 'Total',     val: fmt(discountedTotal),                           color: 'var(--text-primary)' },
            { label: 'Pagado',    val: fmt(paid),                   color: '#065F46' },
            { label: 'Pendiente', val: fmt(Math.max(0, discountedTotal-paid)), color: discountedTotal-paid > 0 ? '#B91C1C' : '#065F46' },
          ].filter(Boolean).map(({ label, val, color }) => (
            <div key={label} style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 2 }}>{label}</div>
              <div style={{ fontSize: 16, fontWeight: 700, color }}>{val}</div>
            </div>
          ))}
        </div>
      )}
    </Modal>
  )
}

// ─── FORM MODAL ───────────────────────────────────────────────
function ReservationFormModal({ initial, tables, clients, onClose, onSave }) {
  const isEdit = !!initial?.reservation_id

  const [form, setForm] = useState(() => {
    if (initial) {
      return {
        ...initial,
        clientType: initial.clientRef ? 'registered' : 'guest',
        clientRef: initial.clientRef ? { ...initial.clientRef } : { fullname: '', docID: '' },
        guest: initial.guest ? { ...initial.guest } : { fullname: '', phone: '', notes: '' },
        appliedCoupons: initial.appliedCoupons || []
      }
    }
    return {
      ...EMPTY_FORM,
      clientType: 'guest',
      clientRef: { fullname: '', docID: '' }
    }
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [clientSearch, setClientSearch] = useState('')
  const [selectedClient, setSelectedClient] = useState(initial?.clientRef ? { ...initial.clientRef } : null)
  const [couponCode, setCouponCode] = useState('')
  const [couponLoading, setCouponLoading] = useState(false)
  const [couponError, setCouponError] = useState('')

  const set      = (k, v) => setForm(f => ({ ...f, [k]: v }))
  const setGuest = (k, v) => setForm(f => ({ ...f, guest: { ...f.guest, [k]: v } }))
  const setClientRef = (k, v) => setForm(f => ({ ...f, clientRef: { ...f.clientRef, [k]: v } }))

  const handleClientTypeChange = (type) => {
    setForm(f => ({
      ...f,
      clientType: type,
      ...(type === 'registered'
        ? { clientRef: { fullname: '', docID: '' }, guest: { fullname: '', phone: '', notes: '' } }
        : { guest: { fullname: '', phone: '', notes: '' }, clientRef: { fullname: '', docID: '' } })
    }))
    setSelectedClient(type === 'registered' && initial?.clientRef ? { ...initial.clientRef } : null)
    setClientSearch('')
  }

  const filteredClients = clients.filter(c => {
    const term = clientSearch.toLowerCase()
    return c.fullname.toLowerCase().includes(term) || c.docID.toLowerCase().includes(term)
  })

  const selectClient = (client) => {
    setSelectedClient(client)
    setForm(f => ({ ...f, clientRef: { fullname: client.fullname, docID: client.docID } }))
  }

  // ── COUPON LOGIC ──
  const handleSearchCoupon = async () => {
    if (!couponCode.trim()) {
      setCouponError('Ingresa un código de cupón')
      return
    }

    setCouponLoading(true)
    setCouponError('')
    try {
      const res = await api.get(`/discounts?code=${couponCode.trim().toUpperCase()}`)
      const coupons = res.data?.data || []

      if (coupons.length === 0) {
        setCouponError('Cupón no encontrado')
        setCouponLoading(false)
        return
      }

      const coupon = coupons[0]
      const now = new Date()
      const validFrom = new Date(coupon.validFrom)
      const validUntil = new Date(coupon.validUntil)

      // Validaciones
      if (!coupon.active) {
        setCouponError('Este cupón está inactivo')
        setCouponLoading(false)
        return
      }

      if (now < validFrom) {
        setCouponError('Este cupón aún no está disponible')
        setCouponLoading(false)
        return
      }

      if (now > validUntil) {
        setCouponError('Este cupón ha expirado')
        setCouponLoading(false)
        return
      }

      if (coupon.maxUses && coupon.usedCount >= coupon.maxUses) {
        setCouponError('Este cupón ha alcanzado el límite de usos')
        setCouponLoading(false)
        return
      }

      // Verificar si ya está aplicado
      if (form.appliedCoupons?.some(c => c.discount_id === coupon.discount_id)) {
        setCouponError('Este cupón ya está aplicado')
        setCouponLoading(false)
        return
      }

      // Agregar el cupón
      const appliedCoupon = {
        discount_id: coupon.discount_id,
        code: coupon.code,
        name: coupon.name,
        type: coupon.type,
        value: coupon.value,
        stackable: coupon.stackable,
        consumed: false,
        appliedAt: new Date().toISOString()
      }

      setForm(f => ({
        ...f,
        appliedCoupons: [...(f.appliedCoupons || []), appliedCoupon]
      }))

      setCouponCode('')
      setCouponError('')
    } catch (e) {
      setCouponError('Error al buscar el cupón')
    } finally {
      setCouponLoading(false)
    }
  }

  const removeCoupon = (discountId) => {
    setForm(f => ({
      ...f,
      appliedCoupons: (f.appliedCoupons || []).filter(c => c.discount_id !== discountId)
    }))
  }

  const calculateCouponDiscount = (coupon, baseAmount = 0) => {
    if (coupon.type === 'percentage') {
      return (baseAmount * coupon.value) / 100
    }
    return coupon.value
  }

  const handleSubmit = async () => {
    setError('')
    if (!form.table_id) return setError('Selecciona una mesa')
    if (!form.date) return setError('La fecha es obligatoria')
    if (!form.startTime) return setError('La hora de inicio es obligatoria')
    if (!form.endTime) return setError('La hora de fin es obligatoria')
  const duration = getDurationMinutes(form.startTime, form.endTime)

    if (duration < 30) {
      return setError('La reserva debe tener una duración mínima de 30 minutos')
    }

    if (duration > 480) {
      return setError('La reserva no puede exceder 8 horas')
    }

    if (form.clientType === 'registered') {
      if (!selectedClient?.docID) return setError('Selecciona un cliente registrado')
    } else {
      if (!form.guest?.fullname) return setError('El nombre del cliente invitado es obligatorio')
    }

    setSaving(true)
    try {
      await onSave(form)
      onClose()
    } catch(e) {
      setError(getApiErrorMessage(e, 'Error al guardar'))
    } finally {
      setSaving(false)
    }
  }

  const activeTables = tables.filter(t => t.active !== false)

  return (
    <Modal title={isEdit ? 'Editar reservación' : 'Nueva reservación'} onClose={onClose}>

      {error && (
        <div style={{
          background: '#FEE2E2', border: '1px solid #FECACA',
          borderRadius: 8, padding: '10px 14px', marginBottom: 16,
          fontSize: 13, color: '#B91C1C', display: 'flex', alignItems: 'center', gap: 8
        }}>
          <X size={14} /> {error}
        </div>
      )}

      <div style={{ display: 'flex', gap: 10, marginBottom: 18, flexWrap: 'wrap' }}>
        {['registered', 'guest'].map(type => (
          <button key={type}
            type="button"
            onClick={() => handleClientTypeChange(type)}
            style={{
              flex: 1,
              minWidth: 140,
              padding: '12px 14px',
              borderRadius: 10,
              border: `1.5px solid ${form.clientType === type ? '#2563EB' : 'var(--border)'}`,
              background: form.clientType === type ? '#DBEAFE' : 'var(--bg-panel)',
              color: form.clientType === type ? '#1D4ED8' : 'var(--text-primary)',
              cursor: 'pointer',
              fontWeight: 700
            }}
          >
            {type === 'registered' ? 'Cliente registrado' : 'Invitado'}
          </button>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>

        {/* ── Mesa ── */}
        <div style={{ gridColumn: '1 / -1' }}>
          <Field label="Mesa" required>
            <select
              style={{ ...inputStyle, cursor: 'pointer', appearance: 'auto' }}
              value={form.table_id}
              onChange={e => set('table_id', e.target.value)}
            >
              <option value="">Seleccionar mesa...</option>
              {activeTables.map(t => (
                <option key={t.table_id} value={t.table_id}>
                  Mesa {t.tableNumber} — {t.zone} (cap. {t.capacity} personas)
                </option>
              ))}
            </select>
          </Field>
        </div>

        <Field label="Fecha" required>
          <input style={inputStyle} type="date" value={form.date}
            onChange={e => set('date', e.target.value)} />
        </Field>

        <Field label="Personas" required>
          <input style={inputStyle} type="number" min={1} max={50} value={form.peopleCount}
            onChange={e => set('peopleCount', Number(e.target.value))} />
        </Field>

        <Field label="Hora inicio" required>
          <input style={inputStyle} type="time" value={form.startTime}
            onChange={e => set('startTime', e.target.value)} />
        </Field>

        <Field label="Hora fin" required>
          <input style={inputStyle} type="time" value={form.endTime}
            onChange={e => set('endTime', e.target.value)} />
        </Field>

        <Field label="Canal">
          <select style={{ ...inputStyle, cursor: 'pointer', appearance: 'auto' }}
            value={form.channel} onChange={e => set('channel', e.target.value)}>
            <option value="">Seleccionar...</option>
            <option value="telefono">Teléfono</option>
            <option value="web">Web</option>
            <option value="presencial">Presencial</option>
            <option value="app">App</option>
          </select>
        </Field>

        {isEdit && (
          <Field label="Estado">
            <select style={{ ...inputStyle, cursor: 'pointer', appearance: 'auto' }}
              value={form.status} onChange={e => set('status', e.target.value)}>
              {Object.entries(STATUS_CONFIG).map(([k, v]) => (
                <option key={k} value={k}>{v.label}</option>
              ))}
            </select>
          </Field>
        )}
      </div>

      {/* Cliente */}
      <div style={{ borderTop: '1.5px solid var(--border)', paddingTop: 16, marginTop: 4, marginBottom: 14 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 12 }}>
          Datos del cliente
        </div>

        {form.clientType === 'registered' ? (
          <>
            <Field label="Buscar cliente registrado" required>
              <input style={inputStyle} value={clientSearch}
                onChange={e => setClientSearch(e.target.value)}
                placeholder="Buscar por nombre o documento" />
            </Field>

            {selectedClient ? (
              <div style={{ gridColumn: '1 / -1', background: '#F3F4F6', border: '1.5px solid var(--border)', borderRadius: 12, padding: 14, marginBottom: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
                  <div>
                    <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Cliente seleccionado</div>
                    <div style={{ fontSize: 15, fontWeight: 700 }}>{selectedClient.fullname}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{selectedClient.docID}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{selectedClient.phone}</div>
                  </div>
                  <button type="button" onClick={() => { setSelectedClient(null); setForm(f => ({ ...f, clientRef: { fullname: '', docID: '' } })) }}
                    style={{ border: '1.5px solid var(--border)', borderRadius: 10, padding: '10px 14px', background: 'var(--bg-panel)', cursor: 'pointer' }}>
                    Cambiar cliente
                  </button>
                </div>
              </div>
            ) : (
              <div style={{ gridColumn: '1 / -1' }}>
                {filteredClients.length === 0 ? (
                  <div style={{ padding: 14, color: 'var(--text-secondary)', fontSize: 13 }}>No se encontraron clientes.</div>
                ) : (
                  <div style={{ display: 'grid', gap: 10, marginBottom: 14 }}>
                    {filteredClients.map(client => (
                      <button key={client.docID} type="button" onClick={() => selectClient(client)}
                        style={{
                          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                          padding: '12px 14px', borderRadius: 12, border: '1.5px solid var(--border)',
                          background: 'var(--bg-panel)', cursor: 'pointer', textAlign: 'left'
                        }}>
                        <div>
                          <div style={{ fontWeight: 700 }}>{client.fullname}</div>
                          <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{client.docID} • {client.phone || 'Sin teléfono'}</div>
                        </div>
                        <span style={{ color: '#2563EB', fontWeight: 700 }}>Seleccionar</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
            <Field label="Nombre" required>
              <input style={inputStyle} value={form.guest?.fullname || ''}
                onChange={e => setGuest('fullname', e.target.value)}
                placeholder="Nombre completo" />
            </Field>
            <Field label="Teléfono">
              <input style={inputStyle} value={form.guest?.phone || ''}
                onChange={e => setGuest('phone', e.target.value)}
                placeholder="3001234567" />
            </Field>
          </div>
        )}
      </div>

      {form.clientType === 'registered' && selectedClient && (
        <div style={{ gridColumn: '1 / -1', marginBottom: 14 }}>
          <Field label="Cliente registrado" required>
            <input style={inputStyle} value={selectedClient.fullname}
              readOnly />
          </Field>
        </div>
      )}

      <Field label="Notas">
        <textarea style={{ ...inputStyle, resize: 'vertical', minHeight: 68 }}
          value={form.notes || ''} onChange={e => set('notes', e.target.value)}
          placeholder="Peticiones especiales, alergias, ocasión especial..." />
      </Field>

      {/* ── CUPONES ── */}
      <div style={{ borderTop: '1.5px solid var(--border)', paddingTop: 16, marginTop: 16, marginBottom: 16 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 12 }}>
          Cupones y descuentos
        </div>

        {/* Búsqueda de cupón */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
          <div style={{ flex: 1 }}>
            <input
              style={inputStyle}
              value={couponCode}
              onChange={e => { setCouponCode(e.target.value); setCouponError('') }}
              onKeyPress={e => e.key === 'Enter' && handleSearchCoupon()}
              placeholder="Ingresa código de cupón..."
              disabled={couponLoading}
            />
          </div>
          <button
            type="button"
            onClick={handleSearchCoupon}
            disabled={couponLoading || !couponCode.trim()}
            style={{
              padding: '10px 14px', borderRadius: 8,
              background: '#2563EB', color: '#fff', border: 'none',
              cursor: 'pointer', fontWeight: 600, fontSize: 13,
              opacity: couponLoading || !couponCode.trim() ? 0.5 : 1
            }}
          >
            {couponLoading ? 'Buscando...' : 'Aplicar'}
          </button>
        </div>

        {/* Error de cupón */}
        {couponError && (
          <div style={{
            background: '#FEE2E2', border: '1px solid #FECACA',
            borderRadius: 8, padding: '8px 12px', marginBottom: 12,
            fontSize: 12, color: '#B91C1C'
          }}>
            {couponError}
          </div>
        )}

        {/* Cupones aplicados */}
        {form.appliedCoupons && form.appliedCoupons.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {form.appliedCoupons.map(coupon => (
              <div key={coupon.discount_id} style={{
                background: '#F0FDF4', border: '1.5px solid #86EFAC',
                borderRadius: 10, padding: 12, display: 'flex',
                justifyContent: 'space-between', alignItems: 'center'
              }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 13, color: '#166534' }}>
                    {coupon.name}
                  </div>
                  <div style={{ fontSize: 12, color: '#4ADE80' }}>
                    Código: <strong>{coupon.code}</strong> • 
                    {coupon.type === 'percentage' ? ` ${coupon.value}%` : ` $${Number(coupon.value).toLocaleString('es-CO')}`}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => removeCoupon(coupon.discount_id)}
                  style={{
                    background: 'none', border: 'none', cursor: 'pointer',
                    color: '#16A34A', padding: '8px'
                  }}
                >
                  <X size={18} />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div style={{
            padding: 12, textAlign: 'center', color: 'var(--text-secondary)',
            fontSize: 13, background: 'var(--bg-main)', borderRadius: 8
          }}>
            Sin cupones aplicados
          </div>
        )}
      </div>

      <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
        <button className="btn-secondary" onClick={onClose} style={{ flex: 1 }}>
          Cancelar
        </button>
        <button className="btn-primary" onClick={handleSubmit}
          disabled={saving}
          style={{ flex: 2, opacity: saving ? 0.7 : 1 }}>
          {saving ? 'Guardando...' : isEdit ? 'Guardar cambios' : 'Crear reservación'}
        </button>
      </div>
    </Modal>
  )
}

// ─── ACTION BUTTON ────────────────────────────────────────────
function ActionBtn({ icon: Icon, onClick, title, hoverColor }) {
  const [hover, setHover] = useState(false)
  return (
    <button
      title={title}
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        width: 30, height: 30, borderRadius: 7, cursor: 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        border: `1.5px solid ${hover ? hoverColor : 'var(--border)'}`,
        background: hover ? hoverColor + '15' : 'transparent',
        color: hover ? hoverColor : 'var(--text-secondary)',
        transition: 'all 0.12s'
      }}>
      <Icon size={13} />
    </button>
  )
}

// ─── ROW ──────────────────────────────────────────────────────
function Row({ res, tables, orders = [], onView, onEdit, onDelete, index }) {
  const actualOrders = orders.length > 0 ? orders : (res.orders || [])
  const name        = res.guest?.fullname || res.clientRef?.fullname || '—'
  const orderCount  = actualOrders.length
  const totalAmount = actualOrders.reduce((s, o) => s + (o.totalAmount || 0), 0)
  const totalPaid   = actualOrders.reduce((s, o) =>
    s + (o.payments || []).filter(p => p.status === 'aprobado')
      .reduce((ps, p) => ps + p.amount, 0), 0)

  // Calcular descuento total de cupones
  const coupons = res.appliedCoupons || []
  let totalDiscount = 0
  coupons.forEach(coupon => {
    if (coupon.type === 'percentage') {
      totalDiscount += (totalAmount * coupon.value) / 100
    } else {
      totalDiscount += coupon.value
    }
  })
  const discountedTotal = Math.max(0, totalAmount - totalDiscount)

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: '1.4fr 1.2fr 110px 90px 130px 140px 110px',
      alignItems: 'center', gap: 12,
      padding: '13px 20px', background: 'var(--bg-card)',
      borderBottom: '1.5px solid var(--border-light)',
      animation: `fadeIn 0.2s ease ${index * 0.03}s both`,
      transition: 'background 0.1s'
    }}
      onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-panel)'}
      onMouseLeave={e => e.currentTarget.style.background = 'var(--bg-card)'}
    >
      {/* Cliente */}
      <div>
        <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 2 }}>
          {name}
        </div>
        <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
          {res.reservation_id}
        </div>
      </div>

      {/* Fecha y hora */}
      <div>
        <div style={{ fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 5 }}>
          <CalendarDays size={12} color="var(--text-secondary)" />
          {fmtDate(res.date)}
        </div>
        <div style={{ fontSize: 12, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 4, marginTop: 3 }}>
          <Clock size={10} />{res.startTime} – {res.endTime}
        </div>
      </div>

      {/* Mesa */}
      <div style={{ fontSize: 13, fontWeight: 600 }}>
        {tableNumber(res.table_id, tables)}
        <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 2 }}>
          {res.peopleCount} pers.
        </div>
      </div>

      {/* Órdenes */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <ShoppingBag size={13} color={orderCount > 0 ? '#3B82F6' : '#CBD5E1'} />
        <span style={{
          fontSize: 14, fontWeight: 600,
          color: orderCount > 0 ? '#3B82F6' : 'var(--text-secondary)'
        }}>{orderCount}</span>
      </div>

      {/* Pagos + Cupón */}
      <div>
        {totalAmount > 0 ? (
          <>
            <div style={{ fontSize: 13, fontWeight: 700 }}>{fmt(totalPaid)}</div>
            <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
              de {fmt(discountedTotal > 0 ? discountedTotal : totalAmount)}
              {totalDiscount > 0 && (
                <span style={{ display: 'block', color: '#16A34A', fontWeight: 600, marginTop: 2 }}>
                  Desc: {fmt(totalDiscount)}
                </span>
              )}
            </div>
          </>
        ) : (
          <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>—</span>
        )}
      </div>

      {/* Estado + Cupón */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'flex-start' }}>
        <Badge status={res.status} map={STATUS_CONFIG} />
        {coupons.length > 0 && (
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 4,
            padding: '2px 8px', borderRadius: 6, background: '#F0FDF4',
            border: '1px solid #86EFAC', fontSize: 10, fontWeight: 600,
            color: '#166534'
          }}>
            <span>✓</span>
            <span>{coupons.length} cupón{coupons.length > 1 ? 'es' : ''}</span>
          </div>
        )}
      </div>

      {/* Acciones */}
      <div style={{ display: 'flex', gap: 5, justifyContent: 'flex-end' }}>
        <ActionBtn icon={Eye}    onClick={() => onView(res)}   title="Ver detalle" hoverColor="#3B82F6" />
        <ActionBtn icon={Edit2}  onClick={() => onEdit(res)}   title="Editar"      hoverColor="#F59E0B" />
        <ActionBtn icon={Trash2} onClick={() => onDelete(res)} title="Cancelar"    hoverColor="#EF4444" />
      </div>
    </div>
  )
}

// ─── FILTER PILL ──────────────────────────────────────────────
// Arreglado: "Todos" ahora usa estilos distintos al resto para que el texto sea siempre visible
function FilterPill({ value, active, onClick }) {
  const isTodos = value === 'todos'
  const cfg     = STATUS_CONFIG[value]

  // Estilos cuando está activo
  const activeBg    = isTodos ? '#1A1A1A' : (cfg?.bg  || '#F3F4F6')
  const activeColor = isTodos ? '#FFFFFF'  : (cfg?.color || '#374151')
  const activeBorder= isTodos ? '#1A1A1A' : (cfg?.color || '#9CA3AF')

  return (
    <button onClick={onClick} style={{
      padding: '8px 14px', borderRadius: 8, cursor: 'pointer',
      fontFamily: 'var(--font-body)', fontSize: 13,
      fontWeight: active ? 600 : 400,
      transition: 'all 0.12s',
      border: active ? `1.5px solid ${activeBorder}` : '1.5px solid var(--border)',
      background: active ? activeBg : '#fff',
      color: active ? activeColor : 'var(--text-secondary)',
    }}>
      {isTodos ? 'Todos' : cfg?.label || value}
    </button>
  )
}

// ─── MAIN PAGE ────────────────────────────────────────────────
export default function Reservations() {
  const [reservations, setReservations] = useState([])
  const [tables, setTables]             = useState([])
  const [clients, setClients]           = useState([])
  const [orders, setOrders]             = useState([])
  const [payments, setPayments]         = useState([])
  const [loading, setLoading]           = useState(true)
  const [search, setSearch]             = useState('')
  const [statusFilter, setStatusFilter] = useState('todos')
  const [showForm, setShowForm]         = useState(false)
  const [editTarget, setEditTarget]     = useState(null)
  const [detailTarget, setDetailTarget] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    // Carga reservaciones, mesas, clientes, órdenes y pagos en paralelo
    const [resResult, tablesResult, clientsResult, ordersResult, paymentsResult] = await Promise.allSettled([
      api.get('/reservations'),
      api.get('/tables'),
      api.get('/clients'),
      api.get('/orders?limit=100'),
      api.get('/payments?limit=100')
    ])

    // Reservaciones
    if (resResult.status === 'fulfilled') {
      const d = resResult.value.data?.data || resResult.value.data
      setReservations(Array.isArray(d) && d.length > 0 ? d : SAMPLE_RESERVATIONS)
    } else {
      setReservations(SAMPLE_RESERVATIONS)
    }

    // Mesas
    if (tablesResult.status === 'fulfilled') {
      const d = tablesResult.value.data?.data || tablesResult.value.data
      setTables(Array.isArray(d) && d.length > 0 ? d : SAMPLE_TABLES)
    } else {
      setTables(SAMPLE_TABLES)
    }

    // Clientes
    if (clientsResult.status === 'fulfilled') {
      const d = clientsResult.value.data?.data || clientsResult.value.data
      setClients(Array.isArray(d) && d.length > 0 ? d : SAMPLE_CLIENTS)
    } else {
      setClients(SAMPLE_CLIENTS)
    }

    // Órdenes
    if (ordersResult.status === 'fulfilled') {
      const d = ordersResult.value.data?.data || ordersResult.value.data
      setOrders(Array.isArray(d) && d.length > 0 ? d : [])
    } else {
      setOrders([])
    }

    // Pagos
    if (paymentsResult.status === 'fulfilled') {
      const d = paymentsResult.value.data?.data || paymentsResult.value.data
      setPayments(Array.isArray(d) && d.length > 0 ? d : [])
    } else {
      setPayments([])
    }

    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  // Filtrar
  const filtered = reservations.filter(r => {
    const name = (r.guest?.fullname || r.clientRef?.fullname || '').toLowerCase()
    const matchSearch =
      r.reservation_id.toLowerCase().includes(search.toLowerCase()) ||
      name.includes(search.toLowerCase()) ||
      r.table_id.toLowerCase().includes(search.toLowerCase())
    const matchStatus = statusFilter === 'todos' || r.status === statusFilter
    return matchSearch && matchStatus
  })

  const buildReservationPayload = (form) => {
    const base = {
      table_id: form.table_id,
      date: form.date,
      startTime: normalizeTimeTo24h(form.startTime),
      endTime: normalizeTimeTo24h(form.endTime),
      peopleCount: Number(form.peopleCount),
      ...(form.channel && { channel: String(form.channel).toLowerCase() }),
      ...(form.notes && { notes: form.notes }),
      ...(form.status && { status: form.status }),
      ...(form.appliedCoupons && form.appliedCoupons.length > 0 && { appliedCoupons: form.appliedCoupons })
    }

    if (form.clientType === 'registered') {
      base.clientRef = {
        fullname: form.clientRef?.fullname || '',
        docID: form.clientRef?.docID || ''
      }
    } else {
      base.guest = {
        fullname: form.guest?.fullname || '',
        ...(form.guest?.phone && { phone: form.guest.phone }),
        ...(form.guest?.notes && { notes: form.guest.notes })
      }
    }

    return base
  }
  // ── CREATE ──
  const handleCreate = async (form) => {
    const payload = buildReservationPayload(form)
    await api.post('/reservations', payload)
    await load()
  }

  // ── EDIT ──
  const handleEdit = async (form) => {
    const { reservation_id, orders, createdAt, updatedAt, __v, _id, ...rest } = form
    const payload = buildReservationPayload(rest)
    await api.patch(`/reservations/${reservation_id}`, payload)
    await load()
  }

  // ── DELETE (cancelación lógica) ──
  const handleDelete = async (res) => {
    if (!confirm(`¿Cancelar la reservación de ${res.guest?.fullname || res.reservation_id}?`)) return
    try {
      await api.delete(`/reservations/${res.reservation_id}`)
      await load()
    } catch {
      // Fallback para demo
      setReservations(prev => prev.map(r =>
        r.reservation_id === res.reservation_id ? { ...r, status: 'cancelada' } : r
      ))
    }
  }

  // Stats
  const ordersByReservation = useMemo(() => {
    const byOrder = {}
    const paymentsByOrder = payments.reduce((acc, pay) => {
      if (!pay.order_id) return acc
      if (!acc[pay.order_id]) acc[pay.order_id] = []
      acc[pay.order_id].push(pay)
      return acc
    }, {})

    orders.forEach(order => {
      const reservationId = order.reservation_id
      if (!reservationId) return

      const enrichedOrder = {
        ...order,
        payments: paymentsByOrder[order.order_id] || []
      }

      if (!byOrder[reservationId]) {
        byOrder[reservationId] = [enrichedOrder]
      } else {
        byOrder[reservationId].push(enrichedOrder)
      }
    })

    return byOrder
  }, [orders, payments])

  const stats = {
    total:      reservations.length,
    pendiente:  reservations.filter(r => r.status === 'pendiente').length,
    confirmada: reservations.filter(r => r.status === 'confirmada').length,
    en_curso:   reservations.filter(r => r.status === 'en_curso').length,
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-main)', padding: 28 }}>
      <style>{`
        @keyframes fadeIn  { from { opacity:0; transform:translateY(5px) } to { opacity:1; transform:none } }
        @keyframes modalIn { from { opacity:0; transform:scale(0.97)     } to { opacity:1; transform:none } }
      `}</style>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 36, letterSpacing: 0.5, marginBottom: 4 }}>
            Reservaciones
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>
            Gestiona las reservas de mesas del restaurante
          </p>
        </div>
        <button
          className="btn-primary"
          style={{ width: 'auto', padding: '11px 20px' }}
          onClick={() => { setEditTarget(null); setShowForm(true) }}
        >
          <Plus size={16} /> Nueva reservación
        </button>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14, marginBottom: 24 }}>
        {[
          { label: 'Total',       val: stats.total,      color: 'var(--text-primary)', bg: '#fff',    border: 'var(--border)' },
          { label: 'Pendientes',  val: stats.pendiente,  color: '#B45309',             bg: '#FEF3C7', border: '#FDE68A' },
          { label: 'Confirmadas', val: stats.confirmada, color: '#1D4ED8',             bg: '#DBEAFE', border: '#BFDBFE' },
          { label: 'En curso',    val: stats.en_curso,   color: '#065F46',             bg: '#D1FAE5', border: '#A7F3D0' },
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

      {/* Search + Filtros */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 20, alignItems: 'center', flexWrap: 'wrap' }}>
        <div className="search-bar" style={{ flex: 1, minWidth: 240 }}>
          <Search size={15} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar por cliente, ID o mesa..."
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

        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {['todos', ...Object.keys(STATUS_CONFIG)].map(k => (
            <FilterPill
              key={k}
              value={k}
              active={statusFilter === k}
              onClick={() => setStatusFilter(k)}
            />
          ))}
        </div>
      </div>

      {/* Tabla */}
      <div style={{
        background: 'var(--bg-card)', border: '1.5px solid var(--border)',
        borderRadius: 14, overflow: 'hidden', boxShadow: 'var(--shadow-card)'
      }}>
        {/* Cabecera */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1.4fr 1.2fr 110px 90px 130px 140px 110px',
          gap: 12, padding: '11px 20px',
          background: 'var(--bg-main)',
          borderBottom: '1.5px solid var(--border)'
        }}>
          {['Cliente', 'Fecha y hora', 'Mesa', 'Órdenes', 'Pagos', 'Estado', 'Acciones'].map(h => (
            <div key={h} style={{
              fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)',
              textTransform: 'uppercase', letterSpacing: '0.5px'
            }}>{h}</div>
          ))}
        </div>

        {/* Filas */}
        {loading ? (
          <div style={{ padding: 48, textAlign: 'center', color: 'var(--text-secondary)', fontSize: 14 }}>
            Cargando reservaciones...
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: 48, textAlign: 'center', color: 'var(--text-secondary)', fontSize: 14 }}>
            No se encontraron reservaciones
          </div>
        ) : (
          filtered.map((res, i) => (
            <Row
              key={res.reservation_id}
              res={res}
              tables={tables}
              orders={ordersByReservation[res.reservation_id] || []}
              index={i}
              onView={setDetailTarget}
              onEdit={r => { setEditTarget(r); setShowForm(true) }}
              onDelete={handleDelete}
            />
          ))
        )}

        {/* Footer */}
        <div style={{
          padding: '10px 20px', background: 'var(--bg-main)',
          borderTop: '1.5px solid var(--border)',
          fontSize: 12, color: 'var(--text-secondary)',
          display: 'flex', justifyContent: 'space-between'
        }}>
          <span>Mostrando {filtered.length} de {reservations.length} reservaciones</span>
          <span>* Eliminar realiza una cancelación lógica</span>
        </div>
      </div>

      {/* Modals */}
      {showForm && (
        <ReservationFormModal
          initial={editTarget}
          tables={tables}
          clients={clients}
          onClose={() => { setShowForm(false); setEditTarget(null) }}
          onSave={editTarget ? handleEdit : handleCreate}
        />
      )}
      {detailTarget && (
        <DetailModal
          res={detailTarget}
          tables={tables}
          orders={ordersByReservation[detailTarget.reservation_id] || []}
          onClose={() => setDetailTarget(null)}
        />
      )}
    </div>
  )
}
