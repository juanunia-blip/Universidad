import { useState, useEffect, useCallback } from 'react'
import {
  Search, Plus, X, Edit2, Trash2, Eye,
  CreditCard, Banknote, Smartphone, ChevronUp,
  ChevronDown, ShoppingBag, CalendarDays, Users,
  CheckCircle2, Clock, AlertCircle, Receipt,
  SplitSquareHorizontal, Hash, TrendingUp
} from 'lucide-react'
import api from '../Api/axios'

// ─── CONSTANTS ────────────────────────────────────────────────
const STATUS_CONFIG = {
  pendiente: { label: 'Pendiente', color: '#B45309', bg: '#FEF3C7', border: '#FDE68A', icon: Clock },
  aprobado:  { label: 'Aprobado',  color: '#065F46', bg: '#D1FAE5', border: '#A7F3D0', icon: CheckCircle2 },
}

const METHOD_CONFIG = {
  efectivo:  { label: 'Efectivo',  color: '#065F46', bg: '#D1FAE5', icon: Banknote },
  tarjeta:   { label: 'Tarjeta',   color: '#1D4ED8', bg: '#DBEAFE', icon: CreditCard },
  nequi:     { label: 'Nequi',     color: '#5B21B6', bg: '#EDE9FE', icon: Smartphone },
  daviplata: { label: 'Daviplata', color: '#B45309', bg: '#FEF3C7', icon: Smartphone },
}

const SAMPLE_PAYMENTS = [
  {
    payment_id: 'PAY_0001', reservation_id: 'RES_0001', order_id: 'ORD_0001',
    amount: 60000, method: 'nequi', status: 'aprobado', tip: 5000,
    createdAt: '2026-05-10T19:45:00Z',
    split: null,
    _order: { status: 'abierto', totalAmount: 110000 },
    _reservation: { date: '2026-05-10', startTime: '19:00', endTime: '21:00', peopleCount: 4, table_id: 'TBL_0001', guest: { fullname: 'Juan Pérez' } }
  },
  {
    payment_id: 'PAY_0002', reservation_id: 'RES_0001', order_id: 'ORD_0001',
    amount: 50000, method: 'efectivo', status: 'pendiente', tip: 0,
    createdAt: '2026-05-10T20:10:00Z',
    split: { part: 1, totalParts: 2 },
    _order: { status: 'abierto', totalAmount: 110000 },
    _reservation: { date: '2026-05-10', startTime: '19:00', endTime: '21:00', peopleCount: 4, table_id: 'TBL_0001', guest: { fullname: 'Juan Pérez' } }
  },
  {
    payment_id: 'PAY_0003', reservation_id: 'RES_0002', order_id: 'ORD_0002',
    amount: 122500, method: 'tarjeta', status: 'aprobado', tip: 12000,
    createdAt: '2026-05-09T22:00:00Z',
    split: { part: 1, totalParts: 2 },
    _order: { status: 'servido', totalAmount: 245000 },
    _reservation: { date: '2026-05-09', startTime: '20:00', endTime: '22:30', peopleCount: 6, table_id: 'TBL_0002', guest: { fullname: 'Carlos Grupo' } }
  },
  {
    payment_id: 'PAY_0004', reservation_id: 'RES_0002', order_id: 'ORD_0002',
    amount: 122500, method: 'daviplata', status: 'aprobado', tip: 12000,
    createdAt: '2026-05-09T22:05:00Z',
    split: { part: 2, totalParts: 2 },
    _order: { status: 'servido', totalAmount: 245000 },
    _reservation: { date: '2026-05-09', startTime: '20:00', endTime: '22:30', peopleCount: 6, table_id: 'TBL_0002', guest: { fullname: 'Carlos Grupo' } }
  },
  {
    payment_id: 'PAY_0005', reservation_id: 'RES_0003', order_id: 'ORD_0003',
    amount: 85000, method: 'efectivo', status: 'pendiente', tip: 0,
    createdAt: '2026-05-11T13:30:00Z',
    split: null,
    _order: { status: 'abierto', totalAmount: 85000 },
    _reservation: { date: '2026-05-11', startTime: '12:00', endTime: '14:00', peopleCount: 2, table_id: 'TBL_0003', guest: { fullname: 'María López' } }
  },
]

const EMPTY_FORM = {
  reservation_id: '', order_id: '', amount: '',
  method: 'efectivo', tip: '', split_part: '', split_total: ''
}

