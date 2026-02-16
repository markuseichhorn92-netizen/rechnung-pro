'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { 
  AlertTriangle, 
  FileText, 
  Mail,
  Clock,
  Euro
} from 'lucide-react'
import { supabase } from '@/lib/supabase'

interface OverdueInvoice {
  id: string
  invoice_number: string
  customer_id: string
  customer?: { company_name: string; email: string }
  due_date: string
  total: number
  days_overdue: number
}

export default function MahnungenPage() {
  const [overdueInvoices, setOverdueInvoices] = useState<OverdueInvoice[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchOverdueInvoices()
  }, [])

  async function fetchOverdueInvoices() {
    setLoading(true)
    const today = new Date().toISOString().split('T')[0]
    
    const { data, error } = await supabase
      .from('invoices')
      .select(`
        *,
        customer:customers(company_name, email)
      `)
      .eq('status', 'sent')
      .lt('due_date', today)
      .order('due_date', { ascending: true })

    if (error) {
      console.error('Error fetching overdue invoices:', error)
    } else {
      const invoicesWithDays = (data || []).map(inv => ({
        ...inv,
        days_overdue: Math.floor((new Date().getTime() - new Date(inv.due_date).getTime()) / (1000 * 60 * 60 * 24))
      }))
      setOverdueInvoices(invoicesWithDays)
    }
    setLoading(false)
  }

  async function markAsPaid(id: string) {
    const { error } = await supabase
      .from('invoices')
      .update({ status: 'paid', paid_date: new Date().toISOString().split('T')[0] })
      .eq('id', id)

    if (error) {
      alert('Fehler: ' + error.message)
    } else {
      setOverdueInvoices(overdueInvoices.filter(inv => inv.id !== id))
    }
  }

  const totalOverdue = overdueInvoices.reduce((sum, inv) => sum + inv.total, 0)

  // Group by severity
  const mild = overdueInvoices.filter(inv => inv.days_overdue <= 14)
  const moderate = overdueInvoices.filter(inv => inv.days_overdue > 14 && inv.days_overdue <= 30)
  const severe = overdueInvoices.filter(inv => inv.days_overdue > 30)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Mahnungen</h1>
        <p className="text-slate-500">Überfällige Rechnungen verwalten</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-4 border border-slate-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
              <AlertTriangle size={20} className="text-red-600" />
            </div>
            <div>
              <div className="text-sm text-slate-500">Überfällig</div>
              <div className="text-2xl font-bold text-red-600">{overdueInvoices.length}</div>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl p-4 border border-slate-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
              <Euro size={20} className="text-amber-600" />
            </div>
            <div>
              <div className="text-sm text-slate-500">Offener Betrag</div>
              <div className="text-2xl font-bold text-slate-900">
                {totalOverdue.toLocaleString('de-DE')} €
              </div>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl p-4 border border-slate-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
              <Clock size={20} className="text-yellow-600" />
            </div>
            <div>
              <div className="text-sm text-slate-500">1-14 Tage</div>
              <div className="text-2xl font-bold text-yellow-600">{mild.length}</div>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl p-4 border border-slate-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
              <AlertTriangle size={20} className="text-red-600" />
            </div>
            <div>
              <div className="text-sm text-slate-500">&gt;30 Tage</div>
              <div className="text-2xl font-bold text-red-600">{severe.length}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Overdue List */}
      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500 mx-auto"></div>
          <p className="mt-2 text-slate-500">Lade überfällige Rechnungen...</p>
        </div>
      ) : overdueInvoices.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-slate-200">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <FileText size={32} className="text-green-600" />
          </div>
          <h3 className="text-lg font-medium text-slate-900 mb-2">Keine überfälligen Rechnungen! 🎉</h3>
          <p className="text-slate-500">Alle Rechnungen wurden rechtzeitig bezahlt.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Severe (>30 days) */}
          {severe.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold text-red-600 mb-3 flex items-center gap-2">
                <AlertTriangle size={20} />
                Kritisch überfällig (&gt;30 Tage)
              </h2>
              <div className="bg-white rounded-xl shadow-sm border border-red-200 overflow-hidden">
                {severe.map((invoice) => (
                  <InvoiceRow 
                    key={invoice.id} 
                    invoice={invoice} 
                    onMarkPaid={() => markAsPaid(invoice.id)}
                    severity="severe"
                  />
                ))}
              </div>
            </div>
          )}

          {/* Moderate (15-30 days) */}
          {moderate.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold text-amber-600 mb-3 flex items-center gap-2">
                <Clock size={20} />
                1. Mahnung fällig (15-30 Tage)
              </h2>
              <div className="bg-white rounded-xl shadow-sm border border-amber-200 overflow-hidden">
                {moderate.map((invoice) => (
                  <InvoiceRow 
                    key={invoice.id} 
                    invoice={invoice} 
                    onMarkPaid={() => markAsPaid(invoice.id)}
                    severity="moderate"
                  />
                ))}
              </div>
            </div>
          )}

          {/* Mild (1-14 days) */}
          {mild.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold text-yellow-600 mb-3 flex items-center gap-2">
                <Clock size={20} />
                Zahlungserinnerung (1-14 Tage)
              </h2>
              <div className="bg-white rounded-xl shadow-sm border border-yellow-200 overflow-hidden">
                {mild.map((invoice) => (
                  <InvoiceRow 
                    key={invoice.id} 
                    invoice={invoice} 
                    onMarkPaid={() => markAsPaid(invoice.id)}
                    severity="mild"
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function InvoiceRow({ 
  invoice, 
  onMarkPaid, 
  severity 
}: { 
  invoice: OverdueInvoice
  onMarkPaid: () => void
  severity: 'mild' | 'moderate' | 'severe'
}) {
  const bgColors = {
    mild: 'hover:bg-yellow-50',
    moderate: 'hover:bg-amber-50',
    severe: 'hover:bg-red-50'
  }

  return (
    <div className={`p-4 border-b border-slate-100 last:border-b-0 ${bgColors[severity]} flex items-center justify-between`}>
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center">
          <FileText size={20} className="text-slate-500" />
        </div>
        <div>
          <Link href={`/rechnungen/${invoice.id}`} className="font-medium text-slate-900 hover:text-green-600">
            {invoice.invoice_number}
          </Link>
          <div className="text-sm text-slate-500">{invoice.customer?.company_name}</div>
        </div>
      </div>
      
      <div className="flex items-center gap-6">
        <div className="text-right">
          <div className="font-semibold">{invoice.total.toLocaleString('de-DE', { minimumFractionDigits: 2 })} €</div>
          <div className="text-sm text-red-500">{invoice.days_overdue} Tage überfällig</div>
        </div>
        
        <div className="flex gap-2">
          <button className="p-2 hover:bg-blue-100 rounded-lg text-blue-600" title="Mahnung senden">
            <Mail size={18} />
          </button>
          <button 
            onClick={onMarkPaid}
            className="px-3 py-1 bg-green-100 text-green-700 text-sm rounded-lg hover:bg-green-200"
          >
            Bezahlt
          </button>
        </div>
      </div>
    </div>
  )
}
