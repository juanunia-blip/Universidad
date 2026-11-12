import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  BarChart3, CalendarDays, CreditCard, Download, Package, RefreshCw,
  Search, ShoppingBag, Table2, TicketPercent, Users, Wallet, X
} from 'lucide-react'
import api from '../Api/axios'

const fmt = (n) => '$ ' + Number(n || 0).toLocaleString('es-CO')

const parseCollection = (res) => {
  const d = res?.data?.data || res?.data
  return Array.isArray(d) ? d : []
}

const getDate = (item) => {
  const raw = item.createdAt || item.date
  if (!raw) return null
  const date = new Date(raw)
  return Number.isNaN(date.getTime()) ? null : date
}

const inRange = (item, startDate, endDate) => {
  const date = getDate(item)
  if (!date) return true

  const start = startDate ? new Date(`${startDate}T00:00:00`) : null
  const end = endDate ? new Date(`${endDate}T23:59:59`) : null

  if (start && date < start) return false
  if (end && date > end) return false
  return true
}

const pct = (value, total) => total > 0 ? Math.round((value / total) * 100) : 0

const todayISO = () => new Date().toISOString().slice(0, 10)

const daysAgoISO = (days) => {
  const date = new Date()
  date.setDate(date.getDate() - days)
  return date.toISOString().slice(0, 10)
}

const tableLabel = (tableId, tables) => {
  const table = tables.find(t => t.table_id === tableId)
  if (!table) return tableId || 'Sin mesa'
  return `Mesa ${table.tableNumber}${table.zone ? ` - ${table.zone}` : ''}`
}

function StatCard({ label, value, icon: Icon, color, bg, helper }) {
  return (
    <div style={{
      background: bg || 'var(--bg-card)',
      border: `1.5px solid ${color}25`,
      borderRadius: 12,
      padding: '16px 18px',
      display: 'flex',
      gap: 14,
      alignItems: 'center'
    }}>
      <div style={{
        width: 42,
        height: 42,
        borderRadius: 10,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--bg-panel)',
        color
      }}>
        <Icon size={20} />
      </div>
      <div>
        <div style={{ fontSize: 28, fontFamily: 'var(--font-display)', color, lineHeight: 1 }}>
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

function ProgressRow({ label, value, total, amount, color = '#1D4ED8' }) {
  const width = pct(value, total)

  return (
    <div style={{ marginBottom: 13 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, marginBottom: 6 }}>
        <span style={{ fontSize: 13, fontWeight: 700 }}>{label || 'Sin dato'}</span>
        <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
          {amount !== undefined ? fmt(amount) : value}
        </span>
      </div>
      <div style={{ height: 8, background: 'var(--bg-panel)', borderRadius: 99, overflow: 'hidden' }}>
        <div style={{ width: `${width}%`, height: '100%', background: color, borderRadius: 99 }} />
      </div>
    </div>
  )
}

function DataTable({ columns, rows, empty = 'Sin datos' }) {
  if (!rows.length) {
    return (
      <div style={{ padding: 28, textAlign: 'center', color: 'var(--text-secondary)', fontSize: 14 }}>
        {empty}
      </div>
    )
  }

  return (
    <div style={{ border: '1.5px solid var(--border)', borderRadius: 10, overflow: 'hidden' }}>
      <div style={{
        display: 'grid',
        gridTemplateColumns: columns.map(c => c.width || '1fr').join(' '),
        gap: 10,
        padding: '10px 12px',
        background: 'var(--bg-main)',
        borderBottom: '1.5px solid var(--border)'
      }}>
        {columns.map(col => (
          <div key={col.key} style={{
            fontSize: 11,
            fontWeight: 700,
            color: 'var(--text-secondary)',
            textTransform: 'uppercase',
            letterSpacing: '0.5px'
          }}>
            {col.label}
          </div>
        ))}
      </div>
      {rows.map((row, index) => (
        <div key={row.id || index} style={{
          display: 'grid',
          gridTemplateColumns: columns.map(c => c.width || '1fr').join(' '),
          gap: 10,
          padding: '11px 12px',
          borderBottom: index < rows.length - 1 ? '1px solid var(--border-light)' : 'none',
          alignItems: 'center'
        }}>
          {columns.map(col => (
            <div key={col.key} style={{ fontSize: 13, minWidth: 0 }}>
              {col.render ? col.render(row) : row[col.key]}
            </div>
          ))}
        </div>
      ))}
    </div>
  )
}

function FilterPill({ active, children, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: '8px 13px',
        borderRadius: 8,
        border: active ? '1.5px solid #111' : '1.5px solid var(--border)',
        background: active ? '#111' : 'var(--bg-panel)',
        color: active ? '#fff' : 'var(--text-secondary)',
        cursor: 'pointer',
        fontWeight: active ? 700 : 500
      }}
    >
      {children}
    </button>
  )
}

