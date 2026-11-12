import { NavLink } from 'react-router-dom'
import {
  Home, ShoppingCart, CalendarDays, Users,
  Package, CreditCard, UserCog, BarChart3,
  Settings, LogOut, Armchair, Tag
} from 'lucide-react'

const NAV = [
  { to: '/',             label: 'Inicio',      icon: Home },
  { to: '/orders',       label: 'Órdenes',     icon: ShoppingCart },
  { to: '/reservations', label: 'Reservación', icon: CalendarDays },
  { to: '/clients',      label: 'Clientes',    icon: Users },
  { to: '/products',     label: 'Productos',   icon: Package },
  { to: '/tables',       label: 'Mesas',       icon: Armchair },
  { to: '/payments',     label: 'Pagos',       icon: CreditCard },
  { to: '/discounts',    label: 'Cupones',     icon: Tag },
  { to: '/staff',        label: 'Staff',       icon: UserCog },
  { to: '/reports',      label: 'Reportes',    icon: BarChart3 },
  { to: '/settings',     label: 'Configuración', icon: Settings },
]

export default function Sidebar({ user, onLogout }) {
  const now = new Date()
  const dateStr = now.toLocaleDateString('es-CO', {
    day: '2-digit', month: '2-digit', year: 'numeric'
  })
  const timeStr = now.toLocaleTimeString('es-CO', {
    hour: '2-digit', minute: '2-digit'
  })

  return (
    <aside style={{
      position: 'fixed', left: 0, top: 0, bottom: 0,
      width: 'var(--sidebar-width)',
      background: 'var(--bg-sidebar)',
      display: 'flex', flexDirection: 'column',
      zIndex: 100,
      borderRight: '1px solid var(--border)'
    }}>
      {/* Logo */}
      <div style={{
        padding: '24px 20px 20px',
        borderBottom: '1px solid #1E1E1E'
      }}>
        <div style={{
          width: 64, height: 64,
          borderRadius: '50%',
          background: 'var(--bg-card)',
          border: '2px solid var(--border)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto'
        }}>
          <span style={{
            fontFamily: 'var(--font-display)',
            fontSize: 11,
            color: 'var(--accent)',
            letterSpacing: '1px',
            textAlign: 'center',
            lineHeight: 1.2
          }}>LA<br/>TARIMA</span>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: '12px 10px', overflowY: 'auto' }}>
        {NAV.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            style={({ isActive }) => ({
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '10px 12px',
              borderRadius: 8,
              marginBottom: 2,
              textDecoration: 'none',
              fontSize: 14,
              fontWeight: isActive ? 600 : 400,
              color: isActive ? 'var(--text-sidebar-active)' : 'var(--text-sidebar)',
              background: isActive ? 'var(--bg-nav-active)' : 'transparent',
              transition: 'all 0.15s'
            })}
          >
            {({ isActive }) => (
              <>
                <Icon size={17} color={isActive ? 'var(--accent)' : 'var(--text-sidebar)'} />
                {label}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* User + Shift */}
      <div style={{
        padding: '14px 14px',
        borderTop: '1px solid #1E1E1E'
      }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '10px 10px',
          borderRadius: 8,
          background: 'var(--bg-sidebar)',
          marginBottom: 12
        }}>
          <div style={{
            width: 34, height: 34, borderRadius: '50%',
            background: 'var(--bg-panel)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0
          }}>
            <UserCog size={16} color="#888" />
          </div>
          <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-sidebar-active)' }}>
                {user?.name || user?.email || 'Administrador'}
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-sidebar)' }}>
              {user?.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : 'Administrador'}
            </div>
          </div>
        </div>

        <div style={{
          background: 'var(--bg-sidebar)',
          borderRadius: 8,
          padding: '10px 12px',
          marginBottom: 10
        }}>
          <div style={{ fontSize: 11, color: 'var(--text-sidebar)', marginBottom: 3 }}>Turno actual</div>
          <div style={{ fontSize: 12, color: 'var(--text-sidebar)' }}>{dateStr} · {timeStr}</div>
        </div>

        <button
          type="button"
          onClick={onLogout}
          style={{
            width: '100%',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            padding: '9px',
            borderRadius: 8,
            border: '1px solid var(--border)',
            background: 'transparent',
            color: 'var(--text-sidebar-active)',
            fontSize: 13,
            cursor: 'pointer',
            transition: 'all 0.15s'
          }}
          onMouseEnter={e => {
            e.currentTarget.style.background = 'var(--bg-card)'
            e.currentTarget.style.color = 'var(--text-primary)'
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = 'transparent'
            e.currentTarget.style.color = 'var(--text-sidebar-active)'
          }}
        >
          <LogOut size={14} />
          Cerrar sesión
        </button>
      </div>
    </aside>
  )
}
