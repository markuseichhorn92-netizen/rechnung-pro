// Customer Types
export interface Customer {
  id: string
  company_name: string
  contact_person?: string
  email: string
  phone?: string
  address: string
  zip_code: string
  city: string
  country: string
  tax_id?: string // USt-IdNr.
  notes?: string
  created_at: string
  updated_at: string
}

// Product/Service Types
export interface Product {
  id: string
  name: string
  description?: string
  unit: string // Stück, Stunde, Pauschal, etc.
  price: number
  tax_rate: number // 0, 7, 19
  category?: string
  created_at: string
}

// Invoice Types
export interface InvoiceItem {
  id: string
  product_id?: string
  description: string
  quantity: number
  unit: string
  unit_price: number
  tax_rate: number
  total: number
}

export interface Invoice {
  id: string
  invoice_number: string
  customer_id: string
  customer?: Customer
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled'
  issue_date: string
  due_date: string
  delivery_date?: string
  items: InvoiceItem[]
  subtotal: number
  tax_amount: number
  total: number
  notes?: string
  payment_terms?: string
  paid_date?: string
  created_at: string
  updated_at: string
}

// Quote/Offer Types
export interface Quote {
  id: string
  quote_number: string
  customer_id: string
  customer?: Customer
  status: 'draft' | 'sent' | 'accepted' | 'rejected' | 'expired'
  issue_date: string
  valid_until: string
  items: InvoiceItem[]
  subtotal: number
  tax_amount: number
  total: number
  notes?: string
  converted_to_invoice_id?: string
  created_at: string
}

// Reminder/Dunning Types
export interface Reminder {
  id: string
  invoice_id: string
  invoice?: Invoice
  level: 1 | 2 | 3 // Zahlungserinnerung, 1. Mahnung, 2. Mahnung
  sent_date: string
  fee?: number
  notes?: string
}

// Company Settings
export interface CompanySettings {
  id: string
  company_name: string
  owner_name: string
  address: string
  zip_code: string
  city: string
  country: string
  email: string
  phone?: string
  website?: string
  tax_id?: string // Steuernummer
  vat_id?: string // USt-IdNr.
  bank_name?: string
  iban?: string
  bic?: string
  logo_url?: string
  invoice_prefix: string
  next_invoice_number: number
  quote_prefix: string
  next_quote_number: number
  default_payment_terms: number // days
  default_tax_rate: number
  footer_text?: string
  is_small_business: boolean // Kleinunternehmer
}

// Dashboard Stats
export interface DashboardStats {
  total_revenue_month: number
  total_revenue_year: number
  open_invoices_count: number
  open_invoices_amount: number
  overdue_invoices_count: number
  overdue_invoices_amount: number
  paid_invoices_month: number
  quotes_pending: number
}
