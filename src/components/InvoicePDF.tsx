'use client'

import { Document, Page, Text, View, StyleSheet, Font } from '@react-pdf/renderer'

// Register fonts (optional, uses default fonts if not available)
Font.register({
  family: 'Helvetica',
  fonts: [
    { src: 'https://fonts.gstatic.com/s/roboto/v30/KFOmCnqEu92Fr1Me5Q.ttf' },
    { src: 'https://fonts.gstatic.com/s/roboto/v30/KFOlCnqEu92Fr1MmWUlvAw.ttf', fontWeight: 700 }
  ]
})

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 10,
    fontFamily: 'Helvetica',
    color: '#1e293b',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 40,
  },
  companyInfo: {
    maxWidth: '50%',
  },
  companyName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
    color: '#16a34a',
  },
  companyDetails: {
    fontSize: 9,
    color: '#64748b',
    lineHeight: 1.5,
  },
  invoiceInfo: {
    textAlign: 'right',
  },
  invoiceTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#1e293b',
  },
  invoiceNumber: {
    fontSize: 11,
    marginBottom: 2,
  },
  customerSection: {
    marginBottom: 30,
  },
  customerLabel: {
    fontSize: 8,
    color: '#64748b',
    marginBottom: 4,
  },
  customerName: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  customerDetails: {
    fontSize: 10,
    lineHeight: 1.4,
  },
  dateRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: 4,
    fontSize: 9,
  },
  dateLabel: {
    width: 100,
    color: '#64748b',
  },
  dateValue: {
    width: 80,
    textAlign: 'right',
  },
  table: {
    marginTop: 20,
    marginBottom: 20,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f1f5f9',
    padding: 8,
    fontWeight: 'bold',
    fontSize: 9,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  tableRow: {
    flexDirection: 'row',
    padding: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  colPos: { width: '5%' },
  colDescription: { width: '40%' },
  colQuantity: { width: '12%', textAlign: 'right' },
  colUnit: { width: '10%', textAlign: 'center' },
  colPrice: { width: '15%', textAlign: 'right' },
  colTotal: { width: '18%', textAlign: 'right' },
  totalsSection: {
    marginTop: 20,
    alignItems: 'flex-end',
  },
  totalsRow: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  totalsLabel: {
    width: 120,
    textAlign: 'right',
    paddingRight: 20,
    color: '#64748b',
    fontSize: 10,
  },
  totalsValue: {
    width: 100,
    textAlign: 'right',
    fontSize: 10,
  },
  totalFinal: {
    flexDirection: 'row',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 2,
    borderTopColor: '#16a34a',
  },
  totalFinalLabel: {
    width: 120,
    textAlign: 'right',
    paddingRight: 20,
    fontWeight: 'bold',
    fontSize: 12,
  },
  totalFinalValue: {
    width: 100,
    textAlign: 'right',
    fontWeight: 'bold',
    fontSize: 12,
    color: '#16a34a',
  },
  paymentSection: {
    marginTop: 40,
    padding: 15,
    backgroundColor: '#f8fafc',
    borderRadius: 4,
  },
  paymentTitle: {
    fontWeight: 'bold',
    marginBottom: 8,
    fontSize: 10,
  },
  paymentDetails: {
    fontSize: 9,
    color: '#64748b',
    lineHeight: 1.5,
  },
  notesSection: {
    marginTop: 20,
  },
  notesTitle: {
    fontWeight: 'bold',
    marginBottom: 4,
    fontSize: 10,
  },
  notesText: {
    fontSize: 9,
    color: '#64748b',
    lineHeight: 1.5,
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    textAlign: 'center',
    fontSize: 8,
    color: '#94a3b8',
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    paddingTop: 10,
  },
  smallBusinessNote: {
    marginTop: 15,
    fontSize: 8,
    color: '#64748b',
    fontStyle: 'italic',
  },
})

interface InvoiceItem {
  description: string
  quantity: number
  unit: string
  unit_price: number
  tax_rate: number
  total: number
}

interface CompanySettings {
  company_name: string
  owner_name?: string
  address: string
  zip_code: string
  city: string
  email: string
  phone?: string
  tax_id?: string
  vat_id?: string
  bank_name?: string
  iban?: string
  bic?: string
  is_small_business?: boolean
}

interface Customer {
  company_name: string
  contact_person?: string
  address: string
  zip_code: string
  city: string
  country: string
}

interface InvoiceData {
  invoice_number: string
  issue_date: string
  due_date: string
  delivery_date?: string
  items: InvoiceItem[]
  subtotal: number
  tax_amount: number
  total: number
  notes?: string
  payment_terms?: string
}

interface InvoicePDFProps {
  invoice: InvoiceData
  customer: Customer
  company: CompanySettings
}

