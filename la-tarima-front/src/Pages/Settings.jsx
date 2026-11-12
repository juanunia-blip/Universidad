import { useEffect, useMemo, useState } from 'react'
import {
  Moon, SunMedium, Bell, Repeat, SlidersHorizontal,
  ShieldCheck, Globe2, Trash2, Sparkles
} from 'lucide-react'

const STORAGE_KEY = 'laTarimaSettings'
const DEFAULT_SETTINGS = {
  theme: 'light',
  showInactiveItems: false,
  autoRefresh: 0,
  notificationsEnabled: true,
  defaultReportPeriod: 'today'
}

const REFRESH_OPTIONS = [
  { value: 0, label: 'Sin actualización automática' },
  { value: 15, label: 'Cada 15 seg' },
  { value: 30, label: 'Cada 30 seg' },
  { value: 60, label: 'Cada 60 seg' }
]

const REPORT_PERIODS = [
  { value: 'today', label: 'Hoy' },
  { value: 'last7', label: 'Últimos 7 días' },
  { value: 'thisMonth', label: 'Este mes' },
  { value: 'custom', label: 'Personalizado' }
]

function Section({ icon: Icon, title, description, children }) {
  return (
    <section style={{
      background: 'var(--bg-card)',
      border: '1px solid var(--border)',
      borderRadius: 16,
      padding: 24,
      marginBottom: 20,
      boxShadow: 'var(--shadow-card)'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18 }}>
        <div style={{
          width: 40, height: 40,
          display: 'grid', placeItems: 'center',
          borderRadius: 12,
          background: 'var(--bg-panel)'
        }}><Icon size={18} /></div>
        <div>
          <h2 style={{ margin: 0, fontSize: 20 }}>{title}</h2>
          {description && <p style={{ margin: '6px 0 0', color: 'var(--text-secondary)', fontSize: 14 }}>{description}</p>}
        </div>
      </div>
      {children}
    </section>
  )
}

function Toggle({ label, description, value, onChange }) {
  return (
    <label style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 20,
      padding: '14px 16px',
      background: 'var(--bg-panel)',
      borderRadius: 12,
      marginBottom: 12,
      border: '1px solid var(--border)'
    }}>
      <div>
        <div style={{ fontWeight: 600 }}>{label}</div>
        <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4 }}>{description}</div>
      </div>
      <button type="button" onClick={onChange} style={{
        width: 52,
        height: 28,
        borderRadius: 999,
        border: '1px solid var(--border)',
        background: value ? 'var(--accent)' : 'var(--bg-panel)',
        position: 'relative',
        cursor: 'pointer'
      }}>
        <span style={{
          display: 'block',
          width: 22,
          height: 22,
          borderRadius: '50%',
            background: 'var(--bg-card)',
          position: 'absolute',
          top: 2,
          left: value ? 26 : 2,
          transition: 'left 0.2s ease'
        }} />
      </button>
    </label>
  )
}

function Select({ label, value, options, onChange }) {
  return (
    <label style={{ display: 'block', marginBottom: 14 }}>
      <div style={{ fontWeight: 600, marginBottom: 8 }}>{label}</div>
      <select
        value={value}
        onChange={(event) => onChange(Number(event.target.value) || event.target.value)}
        style={{
          width: '100%',
          padding: '12px 14px',
          borderRadius: 12,
          border: '1px solid var(--border)',
          background: 'var(--bg-panel)',
          color: 'var(--text-primary)',
          fontSize: 14
        }}
      >
        {options.map(option => (
          <option key={option.value} value={option.value}>{option.label}</option>
        ))}
      </select>
    </label>
  )
}

