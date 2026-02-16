'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import { 
  ArrowLeft, 
  Download, 
  Mail, 
  CheckCircle,
  Clock,
  FileText,
  Edit,
  Printer
} from 'lucide-react'
import { supabase } from '@/lib/supabase'

// Dynamic import for PDF (client-side only)
const PDFDownloadLink = dynamic(
  () => import('@react-pdf/renderer').then(mod => mod.PDFDownloadLink),
  { ssr: false, loading: () => <span>Lade PDF...</span> }
)

const InvoicePDF = dynamic(
  () => import('@/components/InvoicePDF'),
  { ssr: false }
)

interface InvoiceItem {
  id: string
  description: string
  quantity: number
  unit: string
  unit_price: number
  tax_rate: number
  total: number
}

interface Invoice {
  id: string
  invoice_number: string
  customer_id: string
  status: string
  issue_date: string
  due_date: string
  delivery_date?: string
  subtotal: number
  tax_amount: number
  total: number
  notes?: string
  payment_terms?: string
  paid_date?: string
}

interface Customer {
  company_name: string
  contact_person?: string
  email: string
  address: string
  zip_code: string
  city: string
  country: string
}

interface CompanySettings {
  company_name: string
  owner_name?: string
  address: string
  zip_code: string
  city: string
  email: string
  phone?: string
  tax_id?: string
  vat_id?: string
  bank_name?: string
  iban?: string
  bic?: string
  is_small_business?: boolean
}

const statusConfig: Record<string, { label: string; color: string }> = {
  draft: { label: 'Entwurf', color: 'bg-gray-100 text-gray-700' },
  sent: { label: 'Versendet', color: 'bg-blue-100 text-blue-700' },
  paid: { label: 'Bezahlt', color: 'bg-green-100 text-green-700' },
  overdue: { label: 'Überfällig', color: 'bg-red-100 text-red-700' },
  cancelled: { label: 'Storniert', color: 'bg-gray-100 text-gray-500' },
}

