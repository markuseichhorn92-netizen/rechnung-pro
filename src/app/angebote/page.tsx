'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { FileCheck, Plus, Search, Eye, MoreVertical, Send, CheckCircle, XCircle, FileText, Trash2 } from 'lucide-react'
import { getQuotes, deleteQuote, updateQuoteStatus, convertQuoteToInvoice } from '@/lib/database'
import { Quote, Customer } from '@/types'
import { useRouter } from 'next/navigation'

const statusColors: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-700',
  sent: 'bg-blue-100 text-blue-700',
  accepted: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-700',
  expired: 'bg-orange-100 text-orange-700',
}

const statusLabels: Record<string, string> = {
  draft: 'Entwurf',
  sent: 'Versendet',
  accepted: 'Angenommen',
  rejected: 'Abgelehnt',
  expired: 'Abgelaufen',
}

export default function AngebotePage() {
  const router = useRouter()
  const [quotes, setQuotes] = useState<(Quote & { customer: Customer })[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [menuOpen, setMenuOpen] = useState<string | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [converting, setConverting] = useState<string | null>(null)

  useEffect(() => {
    loadQuotes()
  }, [])

  async function loadQuotes() {
    try {
      setLoading(true)
      const data = await getQuotes()
      setQuotes(data)
    } catch (err) {
      setError('Fehler beim Laden der Angebote')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete(id: string) {
    try {
      await deleteQuote(id)
      setQuotes(quotes.filter(q => q.id !== id))
      setDeleteConfirm(null)
      setMenuOpen(null)
    } catch (err) {
      setError('Fehler beim Löschen')
      console.error(err)
    }
  }

  async function handleStatusChange(id: string, status: Quote['status']) {
    try {
      await updateQuoteStatus(id, status)
      setQuotes(quotes.map(q => q.id === id ? { ...q, status } : q))
      setMenuOpen(null)
    } catch (err) {
      setError('Fehler beim Aktualisieren')
      console.error(err)
    }
  }

  async function handleConvertToInvoice(id: string) {
    try {
      setConverting(id)
      const invoice = await convertQuoteToInvoice(id)
      router.push(`/rechnungen/${invoice.id}`)
    } catch (err) {
      setError('Fehler beim Umwandeln')
      console.error(err)
      setConverting(null)
    }
  }

  const filteredQuotes = quotes.filter(q => {
    const matchesSearch = 
      q.quote_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      q.customer?.company_name?.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = statusFilter === 'all' || q.status === statusFilter
    return matchesSearch && matchesStatus
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Angebote</h1>
          <p className="text-slate-500">{quotes.length} Angebote insgesamt</p>
        </div>
        <Link
          href="/angebote/neu"
          className="flex items-center gap-2 px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors"
        >
          <Plus size={20} />
          Neues Angebot
        </Link>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
          <input
            type="text"
            placeholder="Angebote suchen..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
        >
          <option value="all">Alle Status</option>
          <option value="draft">Entwurf</option>
          <option value="sent">Versendet</option>
          <option value="accepted">Angenommen</option>
          <option value="rejected">Abgelehnt</option>
          <option value="expired">Abgelaufen</option>
        </select>
      </div>

      {/* Quotes List */}
      {filteredQuotes.length === 0 ? (
        <div className="bg-white rounded-xl p-12 text-center border border-slate-200">
          <FileCheck size={48} className="mx-auto text-slate-300 mb-4" />
          <h3 className="text-lg font-medium text-slate-900 mb-2">Keine Angebote gefunden</h3>
          <p className="text-slate-500 mb-4">
            {searchQuery || statusFilter !== 'all' ? 'Versuche andere Filter.' : 'Erstelle dein erstes Angebot.'}
          </p>
          {!searchQuery && statusFilter === 'all' && (
            <Link
              href="/angebote/neu"
              className="inline-flex items-center gap-2 px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors"
            >
              <Plus size={20} />
              Angebot erstellen
            </Link>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="divide-y divide-slate-100">
            {filteredQuotes.map((quote) => (
              <div key={quote.id} className="p-4 hover:bg-slate-50 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <FileCheck size={24} className="text-blue-600" />
                  </div>
                  <div>
                    <div className="font-semibold text-slate-900">{quote.quote_number}</div>
                    <div className="text-sm text-slate-500">{quote.customer?.company_name || 'Unbekannt'}</div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[quote.status]}`}>
                    {statusLabels[quote.status]}
                  </span>
                  <div className="text-right">
                    <div className="font-semibold text-slate-900">
                      {Number(quote.total).toLocaleString('de-DE', { minimumFractionDigits: 2 })} €
                    </div>
                    <div className="text-sm text-slate-500">
                      Gültig bis: {new Date(quote.valid_until).toLocaleDateString('de-DE')}
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Link
                      href={`/angebote/${quote.id}`}
                      className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    >
                      <Eye size={18} />
                    </Link>
                    <div className="relative">
                      <button
                        onClick={() => setMenuOpen(menuOpen === quote.id ? null : quote.id)}
                        className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                      >
                        <MoreVertical size={18} />
                      </button>
                      {menuOpen === quote.id && (
                        <div className="absolute right-0 mt-1 w-56 bg-white rounded-lg shadow-lg border border-slate-200 py-1 z-10">
                          {quote.status === 'draft' && (
                            <button
                              onClick={() => handleStatusChange(quote.id, 'sent')}
                              className="w-full px-4 py-2 text-left text-sm hover:bg-slate-50 flex items-center gap-2"
                            >
                              <Send size={16} className="text-blue-500" />
                              Als versendet markieren
                            </button>
                          )}
                          {quote.status === 'sent' && (
                            <>
                              <button
                                onClick={() => handleStatusChange(quote.id, 'accepted')}
                                className="w-full px-4 py-2 text-left text-sm hover:bg-slate-50 flex items-center gap-2"
                              >
                                <CheckCircle size={16} className="text-green-500" />
                                Als angenommen markieren
                              </button>
                              <button
                                onClick={() => handleStatusChange(quote.id, 'rejected')}
                                className="w-full px-4 py-2 text-left text-sm hover:bg-slate-50 flex items-center gap-2"
                              >
                                <XCircle size={16} className="text-red-500" />
                                Als abgelehnt markieren
                              </button>
                            </>
                          )}
                          {(quote.status === 'sent' || quote.status === 'accepted') && !quote.converted_to_invoice_id && (
                            <button
                              onClick={() => handleConvertToInvoice(quote.id)}
                              disabled={converting === quote.id}
                              className="w-full px-4 py-2 text-left text-sm hover:bg-slate-50 flex items-center gap-2 text-green-600"
                            >
                              <FileText size={16} />
                              {converting === quote.id ? 'Wird umgewandelt...' : 'In Rechnung umwandeln'}
                            </button>
                          )}
                          {deleteConfirm === quote.id ? (
                            <div className="px-4 py-2 flex gap-2">
                              <button
                                onClick={() => handleDelete(quote.id)}
                                className="flex-1 px-2 py-1 bg-red-500 text-white text-xs rounded hover:bg-red-600"
                              >
                                Ja
                              </button>
                              <button
                                onClick={() => setDeleteConfirm(null)}
                                className="flex-1 px-2 py-1 bg-slate-200 text-slate-600 text-xs rounded hover:bg-slate-300"
                              >
                                Nein
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => setDeleteConfirm(quote.id)}
                              className="w-full px-4 py-2 text-left text-sm hover:bg-red-50 text-red-600 flex items-center gap-2"
                            >
                              <Trash2 size={16} />
                              Löschen
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