// ─── HELPERS ──────────────────────────────────────────────────
const fmt = (n) => '$ ' + Number(n || 0).toLocaleString('es-CO')
const fmtDate = (iso) => {
  if (!iso) return '—'
  const d = new Date(iso)
  return d.toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' }) +
    ' ' + d.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })
}
const fmtDateShort = (str) => {
  if (!str) return '—'
  const [y, m, d] = str.split('-')
  return `${d}/${m}/${y}`
}

// ─── BADGE ────────────────────────────────────────────────────
function Badge({ value, map, size = 'md' }) {
  const cfg = map[value] || { label: value, color: '#666', bg: '#F3F4F6', border: '#E5E7EB' }
  const Icon = cfg.icon
  const pad = size === 'sm' ? '2px 8px' : '4px 10px'
  const fs  = size === 'sm' ? 11 : 12
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      padding: pad, borderRadius: 99,
      background: cfg.bg, color: cfg.color,
      fontSize: fs, fontWeight: 600, whiteSpace: 'nowrap',
      border: `1px solid ${cfg.border || cfg.color + '30'}`
    }}>
      {Icon && <Icon size={10} />}
      {cfg.label}
    </span>
  )
}

// ─── MODAL ────────────────────────────────────────────────────
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

// ─── FIELD ────────────────────────────────────────────────────
const inputStyle = {
  width: '100%', padding: '10px 12px',
  border: '1.5px solid var(--border)', borderRadius: 8,
  fontSize: 14, fontFamily: 'var(--font-body)',
  outline: 'none', background: 'var(--bg-panel)',
  color: 'var(--text-primary)', boxSizing: 'border-box'
}

function Field({ label, required, hint, children }) {
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
      {hint && <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 4 }}>{hint}</div>}
    </div>
  )
}

// ─── DETAIL MODAL ─────────────────────────────────────────────
function DetailModal({ payment, onClose }) {
  const res = payment._reservation || {}
  const ord = payment._order || {}
  const StatusIcon = STATUS_CONFIG[payment.status]?.icon || Clock
  const MethodIcon = METHOD_CONFIG[payment.method]?.icon || CreditCard

  const InfoChip = ({ icon: Icon, label, val }) => (
    <div style={{
      background: 'var(--bg-main)', borderRadius: 8, padding: '10px 12px',
      display: 'flex', alignItems: 'center', gap: 10
    }}>
      <Icon size={14} color="var(--text-secondary)" style={{ flexShrink: 0 }} />
      <div>
        <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 1 }}>{label}</div>
        <div style={{ fontSize: 13, fontWeight: 600 }}>{val}</div>
      </div>
    </div>
  )

  return (
    <Modal title="Detalle del pago" onClose={onClose} maxWidth={560}>

      {/* Header del pago */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        background: 'var(--bg-main)', borderRadius: 12, padding: '16px 18px', marginBottom: 20
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{
            width: 48, height: 48, borderRadius: 12,
            background: METHOD_CONFIG[payment.method]?.bg || '#F3F4F6',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <MethodIcon size={22} color={METHOD_CONFIG[payment.method]?.color || '#666'} />
          </div>
          <div>
            <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 2 }}>{payment.payment_id}</div>
            <div style={{ fontSize: 26, fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}>
              {fmt(payment.amount)}
            </div>
            {payment.tip > 0 && (
              <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                + {fmt(payment.tip)} de propina
              </div>
            )}
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <Badge value={payment.status} map={STATUS_CONFIG} />
          <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 6 }}>
            {fmtDate(payment.createdAt)}
          </div>
        </div>
      </div>

      {/* Split info */}
      {payment.split && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          background: '#EDE9FE', borderRadius: 8, padding: '9px 14px', marginBottom: 16,
          border: '1px solid #DDD6FE'
        }}>
          <SplitSquareHorizontal size={14} color="#5B21B6" />
          <span style={{ fontSize: 13, color: '#5B21B6', fontWeight: 600 }}>
            Pago dividido — Parte {payment.split.part} de {payment.split.totalParts}
          </span>
        </div>
      )}

      {/* Orden asociada */}
      <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 10 }}>
        Orden asociada
      </div>
      <div style={{
        border: '1.5px solid var(--border)', borderRadius: 10,
        padding: '12px 14px', marginBottom: 20,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <ShoppingBag size={16} color="var(--text-secondary)" />
          <div>
            <div style={{ fontSize: 14, fontWeight: 700 }}>{payment.order_id}</div>
            {ord.totalAmount && (
              <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>
                Total de la orden: {fmt(ord.totalAmount)}
              </div>
            )}
          </div>
        </div>
        {ord.status && (
          <Badge value={ord.status} map={{
            abierto: { label: 'Abierto', color: '#1D4ED8', bg: '#DBEAFE', border: '#BFDBFE' },
            servido: { label: 'Servido', color: '#065F46', bg: '#D1FAE5', border: '#A7F3D0' }
          }} />
        )}
      </div>

      {/* Reserva asociada */}
      {(res.date || res.table_id) && (
        <>
          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 10 }}>
            Reserva asociada
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 4 }}>
            <InfoChip icon={Hash}         label="ID Reserva" val={payment.reservation_id} />
            <InfoChip icon={CalendarDays} label="Fecha"      val={fmtDateShort(res.date)} />
            <InfoChip icon={Clock}        label="Horario"    val={`${res.startTime || '—'} – ${res.endTime || '—'}`} />
            <InfoChip icon={Users}        label="Personas"   val={`${res.peopleCount || '—'} personas`} />
            {res.guest?.fullname && (
              <InfoChip icon={Users}      label="Cliente"    val={res.guest.fullname} />
            )}
            {res.table_id && (
              <InfoChip icon={Hash}       label="Mesa"       val={res.table_id} />
            )}
          </div>
        </>
      )}
    </Modal>
  )
}

