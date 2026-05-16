'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const router = useRouter()
  const supabase = createClient()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      router.push('/leads')
      router.refresh()
    }
  }

  return (
    <div style={{ width: 400 }}>
      {/* Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 32, justifyContent: 'center' }}>
        <div className="mark" style={{ width: 32, height: 32, fontSize: 15 }}>A</div>
        <div style={{ fontWeight: 700, letterSpacing: '0.10em', fontSize: 14, color: 'var(--text)' }}>AURUM CARS</div>
      </div>

      <div className="card" style={{ padding: '32px' }}>
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 18, fontWeight: 600, color: 'var(--text)', letterSpacing: '-0.01em', marginBottom: 6 }}>
            Iniciar sesión
          </div>
          <div style={{ fontSize: 13, color: 'var(--text-mute)' }}>
            Accede a tu workspace de AURUM CARS
          </div>
        </div>

        {error && (
          <div style={{ background: 'rgba(224,68,68,0.1)', border: '1px solid rgba(224,68,68,0.3)', borderRadius: 6, padding: '10px 14px', fontSize: 13, color: '#E04444', marginBottom: 18 }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="field">
            <label className="label">Email</label>
            <input
              className="input-full"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="tu@agencia.com"
              required
              autoFocus
            />
          </div>
          <div className="field" style={{ marginBottom: 24 }}>
            <label className="label">Contraseña</label>
            <input
              className="input-full"
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>
          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', justifyContent: 'center', padding: '10px 14px' }}
            disabled={loading}
          >
            {loading ? 'Ingresando…' : 'Ingresar'}
          </button>
        </form>

        <div style={{ marginTop: 20, textAlign: 'center', fontSize: 12, color: 'var(--text-mute)' }}>
          ¿No tenés cuenta?{' '}
          <Link href="/register" style={{ color: 'var(--gold)', textDecoration: 'none', fontWeight: 500 }}>
            Registrarse
          </Link>
        </div>
      </div>
    </div>
  )
}
