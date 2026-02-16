'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { 
  Plus, 
  Search, 
  MoreVertical, 
  Mail, 
  Phone, 
  MapPin,
  Building2,
  Trash2,
  Edit,
  FileText
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { Customer } from '@/types'

export default function KundenPage() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [openMenu, setOpenMenu] = useState<string | null>(null)

  useEffect(() => {
    fetchCustomers()
  }, [])

  async function fetchCustomers() {
    setLoading(true)
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .order('company_name', { ascending: true })

    if (error) {
      console.error('Error fetching customers:', error)
    } else {
      setCustomers(data || [])
    }
    setLoading(false)
  }

  async function deleteCustomer(id: string) {
    if (!confirm('Möchtest du diesen Kunden wirklich löschen?')) return

    const { error } = await supabase
      .from('customers')
      .delete()
      .eq('id', id)

    if (error) {
      alert('Fehler: Kunde hat noch Rechnungen und kann nicht gelöscht werden.')
    } else {
      setCustomers(customers.filter(c => c.id !== id))
    }
    setOpenMenu(null)
  }

  const filteredCustomers = customers.filter(customer =>
    customer.company_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.contact_person?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.email.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Kunden</h1>
          <p className="text-slate-500">{customers.length} Kunden insgesamt</p>
        </div>
        <Link 
          href="/kunden/neu"
          className="flex items-center gap-2 px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors"
        >
          <Plus size={20} />
          Neuer Kunde
        </Link>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
        <input
          type="text"
          placeholder="Kunden suchen..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
        />
      </div>

      {/* Customer List */}
      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500 mx-auto"></div>
          <p className="mt-2 text-slate-500">Lade Kunden...</p>
        </div>
      ) : filteredCustomers.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-slate-200">
          <Building2 size={48} className="mx-auto text-slate-300 mb-4" />
          <h3 className="text-lg font-medium text-slate-900 mb-2">Keine Kunden gefunden</h3>
          <p className="text-slate-500 mb-4">
            {searchTerm ? 'Versuche einen anderen Suchbegriff.' : 'Erstelle deinen ersten Kunden.'}
          </p>
          {!searchTerm && (
            <Link 
              href="/kunden/neu"
              className="inline-flex items-center gap-2 px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg"
            >
              <Plus size={18} />
              Kunde anlegen
            </Link>
          )}
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredCustomers.map((customer) => (
            <div 
              key={customer.id} 
              className="bg-white rounded-xl p-6 shadow-sm border border-slate-200 hover:border-green-200 transition-colors"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                    <Building2 size={24} className="text-green-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900">{customer.company_name}</h3>
                    {customer.contact_person && (
                      <p className="text-sm text-slate-500">{customer.contact_person}</p>
                    )}
                    <div className="flex flex-wrap gap-4 mt-2 text-sm text-slate-600">
                      <span className="flex items-center gap-1">
                        <Mail size={14} className="text-slate-400" />
                        {customer.email}
                      </span>
                      {customer.phone && (
                        <span className="flex items-center gap-1">
                          <Phone size={14} className="text-slate-400" />
                          {customer.phone}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <MapPin size={14} className="text-slate-400" />
                        {customer.zip_code} {customer.city}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="relative">
                  <button 
                    onClick={() => setOpenMenu(openMenu === customer.id ? null : customer.id)}
                    className="p-2 hover:bg-slate-100 rounded-lg"
                  >
                    <MoreVertical size={20} className="text-slate-400" />
                  </button>
                  
                  {openMenu === customer.id && (
                    <div className="absolute right-0 top-full mt-1 bg-white rounded-lg shadow-lg border border-slate-200 py-1 z-10 min-w-[160px]">
                      <Link 
                        href={`/kunden/${customer.id}`}
                        className="flex items-center gap-2 px-4 py-2 hover:bg-slate-50 text-sm"
                      >
                        <Edit size={16} />
                        Bearbeiten
                      </Link>
                      <Link 
                        href={`/rechnungen/neu?kunde=${customer.id}`}
                        className="flex items-center gap-2 px-4 py-2 hover:bg-slate-50 text-sm"
                      >
                        <FileText size={16} />
                        Rechnung erstellen
                      </Link>
                      <button 
                        onClick={() => deleteCustomer(customer.id)}
                        className="flex items-center gap-2 px-4 py-2 hover:bg-red-50 text-red-600 text-sm w-full"
                      >
                        <Trash2 size={16} />
                        Löschen
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
