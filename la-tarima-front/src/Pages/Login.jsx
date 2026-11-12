import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../Api/axios'

export default function Login({ onLogin }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullname, setFullname] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)
  const [isRegistering, setIsRegistering] = useState(false)
  const navigate = useNavigate()

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')
    setSuccess('')
    setLoading(true)

    try {
      const response = await api.post('/auth/login', { email, password })
      onLogin(response.data)
      navigate('/', { replace: true })
    } catch (err) {
      setError(err.response?.data?.message || 'Error al iniciar sesión')
    } finally {
      setLoading(false)
    }
  }

  const handleRegister = async (event) => {
    event.preventDefault()
    setError('')
    setSuccess('')

    if (!fullname.trim() || !email.trim() || !password.trim() || !confirmPassword.trim()) {
      setError('Todos los campos son obligatorios')
      return
    }

    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden')
      return
    }

    setLoading(true)

    try {
      const response = await api.post('/auth/register', {
        fullname,
        role: 'manager',
        email,
        password
      })

      setSuccess(response.data.message || 'Cuenta creada. Revisa tu correo para verificar la cuenta.')
      setIsRegistering(false)
      setPassword('')
      setConfirmPassword('')
    } catch (err) {
      setError(err.response?.data?.message || 'Error al crear el usuario')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', background: 'var(--bg-main)', padding: 24 }}>
      <div style={{ width: '100%', maxWidth: 460, padding: 32, borderRadius: 24, background: 'var(--bg-card)', boxShadow: '0 24px 80px rgba(0,0,0,0.12)' }}>
        <div style={{ marginBottom: 22 }}>
          <h1 style={{ margin: 0, fontSize: 28, letterSpacing: '-0.02em' }}>
            {isRegistering ? 'Crear gerente' : 'Iniciar sesión'}
          </h1>
          <p style={{ marginTop: 8, color: 'var(--text-secondary)' }}>
            {isRegistering
              ? 'Registra un nuevo usuario con rol gerente y accede a la plataforma.'
              : 'Solo los usuarios con rol de gerente pueden ingresar.'}
          </p>
        </div>

        {error && (
          <div style={{ marginBottom: 18, padding: '12px 14px', borderRadius: 12, background: '#FEE2E2', color: '#991B1B', border: '1px solid #FECACA' }}>
            {error}
          </div>
        )}

        {success && (
          <div style={{ marginBottom: 18, padding: '12px 14px', borderRadius: 12, background: '#DCFCE7', color: '#14532D', border: '1px solid #6EE7B7' }}>
            {success}
          </div>
        )}

        <form onSubmit={isRegistering ? handleRegister : handleSubmit}>
          {isRegistering && (
            <>
              <label style={{ display: 'block', marginBottom: 6, fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Nombre completo
              </label>
              <input
                type="text"
                value={fullname}
                onChange={(e) => {
                  setFullname(e.target.value)
                  setError('')
                }}
                placeholder="Nombre del gerente"
                style={{ width: '100%', padding: '12px 14px', borderRadius: 10, border: '1.5px solid var(--border)', marginBottom: 16, background: 'var(--bg-panel)', color: 'var(--text-primary)' }}
              />
            </>
          )}

          <label style={{ display: 'block', marginBottom: 6, fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Email
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value)
              setError('')
            }}
            placeholder="ejemplo@tarima.com"
            style={{ width: '100%', padding: '12px 14px', borderRadius: 10, border: '1.5px solid var(--border)', marginBottom: 16, background: 'var(--bg-panel)', color: 'var(--text-primary)' }}
          />

          <label style={{ display: 'block', marginBottom: 6, fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Contraseña
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value)
              setError('')
            }}
            placeholder={isRegistering ? 'Nueva contraseña' : 'admin123'}
            style={{ width: '100%', padding: '12px 14px', borderRadius: 10, border: '1.5px solid var(--border)', marginBottom: isRegistering ? 16 : 24, background: 'var(--bg-panel)', color: 'var(--text-primary)' }}
          />

          {isRegistering && (
            <>
              <label style={{ display: 'block', marginBottom: 6, fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Confirmar contraseña
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value)
                  setError('')
                }}
                placeholder="Repite la contraseña"
                style={{ width: '100%', padding: '12px 14px', borderRadius: 10, border: '1.5px solid var(--border)', marginBottom: 24, background: 'var(--bg-panel)', color: 'var(--text-primary)' }}
              />
            </>
          )}

          <button
            type="submit"
            style={{ width: '100%', padding: '12px 14px', borderRadius: 12, border: 'none', background: 'var(--accent)', color: '#fff', fontWeight: 700, cursor: 'pointer' }}
            disabled={loading || !email.trim() || !password.trim() || (isRegistering && (!fullname.trim() || !confirmPassword.trim()))}
          >
            {loading ? (isRegistering ? 'Creando...' : 'Iniciando...') : (isRegistering ? 'Crear gerente' : 'Entrar')}
          </button>
        </form>

        <div style={{ marginTop: 18, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
            {isRegistering
              ? 'Al crear este usuario, se asigna automáticamente el rol gerente.'
              : 'Usa el email de un empleado con rol gerente registrado en staff.'}
          </div>
          <button
            type="button"
            onClick={() => {
              setIsRegistering(!isRegistering)
              setError('')
              setSuccess('')
            }}
            style={{ border: 'none', background: 'transparent', color: 'var(--accent)', fontWeight: 700, cursor: 'pointer', fontSize: 12 }}
          >
            {isRegistering ? 'Volver al login' : 'Crear usuario gerente'}
          </button>
        </div>
      </div>
    </div>
  )
}
