'use client'

import { useState, useTransition } from 'react'
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

export default function VisualPipeline({ initialContacts, stages, vendors }: Props) {
  const router = useRouter()
  const supabase = createClient()
  const [, startTransition] = useTransition()
  const [contacts, setContacts] = useState<Contact[]>(initialContacts)
  const [activeDrag, setActiveDrag] = useState<Contact | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  )

  function handleDragStart(event: DragStartEvent) {
    const contact = contacts.find(c => c.id === event.active.id)
    setActiveDrag(contact ?? null)
  }

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    setActiveDrag(null)
    if (!over || active.data.current?.stageId === over.id) return

    const contactId = active.id as string
    const newStageId = over.id as string

    setContacts(prev =>
      prev.map(c => c.id === contactId
        ? { ...c, stage_id: newStageId, stage: stages.find(s => s.id === newStageId), days: 0 }
        : c
      )
    )

    await supabase
      .from('leads')
      .update({ stage_id: newStageId, days: 0, updated_at: new Date().toISOString() })
      .eq('id', contactId)

    await supabase.from('activities').insert({
      type: 'stage_change',
      description: `Movido a: ${stages.find(s => s.id === newStageId)?.name}`,
      lead_id: contactId,
    })

    startTransition(() => router.refresh())
  }

  async function handleAddContact(stageId: string, name: string) {
    const { data } = await supabase
      .from('leads')
      .insert({ name, stage_id: stageId, origin: 'Web', days: 0, amount: 0 })
      .select('*, stage:pipeline_stages(*), vendor:users(*)')
      .single()
    if (data) setContacts(prev => [data, ...prev])
    startTransition(() => router.refresh())
  }

  return (
    <>
      <div className="module-header">
        <div>
          <div className="module-title">Visual Pipeline</div>
          <div className="module-sub">{contacts.length} deals activos · arrastrá entre columnas para mover</div>
        </div>
        <div className="header-right">
          <button className="btn"><Icon name="filter" size={12} /> Filtros</button>
        </div>
      </div>

      <div className="module-body" style={{ padding: '18px 20px', overflow: 'auto' }}>
        <DndContext
          sensors={sensors}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <div className="pipeline">
            {stages.map(stage => (
              <KanbanColumn
                key={stage.id}
                stage={stage}
                contacts={contacts.filter(c => c.stage_id === stage.id)}
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
