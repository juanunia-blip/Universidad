import { useEffect, useState } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import api from '../Api/axios'

export default function Verify({ onLogin }) {
  const [searchParams] = useSearchParams()
  const [message, setMessage] = useState('Verificando...')
  const [error, setError] = useState(null)
  const navigate = useNavigate()

  useEffect(() => {
    const token = searchParams.get('token')
    if (!token) {
      setMessage('Token de verificación faltante.')
      setError(true)
      return
    }

    api.get(`/auth/verify?token=${encodeURIComponent(token)}`)
      .then(response => {
        const data = response.data
        setMessage(data.message || 'Cuenta verificada correctamente.')

        if (data.token && data.user) {
          onLogin({ token: data.token, user: data.user })
          navigate('/', { replace: true })
        }
      })
      .catch(err => {
        setError(true)
        setMessage(err.response?.data?.message || 'Error al verificar la cuenta.')
      })
  }, [searchParams, navigate, onLogin])

  return (
    <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', background: 'var(--bg-main)', padding: 24 }}>
      <div style={{ width: '100%', maxWidth: 500, padding: 32, borderRadius: 24, background: 'var(--bg-card)', boxShadow: '0 24px 80px rgba(0,0,0,0.12)' }}>
        <h1 style={{ margin: 0, fontSize: 28, letterSpacing: '-0.02em' }}>Verificación de correo</h1>
        <p style={{ marginTop: 18, color: error ? '#B91C1C' : '#134E4A' }}>{message}</p>
        <button
          onClick={() => navigate('/login')}
          style={{ marginTop: 24, padding: '12px 14px', borderRadius: 12, border: 'none', background: 'var(--accent)', color: '#fff', fontWeight: 700, cursor: 'pointer' }}
        >
          Ir a iniciar sesión
        </button>
      </div>
    </div>
  )
}
