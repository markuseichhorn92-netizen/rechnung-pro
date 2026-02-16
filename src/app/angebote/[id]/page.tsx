'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Send, CheckCircle, XCircle, FileText, Edit2 } from 'lucide-react'
import { getQuote, updateQuoteStatus, convertQuoteToInvoice, getCompanySettings } from '@/lib/database'
import { Quote, CompanySettings } from '@/types'

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

export default function AngebotDetailPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string
  
  const [quote, setQuote] = useState<Quote | null>(null)
  const [settings, setSettings] = useState<CompanySettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [converting, setConverting] = useState(false)

  useEffect(() => {
    loadData()
  }, [id])

  async function loadData() {
    try {
      setLoading(true)
      const [quoteData, settingsData] = await Promise.all([
        getQuote(id),
        getCompanySettings()
      ])
      setQuote(quoteData)
      setSettings(settingsData)
    } catch (err) {
      setError('Angebot nicht gefunden')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  async function handleStatusChange(status: Quote['status']) {
    try {
      await updateQuoteStatus(id, status)
      setQuote(prev => prev ? { ...prev, status } : null)
    } catch (err) {
      setError('Fehler beim Aktualisieren')
      console.error(err)
    }
  }

  async function handleConvertToInvoice() {
    try {
      setConverting(true)
      const invoice = await convertQuoteToInvoice(id)
      router.push(`/rechnungen/${invoice.id}`)
    } catch (err) {
      setError('Fehler beim Umwandeln')
      console.error(err)
      setConverting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
      </div>
    )
  }

  if (error || !quote) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
        {error || 'Angebot nicht gefunden'}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/angebote" className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">{quote.quote_number}</h1>
            <p className="text-slate-500">{quote.customer?.company_name}</p>
          </div>
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusColors[quote.status]}`}>
            {statusLabels[quote.status]}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {quote.status === 'draft' && (
            <button
              onClick={() => handleStatusChange('sent')}
              className="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
            >
              <Send size={18} />
              Als versendet markieren
            </button>
          )}
          {quote.status === 'sent' && (
            <>
              <button
                onClick={() => handleStatusChange('accepted')}
                className="flex items-center gap-2 px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors"
              >
                <CheckCircle size={18} />
                Angenommen
              </button>
              <button
                onClick={() => handleStatusChange('rejected')}
                className="flex items-center gap-2 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors"
              >
                <XCircle size={18} />
                Abgelehnt
              </button>
            </>
          )}
          {(quote.status === 'sent' || quote.status === 'accepted') && !quote.converted_to_invoice_id && (
            <button
              onClick={handleConvertToInvoice}
              disabled={converting}
              className="flex items-center gap-2 px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors disabled:opacity-50"
            >
              <FileText size={18} />
              {converting ? 'Wird umgewandelt...' : 'In Rechnung umwandeln'}
            </button>
          )}
          <Link
            href={`/angebote/${id}/bearbeiten`}
            className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors"
          >
            <Edit2 size={18} />
            Bearbeiten
          </Link>
        </div>
      </div>

      {quote.converted_to_invoice_id && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <p className="text-green-700">
            ✓ Dieses Angebot wurde in eine Rechnung umgewandelt.{' '}
            <Link href={`/rechnungen/${quote.converted_to_invoice_id}`} className="underline font-medium">
              Zur Rechnung →
            </Link>
          </p>
        </div>
      )}

      {/* Quote Preview */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8">
        {/* Header */}
        <div className="flex justify-between mb-8">
          <div>
            {settings?.logo_url && (
              <img src={settings.logo_url} alt="Logo" className="h-16 mb-4" />
            )}
            <h2 className="text-xl font-bold text-slate-900">{settings?.company_name}</h2>
            <p className="text-slate-500">{settings?.address}</p>
            <p className="text-slate-500">{settings?.zip_code} {settings?.city}</p>
          </div>
          <div className="text-right">
            <h3 className="text-3xl font-bold text-blue-600 mb-2">ANGEBOT</h3>
            <p className="text-slate-500">Nr. {quote.quote_number}</p>
            <p className="text-slate-500">Datum: {new Date(quote.issue_date).toLocaleDateString('de-DE')}</p>
            <p className="text-slate-500">Gültig bis: {new Date(quote.valid_until).toLocaleDateString('de-DE')}</p>
          </div>
        </div>

        {/* Customer */}
        <div className="mb-8">
          <h4 className="text-sm font-medium text-slate-500 mb-2">Angebot an</h4>
          <p className="font-semibold text-slate-900">{quote.customer?.company_name}</p>
          {quote.customer?.contact_person && (
            <p className="text-slate-600">{quote.customer.contact_person}</p>
          )}
          <p className="text-slate-600">{quote.customer?.address}</p>
          <p className="text-slate-600">{quote.customer?.zip_code} {quote.customer?.city}</p>
        </div>

        {/* Items Table */}
        <table className="w-full mb-8">
          <thead>
            <tr className="border-b-2 border-slate-200">
              <th className="text-left py-3 text-sm font-medium text-slate-500">Pos.</th>
              <th className="text-left py-3 text-sm font-medium text-slate-500">Beschreibung</th>
              <th className="text-right py-3 text-sm font-medium text-slate-500">Menge</th>
              <th className="text-right py-3 text-sm font-medium text-slate-500">Einzelpreis</th>
              <th className="text-right py-3 text-sm font-medium text-slate-500">MwSt.</th>
              <th className="text-right py-3 text-sm font-medium text-slate-500">Gesamt</th>
            </tr>
          </thead>
          <tbody>
            {quote.items?.map((item, index) => (
              <tr key={item.id} className="border-b border-slate-100">
                <td className="py-3 text-slate-500">{index + 1}</td>
                <td className="py-3 text-slate-900">{item.description}</td>
                <td className="py-3 text-right text-slate-600">{item.quantity} {item.unit}</td>
                <td className="py-3 text-right text-slate-600">
                  {Number(item.unit_price).toLocaleString('de-DE', { minimumFractionDigits: 2 })} €
                </td>
                <td className="py-3 text-right text-slate-600">{item.tax_rate}%</td>
                <td className="py-3 text-right font-medium text-slate-900">
                  {Number(item.total).toLocaleString('de-DE', { minimumFractionDigits: 2 })} €
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Totals */}
        <div className="flex justify-end">
          <div className="w-64 space-y-2">
            <div className="flex justify-between">
              <span className="text-slate-500">Netto</span>
              <span className="font-medium">{Number(quote.subtotal).toLocaleString('de-DE', { minimumFractionDigits: 2 })} €</span>
            </div>
            {!settings?.is_small_business && (
              <div className="flex justify-between">
                <span className="text-slate-500">MwSt.</span>
                <span className="font-medium">{Number(quote.tax_amount).toLocaleString('de-DE', { minimumFractionDigits: 2 })} €</span>
              </div>
            )}
            <div className="flex justify-between text-xl font-bold border-t pt-2">
              <span>Gesamt</span>
              <span>{Number(quote.total).toLocaleString('de-DE', { minimumFractionDigits: 2 })} €</span>
            </div>
          </div>
        </div>

        {/* Notes */}
        {quote.notes && (
          <div className="mt-8 pt-8 border-t border-slate-200">
            <h4 className="text-sm font-medium text-slate-500 mb-1">Anmerkungen</h4>
            <p className="text-slate-600">{quote.notes}</p>
          </div>
        )}

        {settings?.is_small_business && (
          <p className="text-sm text-slate-500 mt-4">
            Gemäß § 19 UStG wird keine Umsatzsteuer berechnet.
          </p>
        )}
      </div>
    </div>
  )
}
