// AURUM CRM — Mock data store
// Precios en USD reales del mercado argentino (Abril 2026), unidades de alta gama
window.AURUM_DATA = {
  user: { name: 'Mauricio Vega', role: 'Owner', initials: 'MV' },

  stages: [
    { id: 's1', name: 'Nuevo contacto' },
    { id: 's2', name: 'En seguimiento' },
    { id: 's3', name: 'Test drive' },
    { id: 's4', name: 'Negociación' },
    { id: 's5', name: 'Cerrado' },
  ],

  origins: ['Meli', 'IG', 'Referido', 'Web'],

  vendors: [
    { id: 'v1', name: 'Andrés Solís', initials: 'AS' },
    { id: 'v2', name: 'Camila Reyes', initials: 'CR' },
    { id: 'v3', name: 'Diego Iturbe', initials: 'DI' },
    { id: 'v4', name: 'Valentina Ríos', initials: 'VR' },
  ],

  // Precios en USD (mercado argentino alta gama, Abril 2026)
  leads: [
    { id: 'l1',  name: 'Federico Anaya',     phone: '+5491134568877', origin: 'Referido', car: 'Porsche Cayenne S 2023',         stage: 's4', date: '24 Abr 2026', vendor: 'v1', amount: 165000, days: 5 },
    { id: 'l2',  name: 'Renata Ovalle',      phone: '+5491158429911', origin: 'Meli',     car: 'Mercedes-Benz GLE 450 2024',     stage: 's2', date: '23 Abr 2026', vendor: 'v2', amount: 142000, days: 4 },
    { id: 'l3',  name: 'Juan Pablo Bravo',   phone: '+5491167712233', origin: 'IG',       car: 'BMW M3 Competition 2023',        stage: 's1', date: '26 Abr 2026', vendor: 'v3', amount: 138000, days: 1 },
    { id: 'l4',  name: 'Ximena Cárdenas',    phone: '+5491189987766', origin: 'Web',      car: 'Audi Q8 55 TFSI 2024',           stage: 's3', date: '22 Abr 2026', vendor: 'v1', amount: 152000, days: 5 },
    { id: 'l5',  name: 'Tomás Iribarren',    phone: '+5491176554433', origin: 'Referido', car: 'Range Rover Sport HSE 2023',     stage: 's5', date: '18 Abr 2026', vendor: 'v4', amount: 178000, days: 9 },
    { id: 'l6',  name: 'Lucía Fernández',    phone: '+5491132113344', origin: 'Meli',     car: 'Porsche Cayenne Coupé 2024',     stage: 's2', date: '25 Abr 2026', vendor: 'v2', amount: 172000, days: 2 },
    { id: 'l7',  name: 'Mateo Salinas',      phone: '+5491154221199', origin: 'IG',       car: 'Mercedes-Benz GLE 53 AMG 2023',  stage: 's4', date: '20 Abr 2026', vendor: 'v3', amount: 168000, days: 7 },
    { id: 'l8',  name: 'Andrea Pelaez',      phone: '+5491121223344', origin: 'Web',      car: 'BMW M3 Touring 2024',            stage: 's1', date: '26 Abr 2026', vendor: 'v4', amount: 145000, days: 1 },
    { id: 'l9',  name: 'Sebastián Quintero', phone: '+5491165667788', origin: 'Referido', car: 'Range Rover Sport Autobiography', stage: 's3', date: '21 Abr 2026', vendor: 'v1', amount: 195000, days: 6 },
    { id: 'l10', name: 'Paula Mendoza',      phone: '+5491177889900', origin: 'Meli',     car: 'Audi Q8 60 TFSI e 2024',         stage: 's2', date: '24 Abr 2026', vendor: 'v2', amount: 162000, days: 3 },
    { id: 'l11', name: 'Rodrigo Carmona',    phone: '+5491132987654', origin: 'IG',       car: 'Porsche Cayenne Turbo GT 2023',  stage: 's5', date: '15 Abr 2026', vendor: 'v3', amount: 215000, days: 12 },
    { id: 'l12', name: 'Camila Aguirre',     phone: '+5491168765432', origin: 'Web',      car: 'Mercedes-Benz GLE 63 S AMG 2024',stage: 's4', date: '19 Abr 2026', vendor: 'v4', amount: 198000, days: 8 },
  ],

  // Inventario real — 5 modelos exigidos: Porsche Cayenne, BMW M3, Audi Q8, Mercedes GLE, Range Rover Sport
  // Precios USD aproximados al mercado argentino (alta gama usados/0km, Abril 2026)
  inventory: [
    { id: 'u1',  brand: 'Porsche',       model: 'Cayenne S',                year: 2023, km: 18400, price: 165000, status: 'reserved' },
    { id: 'u2',  brand: 'Porsche',       model: 'Cayenne Coupé',            year: 2024, km: 6200,  price: 172000, status: 'available' },
    { id: 'u3',  brand: 'Porsche',       model: 'Cayenne Turbo GT',         year: 2023, km: 11800, price: 215000, status: 'sold' },
    { id: 'u4',  brand: 'Porsche',       model: 'Cayenne E-Hybrid',         year: 2024, km: 3100,  price: 158000, status: 'available' },
    { id: 'u5',  brand: 'BMW',           model: 'M3 Competition',           year: 2023, km: 14200, price: 138000, status: 'available' },
    { id: 'u6',  brand: 'BMW',           model: 'M3 Touring',               year: 2024, km: 4800,  price: 145000, status: 'reserved' },
    { id: 'u7',  brand: 'BMW',           model: 'M3 CS',                    year: 2023, km: 9600,  price: 168000, status: 'available' },
    { id: 'u8',  brand: 'Audi',          model: 'Q8 55 TFSI quattro',       year: 2024, km: 7400,  price: 152000, status: 'available' },
    { id: 'u9',  brand: 'Audi',          model: 'Q8 60 TFSI e quattro',     year: 2024, km: 2900,  price: 162000, status: 'available' },
    { id: 'u10', brand: 'Audi',          model: 'SQ8 TFSI',                 year: 2023, km: 16800, price: 148000, status: 'sold' },
    { id: 'u11', brand: 'Mercedes-Benz', model: 'GLE 450 4MATIC',           year: 2024, km: 5400,  price: 142000, status: 'available' },
    { id: 'u12', brand: 'Mercedes-Benz', model: 'GLE 53 AMG 4MATIC+',       year: 2023, km: 12100, price: 168000, status: 'reserved' },
    { id: 'u13', brand: 'Mercedes-Benz', model: 'GLE 63 S AMG 4MATIC+',     year: 2024, km: 3800,  price: 198000, status: 'available' },
    { id: 'u14', brand: 'Mercedes-Benz', model: 'GLE 400 d 4MATIC',         year: 2023, km: 21400, price: 128000, status: 'sold' },
    { id: 'u15', brand: 'Land Rover',    model: 'Range Rover Sport HSE',    year: 2023, km: 13600, price: 178000, status: 'available' },
    { id: 'u16', brand: 'Land Rover',    model: 'Range Rover Sport Autobio.',year: 2024, km: 4200, price: 195000, status: 'reserved' },
    { id: 'u17', brand: 'Land Rover',    model: 'Range Rover Sport SVR',    year: 2023, km: 8900,  price: 205000, status: 'available' },
    { id: 'u18', brand: 'Land Rover',    model: 'Range Rover Sport P440e',  year: 2024, km: 2400,  price: 188000, status: 'available' },
  ],

  users: [
    { id: 'u_a', name: 'Mauricio Vega',   email: 'm.vega@aurum.com.ar',   role: 'Admin',  active: true },
    { id: 'u_b', name: 'Andrés Solís',    email: 'a.solis@aurum.com.ar',  role: 'Closer', active: true },
    { id: 'u_c', name: 'Camila Reyes',    email: 'c.reyes@aurum.com.ar',  role: 'Closer', active: true },
    { id: 'u_d', name: 'Diego Iturbe',    email: 'd.iturbe@aurum.com.ar', role: 'Closer', active: true },
    { id: 'u_e', name: 'Valentina Ríos',  email: 'v.rios@aurum.com.ar',   role: 'Closer', active: false },
  ],

  commissions: { admin: 0.5, closer: 3.5, autoEnabled: true },

  // Revenue en USD
  weeklySales: [
    { week: 'Sem 14', units: 4, revenue: 612000,  target: 5 },
    { week: 'Sem 15', units: 6, revenue: 928000,  target: 5 },
    { week: 'Sem 16', units: 5, revenue: 785000,  target: 5 },
    { week: 'Sem 17', units: 7, revenue: 1184000, target: 5 },
  ],

  recentClosed: [
    { id: 'c1', car: 'Range Rover Sport HSE 2023',        client: 'Tomás Iribarren',  date: '18 Abr', amount: 178000, vendor: 'Valentina Ríos' },
    { id: 'c2', car: 'Porsche Cayenne Turbo GT 2023',     client: 'Rodrigo Carmona',  date: '15 Abr', amount: 215000, vendor: 'Diego Iturbe' },
    { id: 'c3', car: 'Audi SQ8 TFSI 2023',                client: 'Sofía Lamadrid',   date: '12 Abr', amount: 148000, vendor: 'Andrés Solís' },
    { id: 'c4', car: 'Mercedes-Benz GLE 400 d 2023',      client: 'Héctor Quiroz',    date: '08 Abr', amount: 128000, vendor: 'Camila Reyes' },
    { id: 'c5', car: 'BMW M3 Competition 2023',           client: 'Ileana Bermúdez',  date: '05 Abr', amount: 138000, vendor: 'Andrés Solís' },
  ],

  rankings: [
    { id: 'v1', name: 'Andrés Solís',    deals: 9, revenue: 1420000, rate: 32 },
    { id: 'v4', name: 'Valentina Ríos',  deals: 7, revenue: 1190000, rate: 28 },
    { id: 'v2', name: 'Camila Reyes',    deals: 6, revenue: 920000,  rate: 24 },
    { id: 'v3', name: 'Diego Iturbe',    deals: 5, revenue: 815000,  rate: 21 },
  ],

  kpis: {
    revenue: { value: 3509000, delta: '+18.2% vs mes anterior' },
    units:   { value: 22, target: 30 },
    conv:    { value: 26.5, delta: '+3.1pp vs mes anterior' },
    ticket:  { value: 159500, delta: '+5.4% vs mes anterior' },
  },
};