export default function Reports() {
  const [orders, setOrders] = useState([])
  const [payments, setPayments] = useState([])
  const [reservations, setReservations] = useState([])
  const [products, setProducts] = useState([])
  const [clients, setClients] = useState([])
  const [tables, setTables] = useState([])
  const [staff, setStaff] = useState([])
  const [salesByCategory, setSalesByCategory] = useState([])
  const [salesByProduct, setSalesByProduct] = useState([])
  const [topClientsApi, setTopClientsApi] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [query, setQuery] = useState('')
  const [range, setRange] = useState('30')
  const [startDate, setStartDate] = useState(daysAgoISO(30))
  const [endDate, setEndDate] = useState(todayISO())

  const applyRange = (value) => {
    setRange(value)
    if (value === 'all') {
      setStartDate('')
      setEndDate('')
      return
    }
    setStartDate(daysAgoISO(Number(value)))
    setEndDate(todayISO())
  }

  const load = useCallback(async () => {
    setLoading(true)
    setError('')

    const [
      ordersResult,
      paymentsResult,
      reservationsResult,
      productsResult,
      clientsResult,
      tablesResult,
      staffResult,
      categoryResult,
      productReportResult,
      topClientsResult
    ] = await Promise.allSettled([
      api.get('/orders?limit=100'),
      api.get('/payments?limit=100'),
      api.get('/reservations?limit=100'),
      api.get('/products?showInactive=true&limit=100'),
      api.get('/clients?limit=100'),
      api.get('/tables?showInactive=true'),
      api.get('/staff?limit=100'),
      api.get('/reports/sales-by-category'),
      api.get('/reports/sales-by-product'),
      api.get('/reports/top-clients?limit=10')
    ])

    if (ordersResult.status === 'fulfilled') setOrders(parseCollection(ordersResult.value))
    if (paymentsResult.status === 'fulfilled') setPayments(parseCollection(paymentsResult.value))
    if (reservationsResult.status === 'fulfilled') setReservations(parseCollection(reservationsResult.value))
    if (productsResult.status === 'fulfilled') setProducts(parseCollection(productsResult.value))
    if (clientsResult.status === 'fulfilled') setClients(parseCollection(clientsResult.value))
    if (tablesResult.status === 'fulfilled') setTables(parseCollection(tablesResult.value))
    if (staffResult.status === 'fulfilled') setStaff(parseCollection(staffResult.value))
    if (categoryResult.status === 'fulfilled') setSalesByCategory(parseCollection(categoryResult.value))
    if (productReportResult.status === 'fulfilled') setSalesByProduct(parseCollection(productReportResult.value))
    if (topClientsResult.status === 'fulfilled') setTopClientsApi(parseCollection(topClientsResult.value))

    const failed = [
      ordersResult, paymentsResult, reservationsResult, productsResult, clientsResult,
      tablesResult, staffResult, categoryResult, productReportResult, topClientsResult
    ].some(result => result.status === 'rejected')

    if (failed) setError('Algunos reportes no pudieron cargarse. Se muestran los datos disponibles.')
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  const data = useMemo(() => {
    const filteredOrders = orders.filter(o => inRange(o, startDate, endDate))
    const filteredPayments = payments.filter(p => inRange(p, startDate, endDate))
    const filteredReservations = reservations.filter(r => inRange(r, startDate, endDate))

    const approvedPayments = filteredPayments.filter(p => p.status === 'aprobado')
    const pendingPayments = filteredPayments.filter(p => p.status === 'pendiente')
    const servedOrders = filteredOrders.filter(o => o.status === 'servido')
    const activeOrders = filteredOrders.filter(o => !['cancelado', 'servido'].includes(o.status))

    const paidAmount = approvedPayments.reduce((sum, p) => sum + Number(p.amount || 0), 0)
    const pendingAmount = pendingPayments.reduce((sum, p) => sum + Number(p.amount || 0), 0)
    const orderAmount = filteredOrders
      .filter(o => o.status !== 'cancelado')
      .reduce((sum, o) => sum + Number(o.totalAmount || 0), 0)
    const servedAmount = servedOrders.reduce((sum, o) => sum + Number(o.totalAmount || 0), 0)

    const productMap = products.reduce((acc, product) => {
      acc[product.product_id] = product
      return acc
    }, {})

    const itemRows = {}
    filteredOrders
      .filter(o => o.status !== 'cancelado')
      .forEach(order => {
        ;(order.items || []).forEach(item => {
          const product = productMap[item.product_id]
          const key = item.product_id
          if (!itemRows[key]) {
            itemRows[key] = {
              id: key,
              product_id: key,
              name: item.name,
              category: product?.category || 'sin categoria',
              units: 0,
              amount: 0
            }
          }
          itemRows[key].units += Number(item.quantity || 0)
          itemRows[key].amount += Number(item.quantity || 0) * Number(item.unitPrice || 0)
        })
      })

    const byCategory = Object.values(itemRows).reduce((acc, item) => {
      if (!acc[item.category]) acc[item.category] = { id: item.category, category: item.category, units: 0, amount: 0 }
      acc[item.category].units += item.units
      acc[item.category].amount += item.amount
      return acc
    }, {})

    const byPaymentMethod = filteredPayments.reduce((acc, payment) => {
      const key = payment.method || 'sin metodo'
      if (!acc[key]) acc[key] = { id: key, method: key, count: 0, amount: 0 }
      acc[key].count += 1
      acc[key].amount += Number(payment.amount || 0)
      return acc
    }, {})

    const byReservationStatus = filteredReservations.reduce((acc, reservation) => {
      const key = reservation.status || 'sin estado'
      if (!acc[key]) acc[key] = { id: key, status: key, count: 0 }
      acc[key].count += 1
      return acc
    }, {})

    const byTable = filteredReservations.reduce((acc, reservation) => {
      const key = reservation.table_id || 'sin mesa'
      if (!acc[key]) acc[key] = { id: key, table_id: key, count: 0, people: 0 }
      acc[key].count += 1
      acc[key].people += Number(reservation.peopleCount || 0)
      return acc
    }, {})

    const clientConsumption = filteredOrders.reduce((acc, order) => {
      const key = order.clientHint || 'Sin referencia'
      if (!acc[key]) acc[key] = { id: key, name: key, orders: 0, amount: 0 }
      acc[key].orders += 1
      acc[key].amount += Number(order.totalAmount || 0)
      return acc
    }, {})

    return {
      filteredOrders,
      filteredPayments,
      filteredReservations,
      paidAmount,
      pendingAmount,
      orderAmount,
      servedAmount,
      servedOrders,
      activeOrders,
      canceledOrders: filteredOrders.filter(o => o.status === 'cancelado'),
      approvedPayments,
      pendingPayments,
      topProducts: Object.values(itemRows).sort((a, b) => b.amount - a.amount).slice(0, 8),
      categories: Object.values(byCategory).sort((a, b) => b.amount - a.amount),
      paymentMethods: Object.values(byPaymentMethod).sort((a, b) => b.amount - a.amount),
      reservationStatus: Object.values(byReservationStatus).sort((a, b) => b.count - a.count),
      tableUsage: Object.values(byTable).sort((a, b) => b.count - a.count).slice(0, 8),
      clientConsumption: Object.values(clientConsumption).sort((a, b) => b.amount - a.amount).slice(0, 8)
    }
  }, [orders, payments, reservations, products, startDate, endDate])

  const searchedOrders = data.filteredOrders.filter(order => {
    const q = query.toLowerCase()
    return order.order_id?.toLowerCase().includes(q) ||
      order.reservation_id?.toLowerCase().includes(q) ||
      (order.clientHint || '').toLowerCase().includes(q)
  }).slice(0, 12)

  const exportCsv = () => {
    const rows = [
      ['tipo', 'id', 'referencia', 'estado', 'monto'],
      ...data.filteredOrders.map(o => ['orden', o.order_id, o.reservation_id, o.status, o.totalAmount || 0]),
      ...data.filteredPayments.map(p => ['pago', p.payment_id, p.order_id || p.reservation_id, p.status, p.amount || 0])
    ]

    const csv = rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `reportes-${startDate || 'inicio'}-${endDate || 'hoy'}.csv`
    link.click()
    URL.revokeObjectURL(url)
  }

  const maxProductAmount = Math.max(...data.topProducts.map(p => p.amount), 0)
  const maxCategoryAmount = Math.max(...data.categories.map(c => c.amount), 0)
  const maxPaymentAmount = Math.max(...data.paymentMethods.map(m => m.amount), 0)
  const maxTableCount = Math.max(...data.tableUsage.map(t => t.count), 0)

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-main)', padding: 28 }}>
      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(5px) } to { opacity: 1; transform: none } }
      `}</style>

      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, marginBottom: 24 }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 36, letterSpacing: 0.5, marginBottom: 4 }}>
            Reportes
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>
            Ventas, pagos, reservas, productos, clientes y operacion del negocio
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn-secondary" style={{ width: 'auto', padding: '11px 16px' }} onClick={load}>
            <RefreshCw size={16} /> Actualizar
          </button>
          <button className="btn-primary" style={{ width: 'auto', padding: '11px 16px' }} onClick={exportCsv}>
            <Download size={16} /> Exportar CSV
          </button>
        </div>
      </div>

      <div style={{
        background: 'var(--bg-panel)',
        border: '1.5px solid var(--border)',
        borderRadius: 14,
        padding: 16,
        marginBottom: 22,
        display: 'flex',
        gap: 10,
        alignItems: 'center',
        flexWrap: 'wrap'
      }}>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          <FilterPill active={range === '7'} onClick={() => applyRange('7')}>7 dias</FilterPill>
          <FilterPill active={range === '30'} onClick={() => applyRange('30')}>30 dias</FilterPill>
          <FilterPill active={range === '90'} onClick={() => applyRange('90')}>90 dias</FilterPill>
          <FilterPill active={range === 'all'} onClick={() => applyRange('all')}>Todo</FilterPill>
        </div>

        <div style={{ width: 1, height: 28, background: 'var(--border)' }} />

        <label style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Desde</label>
        <input
          type="date"
          value={startDate}
          onChange={e => { setRange('custom'); setStartDate(e.target.value) }}
          style={{ padding: '8px 10px', border: '1.5px solid var(--border)', borderRadius: 8 }}
        />
        <label style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Hasta</label>
        <input
          type="date"
          value={endDate}
          onChange={e => { setRange('custom'); setEndDate(e.target.value) }}
          style={{ padding: '8px 10px', border: '1.5px solid var(--border)', borderRadius: 8 }}
        />

        <div className="search-bar" style={{ flex: 1, minWidth: 240 }}>
          <Search size={15} />
          <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Buscar orden, reserva o cliente..." />
          {query && (
            <button onClick={() => setQuery('')} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex' }}>
              <X size={14} />
            </button>
          )}
        </div>
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
          Cargando reportes...
        </div>
      ) : (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14, marginBottom: 22 }}>
            <StatCard label="Ingresos aprobados" value={fmt(data.paidAmount)} icon={Wallet} color="#065F46" bg="#D1FAE5" />
            <StatCard label="Pagos pendientes" value={fmt(data.pendingAmount)} icon={CreditCard} color="#B45309" bg="#FEF3C7" />
            <StatCard label="Ventas en ordenes" value={fmt(data.orderAmount)} icon={ShoppingBag} color="#1D4ED8" bg="#DBEAFE" />
            <StatCard label="Reservas" value={data.filteredReservations.length} icon={CalendarDays} color="#7C3AED" bg="#EDE9FE" />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14, marginBottom: 22 }}>
            <StatCard label="Ordenes servidas" value={data.servedOrders.length} helper={fmt(data.servedAmount)} icon={BarChart3} color="#065F46" bg="#ECFDF5" />
            <StatCard label="Ordenes activas" value={data.activeOrders.length} icon={ShoppingBag} color="#1D4ED8" bg="#EFF6FF" />
            <StatCard label="Productos activos" value={products.filter(p => p.active !== false).length} icon={Package} color="#92400E" bg="#FEF3C7" />
            <StatCard label="Clientes registrados" value={clients.length} icon={Users} color="#BE185D" bg="#FCE7F3" />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18, marginBottom: 18 }}>
            <Section title="Ventas por categoria" icon={BarChart3}>
              {(data.categories.length ? data.categories : salesByCategory.map(c => ({
                id: c._id,
                category: c._id,
                amount: c.totalSold,
                units: c.totalItems
              }))).map(row => (
                <ProgressRow
                  key={row.id || row.category}
                  label={`${row.category} (${row.units || 0} uds.)`}
                  value={row.amount}
                  amount={row.amount}
                  total={maxCategoryAmount || Math.max(...salesByCategory.map(c => c.totalSold), 0)}
                  color="#1D4ED8"
                />
              ))}
            </Section>

            <Section title="Metodos de pago" icon={CreditCard}>
              {data.paymentMethods.map(row => (
                <ProgressRow
                  key={row.method}
                  label={`${row.method} (${row.count})`}
                  value={row.amount}
                  amount={row.amount}
                  total={maxPaymentAmount}
                  color="#065F46"
                />
              ))}
              {!data.paymentMethods.length && <div style={{ color: 'var(--text-secondary)', fontSize: 14 }}>Sin pagos en el rango.</div>}
            </Section>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: 18, marginBottom: 18 }}>
            <Section title="Productos mas vendidos" icon={Package}>
              <DataTable
                columns={[
                  { key: 'name', label: 'Producto', width: '1.4fr' },
                  { key: 'category', label: 'Categoria', width: '0.9fr' },
                  { key: 'units', label: 'Unidades', width: '80px' },
                  { key: 'amount', label: 'Ventas', width: '110px', render: row => <strong>{fmt(row.amount)}</strong> }
                ]}
                rows={data.topProducts.length ? data.topProducts : salesByProduct.slice(0, 8).map(row => ({
                  id: row._id,
                  name: row._id,
                  category: '-',
                  units: row.unitsSold,
                  amount: row.totalSold
                }))}
              />
              <div style={{ marginTop: 14 }}>
                {data.topProducts.map(row => (
                  <ProgressRow key={row.id} label={row.name} value={row.amount} total={maxProductAmount} amount={row.amount} color="#F59E0B" />
                ))}
              </div>
            </Section>

            <Section title="Estado de reservas" icon={CalendarDays}>
              {data.reservationStatus.map(row => (
                <ProgressRow key={row.status} label={row.status} value={row.count} total={data.filteredReservations.length} color="#7C3AED" />
              ))}
              {!data.reservationStatus.length && <div style={{ color: 'var(--text-secondary)', fontSize: 14 }}>Sin reservas en el rango.</div>}
            </Section>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18, marginBottom: 18 }}>
            <Section title="Top clientes por consumo" icon={Users}>
              <DataTable
                columns={[
                  { key: 'name', label: 'Cliente', width: '1.5fr' },
                  { key: 'orders', label: 'Ordenes', width: '90px' },
                  { key: 'amount', label: 'Consumo', width: '120px', render: row => <strong>{fmt(row.amount)}</strong> }
                ]}
                rows={data.clientConsumption.length ? data.clientConsumption : topClientsApi.map(row => ({
                  id: row._id,
                  name: row._id || 'Sin referencia',
                  orders: row.ordersCount,
                  amount: row.totalPaid
                }))}
              />
            </Section>

            <Section title="Uso de mesas" icon={Table2}>
              <DataTable
                columns={[
                  { key: 'table', label: 'Mesa', width: '1.3fr', render: row => tableLabel(row.table_id, tables) },
                  { key: 'count', label: 'Reservas', width: '90px' },
                  { key: 'people', label: 'Personas', width: '90px' }
                ]}
                rows={data.tableUsage}
              />
              <div style={{ marginTop: 14 }}>
                {data.tableUsage.map(row => (
                  <ProgressRow key={row.table_id} label={tableLabel(row.table_id, tables)} value={row.count} total={maxTableCount} color="#BE185D" />
                ))}
              </div>
            </Section>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: 18 }}>
            <Section title="Ordenes recientes / busqueda" icon={Search}>
              <DataTable
                columns={[
                  { key: 'order_id', label: 'Orden', width: '110px' },
                  { key: 'reservation_id', label: 'Reserva', width: '110px' },
                  { key: 'clientHint', label: 'Cliente', width: '1fr', render: row => row.clientHint || 'Sin referencia' },
                  { key: 'status', label: 'Estado', width: '130px' },
                  { key: 'totalAmount', label: 'Total', width: '110px', render: row => <strong>{fmt(row.totalAmount)}</strong> }
                ]}
                rows={searchedOrders}
              />
            </Section>

            <Section title="Resumen operativo" icon={TicketPercent}>
              <div style={{ display: 'grid', gap: 12 }}>
                {[
                  ['Pagos aprobados', data.approvedPayments.length],
                  ['Pagos pendientes', data.pendingPayments.length],
                  ['Ordenes canceladas', data.canceledOrders.length],
                  ['Productos inactivos', products.filter(p => p.active === false).length],
                  ['Mesas activas', tables.filter(t => t.active !== false).length],
                  ['Personal registrado', staff.length]
                ].map(([label, value]) => (
                  <div key={label} style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    padding: '10px 12px',
                    border: '1px solid var(--border-light)',
                    borderRadius: 8
                  }}>
                    <span style={{ color: 'var(--text-secondary)', fontSize: 13 }}>{label}</span>
                    <strong>{value}</strong>
                  </div>
                ))}
              </div>
            </Section>
          </div>
        </>
      )}
    </div>
  )
}
