'use client'

import { useState, useEffect, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import { createClient } from '@/lib/supabase/client'
import Icon from '@/components/ui/icon'
import KanbanColumn from './kanban-column'
import DealCard from './deal-card'
import type { Contact, Stage, Profile } from '@/lib/types'

interface Props {
  initialContacts: Contact[]
  stages: Stage[]
  vendors: Profile[]
}

export default function VisualPipeline({ initialContacts, stages: initialStages, vendors }: Props) {
  const router = useRouter()
  const supabase = createClient()
  const [, startTransition] = useTransition()
  const [contacts, setContacts] = useState<Contact[]>(initialContacts)
  // #3 — stages as local state so realtime updates reflect immediately
  const [stages, setStages] = useState<Stage[]>(initialStages)
  const [activeDrag, setActiveDrag] = useState<Contact | null>(null)
  const [filterOpen, setFilterOpen] = useState(false)
  const [vendorFilter, setVendorFilter] = useState('all')
  const [stageFilterId, setStageFilterId] = useState('all')

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  )

  // #3 — realtime subscription: when stage names change in Admin Settings, update kanban instantly
  useEffect(() => {
    const stagesCh = supabase
      .channel('rt-pipeline-stages')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'pipeline_stages' }, payload => {
        const updated = payload.new as Stage
        setStages(prev => prev.map(s => s.id === updated.id ? { ...s, ...updated } : s))
        // Also update any contact that has a cached stage object
        setContacts(prev => prev.map(c =>
          c.stage_id === updated.id ? { ...c, stage: { ...c.stage, ...updated } as Stage } : c
        ))
      })
      .subscribe()

    return () => { supabase.removeChannel(stagesCh) }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  function handleDragStart(event: DragStartEvent) {
    const contact = contacts.find(c => c.id === event.active.id)
    setActiveDrag(contact ?? null)
  }

  // #1 — optimistic update: state moves instantly, Supabase write is fire-and-forget
  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    setActiveDrag(null)
    if (!over || active.data.current?.stageId === over.id) return

    const contactId = active.id as string
    const newStageId = over.id as string
    const newStage = stages.find(s => s.id === newStageId)

    // Instant optimistic update — no await
    setContacts(prev =>
      prev.map(c => c.id === contactId
        ? { ...c, stage_id: newStageId, stage: newStage, days: 0 }
        : c
      )
    )

    // Fire-and-forget DB write (non-blocking)
    supabase
      .from('leads')
      .update({ stage_id: newStageId, days: 0, updated_at: new Date().toISOString() })
      .eq('id', contactId)
      .then(() => {
        supabase.from('activities').insert({
          type: 'stage_change',
          description: `Movido a: ${newStage?.name}`,
          lead_id: contactId,
        })
        startTransition(() => router.refresh())
      })
  }

  async function handleAddContact(stageId: string, name: string) {
    const { data } = await supabase
      .from('leads')
      .insert({ name, stage_id: stageId, origin: 'Web', days: 0, amount: 0 })
      .select('*, stage:pipeline_stages(*), vendor:users(*)')
      .single()
    if (data) setContacts(prev => [data as Contact, ...prev])
    startTransition(() => router.refresh())
  }

  const hasFilter = vendorFilter !== 'all' || stageFilterId !== 'all'

  const displayContacts = contacts.filter(c =>
    vendorFilter === 'all' || c.vendor_id === vendorFilter
  )
  const displayStages = stageFilterId === 'all'
    ? stages
    : stages.filter(s => s.id === stageFilterId)

  return (
    <>
      <div className="module-header">
        <div>
          <div className="module-title">Visual Pipeline</div>
          <div className="module-sub">
            {displayContacts.length} deals{hasFilter ? ' filtrados' : ' activos'} · arrastrá entre columnas para mover
          </div>
        </div>
        <div className="header-right">
          <button
            className={`btn${hasFilter ? ' btn-primary' : ''}`}
            onClick={() => setFilterOpen(f => !f)}
          >
            <Icon name="filter" size={12} /> Filtros{hasFilter ? ` (${[vendorFilter !== 'all', stageFilterId !== 'all'].filter(Boolean).length})` : ''}
          </button>
        </div>
      </div>

      {filterOpen && (
        <div style={{ padding: '10px 20px', background: 'var(--surface-2)', borderBottom: '1px solid var(--border)', display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
          <span style={{ fontSize: 11, color: 'var(--text-mute)', fontWeight: 500 }}>Filtrar por:</span>
          <select className="select" value={vendorFilter} onChange={e => setVendorFilter(e.target.value)}>
            <option value="all">Todos los vendedores</option>
            {vendors.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
          </select>
          <select className="select" value={stageFilterId} onChange={e => setStageFilterId(e.target.value)}>
            <option value="all">Todas las etapas</option>
            {stages.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
          {hasFilter && (
            <button className="btn-ghost btn-sm" onClick={() => { setVendorFilter('all'); setStageFilterId('all') }}>
              Limpiar
            </button>
          )}
          <span style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--text-mute)' }}>
            {displayContacts.length} deals
          </span>
        </div>
      )}

      <div className="module-body" style={{ padding: '18px 20px', overflow: 'auto' }}>
        <DndContext
          sensors={sensors}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <div className="pipeline">
            {displayStages.map(stage => (
              <KanbanColumn
                key={stage.id}
                stage={stage}
                contacts={displayContacts.filter(c => c.stage_id === stage.id)}
                vendors={vendors}
                onAddContact={handleAddContact}
              />
            ))}
          </div>

          <DragOverlay>
            {activeDrag && (
              <div style={{ transform: 'rotate(2deg)', opacity: 0.95 }}>
                <DealCard contact={activeDrag} vendors={vendors} overlay />
              </div>
            )}
          </DragOverlay>
        </DndContext>
      </div>
    </>
  )
}
