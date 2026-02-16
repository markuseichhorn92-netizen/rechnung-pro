'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { 
  Plus, 
  Search, 
  FileText,
  MoreVertical,
  Trash2,
  Edit,
  Download,
  Mail,
  CheckCircle,
  Clock,
  XCircle,
  AlertTriangle
} from 'lucide-react'
import { supabase } from '@/lib/supabase'

interface Invoice {
  id: string
  invoice_number: string
  customer_id: string
  customer?: { company_name: string }
  status: string
  issue_date: string
  due_date: string
  total: number
}

const statusConfig: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  draft: { label: 'Entwurf', color: 'bg-gray-100 text-gray-700', icon: <FileText size={14} /> },
  sent: { label: 'Versendet', color: 'bg-blue-100 text-blue-700', icon: <Clock size={14} /> },
  paid: { label: 'Bezahlt', color: 'bg-green-100 text-green-700', icon: <CheckCircle size={14} /> },
  overdue: { label: 'Überfällig', color: 'bg-red-100 text-red-700', icon: <AlertTriangle size={14} /> },
  cancelled: { label: 'Storniert', color: 'bg-gray-100 text-gray-500', icon: <XCircle size={14} /> },
}

export default function RechnungenPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [openMenu, setOpenMenu] = useState<string | null>(null)

  useEffect(() => {
    fetchInvoices()
  }, [])

  async function fetchInvoices() {
    setLoading(true)
    const { data, error } = await supabase
      .from('invoices')
      .select(`
        *,
        customer:customers(company_name)
      `)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching invoices:', error)
    } else {
      // Check for overdue invoices
      const today = new Date()
      const updatedInvoices = (data || []).map(inv => {
        if (inv.status === 'sent' && new Date(inv.due_date) < today) {
          return { ...inv, status: 'overdue' }
        }
        return inv
      })
      setInvoices(updatedInvoices)
    }
    setLoading(false)
  }

  async function deleteInvoice(id: string) {
    if (!confirm('Möchtest du diese Rechnung wirklich löschen?')) return

    const { error } = await supabase
      .from('invoices')
      .delete()
      .eq('id', id)

    if (error) {
      alert('Fehler beim Löschen: ' + error.message)
    } else {
      setInvoices(invoices.filter(i => i.id !== id))
    }
    setOpenMenu(null)
  }

  async function markAsPaid(id: string) {
    const { error } = await supabase
      .from('invoices')
      .update({ status: 'paid', paid_date: new Date().toISOString().split('T')[0] })
      .eq('id', id)

    if (error) {
      alert('Fehler: ' + error.message)
    } else {
      setInvoices(invoices.map(inv => 
        inv.id === id ? { ...inv, status: 'paid' } : inv
      ))
    }
    setOpenMenu(null)
  }

  const filteredInvoices = invoices.filter(invoice => {
    const matchesSearch = 
      invoice.invoice_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoice.customer?.company_name?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = statusFilter === 'all' || invoice.status === statusFilter
    
    return matchesSearch && matchesStatus
  })

  // Stats
  const stats = {
    total: invoices.length,
    open: invoices.filter(i => i.status === 'sent').length,
    overdue: invoices.filter(i => i.status === 'overdue').length,
    paid: invoices.filter(i => i.status === 'paid').length,
    openAmount: invoices.filter(i => ['sent', 'overdue'].includes(i.status)).reduce((sum, i) => sum + i.total, 0)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Rechnungen</h1>
          <p className="text-slate-500">{invoices.length} Rechnungen insgesamt</p>
        </div>
        <Link 
          href="/rechnungen/neu"
          className="flex items-center gap-2 px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors"
        >
          <Plus size={20} />
          Neue Rechnung
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-white rounded-xl p-4 border border-slate-200">
          <div className="text-sm text-slate-500">Gesamt</div>
          <div className="text-2xl font-bold text-slate-900">{stats.total}</div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-slate-200">
          <div className="text-sm text-slate-500">Offen</div>
          <div className="text-2xl font-bold text-blue-600">{stats.open}</div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-slate-200">
          <div className="text-sm text-slate-500">Überfällig</div>
          <div className="text-2xl font-bold text-red-600">{stats.overdue}</div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-slate-200">
          <div className="text-sm text-slate-500">Bezahlt</div>
          <div className="text-2xl font-bold text-green-600">{stats.paid}</div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-slate-200">
          <div className="text-sm text-slate-500">Offener Betrag</div>
          <div className="text-2xl font-bold text-slate-900">
            {stats.openAmount.toLocaleString('de-DE')} €
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
          <input
            type="text"
            placeholder="Rechnungen suchen..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
        >
          <option value="all">Alle Status</option>
          <option value="draft">Entwurf</option>
          <option value="sent">Versendet</option>
          <option value="paid">Bezahlt</option>
          <option value="overdue">Überfällig</option>
          <option value="cancelled">Storniert</option>
        </select>
      </div>

      {/* Invoices List */}
      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500 mx-auto"></div>
          <p className="mt-2 text-slate-500">Lade Rechnungen...</p>
        </div>
      ) : filteredInvoices.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-slate-200">
          <FileText size={48} className="mx-auto text-slate-300 mb-4" />
          <h3 className="text-lg font-medium text-slate-900 mb-2">Keine Rechnungen gefunden</h3>
          <p className="text-slate-500 mb-4">
            {searchTerm || statusFilter !== 'all' 
              ? 'Versuche andere Filteroptionen.' 
              : 'Erstelle deine erste Rechnung.'}
          </p>
          {!searchTerm && statusFilter === 'all' && (
            <Link 
              href="/rechnungen/neu"
              className="inline-flex items-center gap-2 px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg"
            >
              <Plus size={18} />
              Rechnung erstellen
            </Link>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left p-4 font-medium text-slate-600">Rechnung</th>
                <th className="text-left p-4 font-medium text-slate-600">Kunde</th>
                <th className="text-left p-4 font-medium text-slate-600">Status</th>
                <th className="text-left p-4 font-medium text-slate-600">Fällig am</th>
                <th className="text-right p-4 font-medium text-slate-600">Betrag</th>
                <th className="w-12 p-4"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredInvoices.map((invoice) => {
                const status = statusConfig[invoice.status] || statusConfig.draft
                
                return (
                  <tr key={invoice.id} className="hover:bg-slate-50">
                    <td className="p-4">
                      <div className="font-medium text-slate-900">{invoice.invoice_number}</div>
                      <div className="text-sm text-slate-500">
                        {new Date(invoice.issue_date).toLocaleDateString('de-DE')}
                      </div>
                    </td>
                    <td className="p-4 text-slate-600">
                      {invoice.customer?.company_name || '-'}
                    </td>
                    <td className="p-4">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${status.color}`}>
                        {status.icon}
                        {status.label}
                      </span>
                    </td>
                    <td className="p-4 text-slate-600">
                      {new Date(invoice.due_date).toLocaleDateString('de-DE')}
                    </td>
                    <td className="p-4 text-right font-medium">
                      {invoice.total.toLocaleString('de-DE', { minimumFractionDigits: 2 })} €
                    </td>
                    <td className="p-4 relative">
                      <button 
                        onClick={() => setOpenMenu(openMenu === invoice.id ? null : invoice.id)}
                        className="p-2 hover:bg-slate-100 rounded-lg"
                      >
                        <MoreVertical size={18} className="text-slate-400" />
                      </button>
                      
                      {openMenu === invoice.id && (
                        <div className="absolute right-4 top-full mt-1 bg-white rounded-lg shadow-lg border border-slate-200 py-1 z-10 min-w-[180px]">
                          <Link 
                            href={`/rechnungen/${invoice.id}`}
                            className="flex items-center gap-2 px-4 py-2 hover:bg-slate-50 text-sm"
                          >
                            <Edit size={16} />
                            Bearbeiten
                          </Link>
                          <button className="flex items-center gap-2 px-4 py-2 hover:bg-slate-50 text-sm w-full">
                            <Download size={16} />
                            PDF herunterladen
                          </button>
                          <button className="flex items-center gap-2 px-4 py-2 hover:bg-slate-50 text-sm w-full">
                            <Mail size={16} />
                            Per E-Mail senden
                          </button>
                          {invoice.status !== 'paid' && (
                            <button 
                              onClick={() => markAsPaid(invoice.id)}
                              className="flex items-center gap-2 px-4 py-2 hover:bg-green-50 text-green-600 text-sm w-full"
                            >
                              <CheckCircle size={16} />
                              Als bezahlt markieren
                            </button>
                          )}
                          <button 
                            onClick={() => deleteInvoice(invoice.id)}
                            className="flex items-center gap-2 px-4 py-2 hover:bg-red-50 text-red-600 text-sm w-full"
                          >
                            <Trash2 size={16} />
                            Löschen
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
