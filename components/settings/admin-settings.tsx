'use client'

import { useState, useEffect, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Icon from '@/components/ui/icon'
import type { Profile, Stage } from '@/lib/types'

interface Props {
  initialProfiles: Profile[]
  initialStages: Stage[]
  contacts: { id: string; stage_id: string }[]
}

export default function AdminSettings({ initialProfiles, initialStages, contacts }: Props) {
  const router = useRouter()
  const supabase = createClient()
  const [, startTransition] = useTransition()

  const [profiles, setProfiles] = useState<Profile[]>(initialProfiles)
  const [stages, setStages] = useState<Stage[]>(initialStages)
  const [commAdmin, setCommAdmin] = useState(0.5)
  const [commCloser, setCommCloser] = useState(3.5)
  const [commAuto, setCommAuto] = useState(true)
  // #5 — tipo de cambio
  const [exchangeRate, setExchangeRate] = useState(1200)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<{ name: string; email: string; role: 'Admin' | 'Closer' } | null>(null)
  const [dragStageId, setDragStageId] = useState<string | null>(null)
  const [dropTargetId, setDropTargetId] = useState<string | null>(null)
  // #3 — per-stage save feedback
  const [stageSaved, setStageSaved] = useState<Record<string, boolean>>({})
  const [saved, setSaved] = useState(false)
  const [saving, setSaving] = useState(false)

  // Load exchange rate from Supabase settings table (falls back to localStorage)
  useEffect(() => {
    ;(async () => {
      try {
        const { data } = await supabase.from('settings').select('value').eq('key', 'fx_rate').single()
        if (data?.value) setExchangeRate(Number(data.value))
        else {
          const stored = localStorage.getItem('aurum_fx')
          if (stored) setExchangeRate(Number(stored))
        }
      } catch {
        const stored = localStorage.getItem('aurum_fx')
        if (stored) setExchangeRate(Number(stored))
      }
    })()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  function openEdit(p: Profile) {
    setEditingId(p.id)
    setEditForm({ name: p.name, email: p.email, role: p.role })
  }

  async function saveEdit() {
    if (!editingId || !editForm) return
    setProfiles(prev => prev.map(p => p.id === editingId ? { ...p, ...editForm } : p))
    await supabase.from('users').update(editForm).eq('id', editingId)
    setEditingId(null)
    setEditForm(null)
    startTransition(() => router.refresh())
  }

  async function toggleActive(id: string) {
    setProfiles(prev => prev.map(p => p.id === id ? { ...p, active: !p.active } : p))
    const target = profiles.find(p => p.id === id)
    if (target) await supabase.from('users').update({ active: !target.active }).eq('id', id)
    startTransition(() => router.refresh())
  }

  // #3 — save stage name on blur with green check feedback
  async function saveStage(id: string, name: string) {
    await supabase.from('pipeline_stages').update({ name }).eq('id', id)
    setStageSaved(prev => ({ ...prev, [id]: true }))
    setTimeout(() => setStageSaved(prev => ({ ...prev, [id]: false })), 2000)
  }

  function onStageDragStart(id: string) { setDragStageId(id) }
  function onStageDragOver(e: React.DragEvent, id: string) { e.preventDefault(); setDropTargetId(id) }
  function onStageDrop(e: React.DragEvent, id: string) {
    e.preventDefault()
    if (!dragStageId || dragStageId === id) { setDragStageId(null); setDropTargetId(null); return }
    setStages(prev => {
      const arr = [...prev]
      const from = arr.findIndex(s => s.id === dragStageId)
      const to = arr.findIndex(s => s.id === id)
      const [moved] = arr.splice(from, 1)
      arr.splice(to, 0, moved)
      return arr.map((s, i) => ({ ...s, position: i + 1 }))
    })
    setDragStageId(null)
    setDropTargetId(null)
  }

  async function saveAll() {
    setSaving(true)
    // Save stage order and names
    await Promise.all(
      stages.map((s, i) => supabase.from('pipeline_stages').update({ position: i + 1, name: s.name }).eq('id', s.id))
    )
    // Persist exchange rate — both Supabase and localStorage fallback
    localStorage.setItem('aurum_fx', String(exchangeRate))
    await supabase.from('settings').upsert({ key: 'fx_rate', value: String(exchangeRate), updated_at: new Date().toISOString() })
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 1800)
    startTransition(() => router.refresh())
  }

  return (
    <>
      <div className="module-header">
        <div>
          <div className="module-title">Admin Settings</div>
          <div className="module-sub">Gestioná equipo, comisiones y pipeline</div>
        </div>
      </div>

      <div className="module-body" style={{ paddingBottom: 96 }}>
        {/* Section 1: Team */}
        <section className="settings-section">
          <div className="settings-section-head">
            <div>
              <div className="settings-section-title">1 · Equipo</div>
              <div className="settings-section-sub">Usuarios del workspace y sus permisos</div>
            </div>
            <button className="btn btn-sm"><Icon name="plus" size={12} /> Invitar usuario</button>
          </div>
          <div className="card">
            <table className="table">
              <thead>
                <tr>
                  <th style={{ fontWeight: 600 }}>Nombre</th>
                  <th style={{ fontWeight: 600 }}>Email</th>
                  <th style={{ fontWeight: 600 }}>Rol</th>
                  <th style={{ fontWeight: 600 }}>Estado</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {profiles.map(p =>
                  editingId === p.id && editForm ? (
                    <tr key={p.id}>
                      <td><input className="input-full" value={editForm.name} onChange={e => setEditForm({ ...editForm, name: e.target.value })} style={{ padding: '6px 9px' }} /></td>
                      <td><input className="input-full" value={editForm.email} onChange={e => setEditForm({ ...editForm, email: e.target.value })} style={{ padding: '6px 9px' }} /></td>
                      <td>
                        <select className="select-full" value={editForm.role} onChange={e => setEditForm({ ...editForm, role: e.target.value as 'Admin' | 'Closer' })} style={{ padding: '6px 9px' }}>
                          <option value="Admin">Admin</option>
                          <option value="Closer">Closer</option>
                        </select>
                      </td>
                      <td><span className={`badge ${p.active ? 'badge-gold' : 'badge-mute'}`}><span className="dot" />{p.active ? 'Activo' : 'Inactivo'}</span></td>
                      <td style={{ textAlign: 'right' }}>
                        <div className="actions-cell" style={{ justifyContent: 'flex-end' }}>
                          <button className="btn-ghost btn-sm" onClick={() => { setEditingId(null); setEditForm(null) }}>Cancelar</button>
                          <button className="btn btn-primary btn-sm" onClick={saveEdit}>Guardar</button>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    <tr key={p.id}>
                      <td style={{ fontWeight: 500 }}>{p.name}</td>
                      <td className="muted">{p.email}</td>
                      <td><span className={`badge ${p.role === 'Admin' ? 'badge-gold' : 'badge-white'}`}>{p.role}</span></td>
                      <td>
                        <button className={`toggle${p.active ? ' on' : ''}`} onClick={() => toggleActive(p.id)} title={p.active ? 'Desactivar' : 'Activar'} />
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <button className="btn btn-sm" onClick={() => openEdit(p)}><Icon name="edit" size={11} /> Editar</button>
                      </td>
                    </tr>
                  )
                )}
              </tbody>
            </table>
          </div>
        </section>

        <div className="settings-divider" />

        {/* Section 2: Commissions + Exchange rate */}
        <section className="settings-section">
          <div className="settings-section-head">
            <div>
              <div className="settings-section-title">2 · Comisiones y tipo de cambio</div>
              <div className="settings-section-sub">Porcentajes por rol, automatización y FX</div>
            </div>
          </div>
          <div className="card card-pad" style={{ padding: '20px 22px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 22, marginBottom: 22 }}>
              <div className="field">
                <label className="label">Comisión Admin (%)</label>
                <input className="input-full" type="number" step={0.1} value={commAdmin} onChange={e => setCommAdmin(parseFloat(e.target.value) || 0)} />
              </div>
              <div className="field">
                <label className="label">Comisión Closer (%)</label>
                <input className="input-full" type="number" step={0.1} value={commCloser} onChange={e => setCommCloser(parseFloat(e.target.value) || 0)} />
              </div>
              {/* #5 — tipo de cambio */}
              <div className="field">
                <label className="label">Tipo de cambio (ARS/USD)</label>
                <input
                  className="input-full"
                  type="number"
                  step={1}
                  value={exchangeRate}
                  onChange={e => setExchangeRate(Number(e.target.value) || 1200)}
                  placeholder="1200"
                />
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 6 }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)' }}>Comisiones automáticas</div>
                <div style={{ fontSize: 11.5, color: 'var(--text-mute)', marginTop: 3 }}>Calcula y registra comisiones al cerrar deals</div>
              </div>
              <button className={`toggle${commAuto ? ' on' : ''}`} onClick={() => setCommAuto(!commAuto)} />
            </div>
          </div>
        </section>

        <div className="settings-divider" />

        {/* Section 3: Pipeline stages */}
        <section className="settings-section">
          <div className="settings-section-head">
            <div>
              <div className="settings-section-title">3 · Pipeline</div>
              <div className="settings-section-sub">Etapas del proceso comercial · arrastrá para reordenar · los nombres se guardan al salir del campo</div>
            </div>
          </div>
          <div className="card card-pad" style={{ padding: 14 }}>
            {stages.map((s, i) => (
              <div
                key={s.id}
                className={`stage-row${dragStageId === s.id ? ' dragging' : ''}${dropTargetId === s.id && dragStageId !== s.id ? ' drop-target' : ''}`}
                draggable
                onDragStart={() => onStageDragStart(s.id)}
                onDragOver={e => onStageDragOver(e, s.id)}
                onDragLeave={() => setDropTargetId(null)}
                onDrop={e => onStageDrop(e, s.id)}
                onDragEnd={() => { setDragStageId(null); setDropTargetId(null) }}
              >
                <div className="drag-handle"><Icon name="drag" size={14} /></div>
                <div className="num">{i + 1}</div>
                <input
                  value={s.name}
                  onChange={e => setStages(prev => prev.map(p => p.id === s.id ? { ...p, name: e.target.value } : p))}
                  onBlur={() => saveStage(s.id, s.name)}
                  style={{
                    flex: 1,
                    background: 'var(--surface-3)',
                    border: '1px solid var(--border-strong)',
                    borderRadius: 5,
                    color: 'var(--text)',
                    fontSize: 13,
                    fontWeight: 500,
                    padding: '6px 10px',
                    outline: 'none',
                    cursor: 'text',
                    fontFamily: 'inherit',
                  }}
                />
                {/* #3 — green check feedback */}
                {stageSaved[s.id] && (
                  <span style={{ color: '#4CAF50', fontSize: 12, fontWeight: 600, marginLeft: 4, transition: 'opacity 0.3s' }}>
                    ✓ Guardado
                  </span>
                )}
                <span className="badge badge-mute" style={{ marginLeft: 'auto' }}>
                  {contacts.filter(c => c.stage_id === s.id).length} deals
                </span>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* Sticky save bar */}
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'var(--surface-1)', borderTop: '1px solid var(--border)', padding: '14px 28px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontSize: 12, color: saved ? '#4CAF50' : 'var(--text-mute)' }}>
          {saved ? '✓ Cambios guardados' : 'Hay cambios sin guardar'}
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn" onClick={() => { setProfiles(initialProfiles); setStages(initialStages) }}>Descartar</button>
          <button className="btn btn-primary" onClick={saveAll} disabled={saving}>
            {saving ? 'Guardando…' : 'Guardar cambios'}
          </button>
        </div>
      </div>
    </>
  )
}