// ─── PAYMENT FORM ─────────────────────────────────────────────
function PaymentFormModal({ initial, onClose, onSave }) {
  const [form, setForm]     = useState(initial ? {
    reservation_id: initial.reservation_id || '',
    order_id:       initial.order_id || '',
    amount:         initial.amount || '',
    method:         initial.method || 'efectivo',
    tip:            initial.tip || '',
    split_part:     initial.split?.part || '',
    split_total:    initial.split?.totalParts || '',
    status:         initial.status || 'pendiente',
  } : EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [error, setError]   = useState('')
  const [reservations, setReservations] = useState([])
  const [orders, setOrders] = useState([])
  const [loadingReservations, setLoadingReservations] = useState(true)
  const [loadingOrders, setLoadingOrders] = useState(false)
  const isEdit = !!initial?.payment_id

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const loadReservations = async () => {
    setLoadingReservations(true)
    try {
      const res = await api.get('/reservations?limit=100')
      const data = res.data?.data || res.data
      setReservations(Array.isArray(data) ? data : [])
    } catch (e) {
      console.warn('No se pudieron cargar las reservas', e)
      setReservations([])
    } finally {
      setLoadingReservations(false)
    }
  }

  const loadOrders = async (reservation_id) => {
    if (!reservation_id) {
      setOrders([])
      return
    }
    setLoadingOrders(true)
    try {
      const res = await api.get(`/orders?reservation_id=${encodeURIComponent(reservation_id)}&limit=100`)
      const data = res.data?.data || res.data
      setOrders(Array.isArray(data) ? data : [])
    } catch (e) {
      console.warn('No se pudieron cargar las órdenes', e)
      setOrders([])
    } finally {
      setLoadingOrders(false)
    }
  }

  useEffect(() => {
    loadReservations()
  }, [])

  useEffect(() => {
    if (form.reservation_id) {
      loadOrders(form.reservation_id)
    } else {
      setOrders([])
    }
  }, [form.reservation_id])

  const handleSubmit = async () => {
    setError('')
    if (!form.reservation_id) return setError('La reserva es obligatoria')
    if (!form.order_id)       return setError('La orden es obligatoria')
    if (!form.amount || isNaN(Number(form.amount)) || Number(form.amount) <= 0)
      return setError('El monto debe ser mayor a 0')
    if (!form.method) return setError('El método de pago es obligatorio')
    if ((form.split_part && !form.split_total) || (!form.split_part && form.split_total))
      return setError('Si usas pago dividido debes indicar ambos: parte y total de partes')
    if (form.split_part && Number(form.split_part) > Number(form.split_total))
      return setError('La parte no puede ser mayor al total de partes')

    setSaving(true)
    try {
      await onSave(form)
      onClose()
    } catch (e) {
      setError(e.response?.data?.message || e.response?.data?.errors?.[0]?.message || e.message || 'Error al guardar')
    } finally {
      setSaving(false)
    }
  }

  const MethodIcon = METHOD_CONFIG[form.method]?.icon || CreditCard

  return (
    <Modal title={isEdit ? 'Editar pago' : 'Nuevo pago'} onClose={onClose}>
      {error && (
        <div style={{
          background: '#FEE2E2', border: '1px solid #FECACA',
          borderRadius: 8, padding: '10px 14px', marginBottom: 16,
          fontSize: 13, color: '#B91C1C', display: 'flex', alignItems: 'center', gap: 8
        }}>
          <X size={13} /> {error}
        </div>
      )}

      {/* Monto preview */}
      <div style={{
        background: 'var(--bg-main)', borderRadius: 12, padding: '16px 18px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        marginBottom: 20, border: '1.5px solid var(--border)'
      }}>
        <div>
          <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Monto</div>
          <div style={{ fontSize: 28, fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}>
            {form.amount ? fmt(form.amount) : '$ 0'}
          </div>
          {form.tip > 0 && <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>+ {fmt(form.tip)} propina</div>}
        </div>
        <div style={{
          width: 48, height: 48, borderRadius: 12,
          background: METHOD_CONFIG[form.method]?.bg || '#F3F4F6',
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <MethodIcon size={22} color={METHOD_CONFIG[form.method]?.color || '#666'} />
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
        <Field label="Reserva" required>
          <select
            style={{ ...inputStyle, cursor: 'pointer', appearance: 'auto' }}
            value={form.reservation_id}
            onChange={e => { set('reservation_id', e.target.value); set('order_id', '') }}
          >
            <option value="">{loadingReservations ? 'Cargando reservas…' : 'Selecciona una reserva'}</option>
            {reservations.map(res => {
              const label = `${res.reservation_id} · ${fmtDateShort(res.date)}${res.startTime ? ` · ${res.startTime}` : ''}${res.guest?.fullname ? ` · ${res.guest.fullname}` : ''}`
              return <option key={res.reservation_id} value={res.reservation_id}>{label}</option>
            })}
          </select>
        </Field>

        <Field label="Orden" required>
          <select
            style={{ ...inputStyle, cursor: form.reservation_id ? 'pointer' : 'not-allowed', appearance: 'auto' }}
            value={form.order_id}
            onChange={e => set('order_id', e.target.value)}
            disabled={!form.reservation_id || loadingOrders}
          >
            <option value="">
              {form.reservation_id
                ? loadingOrders
                  ? 'Cargando órdenes…'
                  : orders.length > 0
                    ? 'Selecciona una orden'
                    : 'No hay órdenes disponibles'
                : 'Selecciona una reserva primero'}
            </option>
            {orders.map(ord => {
              const label = `${ord.order_id}${ord.status ? ` · ${ord.status}` : ''}${ord.totalAmount ? ` · ${fmt(ord.totalAmount)}` : ''}`
              return <option key={ord.order_id} value={ord.order_id}>{label}</option>
            })}
          </select>
        </Field>

        <Field label="Monto" required>
          <input style={inputStyle} type="number" min={0.01} step={100}
            value={form.amount} onChange={e => set('amount', e.target.value)}
            placeholder="50000" />
        </Field>

        <Field label="Propina">
          <input style={inputStyle} type="number" min={0} step={100}
            value={form.tip} onChange={e => set('tip', e.target.value)}
            placeholder="0" />
        </Field>

        <div style={{ gridColumn: '1 / -1' }}>
          <Field label="Método de pago" required>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8 }}>
              {Object.entries(METHOD_CONFIG).map(([key, cfg]) => {
                const Icon = cfg.icon
                const sel  = form.method === key
                return (
                  <button key={key} onClick={() => set('method', key)} style={{
                    padding: '10px 8px', borderRadius: 8, cursor: 'pointer',
                    border: `1.5px solid ${sel ? cfg.color : 'var(--border)'}`,
                    background: sel ? cfg.bg : 'var(--bg-panel)',
                    color: sel ? cfg.color : 'var(--text-secondary)',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5,
                    fontSize: 12, fontWeight: sel ? 600 : 400,
                    transition: 'all 0.12s', fontFamily: 'var(--font-body)'
                  }}>
                    <Icon size={18} />
                    {cfg.label}
                  </button>
                )
              })}
            </div>
          </Field>
        </div>

        {isEdit && (
          <div style={{ gridColumn: '1 / -1' }}>
            <Field label="Estado">
              <select style={{ ...inputStyle, cursor: 'pointer', appearance: 'auto' }}
                value={form.status} onChange={e => set('status', e.target.value)}>
                <option value="pendiente">Pendiente</option>
                <option value="aprobado">Aprobado</option>
              </select>
            </Field>
          </div>
        )}

        {/* Split */}
        <div style={{ gridColumn: '1 / -1', borderTop: '1.5px solid var(--border)', paddingTop: 14, marginTop: 4 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
            <SplitSquareHorizontal size={11} /> Pago dividido (opcional)
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
            <Field label="Parte N°" hint="Ej: 1 (si es la primera parte)">
              <input style={inputStyle} type="number" min={1}
                value={form.split_part} onChange={e => set('split_part', e.target.value)}
                placeholder="1" />
            </Field>
            <Field label="Total de partes" hint="Ej: 2 (si se divide en 2)">
              <input style={inputStyle} type="number" min={1}
                value={form.split_total} onChange={e => set('split_total', e.target.value)}
                placeholder="2" />
            </Field>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
        <button className="btn-secondary" onClick={onClose} style={{ flex: 1 }}>Cancelar</button>
        <button className="btn-primary" onClick={handleSubmit}
          disabled={saving} style={{ flex: 2, opacity: saving ? 0.7 : 1 }}>
          {saving ? 'Guardando...' : isEdit ? 'Guardar cambios' : 'Registrar pago'}
        </button>
      </div>
    </Modal>
  )
}

// ─── CONFIRM DELETE ───────────────────────────────────────────
function ConfirmDeleteModal({ payment, onClose, onConfirm }) {
  const [loading, setLoading] = useState(false)
  const isApproved = payment.status === 'aprobado'
  return (
    <Modal title="Eliminar pago" onClose={onClose} maxWidth={420}>
      <div style={{ textAlign: 'center', padding: '8px 0 20px' }}>
        <div style={{
          width: 56, height: 56, borderRadius: 14, margin: '0 auto 14px',
          background: isApproved ? '#FEE2E2' : '#FEF3C7',
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          {isApproved ? <AlertCircle size={26} color="#B91C1C" /> : <Receipt size={26} color="#B45309" />}
        </div>
        {isApproved ? (
          <>
            <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 8, color: '#B91C1C' }}>
              No se puede eliminar
            </div>
            <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              El pago <strong>{payment.payment_id}</strong> ya está <strong>aprobado</strong>. Los pagos aprobados no pueden eliminarse para mantener la integridad financiera.
            </div>
            <button className="btn-secondary" onClick={onClose} style={{ marginTop: 20, width: '100%' }}>Entendido</button>
          </>
        ) : (
          <>
            <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 6 }}>
              ¿Eliminar <span style={{ color: 'var(--accent)' }}>{payment.payment_id}</span>?
            </div>
            <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              Se eliminará el pago de <strong>{fmt(payment.amount)}</strong> por <strong>{METHOD_CONFIG[payment.method]?.label}</strong>. Esta acción no se puede deshacer.
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
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
          </>
        )}
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
    <div onClick={() => onSort(field)} style={{
      fontSize: 11, fontWeight: 700,
      color: active ? 'var(--accent)' : 'var(--text-secondary)',
      textTransform: 'uppercase', letterSpacing: '0.5px',
      display: 'flex', alignItems: 'center', gap: 4,
      cursor: 'pointer', userSelect: 'none'
    }}>
      {label}
      {active
        ? (sort.dir === 'asc' ? <ChevronUp size={11} /> : <ChevronDown size={11} />)
        : <ChevronDown size={11} style={{ opacity: 0.3 }} />}
    </div>
  )
}

// ─── PAYMENT ROW ──────────────────────────────────────────────
function PaymentRow({ payment, onView, onEdit, onDelete, index }) {
  const res = payment._reservation || {}
  const ord = payment._order || {}
  const MethodIcon = METHOD_CONFIG[payment.method]?.icon || CreditCard
  const methodCfg  = METHOD_CONFIG[payment.method] || { color: '#666', bg: '#F3F4F6' }
  const clientName = res.guest?.fullname || res.clientRef?.fullname || ord.clientHint || payment.reservation_id || '—'
  const reservationLine = res.date
    ? `${fmtDateShort(res.date)}${res.table_id ? ` · ${res.table_id}` : ''}`
    : payment.reservation_id || '—'

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: '180px 140px 140px 1fr 130px 140px 120px',
      alignItems: 'center', gap: 12,
      padding: '13px 20px', background: 'var(--bg-card)',
      borderBottom: '1.5px solid var(--border-light)',
      animation: `fadeIn 0.2s ease ${index * 0.03}s both`,
      transition: 'background 0.1s'
    }}
      onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-panel)'}
      onMouseLeave={e => e.currentTarget.style.background = 'var(--bg-card)'}
    >
      {/* ID + método */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{
          width: 34, height: 34, borderRadius: 8, flexShrink: 0,
          background: methodCfg.bg,
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <MethodIcon size={15} color={methodCfg.color} />
        </div>
        <div>
          <div style={{ fontSize: 13, fontWeight: 700 }}>{payment.payment_id}</div>
          <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{methodCfg.label || payment.method}</div>
        </div>
      </div>

      {/* Monto */}
      <div>
        <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>
          {fmt(payment.amount)}
        </div>
        {payment.tip > 0 && (
          <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>+{fmt(payment.tip)} prop.</div>
        )}
      </div>

      {/* Orden */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <ShoppingBag size={11} color="var(--text-secondary)" />
          <span style={{ fontSize: 12, fontWeight: 600 }}>{payment.order_id}</span>
        </div>
        {ord.totalAmount && (
          <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 2 }}>
            Total: {fmt(ord.totalAmount)}
          </div>
        )}
      </div>

      {/* Reserva + cliente */}
      <div>
        <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 2 }}>{clientName}</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <CalendarDays size={10} color="var(--text-secondary)" />
          <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
            {reservationLine}
          </span>
        </div>
        {payment.split && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
            <SplitSquareHorizontal size={10} color="#5B21B6" />
            <span style={{ fontSize: 11, color: '#5B21B6', fontWeight: 600 }}>
              Parte {payment.split.part}/{payment.split.totalParts}
            </span>
          </div>
        )}
      </div>

      {/* Fecha creación */}
      <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.4 }}>
        {fmtDate(payment.createdAt)}
      </div>

      {/* Estado */}
      <Badge value={payment.status} map={STATUS_CONFIG} />

      {/* Acciones */}
      <div style={{ display: 'flex', gap: 5, justifyContent: 'flex-end' }}>
        <ActionBtn icon={Eye}    onClick={() => onView(payment)}   title="Ver detalle" hoverColor="#3B82F6" />
        <ActionBtn icon={Edit2}  onClick={() => onEdit(payment)}   title="Editar"      hoverColor="#F59E0B" />
        <ActionBtn icon={Trash2} onClick={() => onDelete(payment)} title="Eliminar"    hoverColor="#EF4444" />
      </div>
    </div>
  )
}

