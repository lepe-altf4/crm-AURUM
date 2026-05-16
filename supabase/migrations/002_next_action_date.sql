-- Agregar campo next_action_date a la tabla leads
-- Ejecutar en Supabase SQL Editor

alter table leads add column if not exists next_action_date date;

-- Índice para queries de Panel de Ventas (atrasados, hoy, sin acción)
create index if not exists leads_next_action_date_idx on leads (next_action_date);
