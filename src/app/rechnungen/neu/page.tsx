'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { 
  ArrowLeft, 
  Plus, 
  Trash2, 
  Save, 
  Send, 
  Download,
  Calculator
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { Customer, Product } from '@/types'

interface InvoiceItem {
  id: string
  description: string
  quantity: number
  unit: string
  unitPrice: number
  taxRate: number
}

function NewInvoiceContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [saving, setSaving] = useState(false)
  const [customers, setCustomers] = useState<Customer[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [invoiceNumber, setInvoiceNumber] = useState('')
  const [isSmallBusiness, setIsSmallBusiness] = useState(false)
  
  const [selectedCustomer, setSelectedCustomer] = useState(searchParams.get('kunde') || '')
  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().split('T')[0])
  const [dueDate, setDueDate] = useState(() => {
    const date = new Date()
    date.setDate(date.getDate() + 14)
    return date.toISOString().split('T')[0]
  })
  const [deliveryDate, setDeliveryDate] = useState('')
  const [items, setItems] = useState<InvoiceItem[]>([
    { id: '1', description: '', quantity: 1, unit: 'Stück', unitPrice: 0, taxRate: 19 }
  ])
  const [notes, setNotes] = useState('')
  const [paymentTerms, setPaymentTerms] = useState('Zahlung innerhalb von 14 Tagen ohne Abzug.')

  useEffect(() => {
    fetchData()
  }, [])

  async function fetchData() {
    // Fetch customers
    const { data: customerData } = await supabase
      .from('customers')
      .select('*')
      .order('company_name')
    setCustomers(customerData || [])

    // Fetch products
    const { data: productData } = await supabase
      .from('products')
      .select('*')
      .order('name')
    setProducts(productData || [])

    // Fetch settings (invoice number + small business status)
    const { data: settings } = await supabase
      .from('company_settings')
      .select('invoice_prefix, next_invoice_number, default_payment_terms, is_small_business')
      .single()
    
    if (settings) {
      const year = new Date().getFullYear()
      const num = String(settings.next_invoice_number).padStart(3, '0')
      setInvoiceNumber(`${settings.invoice_prefix}-${year}-${num}`)
      setIsSmallBusiness(settings.is_small_business || false)
      
      // Update due date based on default payment terms
      if (settings.default_payment_terms) {
        const date = new Date()
        date.setDate(date.getDate() + settings.default_payment_terms)
        setDueDate(date.toISOString().split('T')[0])
        setPaymentTerms(`Zahlung innerhalb von ${settings.default_payment_terms} Tagen ohne Abzug.`)
      }
    }
  }

  const addItem = () => {
    const newItem: InvoiceItem = {
      id: Date.now().toString(),
      description: '',
      quantity: 1,
      unit: 'Stück',
      unitPrice: 0,
      taxRate: isSmallBusiness ? 0 : 19
    }
    setItems([...items, newItem])
  }

  const removeItem = (id: string) => {
    if (items.length > 1) {
      setItems(items.filter(item => item.id !== id))
    }
  }

  const updateItem = (id: string, field: keyof InvoiceItem, value: string | number) => {
    setItems(items.map(item => 
      item.id === id ? { ...item, [field]: value } : item
    ))
  }

  const selectProduct = (itemId: string, productId: string) => {
    const product = products.find(p => p.id === productId)
    if (product) {
      setItems(items.map(item => 
        item.id === itemId ? {
          ...item,
          description: product.name,
          unit: product.unit,
          unitPrice: product.price,
          taxRate: isSmallBusiness ? 0 : product.tax_rate
        } : item
      ))
    }
  }

  // Calculate totals
  const subtotal = items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0)
  const taxGroups = items.reduce((groups, item) => {
    if (!isSmallBusiness) {
      const tax = item.quantity * item.unitPrice * (item.taxRate / 100)
      groups[item.taxRate] = (groups[item.taxRate] || 0) + tax
    }
    return groups
  }, {} as Record<number, number>)
  const totalTax = isSmallBusiness ? 0 : Object.values(taxGroups).reduce((sum, tax) => sum + tax, 0)
  const total = subtotal + totalTax

  const handleSave = async (status: 'draft' | 'sent') => {
    if (!selectedCustomer) {
      alert('Bitte wähle einen Kunden aus.')
      return
    }

    if (items.every(item => !item.description)) {
      alert('Bitte füge mindestens eine Position hinzu.')
      return
    }

    setSaving(true)

    // Create invoice
    const { data: invoice, error: invoiceError } = await supabase
      .from('invoices')
      .insert([{
        invoice_number: invoiceNumber,
        customer_id: selectedCustomer,
        status,
        issue_date: invoiceDate,
        due_date: dueDate,
        delivery_date: deliveryDate || null,
        subtotal,
        tax_amount: totalTax,
        total,
        notes,
        payment_terms: paymentTerms
      }])
      .select()
      .single()

    if (invoiceError) {
      alert('Fehler beim Speichern: ' + invoiceError.message)
      setSaving(false)
      return
    }

    // Create invoice items
    const invoiceItems = items
      .filter(item => item.description)
      .map((item, index) => ({
        invoice_id: invoice.id,
        description: item.description,
        quantity: item.quantity,
        unit: item.unit,
        unit_price: item.unitPrice,
        tax_rate: isSmallBusiness ? 0 : item.taxRate,
        total: item.quantity * item.unitPrice,
        position: index
      }))

    const { error: itemsError } = await supabase
      .from('invoice_items')
      .insert(invoiceItems)

    if (itemsError) {
      alert('Fehler beim Speichern der Positionen: ' + itemsError.message)
      setSaving(false)
      return
    }

    // Update next invoice number
    const { data: currentSettings } = await supabase
      .from('company_settings')
      .select('next_invoice_number')
      .single()
    
    if (currentSettings) {
      await supabase
        .from('company_settings')
        .update({ next_invoice_number: currentSettings.next_invoice_number + 1 })
        .eq('id', (await supabase.from('company_settings').select('id').single()).data?.id)
    }

    router.push('/rechnungen')
  }

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/rechnungen" className="p-2 hover:bg-slate-100 rounded-lg">
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Neue Rechnung</h1>
            <p className="text-slate-500">{invoiceNumber}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => handleSave('draft')}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 border border-slate-200 hover:bg-slate-50 rounded-lg disabled:opacity-50"
          >
            <Save size={18} />
            Entwurf speichern
          </button>
          <button 
            onClick={() => handleSave('sent')}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg disabled:opacity-50"
          >
            <Send size={18} />
            Rechnung erstellen
          </button>
        </div>
      </div>

      {/* Small Business Notice */}
      {isSmallBusiness && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-amber-800 text-sm">
          <strong>Kleinunternehmer:</strong> Auf dieser Rechnung wird keine MwSt. ausgewiesen (§19 UStG).
        </div>
      )}

      <div className="grid grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="col-span-2 space-y-6">
          {/* Customer Selection */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
            <h2 className="text-lg font-semibold mb-4">Kunde</h2>
            <select
              value={selectedCustomer}
              onChange={(e) => setSelectedCustomer(e.target.value)}
              className="w-full p-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="">Kunde auswählen...</option>
              {customers.map(customer => (
                <option key={customer.id} value={customer.id}>
                  {customer.company_name} - {customer.city}
                </option>
              ))}
            </select>
            <Link href="/kunden/neu" className="text-green-600 text-sm hover:underline mt-2 inline-block">
              + Neuen Kunden anlegen
            </Link>
          </div>

          {/* Invoice Items */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
            <h2 className="text-lg font-semibold mb-4">Positionen</h2>
            
            <div className="space-y-4">
              {items.map((item, index) => (
                <div key={item.id} className="p-4 bg-slate-50 rounded-lg space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-slate-500">Position {index + 1}</span>
                    {items.length > 1 && (
                      <button 
                        onClick={() => removeItem(item.id)}
                        className="text-red-500 hover:text-red-600 p-1"
                      >
                        <Trash2 size={18} />
                      </button>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div className="col-span-2">
                      <label className="text-sm text-slate-600 mb-1 block">Produkt/Leistung</label>
                      <select
                        onChange={(e) => selectProduct(item.id, e.target.value)}
                        className="w-full p-2 border border-slate-200 rounded-lg text-sm"
                      >
                        <option value="">Aus Katalog wählen...</option>
                        {products.map(product => (
                          <option key={product.id} value={product.id}>
                            {product.name} ({product.price} €/{product.unit})
                          </option>
                        ))}
                      </select>
                    </div>
                    
                    <div className="col-span-2">
                      <label className="text-sm text-slate-600 mb-1 block">Beschreibung</label>
                      <input
                        type="text"
                        value={item.description}
                        onChange={(e) => updateItem(item.id, 'description', e.target.value)}
                        className="w-full p-2 border border-slate-200 rounded-lg text-sm"
                        placeholder="Beschreibung eingeben..."
                      />
                    </div>
                    
                    <div>
                      <label className="text-sm text-slate-600 mb-1 block">Menge</label>
                      <input
                        type="number"
                        min="1"
                        step="0.5"
                        value={item.quantity}
                        onChange={(e) => updateItem(item.id, 'quantity', parseFloat(e.target.value) || 0)}
                        className="w-full p-2 border border-slate-200 rounded-lg text-sm"
                      />
                    </div>
                    
                    <div>
                      <label className="text-sm text-slate-600 mb-1 block">Einheit</label>
                      <select
                        value={item.unit}
                        onChange={(e) => updateItem(item.id, 'unit', e.target.value)}
                        className="w-full p-2 border border-slate-200 rounded-lg text-sm"
                      >
                        <option value="Stück">Stück</option>
                        <option value="Stunde">Stunde</option>
                        <option value="Tag">Tag</option>
                        <option value="Pauschal">Pauschal</option>
                        <option value="Monat">Monat</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="text-sm text-slate-600 mb-1 block">Einzelpreis (€)</label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={item.unitPrice}
                        onChange={(e) => updateItem(item.id, 'unitPrice', parseFloat(e.target.value) || 0)}
                        className="w-full p-2 border border-slate-200 rounded-lg text-sm"
                      />
                    </div>
                    
                    <div>
                      <label className="text-sm text-slate-600 mb-1 block">MwSt.</label>
                      <select
                        value={item.taxRate}
                        onChange={(e) => updateItem(item.id, 'taxRate', parseInt(e.target.value))}
                        disabled={isSmallBusiness}
                        className="w-full p-2 border border-slate-200 rounded-lg text-sm disabled:bg-slate-100"
                      >
                        <option value={19}>19%</option>
                        <option value={7}>7%</option>
                        <option value={0}>0%</option>
                      </select>
                    </div>
                  </div>
                  
                  <div className="text-right text-sm">
                    <span className="text-slate-500">Gesamt: </span>
                    <span className="font-semibold">{(item.quantity * item.unitPrice).toLocaleString('de-DE', { minimumFractionDigits: 2 })} €</span>
                  </div>
                </div>
              ))}
            </div>
            
            <button 
              onClick={addItem}
              className="mt-4 flex items-center gap-2 text-green-600 hover:text-green-700"
            >
              <Plus size={18} />
              Position hinzufügen
            </button>
          </div>

          {/* Notes */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
            <h2 className="text-lg font-semibold mb-4">Notizen & Zahlungsbedingungen</h2>
            <div className="space-y-4">
              <div>
                <label className="text-sm text-slate-600 mb-1 block">Bemerkungen</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  className="w-full p-3 border border-slate-200 rounded-lg text-sm"
                  placeholder="Zusätzliche Informationen für den Kunden..."
                />
              </div>
              <div>
                <label className="text-sm text-slate-600 mb-1 block">Zahlungsbedingungen</label>
                <input
                  type="text"
                  value={paymentTerms}
                  onChange={(e) => setPaymentTerms(e.target.value)}
                  className="w-full p-3 border border-slate-200 rounded-lg text-sm"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Dates */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
            <h2 className="text-lg font-semibold mb-4">Daten</h2>
            <div className="space-y-4">
              <div>
                <label className="text-sm text-slate-600 mb-1 block">Rechnungsdatum</label>
                <input
                  type="date"
                  value={invoiceDate}
                  onChange={(e) => setInvoiceDate(e.target.value)}
                  className="w-full p-2 border border-slate-200 rounded-lg text-sm"
                />
              </div>
              <div>
                <label className="text-sm text-slate-600 mb-1 block">Fälligkeitsdatum</label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full p-2 border border-slate-200 rounded-lg text-sm"
                />
              </div>
              <div>
                <label className="text-sm text-slate-600 mb-1 block">Lieferdatum (optional)</label>
                <input
                  type="date"
                  value={deliveryDate}
                  onChange={(e) => setDeliveryDate(e.target.value)}
                  className="w-full p-2 border border-slate-200 rounded-lg text-sm"
                />
              </div>
            </div>
          </div>

          {/* Totals */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Calculator size={20} />
              Summe
            </h2>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Zwischensumme</span>
                <span>{subtotal.toLocaleString('de-DE', { minimumFractionDigits: 2 })} €</span>
              </div>
              {!isSmallBusiness && Object.entries(taxGroups).map(([rate, amount]) => (
                <div key={rate} className="flex justify-between text-sm">
                  <span className="text-slate-500">MwSt. {rate}%</span>
                  <span>{amount.toLocaleString('de-DE', { minimumFractionDigits: 2 })} €</span>
                </div>
              ))}
              {isSmallBusiness && (
                <div className="text-xs text-slate-400">
                  Keine MwSt. (Kleinunternehmer §19 UStG)
                </div>
              )}
              <hr className="my-2" />
              <div className="flex justify-between font-bold text-lg">
                <span>Gesamtbetrag</span>
                <span className="text-green-600">{total.toLocaleString('de-DE', { minimumFractionDigits: 2 })} €</span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
            <h2 className="text-lg font-semibold mb-4">Aktionen</h2>
            <div className="space-y-2">
              <button 
                onClick={() => handleSave('sent')}
                disabled={saving}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-green-500 hover:bg-green-600 text-white rounded-lg disabled:opacity-50"
              >
                <Send size={18} />
                Rechnung erstellen
              </button>
              <button className="w-full flex items-center justify-center gap-2 px-4 py-3 border border-slate-200 hover:bg-slate-50 rounded-lg">
                <Download size={18} />
                Als PDF herunterladen
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}


export default function NewInvoicePage() {
  return (
    <Suspense fallback={<div className="p-8">Laden...</div>}>
      <NewInvoiceContent />
    </Suspense>
  )
}
