import { useState } from 'react'
import { CalendarDays, Users, MoreHorizontal, Minus, Plus, Trash2, FileText, ChefHat, Bookmark, CreditCard, ChevronDown, ChevronRight } from 'lucide-react'

const TAX_RATE = 0.08

export default function OrderPanel({ items, reservation, reservationOrders = [], tables, onQtyChange, onRemove, onSend, onSave, onPay, onReservationClick, onCreateOrder, onEditOrder, onSaveOrder }) {
  const [note, setNote] = useState('')
  const [guests, setGuests] = useState(1)
  const [expandedOrders, setExpandedOrders] = useState(new Set())

  const fmt = (n) => '$ ' + Number(n).toLocaleString('es-CO')

  // Si hay reserva seleccionada, mostrar órdenes de la reserva
  if (reservation) {
    return (
      <aside className="order-panel">
        <div className="order-panel-header">
          <div className="order-panel-title">Orden actual</div>
          <div className="order-meta">
            <button className="order-meta-chip" onClick={onReservationClick}>
              <CalendarDays size={14} />
              {reservation.reservation_id}
            </button>
            <button
              className="order-meta-chip"
              onClick={() => setGuests(g => Math.max(1, g + 1))}
            >
              <Users size={14} />
              {guests}
            </button>
          </div>
        </div>

        {/* Lista de órdenes existentes */}
        <div className="order-items">
          {reservationOrders.length === 0 ? (
            <div className="empty-order">
              <ChefHat size={48} />
              <p>Esta reserva no tiene órdenes<br />Crea una nueva orden para comenzar</p>
            </div>
          ) : (
            reservationOrders.map((order) => {
              const orderItems = order.items || []
              const subtotal = orderItems.reduce((s, i) => s + i.quantity * i.unitPrice, 0)
              const taxes = Math.round(subtotal * TAX_RATE)
              const total = subtotal + taxes

              return (
                <div key={order.order_id} style={{
                  border: '1px solid #E2E8F0',
                  borderRadius: 8,
                  marginBottom: 12,
                  overflow: 'hidden',
                  background: 'white'
                }}>
                  <div style={{
                    padding: '12px 16px',
                    background: '#F8FAFC',
                    borderBottom: '1px solid #E2E8F0'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                      <span style={{ fontWeight: 600, fontSize: 14 }}>Orden {order.order_id}</span>
                      <span style={{
                        padding: '2px 8px',
                        borderRadius: 12,
                        fontSize: 11,
                        fontWeight: 600,
                        background: order.status === 'servido' ? '#10B981' : order.status === 'en_proceso' ? '#F59E0B' : '#6B7280',
                        color: 'white'
                      }}>
                        {order.status === 'servido' ? 'Servido' : order.status === 'en_proceso' ? 'En proceso' : 'Pendiente'}
                      </span>
                    </div>
                    <div style={{ fontSize: 12, color: '#64748B', marginBottom: 8 }}>
                      Creada: {new Date(order.createdAt).toLocaleString('es-CO')}
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button
                        onClick={() => onEditOrder && onEditOrder(order)}
                        style={{
                          flex: 1,
                          padding: '6px 12px',
                          border: '1px solid #2563EB',
                          background: '#DBEAFE',
                          color: '#1D4ED8',
                          borderRadius: 6,
                          cursor: 'pointer',
                          fontSize: 12,
                          fontWeight: 600
                        }}
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => onPay && onPay({ total })}
                        style={{
                          flex: 1,
                          padding: '6px 12px',
                          border: '1px solid #065F46',
                          background: '#D1FAE5',
                          color: '#065F46',
                          borderRadius: 6,
                          cursor: 'pointer',
                          fontSize: 12,
                          fontWeight: 600
                        }}
                      >
                        Pagar
                      </button>
                    </div>
                  </div>

                  <div style={{ padding: '12px 16px' }}>
                    {orderItems.map((item, idx) => (
                      <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}>
                        <span style={{ fontSize: 14 }}>{item.name}</span>
                        <span style={{ fontSize: 14, fontWeight: 500 }}>×{item.quantity} {fmt(item.quantity * item.unitPrice)}</span>
                      </div>
                    ))}
                    <div style={{ borderTop: '1px solid #E2E8F0', marginTop: 8, paddingTop: 8 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#64748B' }}>
                        <span>Subtotal</span>
                        <span>{fmt(subtotal)}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#64748B' }}>
                        <span>Impuestos (8%)</span>
                        <span>{fmt(taxes)}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 600, marginTop: 4 }}>
                        <span>Total</span>
                        <span>{fmt(total)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })
          )}
        </div>

        {/* Botón para crear nueva orden */}
        <div style={{ padding: '16px', borderTop: '1px solid #E2E8F0' }}>
          <button
            onClick={onCreateOrder}
            style={{
              width: '100%',
              padding: '12px 16px',
              background: 'var(--bg-panel)',
              color: '#fff',
              border: 'none',
              borderRadius: 8,
              cursor: 'pointer',
              fontSize: 14,
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8
            }}
          >
            <Plus size={16} />
            Crear nueva orden
          </button>
        </div>
      </aside>
    )
  }

  // Modo normal sin reserva seleccionada
  const subtotal = items.reduce((s, i) => s + i.quantity * i.unitPrice, 0)
  const taxes    = Math.round(subtotal * TAX_RATE)
  const total    = subtotal + taxes

  return (
    <aside clvatName="order-panel">
      {/* Header */}
      <div className="order-panel-header">
        <div className="order-panel-title">Orden actual</div>
        <div className="order-meta">
          <button className="order-meta-chip" onClick={onReservationClick}>
            <CalendarDays size={14} />
            Seleccionar reserva
          </button>
          <button
            className="order-meta-chip"
            onClick={() => setGuests(g => Math.max(1, g + 1))}
          >
            <Users size={14} />
            {guests}
          </button>
          <button className="order-meta-more">
            <MoreHorizontal size={14} />
          </button>
        </div>
      </div>

      {/* Items */}
      <div className="order-items">
        {items.length === 0 ? (
          <div className="empty-order">
            <ChefHat size={48} />
            <p>Agrega productos<br />desde el catálogo</p>
          </div>
        ) : (
          items.map((item, idx) => (
            <div className="order-item" key={idx}>
              {/* Qty control */}
              <div className="qty-control">
                <button
                  className="qty-btn"
                  onClick={() => onQtyChange(idx, item.quantity - 1)}
                >−</button>
                <span className="qty-value">{item.quantity}</span>
                <button
                  className="qty-btn"
                  onClick={() => onQtyChange(idx, item.quantity + 1)}
                >+</button>
              </div>

              <span className="order-item-name">{item.name}</span>
              <span className="order-item-price">
                {fmt(item.quantity * item.unitPrice)}
              </span>
              <button
                className="order-item-delete"
                onClick={() => onRemove(idx)}
                title="Eliminar"
              >
                <Trash2 size={15} />
              </button>
            </div>
          ))
        )}
      </div>

      {/* Note */}
      <div className="order-note">
        <FileText size={14} />
        <input
          value={note}
          onChange={e => setNote(e.target.value)}
          placeholder="Agregar nota a la orden (opcional)"
        />
      </div>

      {/* Totals */}
      <div className="order-totals">
        <div className="order-totals-row">
          <span>Subtotal</span>
          <span>{fmt(subtotal)}</span>
        </div>
        <div className="order-totals-row">
          <span>Impuestos (8%)</span>
          <span>{fmt(taxes)}</span>
        </div>
        <div className="order-total-final">
          <span className="order-total-label">Total</span>
          <span className="order-total-value">{fmt(total)}</span>
        </div>
      </div>

      {/* Actions */}
      <div className="order-actions">
        <button
          className="btn-primary"
          onClick={() => onSend && onSend({ items, note, guests })}
          disabled={items.length === 0}
          style={{ opacity: items.length === 0 ? 0.5 : 1 }}
        >
          <ChefHat size={17} />
          Enviar a cocina
        </button>
        <div className="order-actions-row">
          <button
            className="btn-secondary"
            onClick={() => onSave && onSave({ items, note, guests })}
          >
            <Bookmark size={15} />
            Guardar
          </button>
          <button
            className="btn-secondary"
            onClick={() => onPay && onPay({ items, note, guests, total })}
            disabled={items.length === 0}
            style={{ opacity: items.length === 0 ? 0.5 : 1 }}
          >
            <CreditCard size={15} />
            Pagar
          </button>
        </div>
      </div>
    </aside>
  )
}