export default function InvoiceDetailPage() {
  const router = useRouter()
  const params = useParams()
  const [loading, setLoading] = useState(true)
  const [invoice, setInvoice] = useState<Invoice | null>(null)
  const [items, setItems] = useState<InvoiceItem[]>([])
  const [customer, setCustomer] = useState<Customer | null>(null)
  const [company, setCompany] = useState<CompanySettings | null>(null)

  useEffect(() => {
    fetchInvoice()
  }, [params.id])

  async function fetchInvoice() {
    // Fetch invoice
    const { data: invoiceData, error: invoiceError } = await supabase
      .from('invoices')
      .select('*')
      .eq('id', params.id)
      .single()

    if (invoiceError || !invoiceData) {
      alert('Rechnung nicht gefunden')
      router.push('/rechnungen')
      return
    }

    setInvoice(invoiceData)

    // Fetch items
    const { data: itemsData } = await supabase
      .from('invoice_items')
      .select('*')
      .eq('invoice_id', params.id)
      .order('sort_order')
    
    setItems(itemsData || [])

    // Fetch customer
    const { data: customerData } = await supabase
      .from('customers')
      .select('*')
      .eq('id', invoiceData.customer_id)
      .single()
    
    setCustomer(customerData)

    // Fetch company settings
    const { data: companyData } = await supabase
      .from('company_settings')
      .select('*')
      .single()
    
    setCompany(companyData)

    setLoading(false)
  }

  async function markAsPaid() {
    if (!invoice) return

    const { error } = await supabase
      .from('invoices')
      .update({ status: 'paid', paid_date: new Date().toISOString().split('T')[0] })
      .eq('id', invoice.id)

    if (error) {
      alert('Fehler: ' + error.message)
    } else {
      setInvoice({ ...invoice, status: 'paid' })
    }
  }

  async function markAsSent() {
    if (!invoice) return

    const { error } = await supabase
      .from('invoices')
      .update({ status: 'sent' })
      .eq('id', invoice.id)

    if (error) {
      alert('Fehler: ' + error.message)
    } else {
      setInvoice({ ...invoice, status: 'sent' })
    }
  }

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500 mx-auto"></div>
        <p className="mt-2 text-slate-500">Lade Rechnung...</p>
      </div>
    )
  }

  if (!invoice || !customer || !company) {
    return null
  }

  const status = statusConfig[invoice.status] || statusConfig.draft

  // Check if overdue
  const isOverdue = invoice.status === 'sent' && new Date(invoice.due_date) < new Date()

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/rechnungen" className="p-2 hover:bg-slate-100 rounded-lg">
            <ArrowLeft size={20} />
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-slate-900">{invoice.invoice_number}</h1>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${isOverdue ? 'bg-red-100 text-red-700' : status.color}`}>
                {isOverdue ? 'Überfällig' : status.label}
              </span>
            </div>
            <p className="text-slate-500">{customer.company_name}</p>
          </div>
        </div>
        <div className="flex gap-2">
          {invoice.status === 'draft' && (
            <button
              onClick={markAsSent}
              className="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg"
            >
              <Mail size={18} />
              Als versendet markieren
            </button>
          )}
          {(invoice.status === 'sent' || isOverdue) && (
            <button
              onClick={markAsPaid}
              className="flex items-center gap-2 px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg"
            >
              <CheckCircle size={18} />
              Als bezahlt markieren
            </button>
          )}
          {company && customer && (
            <PDFDownloadLink
              document={
                <InvoicePDF
                  invoice={{ ...invoice, items }}
                  customer={customer}
                  company={company}
                />
              }
              fileName={`${invoice.invoice_number}.pdf`}
              className="flex items-center gap-2 px-4 py-2 border border-slate-200 hover:bg-slate-50 rounded-lg"
            >
              <Download size={18} />
              PDF herunterladen
            </PDFDownloadLink>
          )}
        </div>
      </div>

      {/* Invoice Preview */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8">
        {/* Header Section */}
        <div className="flex justify-between mb-10">
          <div>
            <h2 className="text-xl font-bold text-green-600 mb-2">{company.company_name}</h2>
            <div className="text-sm text-slate-500">
              {company.owner_name && <p>{company.owner_name}</p>}
              <p>{company.address}</p>
              <p>{company.zip_code} {company.city}</p>
              <p className="mt-2">{company.email}</p>
              {company.phone && <p>Tel: {company.phone}</p>}
            </div>
          </div>
          <div className="text-right">
            <h1 className="text-3xl font-bold text-slate-900 mb-2">RECHNUNG</h1>
            <p className="text-lg">Nr. {invoice.invoice_number}</p>
          </div>
        </div>

        {/* Customer & Dates */}
        <div className="flex justify-between mb-10">
          <div>
            <p className="text-xs text-slate-400 uppercase tracking-wide mb-2">Rechnungsempfänger</p>
            <h3 className="font-semibold text-slate-900">{customer.company_name}</h3>
            <div className="text-sm text-slate-600">
              {customer.contact_person && <p>{customer.contact_person}</p>}
              <p>{customer.address}</p>
              <p>{customer.zip_code} {customer.city}</p>
              <p>{customer.country}</p>
            </div>
          </div>
          <div className="text-right text-sm">
            <div className="flex justify-end gap-8 mb-1">
              <span className="text-slate-500">Rechnungsdatum:</span>
              <span>{new Date(invoice.issue_date).toLocaleDateString('de-DE')}</span>
            </div>
            <div className="flex justify-end gap-8 mb-1">
              <span className="text-slate-500">Fällig am:</span>
              <span className={isOverdue ? 'text-red-600 font-medium' : ''}>
                {new Date(invoice.due_date).toLocaleDateString('de-DE')}
              </span>
            </div>
            {invoice.delivery_date && (
              <div className="flex justify-end gap-8">
                <span className="text-slate-500">Lieferdatum:</span>
                <span>{new Date(invoice.delivery_date).toLocaleDateString('de-DE')}</span>
              </div>
            )}
          </div>
        </div>

        {/* Items Table */}
        <table className="w-full mb-8">
          <thead>
            <tr className="border-b-2 border-slate-200">
              <th className="text-left py-3 text-sm font-semibold text-slate-600">Pos.</th>
              <th className="text-left py-3 text-sm font-semibold text-slate-600">Beschreibung</th>
              <th className="text-right py-3 text-sm font-semibold text-slate-600">Menge</th>
              <th className="text-center py-3 text-sm font-semibold text-slate-600">Einheit</th>
              <th className="text-right py-3 text-sm font-semibold text-slate-600">Einzelpreis</th>
              <th className="text-right py-3 text-sm font-semibold text-slate-600">Gesamt</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, index) => (
              <tr key={item.id} className="border-b border-slate-100">
                <td className="py-3 text-sm text-slate-500">{index + 1}</td>
                <td className="py-3">{item.description}</td>
                <td className="py-3 text-right">{item.quantity}</td>
                <td className="py-3 text-center text-slate-500">{item.unit}</td>
                <td className="py-3 text-right">{item.unit_price.toLocaleString('de-DE', { minimumFractionDigits: 2 })} €</td>
                <td className="py-3 text-right font-medium">{item.total.toLocaleString('de-DE', { minimumFractionDigits: 2 })} €</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Totals */}
        <div className="flex justify-end">
          <div className="w-64">
            <div className="flex justify-between py-2 text-sm">
              <span className="text-slate-500">Zwischensumme:</span>
              <span>{invoice.subtotal.toLocaleString('de-DE', { minimumFractionDigits: 2 })} €</span>
            </div>
            {!company.is_small_business && invoice.tax_amount > 0 && (
              <div className="flex justify-between py-2 text-sm">
                <span className="text-slate-500">MwSt.:</span>
                <span>{invoice.tax_amount.toLocaleString('de-DE', { minimumFractionDigits: 2 })} €</span>
              </div>
            )}
            <div className="flex justify-between py-3 border-t-2 border-green-500 font-bold text-lg">
              <span>Gesamtbetrag:</span>
              <span className="text-green-600">{invoice.total.toLocaleString('de-DE', { minimumFractionDigits: 2 })} €</span>
            </div>
          </div>
        </div>

        {/* Small Business Note */}
        {company.is_small_business && (
          <p className="text-sm text-slate-500 italic mt-4">
            Gemäß § 19 UStG wird keine Umsatzsteuer berechnet.
          </p>
        )}

        {/* Payment Info */}
        <div className="mt-8 p-4 bg-slate-50 rounded-lg">
          <h4 className="font-semibold mb-2">Zahlungsinformationen</h4>
          <p className="text-sm text-slate-600">{invoice.payment_terms}</p>
          {company.bank_name && (
            <div className="text-sm text-slate-600 mt-2">
              <p>Bank: {company.bank_name}</p>
              {company.iban && <p>IBAN: {company.iban}</p>}
              {company.bic && <p>BIC: {company.bic}</p>}
            </div>
          )}
        </div>

        {/* Notes */}
        {invoice.notes && (
          <div className="mt-6">
            <h4 className="font-semibold mb-2">Bemerkungen</h4>
            <p className="text-sm text-slate-600">{invoice.notes}</p>
          </div>
        )}
      </div>
    </div>
  )
}
