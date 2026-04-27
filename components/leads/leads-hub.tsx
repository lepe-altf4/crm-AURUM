'use client'

import { useState, useMemo, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Drawer from '@/components/ui/drawer'
import Icon from '@/components/ui/icon'
import { StageBadge } from '@/components/ui/badge'
import ActivityTimeline from '@/components/activities/activity-timeline'
import type { Contact, Stage, Profile } from '@/lib/types'

const ORIGINS = ['Meli', 'IG', 'Referido', 'Web'] as const

interface LeadsHubProps {
  initialContacts: Contact[]
  stages: Stage[]
  vendors: Profile[]
}

export default function LeadsHub({ initialContacts, stages, vendors }: LeadsHubProps) {
  const router = useRouter()
  const supabase = createClient()
  const [, startTransition] = useTransition()

  const [contacts, setContacts] = useState<Contact[]>(initialContacts)
  const [query, setQuery] = useState('')
  const [originFilter, setOriginFilter] = useState('all')
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [detailContact, setDetailContact] = useState<Contact | null>(null)
  const [stageMenuFor, setStageMenuFor] = useState<string | null>(null)
  const [form, setForm] = useState({ name: '', phone: '', origin: 'Meli', car_interest: '', vendor_id: '', amount: '' })
  const [saving, setSaving] = useState(false)

  const filtered = useMemo(() =>
    contacts.filter(c => {
      if (originFilter !== 'all' && c.origin !== originFilter) return false
      if (query) {
        const q = query.toLowerCase()
        return c.name.toLowerCase().includes(q) ||
          (c.phone ?? '').includes(q) ||
          (c.car_interest ?? '').toLowerCase().includes(q)
      }
      return true
    }),
    [contacts, query, originFilter]
  )

  function waLink(c: Contact) {
    const phone = (c.phone ?? '').replace(/[^\d]/g, '')
    const txt = encodeURIComponent(`Hola ${c.name.split(' ')[0]}, te contactamos desde AURUM. ¿Seguís interesado/a en el ${c.car_interest}?`)
    return `https://wa.me/${phone}?text=${txt}`
  }

  async function handleMoveStage(contactId: string, stageId: string) {
    setContacts(prev => prev.map(c => c.id === contactId ? { ...c, stage_id: stageId, days: 0 } : c))
    setStageMenuFor(null)
    await supabase.from('leads').update({ stage_id: stageId, days: 0, updated_at: new Date().toISOString() }).eq('id', contactId)
    // Log activity
    await supabase.from('activities').insert({ type: 'stage_change', description: `Movido a etapa: ${stages.find(s => s.id === stageId)?.name}`, lead_id: contactId })
    startTransition(() => router.refresh())
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name || !form.phone) return
    setSaving(true)

    const { data, error } = await supabase
      .from('leads')
      .insert({
        name: form.name,
        phone: form.phone,
        origin: form.origin,
        car_interest: form.car_interest || null,
        vendor_id: form.vendor_id || null,
        amount: form.amount ? parseFloat(form.amount) : 0,
        stage_id: 's1',
        days: 0,
      })
      .select('*, stage:pipeline_stages(*), vendor:users(*)')
      .single()

    if (!error && data) {
      setContacts(prev => [data, ...prev])
      await supabase.from('activities').insert({ type: 'note', description: 'Lead creado', lead_id: data.id })
    }
    setForm({ name: '', phone: '', origin: 'Meli', car_interest: '', vendor_id: '', amount: '' })
    setDrawerOpen(false)
    setSaving(false)
    startTransition(() => router.refresh())
  }

  async function handleDelete(id: string) {
    if (!confirm('¿Eliminar este lead?')) return
    setContacts(prev => prev.filter(c => c.id !== id))
    await supabase.from('leads').delete().eq('id', id)
    startTransition(() => router.refresh())
  }

  const originDotClass: Record<string, string> = { Meli: 'dot-meli', IG: 'dot-ig', Referido: 'dot-ref', Web: 'dot-web' }

  return (
    <>
      {/* Module Header */}
      <div className="module-header">
        <div>
          <div className="module-title">Leads Hub</div>
          <div className="module-sub">{filtered.length} prospectos · actualizado hoy</div>
        </div>
        <div className="header-right">
          <div className="search-wrap">
            <Icon name="search" size={14} />
            <input
              className="search"
              placeholder="Buscar por nombre, teléfono o auto…"
              value={query}
              onChange={e => setQuery(e.target.value)}
            />
          </div>
          <select className="select" value={originFilter} onChange={e => setOriginFilter(e.target.value)}>
            <option value="all">Todos los orígenes</option>
            {ORIGINS.map(o => <option key={o} value={o}>{o}</option>)}
          </select>
          <button className="btn btn-primary" onClick={() => setDrawerOpen(true)}>
            <Icon name="plus" size={14} /> Nuevo lead
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="module-body">
        <div className="card">
          {filtered.length === 0 ? (
            <div className="empty">
              <div style={{ color: 'var(--text-mute)' }}><Icon name="leads" size={32} /></div>
              <div className="empty-title">No hay prospectos que coincidan</div>
              <div className="empty-sub">Ajustá los filtros o creá un nuevo lead.</div>
            </div>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Teléfono</th>
                  <th>Origen</th>
                  <th>Auto de interés</th>
                  <th>Etapa</th>
                  <th>Fecha</th>
                  <th style={{ textAlign: 'right' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(c => (
                  <tr key={c.id}>
                    <td>
                      <button
                        style={{ fontWeight: 500, background: 'none', border: 'none', color: 'var(--text)', cursor: 'pointer', padding: 0, textAlign: 'left' }}
                        onClick={() => setDetailContact(c)}
                      >
                        {c.name}
                      </button>
                    </td>
                    <td className="muted tabular">{c.phone}</td>
                    <td>
                      <span>
                        <span className={`dot-orig ${originDotClass[c.origin ?? ''] ?? 'dot-web'}`} />
                        {c.origin}
                      </span>
                    </td>
                    <td className="muted">{c.car_interest}</td>
                    <td>
                      {c.stage ? (
                        <StageBadge stageId={c.stage_id} stageName={c.stage.name} />
                      ) : <span className="badge badge-mute">{c.stage_id}</span>}
                    </td>
                    <td className="muted tabular">{new Date(c.created_at).toLocaleDateString('es-AR', { day: '2-digit', month: 'short' })}</td>
                    <td>
                      <div className="actions-cell" style={{ justifyContent: 'flex-end' }}>
                        <a className="btn-wa" href={waLink(c)} target="_blank" rel="noopener noreferrer">
                          <Icon name="wa" size={12} /> WhatsApp
                        </a>
                        <div style={{ position: 'relative' }}>
                          <button className="btn btn-sm" onClick={() => setStageMenuFor(stageMenuFor === c.id ? null : c.id)}>
                            Mover etapa <Icon name="chevron" size={10} />
                          </button>
                          {stageMenuFor === c.id && (
                            <div style={{ position: 'absolute', right: 0, top: 'calc(100% + 4px)', background: 'var(--surface-2)', border: '1px solid var(--border-strong)', borderRadius: 'var(--radius)', zIndex: 10, minWidth: 180, boxShadow: '0 8px 24px rgba(0,0,0,0.5)', padding: 4 }}>
                              {stages.map(st => (
                                <button
                                  key={st.id}
                                  onClick={() => handleMoveStage(c.id, st.id)}
                                  style={{ display: 'block', width: '100%', textAlign: 'left', padding: '7px 10px', background: c.stage_id === st.id ? 'var(--surface-3)' : 'transparent', border: 'none', color: c.stage_id === st.id ? 'var(--gold)' : 'var(--text)', fontSize: 12, borderRadius: 4, cursor: 'pointer' }}
                                >
                                  {st.name}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                        <button className="btn-ghost btn-sm" onClick={() => setDetailContact(c)} title="Ver detalle">
                          <Icon name="arrowRight" size={12} />
                        </button>
                        <button className="btn-ghost btn-sm" onClick={() => handleDelete(c.id)} title="Eliminar" style={{ color: 'var(--danger)' }}>
                          <Icon name="close" size={12} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* New Lead Drawer */}
      <Drawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        title="Nuevo lead"
        footer={
          <>
            <button className="btn" onClick={() => setDrawerOpen(false)}>Cancelar</button>
            <button className="btn btn-primary" onClick={handleSubmit} disabled={saving}>
              {saving ? 'Guardando…' : 'Crear lead'}
            </button>
          </>
        }
      >
        <form onSubmit={handleSubmit}>
          <div className="field">
            <label className="label">Nombre completo</label>
            <input className="input-full" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Ej. Federico Anaya" required />
          </div>
          <div className="field">
            <label className="label">Teléfono</label>
            <input className="input-full" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="+5491134568877" required />
          </div>
          <div className="field">
            <label className="label">Origen del lead</label>
            <select className="select-full" value={form.origin} onChange={e => setForm({ ...form, origin: e.target.value })}>
              {ORIGINS.map(o => <option key={o} value={o}>{o}</option>)}
            </select>
          </div>
          <div className="field">
            <label className="label">Auto de interés</label>
            <input className="input-full" value={form.car_interest} onChange={e => setForm({ ...form, car_interest: e.target.value })} placeholder="Ej. Porsche Cayenne S 2023" />
          </div>
          <div className="field">
            <label className="label">Monto estimado (USD)</label>
            <input className="input-full" type="number" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} placeholder="165000" />
          </div>
          <div className="field">
            <label className="label">Vendedor asignado</label>
            <select className="select-full" value={form.vendor_id} onChange={e => setForm({ ...form, vendor_id: e.target.value })}>
              <option value="">Sin asignar</option>
              {vendors.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
            </select>
          </div>
        </form>
      </Drawer>

      {/* Contact Detail Drawer */}
      {detailContact && (
        <Drawer
          open={!!detailContact}
          onClose={() => setDetailContact(null)}
          title={detailContact.name}
          footer={
            <a className="btn-wa" href={waLink(detailContact)} target="_blank" rel="noopener noreferrer" style={{ marginRight: 'auto' }}>
              <Icon name="wa" size={12} /> Contactar por WhatsApp
            </a>
          }
        >
          <div style={{ marginBottom: 20 }}>
            <div className="card" style={{ padding: '4px 16px', marginBottom: 16 }}>
              {[
                ['Teléfono', detailContact.phone],
                ['Origen', detailContact.origin],
                ['Auto de interés', detailContact.car_interest],
                ['Etapa', detailContact.stage?.name ?? detailContact.stage_id],
                ['Monto estimado', detailContact.amount ? `US$${detailContact.amount.toLocaleString('en-US')}` : '—'],
                ['Vendedor', detailContact.vendor?.name ?? '—'],
                ['Días en etapa', detailContact.days + 'd'],
              ].map(([k, v]) => (
                <div className="spec-row" key={k as string}>
                  <span className="k">{k}</span>
                  <span className="v">{v ?? '—'}</span>
                </div>
              ))}
            </div>
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-mute)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 500, marginBottom: 12 }}>
            Actividades
          </div>
          <ActivityTimeline contactId={detailContact.id} />
        </Drawer>
      )}
    </>
  )
}
