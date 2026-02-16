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
  ArrowRight
} from 'lucide-react'

// Demo data - will be replaced with Supabase
const demoStats = {
  revenue_month: 12450.00,
  revenue_last_month: 10200.00,
  open_invoices: 5,
  open_amount: 8750.00,
  overdue_invoices: 2,
  overdue_amount: 3200.00,
  quotes_pending: 3,
}

const recentInvoices = [
  { id: '1', number: 'RE-2026-001', customer: 'Müller GmbH', amount: 2500, status: 'paid', date: '2026-02-15' },
  { id: '2', number: 'RE-2026-002', customer: 'Schmidt AG', amount: 1800, status: 'sent', date: '2026-02-14' },
  { id: '3', number: 'RE-2026-003', customer: 'Weber KG', amount: 3200, status: 'overdue', date: '2026-02-01' },
  { id: '4', number: 'RE-2026-004', customer: 'Fischer e.K.', amount: 950, status: 'draft', date: '2026-02-16' },
]

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
  const percentChange = ((demoStats.revenue_month - demoStats.revenue_last_month) / demoStats.revenue_last_month * 100).toFixed(1)
  const isPositive = Number(percentChange) >= 0

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
              {demoStats.revenue_month.toLocaleString('de-DE')}
            </span>
            <span className="text-slate-500">€</span>
          </div>
        </div>

        {/* Open Invoices */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
          <div className="flex items-center justify-between mb-4">
            <span className="text-slate-500 text-sm">Offene Rechnungen</span>
            <Clock size={20} className="text-blue-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-slate-900">{demoStats.open_invoices}</span>
            <span className="text-slate-500">({demoStats.open_amount.toLocaleString('de-DE')} €)</span>
          </div>
        </div>

        {/* Overdue Invoices */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
          <div className="flex items-center justify-between mb-4">
            <span className="text-slate-500 text-sm">Überfällige Rechnungen</span>
            <AlertTriangle size={20} className="text-red-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-red-600">{demoStats.overdue_invoices}</span>
            <span className="text-red-400">({demoStats.overdue_amount.toLocaleString('de-DE')} €)</span>
          </div>
        </div>

        {/* Pending Quotes */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
          <div className="flex items-center justify-between mb-4">
            <span className="text-slate-500 text-sm">Offene Angebote</span>
            <FileText size={20} className="text-amber-500" />
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-3xl font-bold text-slate-900">{demoStats.quotes_pending}</span>
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
        <div className="divide-y divide-slate-100">
          {recentInvoices.map((invoice) => (
            <div key={invoice.id} className="p-4 hover:bg-slate-50 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center">
                  <FileText size={20} className="text-slate-500" />
                </div>
                <div>
                  <div className="font-medium text-slate-900">{invoice.number}</div>
                  <div className="text-sm text-slate-500">{invoice.customer}</div>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[invoice.status]}`}>
                  {statusLabels[invoice.status]}
                </span>
                <div className="text-right">
                  <div className="font-semibold text-slate-900">{invoice.amount.toLocaleString('de-DE')} €</div>
                  <div className="text-sm text-slate-500">{new Date(invoice.date).toLocaleDateString('de-DE')}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
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
