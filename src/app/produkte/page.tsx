'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Package, Plus, Search, Edit2, Trash2 } from 'lucide-react'
import { getProducts, deleteProduct } from '@/lib/database'
import { Product } from '@/types'

export default function ProduktePage() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)

  useEffect(() => {
    loadProducts()
  }, [])

  async function loadProducts() {
    try {
      setLoading(true)
      const data = await getProducts()
      setProducts(data)
    } catch (err) {
      setError('Fehler beim Laden der Produkte')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete(id: string) {
    try {
      await deleteProduct(id)
      setProducts(products.filter(p => p.id !== id))
      setDeleteConfirm(null)
    } catch (err) {
      setError('Fehler beim Löschen')
      console.error(err)
    }
  }

  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.description?.toLowerCase().includes(searchQuery.toLowerCase())
  )

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
          <h1 className="text-2xl font-bold text-slate-900">Produkte & Leistungen</h1>
          <p className="text-slate-500">{products.length} Produkte insgesamt</p>
        </div>
        <Link
          href="/produkte/neu"
          className="flex items-center gap-2 px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors"
        >
          <Plus size={20} />
          Neues Produkt
        </Link>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
        <input
          type="text"
          placeholder="Produkte suchen..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
        />
      </div>

      {/* Products List */}
      {filteredProducts.length === 0 ? (
        <div className="bg-white rounded-xl p-12 text-center border border-slate-200">
          <Package size={48} className="mx-auto text-slate-300 mb-4" />
          <h3 className="text-lg font-medium text-slate-900 mb-2">Keine Produkte gefunden</h3>
          <p className="text-slate-500 mb-4">
            {searchQuery ? 'Versuche eine andere Suche.' : 'Lege dein erstes Produkt an.'}
          </p>
          {!searchQuery && (
            <Link
              href="/produkte/neu"
              className="inline-flex items-center gap-2 px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors"
            >
              <Plus size={20} />
              Produkt anlegen
            </Link>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left px-4 py-3 text-sm font-medium text-slate-500">Produkt</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-slate-500">Einheit</th>
                <th className="text-right px-4 py-3 text-sm font-medium text-slate-500">Preis</th>
                <th className="text-right px-4 py-3 text-sm font-medium text-slate-500">MwSt.</th>
                <th className="text-right px-4 py-3 text-sm font-medium text-slate-500">Aktionen</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredProducts.map((product) => (
                <tr key={product.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                        <Package size={20} className="text-blue-600" />
                      </div>
                      <div>
                        <div className="font-medium text-slate-900">{product.name}</div>
                        {product.description && (
                          <div className="text-sm text-slate-500 truncate max-w-xs">{product.description}</div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-slate-600">{product.unit}</td>
                  <td className="px-4 py-3 text-right font-medium text-slate-900">
                    {Number(product.price).toLocaleString('de-DE', { minimumFractionDigits: 2 })} €
                  </td>
                  <td className="px-4 py-3 text-right text-slate-600">{product.tax_rate}%</td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Link
                        href={`/produkte/${product.id}`}
                        className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      >
                        <Edit2 size={18} />
                      </Link>
                      {deleteConfirm === product.id ? (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleDelete(product.id)}
                            className="px-2 py-1 bg-red-500 text-white text-xs rounded hover:bg-red-600"
                          >
                            Löschen
                          </button>
                          <button
                            onClick={() => setDeleteConfirm(null)}
                            className="px-2 py-1 bg-slate-200 text-slate-600 text-xs rounded hover:bg-slate-300"
                          >
                            Abbrechen
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setDeleteConfirm(product.id)}
                          className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 size={18} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
