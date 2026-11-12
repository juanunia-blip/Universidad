import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  AlertTriangle, Armchair, CalendarDays, ChefHat, Clock, CreditCard,
  Package, Plus, RefreshCw, ShoppingBag, Table2, Users, Wallet
} from 'lucide-react'
import api from '../Api/axios'

const fmt = (n) => '$ ' + Number(n || 0).toLocaleString('es-CO')
const today = () => new Date().toISOString().slice(0, 10)

const parseCollection = (res) => {
  const d = res?.data?.data || res?.data
  return Array.isArray(d) ? d : []
}

const customerName = (reservation) =>
  reservation?.clientRef?.fullname || reservation?.guest?.fullname || 'Sin cliente'

const tableLabel = (tableId, tables) => {
  const table = tables.find(t => t.table_id === tableId)
  if (!table) return tableId || 'Sin mesa'
  return `Mesa ${table.tableNumber}${table.zone ? ` - ${table.zone}` : ''}`
}

const orderStatusLabel = {
  abierto: 'Abierta',
  enviado_cocina: 'En cocina',
  en_preparacion: 'Preparando',
  listo: 'Lista',
  servido: 'Servida',
  cancelado: 'Cancelada'
}

const tableStatusConfig = {
  libre: { label: 'Libre', color: '#065F46', bg: '#D1FAE5' },
  reservada: { label: 'Reservada', color: '#1D4ED8', bg: '#DBEAFE' },
  en_atencion: { label: 'En atencion', color: '#B45309', bg: '#FEF3C7' },
  limpieza: { label: 'Limpieza', color: '#7C3AED', bg: '#EDE9FE' }
}

function StatCard({ label, value, icon: Icon, color, bg, helper }) {
  return (
    <div style={{
      background: bg,
      border: `1.5px solid ${color}25`,
      borderRadius: 12,
      padding: '16px 18px',
      display: 'flex',
      alignItems: 'center',
      gap: 14,
      color: 'var(--text-primary)'
    }}>
      <div style={{
        width: 42,
        height: 42,
        borderRadius: 10,
        background: 'var(--bg-panel)',
        color,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <Icon size={20} />
      </div>
      <div>
        <div style={{ fontSize: 29, fontFamily: 'var(--font-display)', color, lineHeight: 1 }}>
          {value}
        </div>
        <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 3 }}>{label}</div>
        {helper && <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 3 }}>{helper}</div>}
      </div>
    </div>
  )
}

function Section({ title, icon: Icon, children, action }) {
  return (
    <section style={{
      background: 'var(--bg-card)',
      border: '1.5px solid var(--border)',
      borderRadius: 14,
      overflow: 'hidden',
      boxShadow: 'var(--shadow-card)'
    }}>
      <div style={{
        padding: '14px 18px',
        background: 'var(--bg-main)',
        borderBottom: '1.5px solid var(--border)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 12
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 9, fontWeight: 700 }}>
          <Icon size={16} color="var(--text-secondary)" />
          {title}
        </div>
        {action}
      </div>
      <div style={{ padding: 18 }}>{children}</div>
    </section>
  )
}

function Empty({ text }) {
  return <div style={{ padding: 24, textAlign: 'center', color: 'var(--text-secondary)', fontSize: 14 }}>{text}</div>
}

function QuickAction({ to, icon: Icon, label, color }) {
  return (
    <Link to={to} style={{
      textDecoration: 'none',
      border: '1.5px solid var(--border)',
      borderRadius: 10,
      padding: '12px 14px',
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      color: 'var(--text-primary)',
      background: 'var(--bg-card)',
      fontWeight: 700
    }}>
      <Icon size={17} color={color} />
      {label}
    </Link>
  )
}

function Badge({ children, color = '#374151', bg = 'var(--bg-panel)' }) {
  return (
    <span style={{
      display: 'inline-flex',
      padding: '3px 9px',
      borderRadius: 99,
      background: bg,
      color,
      fontSize: 11,
      fontWeight: 700,
      whiteSpace: 'nowrap'
    }}>
      {children}
    </span>
  )
}

