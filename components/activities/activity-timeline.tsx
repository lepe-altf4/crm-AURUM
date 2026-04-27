'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import Icon from '@/components/ui/icon'
import type { Activity } from '@/lib/types'

const TYPE_ICON: Record<string, string> = {
  note: 'note',
  call: 'phone',
  email: 'mail',
  meeting: 'users',
  stage_change: 'arrowRight',
}

const TYPE_LABEL: Record<string, string> = {
  note: 'Nota',
  call: 'Llamada',
  email: 'Email',
  meeting: 'Reunión',
  stage_change: 'Cambio de etapa',
}

interface Props {
  contactId?: string
  dealId?: string
}

export default function ActivityTimeline({ contactId, dealId }: Props) {
  const supabase = createClient()
  const [activities, setActivities] = useState<Activity[]>([])
  const [loading, setLoading] = useState(true)
  const [newDesc, setNewDesc] = useState('')
  const [newType, setNewType] = useState<Activity['type']>('note')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    async function fetch() {
      let q = supabase.from('activities').select('*, user:users(*)').order('created_at', { ascending: false })
      if (contactId) q = q.eq('lead_id', contactId)
      if (dealId) q = q.eq('deal_id', dealId)
      const { data } = await q
      setActivities(data ?? [])
      setLoading(false)
    }
    fetch()

    // Real-time subscription
    const channel = supabase
      .channel(`activities-${contactId ?? dealId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'activities',
        filter: contactId ? `lead_id=eq.${contactId}` : `deal_id=eq.${dealId}`,
      }, payload => {
        setActivities(prev => [payload.new as Activity, ...prev])
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [contactId, dealId]) // eslint-disable-line react-hooks/exhaustive-deps

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    if (!newDesc.trim()) return
    setSaving(true)
    const { data } = await supabase
      .from('activities')
      .insert({
        type: newType,
        description: newDesc.trim(),
        lead_id: contactId ?? null,
        deal_id: dealId ?? null,
      })
      .select('*, user:users(*)')
      .single()

    if (data) setActivities(prev => [data, ...prev])
    setNewDesc('')
    setSaving(false)
  }

  return (
    <div>
      {/* Add activity */}
      <form onSubmit={handleAdd} style={{ marginBottom: 20 }}>
        <div className="field">
          <label className="label">Tipo</label>
          <select className="select-full" value={newType} onChange={e => setNewType(e.target.value as Activity['type'])}>
            {Object.entries(TYPE_LABEL).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
        </div>
        <div className="field" style={{ marginBottom: 10 }}>
          <label className="label">Descripción</label>
          <textarea
            className="input-full"
            value={newDesc}
            onChange={e => setNewDesc(e.target.value)}
            placeholder="Detalles de la actividad…"
            rows={2}
            style={{ resize: 'vertical' }}
          />
        </div>
        <button className="btn btn-primary btn-sm" type="submit" disabled={saving || !newDesc.trim()}>
          <Icon name="plus" size={12} /> {saving ? 'Guardando…' : 'Registrar'}
        </button>
      </form>

      <div style={{ height: 1, background: 'var(--border)', margin: '16px 0' }} />

      {loading ? (
        <div style={{ fontSize: 12, color: 'var(--text-mute)', padding: '16px 0' }}>Cargando actividades…</div>
      ) : activities.length === 0 ? (
        <div style={{ fontSize: 12, color: 'var(--text-mute)', padding: '16px 0' }}>Sin actividades registradas todavía.</div>
      ) : (
        <div className="timeline">
          {activities.map(a => (
            <div key={a.id} className="timeline-item">
              <div className={`timeline-dot ${a.type}`}>
                <Icon name={TYPE_ICON[a.type] ?? 'note'} size={11} />
              </div>
              <div className="timeline-body">
                <div className="timeline-meta">
                  <span style={{ color: 'var(--gold)', fontWeight: 500 }}>{TYPE_LABEL[a.type]}</span>
                  <span>·</span>
                  <span>{new Date(a.created_at).toLocaleDateString('es-AR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
                  {a.user && <><span>·</span><span>{a.user.name}</span></>}
                </div>
                <div className="timeline-desc">{a.description}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
