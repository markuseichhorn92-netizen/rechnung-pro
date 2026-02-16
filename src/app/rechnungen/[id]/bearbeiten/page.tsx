'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { ArrowLeft, Save, Plus, Trash2 } from 'lucide-react'
import Link from 'next/link'
import { getInvoice, updateInvoice, getCustomers, getProducts, getCompanySettings } from '@/lib/database'
import { Customer, Product, InvoiceItem, CompanySettings } from '@/types'

interface LineItem {
  id: string
  product_id?: string
  description: string
  quantity: number
  unit: string
  unit_price: number
  tax_rate: number
}

export default function RechnungBearbeitenPage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string
  
  const [loading, setLoading] = useState(false)
  const [dataLoading, setDataLoading] = useState(true)
  const [error, setError] = useState('')
  
  const [customers, setCustomers] = useState<Customer[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [settings, setSettings] = useState<CompanySettings | null>(null)
  
  const [invoiceNumber, setInvoiceNumber] = useState('')
  const [customerId, setCustomerId] = useState('')
  const [status, setStatus] = useState<string>('draft')
  const [issueDate, setIssueDate] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [deliveryDate, setDeliveryDate] = useState('')
  const [notes, setNotes] = useState('')
  const [items, setItems] = useState<LineItem[]>([])

  useEffect(() => {
    loadData()
  }, [id])

  async function loadData() {
    try {
      setDataLoading(true)
      const [invoice, customersData, productsData, settingsData] = await Promise.all([
        getInvoice(id),
        getCustomers(),
        getProducts(),
        getCompanySettings()
      ])
      
      setCustomers(customersData)
      setProducts(productsData)
      setSettings(settingsData)
      
      setInvoiceNumber(invoice.invoice_number)
      setCustomerId(invoice.customer_id)
      setStatus(invoice.status)
      setIssueDate(invoice.issue_date)
      setDueDate(invoice.due_date || '')
      setDeliveryDate(invoice.delivery_date || '')
      setNotes(invoice.notes || '')
      
      setItems(invoice.items?.map(item => ({
        id: item.id,
        product_id: item.product_id,
        description: item.description,
        quantity: Number(item.quantity),
        unit: item.unit,
        unit_price: Number(item.unit_price),
        tax_rate: Number(item.tax_rate),
      })) || [{ id: '1', description: '', quantity: 1, unit: 'Stück', unit_price: 0, tax_rate: 19 }])
    } catch (err) {
      setError('Rechnung nicht gefunden')
      console.error(err)
    } finally {
      setDataLoading(false)
    }
  }

  function addItem() {
    setItems([
      ...items,
      { id: String(Date.now()), description: '', quantity: 1, unit: 'Stück', unit_price: 0, tax_rate: settings?.default_tax_rate || 19 }
    ])
  }

  function removeItem(itemId: string) {
    if (items.length > 1) {
      setItems(items.filter(item => item.id !== itemId))
    }
  }

  function updateItem(itemId: string, field: keyof LineItem, value: string | number) {
    setItems(items.map(item => item.id === itemId ? { ...item, [field]: value } : item))
  }

  function selectProduct(itemId: string, productId: string) {
    const product = products.find(p => p.id === productId)
    if (product) {
      setItems(items.map(item => item.id === itemId ? {
        ...item,
        product_id: productId,
        description: product.name,
        unit: product.unit,
        unit_price: Number(product.price),
        tax_rate: Number(product.tax_rate),
      } : item))
    }
  }

  function calculateTotals() {
    let subtotal = 0
    let taxAmount = 0
    
    items.forEach(item => {
      const itemTotal = item.quantity * item.unit_price
      subtotal += itemTotal
      if (!settings?.is_small_business) {
        taxAmount += itemTotal * (item.tax_rate / 100)
      }
    })
    
    return { subtotal, taxAmount, total: subtotal + taxAmount }
  }

  const totals = calculateTotals()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    
    if (!customerId) {
      setError('Bitte wähle einen Kunden aus')
      return
    }
    
    if (items.some(item => !item.description.trim())) {
      setError('Alle Positionen benötigen eine Beschreibung')
      return
    }
    
    try {
      setLoading(true)
      setError('')
      
      const invoiceItems: Partial<InvoiceItem>[] = items.map(item => ({
        product_id: item.product_id,
        description: item.description,
        quantity: item.quantity,
        unit: item.unit,
        unit_price: item.unit_price,
        tax_rate: item.tax_rate,
        total: item.quantity * item.unit_price,
      }))
      
      await updateInvoice(id, {
        customer_id: customerId,
        status: status as any,
        issue_date: issueDate,
        due_date: dueDate || undefined,
        delivery_date: deliveryDate || undefined,
        subtotal: totals.subtotal,
        tax_amount: totals.taxAmount,
        total: totals.total,
        notes,
      }, invoiceItems)
      
      router.push(`/rechnungen/${id}`)
    } catch (err) {
      setError('Fehler beim Speichern')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  if (dataLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href={`/rechnungen/${id}`} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Rechnung bearbeiten</h1>
          <p className="text-slate-500">{invoiceNumber}</p>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Customer & Dates */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Rechnungsdaten</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1">Kunde *</label>
              <select
                value={customerId}
                onChange={(e) => setCustomerId(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                required
              >
                <option value="">Kunde auswählen...</option>
                {customers.map(c => (
                  <option key={c.id} value={c.id}>{c.company_name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Rechnungsdatum</label>
              <input
                type="date"
                value={issueDate}
                onChange={(e) => setIssueDate(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Fälligkeitsdatum</label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>

        {/* Line Items */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-slate-900">Positionen</h2>
            <button
              type="button"
              onClick={addItem}
              className="flex items-center gap-2 text-sm text-green-600 hover:text-green-700"
            >
              <Plus size={18} />
              Position hinzufügen
            </button>
          </div>
          
          <div className="space-y-4">
            {items.map((item, index) => (
              <div key={item.id} className="border border-slate-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-sm font-medium text-slate-500">#{index + 1}</span>
                  {products.length > 0 && (
                    <select
                      value={item.product_id || ''}
                      onChange={(e) => selectProduct(item.id, e.target.value)}
                      className="flex-1 px-3 py-1 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    >
                      <option value="">Aus Produktkatalog wählen...</option>
                      {products.map(p => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>
                  )}
                  {items.length > 1 && (
                    <button type="button" onClick={() => removeItem(item.id)} className="p-1 text-red-500 hover:bg-red-50 rounded">
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-12 gap-3">
                  <div className="col-span-12 md:col-span-5">
                    <label className="block text-xs text-slate-500 mb-1">Beschreibung</label>
                    <input
                      type="text"
                      value={item.description}
                      onChange={(e) => updateItem(item.id, 'description', e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                  </div>
                  <div className="col-span-4 md:col-span-2">
                    <label className="block text-xs text-slate-500 mb-1">Menge</label>
                    <input
                      type="number"
                      value={item.quantity}
                      onChange={(e) => updateItem(item.id, 'quantity', parseFloat(e.target.value) || 0)}
                      step="0.01"
                      className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                  </div>
                  <div className="col-span-4 md:col-span-1">
                    <label className="block text-xs text-slate-500 mb-1">Einheit</label>
                    <select
                      value={item.unit}
                      onChange={(e) => updateItem(item.id, 'unit', e.target.value)}
                      className="w-full px-2 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    >
                      <option value="Stück">Stk</option>
                      <option value="Stunde">Std</option>
                      <option value="Tag">Tag</option>
                      <option value="Pauschal">Psch</option>
                    </select>
                  </div>
                  <div className="col-span-4 md:col-span-2">
                    <label className="block text-xs text-slate-500 mb-1">Einzelpreis</label>
                    <input
                      type="number"
                      value={item.unit_price}
                      onChange={(e) => updateItem(item.id, 'unit_price', parseFloat(e.target.value) || 0)}
                      step="0.01"
                      className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                  </div>
                  <div className="col-span-6 md:col-span-1">
                    <label className="block text-xs text-slate-500 mb-1">MwSt</label>
                    <select
                      value={item.tax_rate}
                      onChange={(e) => updateItem(item.id, 'tax_rate', parseFloat(e.target.value))}
                      className="w-full px-2 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    >
                      <option value="19">19%</option>
                      <option value="7">7%</option>
                      <option value="0">0%</option>
                    </select>
                  </div>
                  <div className="col-span-6 md:col-span-1">
                    <label className="block text-xs text-slate-500 mb-1">Gesamt</label>
                    <div className="px-3 py-2 text-sm font-medium text-slate-900 bg-slate-50 rounded-lg">
                      {(item.quantity * item.unit_price).toLocaleString('de-DE', { minimumFractionDigits: 2 })} €
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Totals */}
          <div className="mt-6 border-t border-slate-200 pt-4">
            <div className="flex justify-end">
              <div className="w-64 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Netto</span>
                  <span className="font-medium">{totals.subtotal.toLocaleString('de-DE', { minimumFractionDigits: 2 })} €</span>
                </div>
                {!settings?.is_small_business && (
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">MwSt.</span>
                    <span className="font-medium">{totals.taxAmount.toLocaleString('de-DE', { minimumFractionDigits: 2 })} €</span>
                  </div>
                )}
                <div className="flex justify-between text-lg font-bold border-t pt-2">
                  <span>Gesamt</span>
                  <span>{totals.total.toLocaleString('de-DE', { minimumFractionDigits: 2 })} €</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Notes */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <label className="block text-sm font-medium text-slate-700 mb-2">Anmerkungen</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
          />
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-4">
          <Link
            href={`/rechnungen/${id}`}
            className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          >
            Abbrechen
          </Link>
          <button
            type="submit"
            disabled={loading}
            className="flex items-center gap-2 px-6 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors disabled:opacity-50"
          >
            <Save size={20} />
            {loading ? 'Speichern...' : 'Änderungen speichern'}
          </button>
        </div>
      </form>
    </div>
  )
}
