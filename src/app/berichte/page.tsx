'use client'

import { useEffect, useState } from 'react'
import { TrendingUp, Euro, FileText, Users, Calendar } from 'lucide-react'
import { getInvoices, getCustomers, getQuotes } from '@/lib/database'
import { Invoice, Customer, Quote } from '@/types'

export default function BerichtePage() {
  const [loading, setLoading] = useState(true)
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [quotes, setQuotes] = useState<Quote[]>([])
  const [year, setYear] = useState(new Date().getFullYear())

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    try {
      setLoading(true)
      const [inv, cust, quot] = await Promise.all([
        getInvoices(),
        getCustomers(),
        getQuotes()
      ])
      setInvoices(inv)
      setCustomers(cust)
      setQuotes(quot)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  // Calculate statistics
  const yearInvoices = invoices.filter(i => new Date(i.issue_date).getFullYear() === year)
  const paidInvoices = yearInvoices.filter(i => i.status === 'paid')
  const totalRevenue = paidInvoices.reduce((sum, i) => sum + Number(i.total), 0)
  const totalTax = paidInvoices.reduce((sum, i) => sum + Number(i.tax_amount), 0)
  
  // Monthly breakdown
  const monthlyData = Array.from({ length: 12 }, (_, month) => {
    const monthInvoices = paidInvoices.filter(i => new Date(i.paid_date || i.issue_date).getMonth() === month)
    return {
      month: new Date(year, month).toLocaleDateString('de-DE', { month: 'long' }),
      revenue: monthInvoices.reduce((sum, i) => sum + Number(i.total), 0),
      count: monthInvoices.length,
    }
  })

  // Top customers
  const customerRevenue = customers.map(c => {
    const custInvoices = paidInvoices.filter(i => i.customer_id === c.id)
    return {
      ...c,
      revenue: custInvoices.reduce((sum, i) => sum + Number(i.total), 0),
      invoiceCount: custInvoices.length,
    }
  }).filter(c => c.revenue > 0).sort((a, b) => b.revenue - a.revenue).slice(0, 5)

  // Quote conversion rate
  const yearQuotes = quotes.filter(q => new Date(q.issue_date).getFullYear() === year)
  const acceptedQuotes = yearQuotes.filter(q => q.status === 'accepted')
  const conversionRate = yearQuotes.length > 0 ? (acceptedQuotes.length / yearQuotes.length * 100).toFixed(1) : '0'

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
      </div>
    )
  }

  const maxMonthlyRevenue = Math.max(...monthlyData.map(m => m.revenue), 1)

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Berichte</h1>
          <p className="text-slate-500">Umsatzübersicht und Statistiken</p>
        </div>
        <select
          value={year}
          onChange={(e) => setYear(Number(e.target.value))}
          className="px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-green-500"
        >
          {[2024, 2025, 2026, 2027].map(y => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-6 border border-slate-200">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <Euro size={20} className="text-green-600" />
            </div>
            <span className="text-sm text-slate-500">Jahresumsatz {year}</span>
          </div>
          <div className="text-2xl font-bold text-slate-900">
            {totalRevenue.toLocaleString('de-DE', { minimumFractionDigits: 2 })} €
          </div>
        </div>
        
        <div className="bg-white rounded-xl p-6 border border-slate-200">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <FileText size={20} className="text-blue-600" />
            </div>
            <span className="text-sm text-slate-500">Rechnungen {year}</span>
          </div>
          <div className="text-2xl font-bold text-slate-900">{yearInvoices.length}</div>
          <div className="text-sm text-slate-500">{paidInvoices.length} bezahlt</div>
        </div>
        
        <div className="bg-white rounded-xl p-6 border border-slate-200">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <TrendingUp size={20} className="text-purple-600" />
            </div>
            <span className="text-sm text-slate-500">MwSt. {year}</span>
          </div>
          <div className="text-2xl font-bold text-slate-900">
            {totalTax.toLocaleString('de-DE', { minimumFractionDigits: 2 })} €
          </div>
        </div>
        
        <div className="bg-white rounded-xl p-6 border border-slate-200">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
              <Users size={20} className="text-amber-600" />
            </div>
            <span className="text-sm text-slate-500">Angebotsquote</span>
          </div>
          <div className="text-2xl font-bold text-slate-900">{conversionRate}%</div>
          <div className="text-sm text-slate-500">{acceptedQuotes.length} von {yearQuotes.length} angenommen</div>
        </div>
      </div>

      {/* Monthly Chart */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-6">Monatlicher Umsatz {year}</h2>
        <div className="space-y-3">
          {monthlyData.map((month, index) => (
            <div key={index} className="flex items-center gap-4">
              <div className="w-20 text-sm text-slate-600">{month.month.slice(0, 3)}</div>
              <div className="flex-1">
                <div className="h-8 bg-slate-100 rounded-lg overflow-hidden">
                  <div 
                    className="h-full bg-green-500 rounded-lg transition-all duration-500 flex items-center justify-end pr-2"
                    style={{ width: `${(month.revenue / maxMonthlyRevenue) * 100}%`, minWidth: month.revenue > 0 ? '60px' : '0' }}
                  >
                    {month.revenue > 0 && (
                      <span className="text-xs text-white font-medium">
                        {month.revenue.toLocaleString('de-DE')} €
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div className="w-16 text-right text-sm text-slate-500">{month.count} RE</div>
            </div>
          ))}
        </div>
      </div>

      {/* Top Customers */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-6">Top Kunden {year}</h2>
        {customerRevenue.length === 0 ? (
          <p className="text-slate-500 text-center py-8">Noch keine Umsätze in {year}</p>
        ) : (
          <div className="space-y-4">
            {customerRevenue.map((customer, index) => (
              <div key={customer.id} className="flex items-center gap-4">
                <div className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center text-sm font-medium text-slate-600">
                  {index + 1}
                </div>
                <div className="flex-1">
                  <div className="font-medium text-slate-900">{customer.company_name}</div>
                  <div className="text-sm text-slate-500">{customer.invoiceCount} Rechnungen</div>
                </div>
                <div className="text-right">
                  <div className="font-semibold text-slate-900">
                    {customer.revenue.toLocaleString('de-DE', { minimumFractionDigits: 2 })} €
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Invoice Status Breakdown */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-6">Rechnungsstatus {year}</h2>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {[
            { status: 'draft', label: 'Entwurf', color: 'bg-gray-100 text-gray-700' },
            { status: 'sent', label: 'Versendet', color: 'bg-blue-100 text-blue-700' },
            { status: 'paid', label: 'Bezahlt', color: 'bg-green-100 text-green-700' },
            { status: 'overdue', label: 'Überfällig', color: 'bg-red-100 text-red-700' },
            { status: 'cancelled', label: 'Storniert', color: 'bg-gray-100 text-gray-500' },
          ].map(({ status, label, color }) => {
            const count = yearInvoices.filter(i => i.status === status).length
            const amount = yearInvoices.filter(i => i.status === status).reduce((sum, i) => sum + Number(i.total), 0)
            return (
              <div key={status} className={`rounded-lg p-4 ${color}`}>
                <div className="text-2xl font-bold">{count}</div>
                <div className="text-sm font-medium">{label}</div>
                <div className="text-xs mt-1 opacity-75">{amount.toLocaleString('de-DE')} €</div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