export function InvoicePDF({ invoice, customer, company }: InvoicePDFProps) {
  const formatCurrency = (amount: number) => {
    return amount.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' €'
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('de-DE')
  }

  // Group taxes by rate
  const taxGroups = invoice.items.reduce((groups, item) => {
    if (item.tax_rate > 0) {
      const tax = item.quantity * item.unit_price * (item.tax_rate / 100)
      groups[item.tax_rate] = (groups[item.tax_rate] || 0) + tax
    }
    return groups
  }, {} as Record<number, number>)

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.companyInfo}>
            <Text style={styles.companyName}>{company.company_name}</Text>
            <Text style={styles.companyDetails}>
              {company.owner_name && `${company.owner_name}\n`}
              {company.address}{'\n'}
              {company.zip_code} {company.city}{'\n'}
              {'\n'}
              {company.email}
              {company.phone && `\nTel: ${company.phone}`}
            </Text>
          </View>
          <View style={styles.invoiceInfo}>
            <Text style={styles.invoiceTitle}>RECHNUNG</Text>
            <Text style={styles.invoiceNumber}>Nr. {invoice.invoice_number}</Text>
          </View>
        </View>

        {/* Customer & Dates */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 30 }}>
          <View style={styles.customerSection}>
            <Text style={styles.customerLabel}>RECHNUNGSEMPFÄNGER</Text>
            <Text style={styles.customerName}>{customer.company_name}</Text>
            <Text style={styles.customerDetails}>
              {customer.contact_person && `${customer.contact_person}\n`}
              {customer.address}{'\n'}
              {customer.zip_code} {customer.city}{'\n'}
              {customer.country}
            </Text>
          </View>
          <View>
            <View style={styles.dateRow}>
              <Text style={styles.dateLabel}>Rechnungsdatum:</Text>
              <Text style={styles.dateValue}>{formatDate(invoice.issue_date)}</Text>
            </View>
            <View style={styles.dateRow}>
              <Text style={styles.dateLabel}>Fällig am:</Text>
              <Text style={styles.dateValue}>{formatDate(invoice.due_date)}</Text>
            </View>
            {invoice.delivery_date && (
              <View style={styles.dateRow}>
                <Text style={styles.dateLabel}>Lieferdatum:</Text>
                <Text style={styles.dateValue}>{formatDate(invoice.delivery_date)}</Text>
              </View>
            )}
          </View>
        </View>

        {/* Table */}
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={styles.colPos}>Pos.</Text>
            <Text style={styles.colDescription}>Beschreibung</Text>
            <Text style={styles.colQuantity}>Menge</Text>
            <Text style={styles.colUnit}>Einheit</Text>
            <Text style={styles.colPrice}>Einzelpreis</Text>
            <Text style={styles.colTotal}>Gesamt</Text>
          </View>
          {invoice.items.map((item, index) => (
            <View key={index} style={styles.tableRow}>
              <Text style={styles.colPos}>{index + 1}</Text>
              <Text style={styles.colDescription}>{item.description}</Text>
              <Text style={styles.colQuantity}>{item.quantity}</Text>
              <Text style={styles.colUnit}>{item.unit}</Text>
              <Text style={styles.colPrice}>{formatCurrency(item.unit_price)}</Text>
              <Text style={styles.colTotal}>{formatCurrency(item.total)}</Text>
            </View>
          ))}
        </View>

        {/* Totals */}
        <View style={styles.totalsSection}>
          <View style={styles.totalsRow}>
            <Text style={styles.totalsLabel}>Zwischensumme:</Text>
            <Text style={styles.totalsValue}>{formatCurrency(invoice.subtotal)}</Text>
          </View>
          {!company.is_small_business && Object.entries(taxGroups).map(([rate, amount]) => (
            <View key={rate} style={styles.totalsRow}>
              <Text style={styles.totalsLabel}>MwSt. {rate}%:</Text>
              <Text style={styles.totalsValue}>{formatCurrency(amount)}</Text>
            </View>
          ))}
          <View style={styles.totalFinal}>
            <Text style={styles.totalFinalLabel}>Gesamtbetrag:</Text>
            <Text style={styles.totalFinalValue}>{formatCurrency(invoice.total)}</Text>
          </View>
        </View>

        {/* Small Business Note */}
        {company.is_small_business && (
          <Text style={styles.smallBusinessNote}>
            Gemäß § 19 UStG wird keine Umsatzsteuer berechnet.
          </Text>
        )}

        {/* Payment Info */}
        <View style={styles.paymentSection}>
          <Text style={styles.paymentTitle}>Zahlungsinformationen</Text>
          <Text style={styles.paymentDetails}>
            {invoice.payment_terms}{'\n'}
            {'\n'}
            {company.bank_name && `Bank: ${company.bank_name}\n`}
            {company.iban && `IBAN: ${company.iban}\n`}
            {company.bic && `BIC: ${company.bic}`}
          </Text>
        </View>

        {/* Notes */}
        {invoice.notes && (
          <View style={styles.notesSection}>
            <Text style={styles.notesTitle}>Bemerkungen</Text>
            <Text style={styles.notesText}>{invoice.notes}</Text>
          </View>
        )}

        {/* Footer */}
        <View style={styles.footer}>
          <Text>
            {company.company_name} • {company.address}, {company.zip_code} {company.city}
            {company.tax_id && ` • Steuer-Nr.: ${company.tax_id}`}
            {company.vat_id && ` • USt-IdNr.: ${company.vat_id}`}
          </Text>
        </View>
      </Page>
    </Document>
  )
}

export default InvoicePDF