export default function Home() {
  const [orders, setOrders] = useState([])
  const [reservations, setReservations] = useState([])
  const [payments, setPayments] = useState([])
  const [products, setProducts] = useState([])
  const [tables, setTables] = useState([])
  const [clients, setClients] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    setError('')

    const [ordersResult, reservationsResult, paymentsResult, productsResult, tablesResult, clientsResult] = await Promise.allSettled([
      api.get('/orders?limit=100'),
      api.get('/reservations?limit=100'),
      api.get('/payments?limit=100'),
      api.get('/products?showInactive=true&limit=100'),
      api.get('/tables?showInactive=true'),
      api.get('/clients?limit=100')
    ])

    if (ordersResult.status === 'fulfilled') setOrders(parseCollection(ordersResult.value))
    if (reservationsResult.status === 'fulfilled') setReservations(parseCollection(reservationsResult.value))
    if (paymentsResult.status === 'fulfilled') setPayments(parseCollection(paymentsResult.value))
    if (productsResult.status === 'fulfilled') setProducts(parseCollection(productsResult.value))
    if (tablesResult.status === 'fulfilled') setTables(parseCollection(tablesResult.value))
    if (clientsResult.status === 'fulfilled') setClients(parseCollection(clientsResult.value))

    const failed = [ordersResult, reservationsResult, paymentsResult, productsResult, tablesResult, clientsResult]
      .some(result => result.status === 'rejected')
    if (failed) setError('Algunos datos no pudieron cargarse. Se muestra la informacion disponible.')
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  const data = useMemo(() => {
    const todayStr = today()
    const todayReservations = reservations.filter(r => r.date === todayStr)
    const activeReservations = reservations.filter(r => ['confirmada', 'en_curso'].includes(r.status))
    const openOrders = orders.filter(o => o.status === 'abierto')
    const kitchenOrders = orders.filter(o => ['enviado_cocina', 'en_preparacion', 'listo'].includes(o.status))
    const pendingPayments = payments.filter(p => p.status === 'pendiente')
    const approvedToday = payments.filter(p => {
      if (p.status !== 'aprobado' || !p.createdAt) return false
      return String(p.createdAt).slice(0, 10) === todayStr
    })
    const incomeToday = approvedToday.reduce((sum, p) => sum + Number(p.amount || 0), 0)

    const paymentsByOrder = payments.reduce((acc, payment) => {
      if (!payment.order_id) return acc
      if (!acc[payment.order_id]) acc[payment.order_id] = []
      acc[payment.order_id].push(payment)
      return acc
    }, {})

    const reservationsById = reservations.reduce((acc, reservation) => {
      acc[reservation.reservation_id] = reservation
      return acc
    }, {})

    const ordersByReservation = orders.reduce((acc, order) => {
      if (!order.reservation_id) return acc
      if (!acc[order.reservation_id]) acc[order.reservation_id] = []
      acc[order.reservation_id].push(order)
      return acc
    }, {})

    const productUnits = {}
    orders.filter(o => o.status !== 'cancelado').forEach(order => {
      ;(order.items || []).forEach(item => {
        if (!productUnits[item.product_id]) {
          productUnits[item.product_id] = { name: item.name, units: 0, amount: 0 }
        }
        productUnits[item.product_id].units += Number(item.quantity || 0)
        productUnits[item.product_id].amount += Number(item.quantity || 0) * Number(item.unitPrice || 0)
      })
    })

    const topProduct = Object.values(productUnits).sort((a, b) => b.units - a.units)[0]

    const alerts = [
      ...openOrders
        .filter(order => !(paymentsByOrder[order.order_id] || []).length)
        .slice(0, 4)
        .map(order => ({
          id: `order-${order.order_id}`,
          title: `Orden ${order.order_id} sin pago`,
          detail: `${order.clientHint || 'Sin cliente'} - ${fmt(order.totalAmount)}`
        })),
      ...activeReservations
        .filter(reservation => !(ordersByReservation[reservation.reservation_id] || []).length)
        .slice(0, 4)
        .map(reservation => ({
          id: `reservation-${reservation.reservation_id}`,
          title: `Reserva ${reservation.reservation_id} sin ordenes`,
          detail: `${customerName(reservation)} - ${tableLabel(reservation.table_id, tables)}`
        })),
      ...tables
        .filter(table => table.currentStatus === 'limpieza')
        .slice(0, 3)
        .map(table => ({
          id: `table-${table.table_id}`,
          title: `Mesa ${table.tableNumber} en limpieza`,
          detail: table.zone || table.table_id
        }))
    ].slice(0, 8)

    return {
      todayReservations,
      openOrders,
      kitchenOrders,
      pendingPayments,
      incomeToday,
      recentOrders: [...orders].sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)).slice(0, 6),
      nextReservations: [...todayReservations]
        .filter(r => !['cancelada', 'completada'].includes(r.status))
        .sort((a, b) => String(a.startTime).localeCompare(String(b.startTime)))
        .slice(0, 6),
      recentPayments: [...payments].sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)).slice(0, 6),
      reservationsById,
      topProduct,
      alerts
    }
  }, [orders, reservations, payments, tables])

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-main)', padding: 28 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, marginBottom: 24 }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 36, letterSpacing: 0.5, marginBottom: 4 }}>
            Inicio
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>
            Estado operativo de La Tarima para hoy
          </p>
        </div>
        <button className="btn-secondary" style={{ width: 'auto', padding: '11px 16px' }} onClick={load}>
          <RefreshCw size={16} /> Actualizar
        </button>
      </div>

      {error && (
        <div style={{
          marginBottom: 18,
          background: '#FEF3C7',
          border: '1.5px solid #FDE68A',
          color: '#92400E',
          borderRadius: 10,
          padding: 12,
          fontSize: 13
        }}>
          {error}
        </div>
      )}

      {loading ? (
        <div style={{ padding: 64, textAlign: 'center', color: 'var(--text-secondary)' }}>
          Cargando inicio...
        </div>
      ) : (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 14, marginBottom: 22 }}>
            <StatCard label="Reservas hoy" value={data.todayReservations.length} icon={CalendarDays} color="#1D4ED8" bg="#DBEAFE" />
            <StatCard label="Ordenes abiertas" value={data.openOrders.length} icon={ShoppingBag} color="#B45309" bg="#FEF3C7" />
            <StatCard label="En cocina" value={data.kitchenOrders.length} icon={ChefHat} color="#7C3AED" bg="#EDE9FE" />
            <StatCard label="Pagos pendientes" value={data.pendingPayments.length} icon={CreditCard} color="#BE185D" bg="#FCE7F3" />
            <StatCard label="Ingresos hoy" value={fmt(data.incomeToday)} icon={Wallet} color="#065F46" bg="#D1FAE5" />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: 18, marginBottom: 18 }}>
            <Section title="Accesos rapidos" icon={Plus}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10 }}>
                <QuickAction to="/orders" icon={ShoppingBag} label="Crear orden" color="#1D4ED8" />
                <QuickAction to="/reservations" icon={CalendarDays} label="Crear reserva" color="#7C3AED" />
                <QuickAction to="/payments" icon={CreditCard} label="Registrar pago" color="#065F46" />
                <QuickAction to="/products" icon={Package} label="Nuevo producto" color="#B45309" />
                <QuickAction to="/tables" icon={Table2} label="Ver mesas" color="#BE185D" />
                <QuickAction to="/reports" icon={Wallet} label="Ver reportes" color="#111" />
              </div>
            </Section>

            <Section title="Mini resumen" icon={Wallet}>
              <div style={{ display: 'grid', gap: 11 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Clientes registrados</span>
                  <strong>{clients.length}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Productos activos</span>
                  <strong>{products.filter(p => p.active !== false).length}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Mesas libres</span>
                  <strong>{tables.filter(t => t.currentStatus === 'libre').length}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10 }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Producto destacado</span>
                  <strong style={{ textAlign: 'right' }}>{data.topProduct ? `${data.topProduct.name} (${data.topProduct.units})` : '-'}</strong>
                </div>
              </div>
            </Section>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18, marginBottom: 18 }}>
            <Section title="Reservas de hoy" icon={CalendarDays}>
              {!data.nextReservations.length ? <Empty text="No hay reservas para hoy." /> : (
                <div style={{ display: 'grid', gap: 10 }}>
                  {data.nextReservations.map(reservation => (
                    <div key={reservation.reservation_id} style={{
                      border: '1px solid var(--border-light)',
                      borderRadius: 10,
                      padding: '11px 12px',
                      display: 'grid',
                      gridTemplateColumns: '1fr auto',
                      gap: 10
                    }}>
                      <div>
                        <div style={{ fontWeight: 700 }}>{customerName(reservation)}</div>
                        <div style={{ color: 'var(--text-secondary)', fontSize: 12 }}>
                          {reservation.reservation_id} - {tableLabel(reservation.table_id, tables)}
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontWeight: 700 }}>{reservation.startTime}</div>
                        <div style={{ color: 'var(--text-secondary)', fontSize: 12 }}>{reservation.peopleCount} pers.</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Section>

            <Section title="Ordenes recientes" icon={ShoppingBag}>
              {!data.recentOrders.length ? <Empty text="No hay ordenes registradas." /> : (
                <div style={{ display: 'grid', gap: 10 }}>
                  {data.recentOrders.map(order => {
                    const status = orderStatusLabel[order.status] || order.status
                    const reservation = data.reservationsById[order.reservation_id]
                    return (
                      <div key={order.order_id} style={{
                        border: '1px solid var(--border-light)',
                        borderRadius: 10,
                        padding: '11px 12px',
                        display: 'grid',
                        gridTemplateColumns: '1fr auto',
                        gap: 10
                      }}>
                        <div>
                          <div style={{ fontWeight: 700 }}>{order.order_id} - {order.clientHint || customerName(reservation)}</div>
                          <div style={{ color: 'var(--text-secondary)', fontSize: 12 }}>{order.reservation_id}</div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontWeight: 700 }}>{fmt(order.totalAmount)}</div>
                          <Badge>{status}</Badge>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </Section>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 0.9fr', gap: 18 }}>
            <Section title="Estado de mesas" icon={Armchair}>
              {!tables.length ? <Empty text="No hay mesas registradas." /> : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: 10 }}>
                  {tables.map(table => {
                    const status = tableStatusConfig[table.currentStatus] || tableStatusConfig.libre
                    return (
                      <div key={table.table_id} style={{
                        border: `1.5px solid ${status.color}30`,
                        background: 'var(--bg-panel)',
                        borderRadius: 10,
                        padding: 12,
                        color: 'var(--text-primary)'
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                          <strong>Mesa {table.tableNumber}</strong>
                          <Users size={13} color={status.color} />
                        </div>
                        <div style={{ color: 'var(--text-secondary)', fontSize: 12, marginBottom: 8 }}>
                          {table.zone || table.table_id} - {table.capacity} pers.
                        </div>
                        <Badge color={status.color} bg="var(--bg-panel)">{status.label}</Badge>
                      </div>
                    )
                  })}
                </div>
              )}
            </Section>

            <Section title="Alertas" icon={AlertTriangle}>
              {!data.alerts.length ? <Empty text="No hay alertas operativas." /> : (
                <div style={{ display: 'grid', gap: 10 }}>
                  {data.alerts.map(alert => (
                    <div key={alert.id} style={{
                      border: '1.5px solid #FDE68A',
                      background: '#FFFBEB',
                      borderRadius: 10,
                      padding: '11px 12px',
                      display: 'flex',
                      gap: 10,
                      alignItems: 'flex-start'
                    }}>
                      <Clock size={16} color="#B45309" style={{ marginTop: 2 }} />
                      <div>
                        <div style={{ fontWeight: 700, color: '#92400E' }}>{alert.title}</div>
                        <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>{alert.detail}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Section>
          </div>
        </>
      )}
    </div>
  )
}
