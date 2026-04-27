'use client'

import { useState } from 'react'
import { useDroppable } from '@dnd-kit/core'
import DealCard from './deal-card'
import type { Contact, Stage, Profile } from '@/lib/types'

function fmtAmt(n: number) {
  if (n >= 1_000_000) return 'US$' + (n / 1_000_000).toFixed(2) + 'M'
  return 'US$' + Math.round(n / 1000) + 'k'
}

interface Props {
  stage: Stage
  contacts: Contact[]
  vendors: Profile[]
  onAddContact: (stageId: string, name: string) => void
}

export default function KanbanColumn({ stage, contacts, vendors, onAddContact }: Props) {
  const { isOver, setNodeRef } = useDroppable({ id: stage.id })
  const [adding, setAdding] = useState(false)
  const [newName, setNewName] = useState('')

  const total = contacts.reduce((acc, c) => acc + (c.amount ?? 0), 0)

  function submit() {
    if (!newName.trim()) { setAdding(false); return }
    onAddContact(stage.id, newName.trim())
    setNewName('')
    setAdding(false)
  }

  return (
    <div ref={setNodeRef} className={`pipe-col${isOver ? ' drag-over' : ''}`}>
      <div className="pipe-head">
        <div className="row">
          <div className="pipe-stage-name">{stage.name}</div>
          <button className="pipe-add" onClick={() => setAdding(true)} title="Agregar deal">+</button>
        </div>
        <div className="pipe-meta">
          <span>{contacts.length} deals</span>
          <span className="amt">{fmtAmt(total)}</span>
        </div>
      </div>

      <div className="pipe-list">
        {adding && (
          <div className="deal" style={{ padding: 10 }}>
            <input
              className="input-full"
              autoFocus
              value={newName}
              onChange={e => setNewName(e.target.value)}
              placeholder="Nombre del prospecto…"
              onKeyDown={e => { if (e.key === 'Enter') submit(); if (e.key === 'Escape') { setAdding(false); setNewName('') } }}
              style={{ fontSize: 12, padding: '7px 9px' }}
            />
            <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
              <button className="btn btn-primary btn-sm" onClick={submit}>Agregar</button>
              <button className="btn-ghost btn-sm" onClick={() => { setAdding(false); setNewName('') }}>Cancelar</button>
            </div>
          </div>
        )}

        {contacts.map(c => (
          <DealCard key={c.id} contact={c} vendors={vendors} />
        ))}

        {contacts.length === 0 && !adding && (
          <div style={{ padding: '32px 12px', textAlign: 'center', color: 'var(--text-mute)', fontSize: 11.5, border: '1px dashed var(--border)', borderRadius: 6 }}>
            Sin deals
          </div>
        )}
      </div>
    </div>
  )
}
