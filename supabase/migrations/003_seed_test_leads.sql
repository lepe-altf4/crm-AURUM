-- Leads de prueba con next_action_date variadas
-- 2 para hoy (2026-05-16), 2 atrasadas, 2 futuras
-- Ejecutar en Supabase SQL Editor

insert into leads (name, phone, origin, car_interest, stage_id, amount, days, next_action_date)
values
  -- Hoy
  ('Valentina Ríos',    '+5491156781234', 'IG',       'BMW M3 Competition 2023',        's2', 138000, 3,  '2026-05-16'),
  ('Matías Ferreyra',   '+5491167892345', 'Meli',     'Porsche Cayenne S 2024',         's3', 165000, 7,  '2026-05-16'),
  -- Atrasadas
  ('Luciana Mendez',    '+5491178903456', 'Referido', 'Mercedes GLE 450 4MATIC 2024',   's2', 142000, 12, '2026-05-10'),
  ('Santiago Blanco',   '+5491189014567', 'Web',      'Audi Q8 55 TFSI quattro 2024',   's1', 152000, 5,  '2026-05-08'),
  -- Futuras
  ('Camila Vega',       '+5491190125678', 'IG',       'Land Rover Range Rover Sport',   's3', 178000, 2,  '2026-05-22'),
  ('Rodrigo Castillo',  '+5491101236789', 'Referido', 'Porsche Cayenne Turbo GT 2023',  's4', 215000, 9,  '2026-05-28')
on conflict do nothing;
