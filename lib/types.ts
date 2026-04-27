export interface Stage {
  id: string
  name: string
  order: number
  created_at: string
}

export interface Profile {
  id: string
  name: string
  email: string
  role: 'Admin' | 'Closer'
  initials: string
  active: boolean
  created_at: string
}

export interface Contact {
  id: string
  name: string
  phone: string | null
  origin: string | null
  car_interest: string | null
  stage_id: string
  vendor_id: string | null
  amount: number
  days: number
  created_at: string
  updated_at: string
  stage?: Stage
  vendor?: Profile
}

export interface Company {
  id: string
  name: string
  industry: string | null
  website: string | null
  phone: string | null
  created_at: string
  updated_at: string
}

export interface Deal {
  id: string
  name: string
  contact_id: string | null
  company_id: string | null
  stage_id: string
  amount: number
  car: string | null
  vendor_id: string | null
  days: number
  created_at: string
  updated_at: string
  contact?: Contact
  company?: Company
  stage?: Stage
  vendor?: Profile
}

export interface InventoryItem {
  id: string
  brand: string
  model: string
  year: number
  km: number
  price: number
  status: 'available' | 'reserved' | 'sold'
  created_at: string
  updated_at: string
}

export interface Activity {
  id: string
  type: 'note' | 'call' | 'email' | 'meeting' | 'stage_change'
  description: string
  contact_id: string | null
  deal_id: string | null
  user_id: string | null
  created_at: string
  user?: Profile
}

export interface WeeklySale {
  id: string
  week: string
  units: number
  revenue: number
  target: number
  created_at: string
}

export type Origin = 'Meli' | 'IG' | 'Referido' | 'Web'
export type StockStatus = 'available' | 'reserved' | 'sold'
export type ActivityType = 'note' | 'call' | 'email' | 'meeting' | 'stage_change'
