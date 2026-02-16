'use client'

import { useState, useEffect } from 'react'
import { Save, Upload, Building2, CreditCard, FileText, Settings } from 'lucide-react'
import { getCompanySettings, updateCompanySettings, uploadLogo } from '@/lib/database'
import { CompanySettings } from '@/types'

export default function EinstellungenPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [uploading, setUploading] = useState(false)
  
  const [settings, setSettings] = useState<Partial<CompanySettings>>({
    company_name: '',
    owner_name: '',
    address: '',
    zip_code: '',
    city: '',
    country: 'Deutschland',
    email: '',
    phone: '',
    website: '',
    tax_id: '',
    vat_id: '',
    bank_name: '',
    iban: '',
    bic: '',
    logo_url: '',
    invoice_prefix: 'RE-',
    next_invoice_number: 1,
    quote_prefix: 'AN-',
    next_quote_number: 1,
    default_payment_terms: 14,
    default_tax_rate: 19,
    footer_text: '',
    is_small_business: false,
  })

  useEffect(() => {
    loadSettings()
  }, [])

  async function loadSettings() {
    try {
      setLoading(true)
      const data = await getCompanySettings()
      setSettings({
        ...data,
        default_tax_rate: Number(data.default_tax_rate) || 19,
      })
    } catch (err: any) {
      const errorMsg = err?.message || err?.toString() || 'Unbekannter Fehler'
      setError(`Fehler beim Laden: ${errorMsg}`)
      console.error('Load error:', err)
    } finally {
      setLoading(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    
    try {
      setSaving(true)
      setError('')
      setSuccess('')
      await updateCompanySettings(settings)
      setSuccess('Einstellungen gespeichert!')
      setTimeout(() => setSuccess(''), 3000)
    } catch (err: any) {
      const errorMsg = err?.message || err?.toString() || 'Unbekannter Fehler'
      setError(`Fehler beim Speichern: ${errorMsg}`)
      console.error('Save error:', err)
    } finally {
      setSaving(false)
    }
  }

  async function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    
    try {
      setUploading(true)
      const url = await uploadLogo(file)
      setSettings({ ...settings, logo_url: url })
    } catch (err) {
      setError('Fehler beim Hochladen des Logos')
      console.error(err)
    } finally {
      setUploading(false)
    }
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
    const { name, value, type } = e.target
    setSettings({
      ...settings,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : 
              type === 'number' ? parseFloat(value) || 0 : value
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Einstellungen</h1>
        <p className="text-slate-500">Firmendaten und Rechnungseinstellungen</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
          {success}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Company Info */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <Building2 size={20} className="text-purple-600" />
            </div>
            <h2 className="text-lg font-semibold text-slate-900">Firmendaten</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1">Firmenname</label>
              <input
                type="text"
                name="company_name"
                value={settings.company_name}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Inhaber / Geschäftsführer</label>
              <input
                type="text"
                name="owner_name"
                value={settings.owner_name}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">E-Mail</label>
              <input
                type="email"
                name="email"
                value={settings.email}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Telefon</label>
              <input
                type="tel"
                name="phone"
                value={settings.phone}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Website</label>
              <input
                type="url"
                name="website"
                value={settings.website}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1">Straße und Hausnummer</label>
              <input
                type="text"
                name="address"
                value={settings.address}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">PLZ</label>
              <input
                type="text"
                name="zip_code"
                value={settings.zip_code}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Stadt</label>
              <input
                type="text"
                name="city"
                value={settings.city}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Steuernummer</label>
              <input
                type="text"
                name="tax_id"
                value={settings.tax_id}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="z.B. 123/456/78901"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">USt-IdNr.</label>
              <input
                type="text"
                name="vat_id"
                value={settings.vat_id}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="z.B. DE123456789"
              />
            </div>
          </div>

          {/* Logo Upload */}
          <div className="mt-6 pt-6 border-t border-slate-200">
            <label className="block text-sm font-medium text-slate-700 mb-2">Firmenlogo</label>
            <div className="flex items-center gap-4">
              {settings.logo_url && (
                <img src={settings.logo_url} alt="Logo" className="h-16 rounded-lg border border-slate-200" />
              )}
              <label className="cursor-pointer">
                <div className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors">
                  <Upload size={18} />
                  {uploading ? 'Wird hochgeladen...' : 'Logo hochladen'}
                </div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleLogoUpload}
                  className="hidden"
                />
              </label>
            </div>
          </div>
        </div>

        {/* Bank Details */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <CreditCard size={20} className="text-blue-600" />
            </div>
            <h2 className="text-lg font-semibold text-slate-900">Bankverbindung</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1">Bankname</label>
              <input
                type="text"
                name="bank_name"
                value={settings.bank_name}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">IBAN</label>
              <input
                type="text"
                name="iban"
                value={settings.iban}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="DE00 0000 0000 0000 0000 00"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">BIC</label>
              <input
                type="text"
                name="bic"
                value={settings.bic}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>

        {/* Invoice Settings */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <FileText size={20} className="text-green-600" />
            </div>
            <h2 className="text-lg font-semibold text-slate-900">Rechnungseinstellungen</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Rechnungs-Prefix</label>
              <input
                type="text"
                name="invoice_prefix"
                value={settings.invoice_prefix}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="RE-"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Nächste Rechnungsnummer</label>
              <input
                type="number"
                name="next_invoice_number"
                value={settings.next_invoice_number}
                onChange={handleChange}
                min="1"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Angebots-Prefix</label>
              <input
                type="text"
                name="quote_prefix"
                value={settings.quote_prefix}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="AN-"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Nächste Angebotsnummer</label>
              <input
                type="number"
                name="next_quote_number"
                value={settings.next_quote_number}
                onChange={handleChange}
                min="1"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Standard-Zahlungsziel (Tage)</label>
              <input
                type="number"
                name="default_payment_terms"
                value={settings.default_payment_terms}
                onChange={handleChange}
                min="0"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Standard-MwSt.-Satz</label>
              <select
                name="default_tax_rate"
                value={settings.default_tax_rate}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                <option value="19">19%</option>
                <option value="7">7%</option>
                <option value="0">0%</option>
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  name="is_small_business"
                  checked={settings.is_small_business}
                  onChange={handleChange}
                  className="w-5 h-5 rounded border-slate-300 text-green-500 focus:ring-green-500"
                />
                <span className="text-sm font-medium text-slate-700">
                  Kleinunternehmer-Regelung (§ 19 UStG)
                </span>
              </label>
              <p className="text-sm text-slate-500 mt-1 ml-8">
                Aktivieren Sie diese Option, wenn Sie als Kleinunternehmer keine Umsatzsteuer ausweisen.
              </p>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1">Fußzeile für Rechnungen</label>
              <textarea
                name="footer_text"
                value={settings.footer_text}
                onChange={handleChange}
                rows={3}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="Vielen Dank für Ihren Auftrag!"
              />
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 px-6 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors disabled:opacity-50"
          >
            <Save size={20} />
            {saving ? 'Speichern...' : 'Einstellungen speichern'}
          </button>
        </div>
      </form>
    </div>
  )
}
