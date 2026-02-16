'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { 
  TrendingUp, 
  TrendingDown, 
  FileText, 
  Clock, 
  AlertTriangle,
  Euro,
  PlusCircle,
  ArrowRight,
  CheckCircle
} from 'lucide-react'
import { supabase } from '@/lib/supabase'

interface DashboardStats {
  revenue_month: number
  revenue_last_month: number
  open_invoices: number
  open_amount: number
  overdue_invoices: number
  overdue_amount: number
  quotes_pending: number
  paid_this_month: number
}

interface RecentInvoice {
  id: string
  invoice_number: string
  customer?: { company_name: string }
  total: number
  status: string
  issue_date: string
}

const statusColors: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-700',
  sent: 'bg-blue-100 text-blue-700',
  paid: 'bg-green-100 text-green-700',
  overdue: 'bg-red-100 text-red-700',
  cancelled: 'bg-gray-100 text-gray-500',
}

const statusLabels: Record<string, string> = {
  draft: 'Entwurf',
  sent: 'Versendet',
  paid: 'Bezahlt',
  overdue: 'Überfällig',
  cancelled: 'Storniert',
}

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    revenue_month: 0,
    revenue_last_month: 0,
    open_invoices: 0,
    open_amount: 0,
    overdue_invoices: 0,
    overdue_amount: 0,
    quotes_pending: 0,
    paid_this_month: 0
  })
  const [recentInvoices, setRecentInvoices] = useState<RecentInvoice[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  async function fetchDashboardData() {
    const now = new Date()
    const thisMonth = now.toISOString().slice(0, 7)
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString().slice(0, 7)
    const today = now.toISOString().split('T')[0]

    // Fetch all invoices
    const { data: invoices } = await supabase
      .from('invoices')
      .select('*, customer:customers(company_name)')
      .order('created_at', { ascending: false })

    // Fetch quotes
    const { data: quotes } = await supabase
      .from('quotes')
      .select('*')
      .eq('status', 'sent')

    if (invoices) {
      // Calculate stats
      const paidThisMonth = invoices.filter(i => 
        i.status === 'paid' && i.issue_date?.startsWith(thisMonth)
      )
      const paidLastMonth = invoices.filter(i => 
        i.status === 'paid' && i.issue_date?.startsWith(lastMonth)
      )
      const openInvoices = invoices.filter(i => i.status === 'sent')
      const overdueInvoices = invoices.filter(i => 
        i.status === 'sent' && new Date(i.due_date) < now
      )

      setStats({
        revenue_month: paidThisMonth.reduce((sum, i) => sum + i.total, 0),
        revenue_last_month: paidLastMonth.reduce((sum, i) => sum + i.total, 0),
        open_invoices: openInvoices.length,
        open_amount: openInvoices.reduce((sum, i) => sum + i.total, 0),
        overdue_invoices: overdueInvoices.length,
        overdue_amount: overdueInvoices.reduce((sum, i) => sum + i.total, 0),
        quotes_pending: quotes?.length || 0,
        paid_this_month: paidThisMonth.length
      })

      // Recent invoices with overdue check
      const recent = invoices.slice(0, 5).map(inv => ({
        ...inv,
        status: inv.status === 'sent' && new Date(inv.due_date) < now ? 'overdue' : inv.status
      }))
      setRecentInvoices(recent)
    }

    setLoading(false)
  }

  const percentChange = stats.revenue_last_month > 0 
    ? ((stats.revenue_month - stats.revenue_last_month) / stats.revenue_last_month * 100).toFixed(1)
    : '0'
  const isPositive = Number(percentChange) >= 0

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500 mx-auto"></div>
        <p className="mt-2 text-slate-500">Lade Dashboard...</p>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
          <p className="text-slate-500">Willkommen zurück! Hier ist deine Übersicht.</p>
        </div>
        <Link 
          href="/rechnungen/neu"
          className="flex items-center gap-2 px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors"
        >
          <PlusCircle size={20} />
          Neue Rechnung
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Revenue This Month */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
          <div className="flex items-center justify-between mb-4">
            <span className="text-slate-500 text-sm">Umsatz diesen Monat</span>
            <div className={`flex items-center gap-1 text-sm ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
              {isPositive ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
              {percentChange}%
            </div>
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-3xl font-bold text-slate-900">
              {stats.revenue_month.toLocaleString('de-DE')}
            </span>
            <span className="text-slate-500">€</span>
          </div>
          <p className="text-xs text-slate-400 mt-2">{stats.paid_this_month} bezahlte Rechnungen</p>
        </div>

        {/* Open Invoices */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
          <div className="flex items-center justify-between mb-4">
            <span className="text-slate-500 text-sm">Offene Rechnungen</span>
            <Clock size={20} className="text-blue-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-slate-900">{stats.open_invoices}</span>
            <span className="text-slate-500">({stats.open_amount.toLocaleString('de-DE')} €)</span>
          </div>
        </div>

        {/* Overdue Invoices */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
          <div className="flex items-center justify-between mb-4">
            <span className="text-slate-500 text-sm">Überfällige Rechnungen</span>
            <AlertTriangle size={20} className="text-red-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-red-600">{stats.overdue_invoices}</span>
            <span className="text-red-400">({stats.overdue_amount.toLocaleString('de-DE')} €)</span>
          </div>
        </div>

        {/* Pending Quotes */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
          <div className="flex items-center justify-between mb-4">
            <span className="text-slate-500 text-sm">Offene Angebote</span>
            <FileText size={20} className="text-amber-500" />
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-3xl font-bold text-slate-900">{stats.quotes_pending}</span>
            <span className="text-slate-500">ausstehend</span>
          </div>
        </div>
      </div>

      {/* Recent Invoices */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200">
        <div className="p-6 border-b border-slate-200 flex justify-between items-center">
          <h2 className="text-lg font-semibold text-slate-900">Letzte Rechnungen</h2>
          <Link 
            href="/rechnungen" 
            className="text-green-600 hover:text-green-700 text-sm flex items-center gap-1"
          >
            Alle anzeigen <ArrowRight size={16} />
          </Link>
        </div>
        {recentInvoices.length === 0 ? (
          <div className="p-8 text-center text-slate-500">
            <FileText size={40} className="mx-auto mb-3 text-slate-300" />
            <p>Noch keine Rechnungen erstellt.</p>
            <Link href="/rechnungen/neu" className="text-green-600 hover:underline text-sm">
              Erste Rechnung erstellen →
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {recentInvoices.map((invoice) => (
              <Link 
                key={invoice.id} 
                href={`/rechnungen/${invoice.id}`}
                className="p-4 hover:bg-slate-50 flex items-center justify-between block"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center">
                    {invoice.status === 'paid' ? (
                      <CheckCircle size={20} className="text-green-500" />
                    ) : invoice.status === 'overdue' ? (
                      <AlertTriangle size={20} className="text-red-500" />
                    ) : (
                      <FileText size={20} className="text-slate-500" />
                    )}
                  </div>
                  <div>
                    <div className="font-medium text-slate-900">{invoice.invoice_number}</div>
                    <div className="text-sm text-slate-500">{invoice.customer?.company_name || 'Unbekannt'}</div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[invoice.status]}`}>
                    {statusLabels[invoice.status]}
                  </span>
                  <div className="text-right">
                    <div className="font-semibold text-slate-900">{invoice.total.toLocaleString('de-DE')} €</div>
                    <div className="text-sm text-slate-500">{new Date(invoice.issue_date).toLocaleDateString('de-DE')}</div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link href="/rechnungen/neu" className="bg-green-50 hover:bg-green-100 border border-green-200 rounded-xl p-6 transition-colors group">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-green-500 rounded-lg flex items-center justify-center group-hover:scale-105 transition-transform">
              <PlusCircle size={24} className="text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900">Neue Rechnung</h3>
              <p className="text-sm text-slate-500">Rechnung erstellen</p>
            </div>
          </div>
        </Link>

        <Link href="/angebote/neu" className="bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-xl p-6 transition-colors group">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center group-hover:scale-105 transition-transform">
              <FileText size={24} className="text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900">Neues Angebot</h3>
              <p className="text-sm text-slate-500">Angebot erstellen</p>
            </div>
          </div>
        </Link>

        <Link href="/kunden/neu" className="bg-purple-50 hover:bg-purple-100 border border-purple-200 rounded-xl p-6 transition-colors group">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-purple-500 rounded-lg flex items-center justify-center group-hover:scale-105 transition-transform">
              <Euro size={24} className="text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900">Neuer Kunde</h3>
              <p className="text-sm text-slate-500">Kunde anlegen</p>
            </div>
          </div>
        </Link>
      </div>
    </div>
  )
}
