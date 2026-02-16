'use client'

import { useState } from 'react'
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

interface InvoiceItem {
  id: string
  description: string
  quantity: number
  unit: string
  unitPrice: number
  taxRate: number
}

// Demo customers
const customers = [
  { id: '1', name: 'Müller GmbH', address: 'Hauptstraße 1, 12345 Berlin' },
  { id: '2', name: 'Schmidt AG', address: 'Industrieweg 5, 54321 München' },
  { id: '3', name: 'Weber KG', address: 'Marktplatz 10, 11111 Hamburg' },
]

// Demo products
const products = [
  { id: '1', name: 'Webdesign', unit: 'Stunde', price: 95 },
  { id: '2', name: 'Beratung', unit: 'Stunde', price: 120 },
  { id: '3', name: 'Entwicklung', unit: 'Stunde', price: 110 },
  { id: '4', name: 'Wartung (monatlich)', unit: 'Pauschal', price: 250 },
]

export default function NewInvoicePage() {
  const [selectedCustomer, setSelectedCustomer] = useState('')
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

  const addItem = () => {
    const newItem: InvoiceItem = {
      id: Date.now().toString(),
      description: '',
      quantity: 1,
      unit: 'Stück',
      unitPrice: 0,
      taxRate: 19
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
      updateItem(itemId, 'description', product.name)
      updateItem(itemId, 'unit', product.unit)
      updateItem(itemId, 'unitPrice', product.price)
    }
  }

  // Calculate totals
  const subtotal = items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0)
  const taxGroups = items.reduce((groups, item) => {
    const tax = item.quantity * item.unitPrice * (item.taxRate / 100)
    groups[item.taxRate] = (groups[item.taxRate] || 0) + tax
    return groups
  }, {} as Record<number, number>)
  const totalTax = Object.values(taxGroups).reduce((sum, tax) => sum + tax, 0)
  const total = subtotal + totalTax

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
            <p className="text-slate-500">RE-2026-007</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button className="flex items-center gap-2 px-4 py-2 border border-slate-200 hover:bg-slate-50 rounded-lg">
            <Save size={18} />
            Entwurf speichern
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg">
            <Send size={18} />
            Rechnung senden
          </button>
        </div>
      </div>

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
                  {customer.name} - {customer.address}
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
                        className="w-full p-2 border border-slate-200 rounded-lg text-sm"
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
              {Object.entries(taxGroups).map(([rate, amount]) => (
                <div key={rate} className="flex justify-between text-sm">
                  <span className="text-slate-500">MwSt. {rate}%</span>
                  <span>{amount.toLocaleString('de-DE', { minimumFractionDigits: 2 })} €</span>
                </div>
              ))}
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
              <button className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-green-500 hover:bg-green-600 text-white rounded-lg">
                <Send size={18} />
                Per E-Mail senden
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
