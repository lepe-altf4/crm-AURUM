'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

export default function RegisterPage() {
  const router = useRouter()
  const supabase = createClient()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name,
          initials: name.split(' ').slice(0, 2).map(p => p[0]?.toUpperCase() ?? '').join(''),
        },
      },
    })

    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      setSuccess(true)
      setTimeout(() => router.push('/login'), 2500)
    }
  }

  if (success) {
    return (
      <div style={{ width: 400 }}>
        <div className="card" style={{ padding: '40px 32px', textAlign: 'center' }}>
          <div style={{ fontSize: 26, marginBottom: 16 }}>✓</div>
          <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text)', marginBottom: 8 }}>Cuenta creada</div>
          <div style={{ fontSize: 13, color: 'var(--text-mute)' }}>
            Revisá tu email para confirmar tu cuenta. Redirigiendo al login…
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={{ width: 400 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 32, justifyContent: 'center' }}>
        <div className="mark" style={{ width: 32, height: 32, fontSize: 15 }}>A</div>
        <div style={{ fontWeight: 700, letterSpacing: '0.10em', fontSize: 14, color: 'var(--text)' }}>AURUM CARS</div>
      </div>

      <div className="card" style={{ padding: '32px' }}>
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 18, fontWeight: 600, color: 'var(--text)', letterSpacing: '-0.01em', marginBottom: 6 }}>
            Crear cuenta
          </div>
          <div style={{ fontSize: 13, color: 'var(--text-mute)' }}>Registrate en AURUM CARS CRM</div>
        </div>

        {error && (
          <div style={{ background: 'rgba(224,68,68,0.1)', border: '1px solid rgba(224,68,68,0.3)', borderRadius: 6, padding: '10px 14px', fontSize: 13, color: '#E04444', marginBottom: 18 }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="field">
            <label className="label">Nombre completo</label>
            <input
              className="input-full"
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Mauricio Vega"
              required
              autoFocus
            />
          </div>
          <div className="field">
            <label className="label">Email</label>
            <input
              className="input-full"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="tu@agencia.com"
              required
            />
          </div>
          <div className="field" style={{ marginBottom: 24 }}>
            <label className="label">Contraseña</label>
            <input
              className="input-full"
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Mínimo 8 caracteres"
              minLength={8}
              required
            />
          </div>
          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', justifyContent: 'center', padding: '10px 14px' }}
            disabled={loading}
          >
            {loading ? 'Creando cuenta…' : 'Crear cuenta'}
          </button>
        </form>

        <div style={{ marginTop: 20, textAlign: 'center', fontSize: 12, color: 'var(--text-mute)' }}>
          ¿Ya tenés cuenta?{' '}
          <Link href="/login" style={{ color: 'var(--gold)', textDecoration: 'none', fontWeight: 500 }}>
            Iniciar sesión
          </Link>
        </div>
      </div>
    </div>
  )
}
