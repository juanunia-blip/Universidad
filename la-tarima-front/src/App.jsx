import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { useState, useEffect } from 'react'
import Sidebar from './components/Sidebar'
import Home from './Pages/Home'
import Orders from './Pages/Orders'
import Reservations from './Pages/Reservations'
import Clients from './Pages/Clients'
import Products from './Pages/Products'
import Payments from './Pages/Payments'
import Coupons from './Pages/Coupons'
import Staff from './Pages/Staff'
import Tables from './Pages/Tables'
import Reports from './Pages/Reports'
import Settings from './Pages/Settings'
import Login from './Pages/Login'
import Verify from './Pages/Verify'
import './index.css'

const getStoredAuth = () => {
  try {
    return JSON.parse(window.localStorage.getItem('laTarimaAuth'))
  } catch {
    return null
  }
}

function RequireAuth({ children }) {
  const auth = getStoredAuth()
  const location = useLocation()

  if (!auth?.token) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  return children
}

export default function App() {
  const [error, setError] = useState(null)
  const [auth, setAuth] = useState(getStoredAuth)

  useEffect(() => {
    window.addEventListener('error', (e) => {
      setError(e.message)
    })

    const savedSettings = window.localStorage.getItem('laTarimaSettings')
    if (savedSettings) {
      try {
        const settings = JSON.parse(savedSettings)
        document.body.classList.toggle('theme-dark', settings.theme === 'dark')
      } catch (error) {
        console.warn('No se pudo cargar la configuración de usuario', error)
      }
    }
  }, [])

  const handleLogin = (data) => {
    window.localStorage.setItem('laTarimaAuth', JSON.stringify(data))
    setAuth(data)
  }

  const handleLogout = () => {
    window.localStorage.removeItem('laTarimaAuth')
    setAuth(null)
  }

  if (error) {
    return (
      <div style={{
        width: '100%',
        height: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#ff0000',
        color: '#fff',
        fontSize: '20px',
        padding: '20px',
        textAlign: 'center'
      }}>
        <div>
          <h1>ERROR</h1>
          <p>{error}</p>
        </div>
      </div>
    )
  }

  return (
    <BrowserRouter>
      <div style={{
        display: 'flex',
        minHeight: '100vh',
        background: 'var(--bg-main)'
      }}>
        {auth?.token && <Sidebar user={auth.user} onLogout={handleLogout} />}

        <main style={{
          flex: 1,
          marginLeft: auth?.token ? '210px' : 0,
          minHeight: '100vh',
          overflowX: 'hidden',
          background: 'var(--bg-main)'
        }}>
          <Routes>
            <Route path="/login" element={auth?.token ? <Navigate to="/" replace /> : <Login onLogin={handleLogin} />} />
            <Route path="/verify" element={<Verify onLogin={handleLogin} />} />
            <Route path="/" element={<RequireAuth><Home /></RequireAuth>} />
            <Route path="/orders" element={<RequireAuth><Orders /></RequireAuth>} />
            <Route path="/reservations" element={<RequireAuth><Reservations /></RequireAuth>} />
            <Route path="/clients" element={<RequireAuth><Clients /></RequireAuth>} />
            <Route path="/products" element={<RequireAuth><Products /></RequireAuth>} />
            <Route path="/payments" element={<RequireAuth><Payments /></RequireAuth>} />
            <Route path="/discounts" element={<RequireAuth><Coupons /></RequireAuth>} />
            <Route path="/tables" element={<RequireAuth><Tables /></RequireAuth>} />
            <Route path="/staff" element={<RequireAuth><Staff /></RequireAuth>} />
            <Route path="/reports" element={<RequireAuth><Reports /></RequireAuth>} />
            <Route path="/settings" element={<RequireAuth><Settings /></RequireAuth>} />
            <Route path="*" element={<Navigate to={auth?.token ? '/' : '/login'} replace />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  )
}
