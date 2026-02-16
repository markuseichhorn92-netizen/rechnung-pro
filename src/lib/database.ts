import { supabase } from './supabase'
import { Customer, Product, Invoice, InvoiceItem, Quote, CompanySettings, Reminder } from '@/types'

// ============= CUSTOMERS =============

export async function getCustomers() {
  const { data, error } = await supabase
    .from('customers')
    .select('*')
    .order('company_name')
  if (error) throw error
  return data as Customer[]
}

export async function getCustomer(id: string) {
  const { data, error } = await supabase
    .from('customers')
    .select('*')
    .eq('id', id)
    .single()
  if (error) throw error
  return data as Customer
}

export async function createCustomer(customer: Partial<Customer>) {
  const { data, error } = await supabase
    .from('customers')
    .insert([customer])
    .select()
    .single()
  if (error) throw error
  return data as Customer
}

export async function updateCustomer(id: string, customer: Partial<Customer>) {
  const { data, error } = await supabase
    .from('customers')
    .update({ ...customer, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data as Customer
}

export async function deleteCustomer(id: string) {
  const { error } = await supabase
    .from('customers')
    .delete()
    .eq('id', id)
  if (error) throw error
}

// ============= PRODUCTS =============

export async function getProducts() {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('is_active', true)
    .order('name')
  if (error) throw error
  return data as Product[]
}

export async function getProduct(id: string) {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('id', id)
    .single()
  if (error) throw error
  return data as Product
}

export async function createProduct(product: Partial<Product>) {
  const { data, error } = await supabase
    .from('products')
    .insert([product])
    .select()
    .single()
  if (error) throw error
  return data as Product
}

export async function updateProduct(id: string, product: Partial<Product>) {
  const { data, error } = await supabase
    .from('products')
    .update({ ...product, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data as Product
}

export async function deleteProduct(id: string) {
  const { error } = await supabase
    .from('products')
    .update({ is_active: false })
    .eq('id', id)
  if (error) throw error
}

// ============= INVOICES =============

export async function getInvoices() {
  const { data, error } = await supabase
    .from('invoices')
    .select(`
      *,
      customer:customers(*)
    `)
    .order('issue_date', { ascending: false })
  if (error) throw error
  return data as (Invoice & { customer: Customer })[]
}

export async function getInvoice(id: string) {
  const { data, error } = await supabase
    .from('invoices')
    .select(`
      *,
      customer:customers(*)
    `)
    .eq('id', id)
    .single()
  if (error) throw error
  
  // Get items
  const { data: items, error: itemsError } = await supabase
    .from('invoice_items')
    .select('*')
    .eq('invoice_id', id)
    .order('position')
  if (itemsError) throw itemsError
  
  return { ...data, items } as Invoice
}

export async function createInvoice(invoice: Partial<Invoice>, items: Partial<InvoiceItem>[]) {
  // Get next invoice number
  const settings = await getCompanySettings()
  const invoiceNumber = `${settings.invoice_prefix}${new Date().getFullYear()}-${String(settings.next_invoice_number).padStart(3, '0')}`
  
  // Create invoice
  const { data, error } = await supabase
    .from('invoices')
    .insert([{ ...invoice, invoice_number: invoiceNumber }])
    .select()
    .single()
  if (error) throw error
  
  // Create items
  if (items.length > 0) {
    const invoiceItems = items.map((item, index) => ({
      ...item,
      invoice_id: data.id,
      position: index,
    }))
    const { error: itemsError } = await supabase
      .from('invoice_items')
      .insert(invoiceItems)
    if (itemsError) throw itemsError
  }
  
  // Increment invoice number
  await supabase
    .from('company_settings')
    .update({ next_invoice_number: settings.next_invoice_number + 1 })
    .eq('id', settings.id)
  
  return data as Invoice
}

export async function updateInvoice(id: string, invoice: Partial<Invoice>, items?: Partial<InvoiceItem>[]) {
  const { data, error } = await supabase
    .from('invoices')
    .update({ ...invoice, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  
  if (items) {
    // Delete existing items
    await supabase.from('invoice_items').delete().eq('invoice_id', id)
    
    // Create new items
    if (items.length > 0) {
      const invoiceItems = items.map((item, index) => ({
        ...item,
        invoice_id: id,
        position: index,
      }))
      const { error: itemsError } = await supabase
        .from('invoice_items')
        .insert(invoiceItems)
      if (itemsError) throw itemsError
    }
  }
  
  return data as Invoice
}

export async function updateInvoiceStatus(id: string, status: Invoice['status'], paidDate?: string) {
  const updates: Record<string, unknown> = { status, updated_at: new Date().toISOString() }
  if (paidDate) updates.paid_date = paidDate
  
  const { data, error } = await supabase
    .from('invoices')
    .update(updates)
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data as Invoice
}

export async function deleteInvoice(id: string) {
  const { error } = await supabase
    .from('invoices')
    .delete()
    .eq('id', id)
  if (error) throw error
}

// ============= QUOTES =============

export async function getQuotes() {
  const { data, error } = await supabase
    .from('quotes')
    .select(`
      *,
      customer:customers(*)
    `)
    .order('issue_date', { ascending: false })
  if (error) throw error
  return data as (Quote & { customer: Customer })[]
}

export async function getQuote(id: string) {
  const { data, error } = await supabase
    .from('quotes')
    .select(`
      *,
      customer:customers(*)
    `)
    .eq('id', id)
    .single()
  if (error) throw error
  
  // Get items
  const { data: items, error: itemsError } = await supabase
    .from('quote_items')
    .select('*')
    .eq('quote_id', id)
    .order('position')
  if (itemsError) throw itemsError
  
  return { ...data, items } as Quote
}

export async function createQuote(quote: Partial<Quote>, items: Partial<InvoiceItem>[]) {
  const settings = await getCompanySettings()
  const quoteNumber = `${settings.quote_prefix}${new Date().getFullYear()}-${String(settings.next_quote_number).padStart(3, '0')}`
  
  const { data, error } = await supabase
    .from('quotes')
    .insert([{ ...quote, quote_number: quoteNumber }])
    .select()
    .single()
  if (error) throw error
  
  if (items.length > 0) {
    const quoteItems = items.map((item, index) => ({
      ...item,
      quote_id: data.id,
      position: index,
    }))
    const { error: itemsError } = await supabase
      .from('quote_items')
      .insert(quoteItems)
    if (itemsError) throw itemsError
  }
  
  await supabase
    .from('company_settings')
    .update({ next_quote_number: settings.next_quote_number + 1 })
    .eq('id', settings.id)
  
  return data as Quote
}

export async function updateQuote(id: string, quote: Partial<Quote>, items?: Partial<InvoiceItem>[]) {
  const { data, error } = await supabase
    .from('quotes')
    .update({ ...quote, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  
  if (items) {
    await supabase.from('quote_items').delete().eq('quote_id', id)
    
    if (items.length > 0) {
      const quoteItems = items.map((item, index) => ({
        ...item,
        quote_id: id,
        position: index,
      }))
      const { error: itemsError } = await supabase
        .from('quote_items')
        .insert(quoteItems)
      if (itemsError) throw itemsError
    }
  }
  
  return data as Quote
}

export async function updateQuoteStatus(id: string, status: Quote['status']) {
  const { data, error } = await supabase
    .from('quotes')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data as Quote
}

export async function convertQuoteToInvoice(quoteId: string) {
  const quote = await getQuote(quoteId)
  
  // Create invoice from quote
  const invoiceData = {
    customer_id: quote.customer_id,
    status: 'draft' as const,
    issue_date: new Date().toISOString().split('T')[0],
    due_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    subtotal: quote.subtotal,
    tax_amount: quote.tax_amount,
    total: quote.total,
    notes: quote.notes,
  }
  
  const items = quote.items.map(item => ({
    description: item.description,
    quantity: item.quantity,
    unit: item.unit,
    unit_price: item.unit_price,
    tax_rate: item.tax_rate,
    total: item.total,
  }))
  
  const invoice = await createInvoice(invoiceData, items)
  
  // Update quote status
  await supabase
    .from('quotes')
    .update({ 
      status: 'accepted', 
      converted_to_invoice_id: invoice.id,
      updated_at: new Date().toISOString()
    })
    .eq('id', quoteId)
  
  return invoice
}

export async function deleteQuote(id: string) {
  const { error } = await supabase
    .from('quotes')
    .delete()
    .eq('id', id)
  if (error) throw error
}

// ============= REMINDERS =============

export async function getReminders() {
  const { data, error } = await supabase
    .from('reminders')
    .select(`
      *,
      invoice:invoices(*, customer:customers(*))
    `)
    .order('sent_date', { ascending: false })
  if (error) throw error
  return data as (Reminder & { invoice: Invoice & { customer: Customer } })[]
}

export async function getOverdueInvoices() {
  const today = new Date().toISOString().split('T')[0]
  const { data, error } = await supabase
    .from('invoices')
    .select(`
      *,
      customer:customers(*)
    `)
    .in('status', ['sent', 'overdue'])
    .lt('due_date', today)
    .order('due_date')
  if (error) throw error
  return data as (Invoice & { customer: Customer })[]
}

export async function createReminder(reminder: Partial<Reminder>) {
  const { data, error } = await supabase
    .from('reminders')
    .insert([reminder])
    .select()
    .single()
  if (error) throw error
  
  // Update invoice status to overdue
  await supabase
    .from('invoices')
    .update({ status: 'overdue' })
    .eq('id', reminder.invoice_id)
  
  return data as Reminder
}

export async function getRemindersByInvoice(invoiceId: string) {
  const { data, error } = await supabase
    .from('reminders')
    .select('*')
    .eq('invoice_id', invoiceId)
    .order('level')
  if (error) throw error
  return data as Reminder[]
}

// ============= COMPANY SETTINGS =============

export async function getCompanySettings(): Promise<CompanySettings> {
  const { data, error } = await supabase
    .from('company_settings')
    .select('*')
    .limit(1)
    .single()
  
  if (error && error.code === 'PGRST116') {
    // No settings exist, create default
    const { data: newData, error: insertError } = await supabase
      .from('company_settings')
      .insert([{ company_name: 'Meine Firma' }])
      .select()
      .single()
    if (insertError) throw insertError
    return newData as CompanySettings
  }
  
  if (error) throw error
  return data as CompanySettings
}

export async function updateCompanySettings(settings: Partial<CompanySettings>) {
  const current = await getCompanySettings()
  
  // Only include fields that exist in the database
  const safeSettings: Record<string, unknown> = {}
  const allowedFields = [
    'company_name', 'owner_name', 'address', 'zip_code', 'city', 'country',
    'email', 'phone', 'website', 'tax_id', 'vat_id',
    'bank_name', 'iban', 'bic', 'logo_url',
    'invoice_prefix', 'next_invoice_number', 'quote_prefix', 'next_quote_number',
    'default_payment_terms', 'default_tax_rate', 'footer_text', 'is_small_business'
  ]
  
  for (const key of allowedFields) {
    if (key in settings && settings[key as keyof CompanySettings] !== undefined) {
      safeSettings[key] = settings[key as keyof CompanySettings]
    }
  }
  
  safeSettings.updated_at = new Date().toISOString()
  
  const { data, error } = await supabase
    .from('company_settings')
    .update(safeSettings)
    .eq('id', current.id)
    .select()
    .single()
  if (error) throw error
  return data as CompanySettings
}

// ============= DASHBOARD STATS =============

export async function getDashboardStats() {
  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]
  const startOfYear = new Date(now.getFullYear(), 0, 1).toISOString().split('T')[0]
  const today = now.toISOString().split('T')[0]
  
  // Revenue this month (paid invoices)
  const { data: monthlyPaid } = await supabase
    .from('invoices')
    .select('total')
    .eq('status', 'paid')
    .gte('paid_date', startOfMonth)
  
  const revenueMonth = monthlyPaid?.reduce((sum, inv) => sum + Number(inv.total), 0) || 0
  
  // Revenue this year
  const { data: yearlyPaid } = await supabase
    .from('invoices')
    .select('total')
    .eq('status', 'paid')
    .gte('paid_date', startOfYear)
  
  const revenueYear = yearlyPaid?.reduce((sum, inv) => sum + Number(inv.total), 0) || 0
  
  // Open invoices (sent, not paid)
  const { data: openInvoices } = await supabase
    .from('invoices')
    .select('total')
    .eq('status', 'sent')
  
  const openCount = openInvoices?.length || 0
  const openAmount = openInvoices?.reduce((sum, inv) => sum + Number(inv.total), 0) || 0
  
  // Overdue invoices
  const { data: overdueInvoices } = await supabase
    .from('invoices')
    .select('total')
    .in('status', ['sent', 'overdue'])
    .lt('due_date', today)
  
  const overdueCount = overdueInvoices?.length || 0
  const overdueAmount = overdueInvoices?.reduce((sum, inv) => sum + Number(inv.total), 0) || 0
  
  // Pending quotes
  const { data: pendingQuotes } = await supabase
    .from('quotes')
    .select('id')
    .in('status', ['draft', 'sent'])
  
  const quotesCount = pendingQuotes?.length || 0
  
  // Recent invoices
  const { data: recentInvoices } = await supabase
    .from('invoices')
    .select(`
      *,
      customer:customers(company_name)
    `)
    .order('issue_date', { ascending: false })
    .limit(5)
  
  return {
    revenue_month: revenueMonth,
    revenue_year: revenueYear,
    open_invoices: openCount,
    open_amount: openAmount,
    overdue_invoices: overdueCount,
    overdue_amount: overdueAmount,
    quotes_pending: quotesCount,
    recent_invoices: recentInvoices || [],
  }
}

// ============= LOGO UPLOAD =============

export async function uploadLogo(file: File): Promise<string> {
  const fileExt = file.name.split('.').pop()
  const fileName = `logo-${Date.now()}.${fileExt}`
  
  const { error } = await supabase.storage
    .from('logos')
    .upload(fileName, file, { upsert: true })
  
  if (error) throw error
  
  const { data } = supabase.storage.from('logos').getPublicUrl(fileName)
  return data.publicUrl
}