export default function Settings() {
  const [settings, setSettings] = useState(DEFAULT_SETTINGS)
  const [statusMessage, setStatusMessage] = useState('')

  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY)
    if (stored) {
      try {
        setSettings((prev) => ({ ...prev, ...JSON.parse(stored) }))
      } catch (error) {
        console.warn('Configuración inválida en localStorage', error)
      }
    }
  }, [])

  useEffect(() => {
    document.body.classList.toggle('theme-dark', settings.theme === 'dark')
  }, [settings.theme])

  const playNotificationSound = () => {
    if (!settings.notificationsEnabled) {
      setStatusMessage('Activa las notificaciones para probar el sonido.')
      return
    }

    const AudioContext = window.AudioContext || window.webkitAudioContext
    if (!AudioContext) {
      setStatusMessage('Audio no soportado en este navegador.')
      return
    }

    const ctx = new AudioContext()
    const oscillator = ctx.createOscillator()
    const gainNode = ctx.createGain()

    oscillator.type = 'sine'
    oscillator.frequency.value = 520
    gainNode.gain.setValueAtTime(0.08, ctx.currentTime)

    oscillator.connect(gainNode)
    gainNode.connect(ctx.destination)

    oscillator.start()
    oscillator.stop(ctx.currentTime + 0.18)
    setTimeout(() => ctx.close(), 300)
    setStatusMessage('Sonido de notificación reproducido.')
  }

  const saveSettings = (nextSettings = settings) => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(nextSettings))
    setStatusMessage('Configuración guardada correctamente.')
  }

  const restoreDefaults = () => {
    setSettings(DEFAULT_SETTINGS)
    saveSettings(DEFAULT_SETTINGS)
    setStatusMessage('Se restauraron los valores predeterminados.')
  }

  const summaryText = useMemo(() => {
    return `Tema: ${settings.theme === 'dark' ? 'Oscuro' : 'Claro'} · Actualización: ${settings.autoRefresh === 0 ? 'Desactivada' : `${settings.autoRefresh}s`} · Reportes: ${REPORT_PERIODS.find(item => item.value === settings.defaultReportPeriod)?.label}`
  }, [settings])

  return (
    <div style={{ padding: 28, minHeight: '100vh', background: 'var(--bg-main)' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, marginBottom: 28 }}>
          <div>
            <p style={{ margin: 0, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.14em', fontSize: 12 }}>Ajustes</p>
            <h1 style={{ margin: '10px 0 0', fontSize: 32 }}>Configuración del sistema</h1>
          </div>
          <div style={{ textAlign: 'right' }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 14px', borderRadius: 14, background: 'var(--bg-panel)', border: '1px solid var(--border)' }}>
              <Sparkles size={18} color="var(--accent)" />
              {summaryText}
            </span>
          </div>
        </div>

        <Section
          icon={SlidersHorizontal}
          title="Preferencias generales"
          description="Controla los parámetros principales que mejoran tu experiencia en la plataforma."
        >
          <div style={{ display: 'grid', gap: 16 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <label style={{ display: 'block' }}>
                <div style={{ fontWeight: 600, marginBottom: 8 }}>Tema de la interfaz</div>
                <div style={{ display: 'flex', gap: 12 }}>
                  {['light', 'dark'].map(mode => (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => {
                        const next = { ...settings, theme: mode }
                        setSettings(next)
                        saveSettings(next)
                      }}
                      style={{
                        flex: 1,
                        padding: '14px 16px',
                        borderRadius: 14,
                        border: settings.theme === mode ? '2px solid var(--accent)' : '1px solid var(--border)',
                        background: settings.theme === mode ? 'var(--accent)' : 'var(--bg-panel)',
                        color: settings.theme === mode ? '#fff' : 'var(--text-primary)',
                        cursor: 'pointer'
                      }}
                    >
                      {mode === 'dark' ? <><Moon size={16} /> Oscuro</> : <><SunMedium size={16} /> Claro</>}
                    </button>
                  ))}
                </div>
              </label>

              <Select
                label="Periodo predeterminado de reportes"
                value={settings.defaultReportPeriod}
                options={REPORT_PERIODS}
                onChange={(value) => {
                  const next = { ...settings, defaultReportPeriod: value }
                  setSettings(next)
                  saveSettings(next)
                }}
              />
            </div>

            <Toggle
              label="Mostrar elementos inactivos"
              description="Incluye productos, mesas o personal desactivado en las listas."
              value={settings.showInactiveItems}
              onChange={() => {
                const next = { ...settings, showInactiveItems: !settings.showInactiveItems }
                setSettings(next)
                saveSettings(next)
              }}
            />

            <Select
              label="Intervalo de actualización automática"
              value={settings.autoRefresh}
              options={REFRESH_OPTIONS}
              onChange={(value) => {
                const next = { ...settings, autoRefresh: Number(value) }
                setSettings(next)
                saveSettings(next)
              }}
            />
          </div>
        </Section>

        <Section
          icon={Bell}
          title="Notificaciones"
          description="Activa alertas sonoras y prueba el sonido de notificación."
        >
          <div style={{ display: 'grid', gap: 16 }}>
            <Toggle
              label="Alertas de nuevo pedido"
              description="Recibe una notificación visual y sonora cuando llegue un nuevo pedido."
              value={settings.notificationsEnabled}
              onChange={() => {
                const next = { ...settings, notificationsEnabled: !settings.notificationsEnabled }
                setSettings(next)
                saveSettings(next)
              }}
            />

            <button
              type="button"
              onClick={playNotificationSound}
              style={{
                width: 'fit-content',
                padding: '12px 18px',
                borderRadius: 12,
                border: '1px solid var(--border)',
                        background: 'var(--bg-panel)',
                color: 'var(--text-primary)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 10,
                cursor: 'pointer'
              }}
            >
              <Bell size={16} /> Probar sonido
            </button>
          </div>
        </Section>

        <Section
          icon={ShieldCheck}
          title="Guardar configuración"
          description="Guarda los cambios de forma permanente en tu navegador o restablece los valores predeterminados."
        >
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
            <button
              type="button"
              onClick={() => saveSettings()}
              style={{
                background: 'var(--accent)',
                color: '#fff',
                border: 'none',
                borderRadius: 12,
                padding: '14px 20px',
                cursor: 'pointer'
              }}
            >Guardar cambios</button>

            <button
              type="button"
              onClick={restoreDefaults}
              style={{
                background: 'var(--bg-panel)',
                color: 'var(--text-primary)',
                border: '1px solid var(--border)',
                borderRadius: 12,
                padding: '14px 20px',
                cursor: 'pointer'
              }}
            >Restablecer predeterminados</button>
          </div>

          {statusMessage && (
            <div style={{ marginTop: 18, padding: 16, borderRadius: 14, background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}>
              {statusMessage}
            </div>
          )}
        </Section>

        <div style={{ display: 'grid', gap: 14, marginTop: 18, color: 'var(--text-secondary)' }}>
          <div style={{ fontWeight: 700 }}>Resumen de configuración</div>
          <div style={{ background: 'var(--bg-panel)', border: '1px solid var(--border)', borderRadius: 16, padding: 18 }}>
            <div style={{ display: 'grid', gap: 10 }}>
              <div><strong>Tema:</strong> {settings.theme === 'dark' ? 'Oscuro' : 'Claro'}</div>
              <div><strong>Mostrar inactivos:</strong> {settings.showInactiveItems ? 'Sí' : 'No'}</div>
              <div><strong>Actualización automática:</strong> {settings.autoRefresh === 0 ? 'Desactivada' : `${settings.autoRefresh} segundos`}</div>
              <div><strong>Reporte predeterminado:</strong> {REPORT_PERIODS.find(item => item.value === settings.defaultReportPeriod)?.label}</div>
              <div><strong>Notificaciones:</strong> {settings.notificationsEnabled ? 'Activadas' : 'Desactivadas'}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
