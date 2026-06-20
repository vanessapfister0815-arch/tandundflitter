// config.js — Supabase-Verbindungsdaten
// anon-Key ist mit aktivem RLS sicher im Frontend

export const SUPABASE_URL = 'https://yejkhxeroxccvwsadqku.supabase.co'
export const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InllamtoeGVyb3hjY3Z3c2FkcWt1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzczMjg0MjcsImV4cCI6MjA5MjkwNDQyN30.zr-HKTtFVjRrf5e3XdkEDp8u7HLQOZbzOhxkFPrdfc4'

// Plattformen (Verkauf)
export const SALE_PLATFORMS = [
  'Vinted',
  'eBay',
  'Kleinanzeigen',
  'ETSY',
  'Vestiaire Collective',
  'Catawiki',
  'Schrottkreisel',
  'Mädchenflohmarkt',
]

// Zahlungsplattformen (Whitelist)
export const PAYMENT_PLATFORMS = [
  'Vinted',
  'eBay',
  'Kleinanzeigen',
  'Cash',
  'PayPal',
  'ETSY',
  'Vestiaire Collective',
  'Catawiki',
]

// Artikel-Status
export const ARTICLE_STATUS = {
  ACTIVE: 'active',
  SOLD: 'sold',
  RETURNED: 'returned',
  PARTIAL_SOLD: 'partial_sold',
  LOST: 'lost',
  DISCONTINUED: 'discontinued',
}

export const ACTIVE_STATUSES = ['active', 'returned', 'partial_sold']

// Sales-Status
export const SALE_STATUS = {
  PENDING: 'pending',
  SUCCESSFUL: 'successful',
  RETURNED: 'returned',
  DISPUTED: 'disputed',
}

// Payout-Status (Sales)
export const PAYOUT_STATUS = {
  UNPAID: 'unpaid',
  PARTIAL: 'partial',
  FULLY_PAID: 'fully_paid',
}

// Payout-Status (Payouts)
export const PAYOUTS_STATUS = {
  PENDING: 'pending',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
}
