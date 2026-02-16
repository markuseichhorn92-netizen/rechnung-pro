'use client'

import { useState } from 'react'
import Link from 'next/link'
import { 
  FileText, 
  PlusCircle, 
  Search, 
  Filter,
  MoreVertical,
  Download,
  Mail,
  Eye,
  Trash2
} from 'lucide-react'

// Demo data
const invoices = [
  { id: '1', number: 'RE-2026-001', customer: 'Müller GmbH', amount: 2500, status: 'paid', date: '2026-02-15', due: '2026-03-01' },
  { id: '2', number: 'RE-2026-002', customer: 'Schmidt AG', amount: 1800, status: 'sent', date: '2026-02-14', due: '2026-02-28' },
  { id: '3', number: 'RE-2026-003', customer: 'Weber KG', amount: 3200, status: 'overdue', date: '2026-02-01', due: '2026-02-15' },
  { id: '4', number: 'RE-2026-004', customer: 'Fischer e.K.', amount: 950, status: 'draft', date: '2026-02-16', due: '2026-03-02' },
  { id: '5', number: 'RE-2026-005', customer: 'Bauer & Co.', amount: 4200, status: 'paid', date: '2026-02-10', due: '2026-02-24' },
  { id: '6', number: 'RE-2026-006', customer: 'Hoffmann Ltd.', amount: 1650, status: 'sent', date: '2026-02-12', due: '2026-02-26' },
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

export default function InvoicesPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')

  const filteredInvoices = invoices.filter(inv => {
    const matchesSearch = inv.number.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         inv.customer.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesFilter = filterStatus === 'all' || inv.status === filterStatus
    return matchesSearch && matchesFilter
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Rechnungen</h1>
          <p className="text-slate-500">Verwalte deine Rechnungen</p>
        </div>
        <Link 
          href="/rechnungen/neu"
          className="flex items-center gap-2 px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors"
        >
          <PlusCircle size={20} />
          Neue Rechnung
        </Link>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200 flex flex-wrap gap-4 items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Suchen nach Nummer oder Kunde..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
          />
        </div>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 bg-white"
        >
          <option value="all">Alle Status</option>
          <option value="draft">Entwurf</option>
          <option value="sent">Versendet</option>
          <option value="paid">Bezahlt</option>
          <option value="overdue">Überfällig</option>
        </select>
      </div>

      {/* Invoice List */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <table className="w-full">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="text-left px-6 py-4 text-sm font-semibold text-slate-600">Rechnung</th>
              <th className="text-left px-6 py-4 text-sm font-semibold text-slate-600">Kunde</th>
              <th className="text-left px-6 py-4 text-sm font-semibold text-slate-600">Datum</th>
              <th className="text-left px-6 py-4 text-sm font-semibold text-slate-600">Fällig</th>
              <th className="text-left px-6 py-4 text-sm font-semibold text-slate-600">Status</th>
              <th className="text-right px-6 py-4 text-sm font-semibold text-slate-600">Betrag</th>
              <th className="px-6 py-4"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredInvoices.map((invoice) => (
              <tr key={invoice.id} className="hover:bg-slate-50">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center">
                      <FileText size={18} className="text-slate-500" />
                    </div>
                    <span className="font-medium text-slate-900">{invoice.number}</span>
                  </div>
                </td>
                <td className="px-6 py-4 text-slate-600">{invoice.customer}</td>
                <td className="px-6 py-4 text-slate-600">
                  {new Date(invoice.date).toLocaleDateString('de-DE')}
                </td>
                <td className="px-6 py-4 text-slate-600">
                  {new Date(invoice.due).toLocaleDateString('de-DE')}
                </td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[invoice.status]}`}>
                    {statusLabels[invoice.status]}
                  </span>
                </td>
                <td className="px-6 py-4 text-right font-semibold text-slate-900">
                  {invoice.amount.toLocaleString('de-DE')} €
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2 justify-end">
                    <button className="p-2 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-slate-700" title="Anzeigen">
                      <Eye size={18} />
                    </button>
                    <button className="p-2 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-slate-700" title="PDF">
                      <Download size={18} />
                    </button>
                    <button className="p-2 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-slate-700" title="Per E-Mail senden">
                      <Mail size={18} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