// ─── MAIN PAGE ────────────────────────────────────────────────
export default function Payments() {
  const [payments, setPayments]     = useState([])
  const [orders, setOrders]         = useState([])
  const [reservations, setReservations] = useState([])
  const [loading, setLoading]       = useState(true)
  const [search, setSearch]         = useState('')
  const [statusFilter, setStatusFilter] = useState('todos')
  const [methodFilter, setMethodFilter] = useState('todos')
  const [sort, setSort]             = useState({ field: 'createdAt', dir: 'desc' })
  const [showForm, setShowForm]     = useState(false)
  const [editTarget, setEditTarget] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [detailTarget, setDetailTarget] = useState(null)
  const [page, setPage]             = useState(1)
  const PAGE_SIZE = 8

  const load = useCallback(async () => {
    setLoading(true)

    const [paymentsResult, ordersResult, reservationsResult] = await Promise.allSettled([
      api.get('/payments?limit=100'),
      api.get('/orders?limit=100'),
      api.get('/reservations?limit=100')
    ])

    const ordersData = ordersResult.status === 'fulfilled'
      ? (ordersResult.value.data?.data || ordersResult.value.data)
      : []

    const reservationsData = reservationsResult.status === 'fulfilled'
      ? (reservationsResult.value.data?.data || reservationsResult.value.data)
      : []

    const orderMap = Array.isArray(ordersData)
      ? ordersData.reduce((acc, order) => {
          if (order?.order_id) acc[order.order_id] = order
          return acc
        }, {})
      : {}

    const reservationMap = Array.isArray(reservationsData)
      ? reservationsData.reduce((acc, reservation) => {
          if (reservation?.reservation_id) acc[reservation.reservation_id] = reservation
          return acc
        }, {})
      : {}

    const paymentsData = paymentsResult.status === 'fulfilled'
      ? (paymentsResult.value.data?.data || paymentsResult.value.data)
      : []

    const enrichedPayments = Array.isArray(paymentsData) && paymentsData.length > 0
      ? paymentsData.map(payment => ({
          ...payment,
          _order: orderMap[payment.order_id] || payment._order,
          _reservation: reservationMap[payment.reservation_id] || payment._reservation
        }))
      : SAMPLE_PAYMENTS

    setPayments(enrichedPayments)
    setOrders(Array.isArray(ordersData) ? ordersData : [])
    setReservations(Array.isArray(reservationsData) ? reservationsData : [])
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  // Filtrar + ordenar
  const filtered = payments
    .filter(p => {
      const q = search.toLowerCase()
      const matchSearch =
        p.payment_id.toLowerCase().includes(q) ||
        p.order_id.toLowerCase().includes(q) ||
        p.reservation_id.toLowerCase().includes(q) ||
        (p._reservation?.guest?.fullname || '').toLowerCase().includes(q)
      const matchStatus = statusFilter === 'todos' || p.status === statusFilter
      const matchMethod = methodFilter === 'todos' || p.method === methodFilter
      return matchSearch && matchStatus && matchMethod
    })
    .sort((a, b) => {
      const va = sort.field === 'amount' ? Number(a.amount) : (a[sort.field] || '')
      const vb = sort.field === 'amount' ? Number(b.amount) : (b[sort.field] || '')
      return sort.dir === 'asc' ? (va > vb ? 1 : -1) : (va < vb ? 1 : -1)
    })

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE)
  const paginated  = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const handleSort = (field) => {
    setSort(s => s.field === field ? { field, dir: s.dir === 'asc' ? 'desc' : 'asc' } : { field, dir: 'desc' })
    setPage(1)
  }

  // Stats
  const totalAprobado = payments.filter(p => p.status === 'aprobado').reduce((s, p) => s + Number(p.amount), 0)
  const totalPendiente = payments.filter(p => p.status === 'pendiente').reduce((s, p) => s + Number(p.amount), 0)
  const aprobados  = payments.filter(p => p.status === 'aprobado').length
  const pendientes = payments.filter(p => p.status === 'pendiente').length

  // ── CREATE ──
  const handleCreate = async (form) => {
    const payload = {
      reservation_id: form.reservation_id.trim(),
      order_id:       form.order_id.trim(),
      amount:         Number(form.amount),
      method:         form.method,
      ...(form.tip && Number(form.tip) > 0 && { tip: Number(form.tip) }),
      ...(form.split_part && form.split_total && {
        split: { part: Number(form.split_part), totalParts: Number(form.split_total) }
      })
    }
    await api.post('/payments', payload)
    load()
  }

  // ── EDIT (solo status) ──
  const handleEdit = async (form) => {
    await api.patch(`/payments/${form.payment_id || editTarget.payment_id}/status`, {
      status: form.status
    })
    load()
  }

  // ── DELETE ──
  const handleDelete = async () => {
    try {
      await api.delete(`/payments/${deleteTarget.payment_id}`)
      load()
    } catch {
      setPayments(prev => prev.filter(p => p.payment_id !== deleteTarget.payment_id))
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
            Pagos
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>
            Registro de transacciones y estados de cobro
          </p>
        </div>
        <button
          className="btn-primary"
          style={{ width: 'auto', padding: '11px 20px' }}
          onClick={() => { setEditTarget(null); setShowForm(true) }}>
          <Plus size={16} /> Registrar pago
        </button>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14, marginBottom: 24 }}>
        {[
          { label: 'Total cobrado',  val: fmt(totalAprobado),  color: '#065F46', bg: '#D1FAE5', border: '#A7F3D0', icon: TrendingUp },
          { label: 'Aprobados',      val: aprobados,           color: '#065F46', bg: '#D1FAE5', border: '#A7F3D0', icon: CheckCircle2 },
          { label: 'Pendiente cobro',val: fmt(totalPendiente), color: '#B45309', bg: '#FEF3C7', border: '#FDE68A', icon: Clock },
          { label: 'Pendientes',     val: pendientes,          color: '#B45309', bg: '#FEF3C7', border: '#FDE68A', icon: AlertCircle },
        ].map(({ label, val, color, bg, border, icon: Icon }) => (
          <div key={label} style={{
            background: bg, border: `1.5px solid ${border}`,
            borderRadius: 12, padding: '16px 20px',
            display: 'flex', alignItems: 'center', gap: 14,
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
              <div style={{ fontSize: typeof val === 'string' ? 17 : 26, fontFamily: 'var(--font-display)', color, lineHeight: 1, marginBottom: 2, fontWeight: 700 }}>{val}</div>
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
            placeholder="Buscar por ID pago, orden, reserva o cliente..."
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

        {/* Filtro estado */}
        <div style={{ display: 'flex', gap: 6 }}>
          <FilterPill label="Todos"     active={statusFilter === 'todos'}     activeColor="#111"    activeBg="#F3F4F6" onClick={() => { setStatusFilter('todos');     setPage(1) }} />
          <FilterPill label="✅ Aprobados"  active={statusFilter === 'aprobado'} activeColor="#065F46" activeBg="#D1FAE5" onClick={() => { setStatusFilter('aprobado'); setPage(1) }} />
          <FilterPill label="⏳ Pendientes" active={statusFilter === 'pendiente'}activeColor="#B45309" activeBg="#FEF3C7" onClick={() => { setStatusFilter('pendiente');setPage(1) }} />
        </div>

        <div style={{ width: 1, height: 28, background: 'var(--border)' }} />

        {/* Filtro método */}
        <div style={{ display: 'flex', gap: 6 }}>
          <FilterPill label="Método"     active={methodFilter === 'todos'}     activeColor="#111"    activeBg="#F3F4F6" onClick={() => { setMethodFilter('todos');     setPage(1) }} />
          <FilterPill label="💵 Efectivo" active={methodFilter === 'efectivo'}  activeColor="#065F46" activeBg="#D1FAE5" onClick={() => { setMethodFilter('efectivo');  setPage(1) }} />
          <FilterPill label="💳 Tarjeta"  active={methodFilter === 'tarjeta'}   activeColor="#1D4ED8" activeBg="#DBEAFE" onClick={() => { setMethodFilter('tarjeta');   setPage(1) }} />
          <FilterPill label="📱 Nequi"    active={methodFilter === 'nequi'}     activeColor="#5B21B6" activeBg="#EDE9FE" onClick={() => { setMethodFilter('nequi');     setPage(1) }} />
          <FilterPill label="📱 Daviplata"active={methodFilter === 'daviplata'} activeColor="#B45309" activeBg="#FEF3C7" onClick={() => { setMethodFilter('daviplata'); setPage(1) }} />
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
          gridTemplateColumns: '180px 140px 140px 1fr 130px 140px 120px',
          gap: 12, padding: '11px 20px',
          background: 'var(--bg-main)', borderBottom: '1.5px solid var(--border)'
        }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>ID / Método</div>
          <SortHeader label="Monto"  field="amount"    sort={sort} onSort={handleSort} />
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Orden</div>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Reserva / Cliente</div>
          <SortHeader label="Fecha"  field="createdAt" sort={sort} onSort={handleSort} />
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Estado</div>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px', textAlign: 'right' }}>Acciones</div>
        </div>

        {/* Filas */}
        {loading ? (
          <div style={{ padding: 48, textAlign: 'center', color: 'var(--text-secondary)', fontSize: 14 }}>
            Cargando pagos...
          </div>
        ) : paginated.length === 0 ? (
          <div style={{ padding: 56, textAlign: 'center' }}>
            <CreditCard size={48} style={{ color: '#CBD5E1', marginBottom: 12 }} />
            <div style={{ fontSize: 14, color: 'var(--text-secondary)' }}>No se encontraron pagos</div>
          </div>
        ) : (
          paginated.map((p, i) => (
            <PaymentRow
              key={p.payment_id}
              payment={p}
              index={i}
              onView={setDetailTarget}
              onEdit={p => { setEditTarget(p); setShowForm(true) }}
              onDelete={setDeleteTarget}
            />
          ))
        )}

        {/* Footer paginación */}
        <div style={{
          padding: '12px 20px', background: 'var(--bg-main)',
          borderTop: '1.5px solid var(--border)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between'
        }}>
          <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
            {filtered.length} pago{filtered.length !== 1 ? 's' : ''} encontrado{filtered.length !== 1 ? 's' : ''}
          </span>
          {totalPages > 1 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                style={{ padding: '4px 10px', borderRadius: 6, border: '1.5px solid var(--border)', background: 'var(--bg-panel)', cursor: page === 1 ? 'not-allowed' : 'pointer', fontSize: 13, color: page === 1 ? '#CBD5E1' : 'var(--text-primary)' }}>←</button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                <button key={p} onClick={() => setPage(p)} style={{
                  width: 30, height: 30, borderRadius: 6,
                  border: `1.5px solid ${page === p ? 'var(--text-primary)' : 'var(--border)'}`,
                  background: page === p ? 'var(--text-primary)' : 'var(--bg-panel)',
                  color: page === p ? '#fff' : 'var(--text-primary)',
                  cursor: 'pointer', fontSize: 13, fontWeight: page === p ? 600 : 400
                }}>{p}</button>
              ))}
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                style={{ padding: '4px 10px', borderRadius: 6, border: '1.5px solid var(--border)', background: 'var(--bg-panel)', cursor: page === totalPages ? 'not-allowed' : 'pointer', fontSize: 13, color: page === totalPages ? '#CBD5E1' : 'var(--text-primary)' }}>→</button>
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      {showForm && (
        <PaymentFormModal
          initial={editTarget}
          onClose={() => { setShowForm(false); setEditTarget(null) }}
          onSave={editTarget ? handleEdit : handleCreate}
        />
      )}
      {detailTarget && (
        <DetailModal payment={detailTarget} onClose={() => setDetailTarget(null)} />
      )}
      {deleteTarget && (
        <ConfirmDeleteModal
          payment={deleteTarget}
          onClose={() => setDeleteTarget(null)}
          onConfirm={handleDelete}
        />
      )}
    </div>
  )
}
