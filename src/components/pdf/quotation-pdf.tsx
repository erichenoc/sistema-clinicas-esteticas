'use client'

import { Document, Page, Text, View, StyleSheet, Image, Font } from '@react-pdf/renderer'

// Register fonts
Font.register({
  family: 'Helvetica',
  fonts: [
    { src: 'Helvetica' },
    { src: 'Helvetica-Bold', fontWeight: 'bold' },
  ],
})

// Brand colors - Med Luxe official palette inspired by reference design
const colors = {
  primary: '#A67C52',       // Med Luxe Gold (main brand color)
  primaryLight: '#c9a67a',  // Gold light
  primaryDark: '#8a6543',   // Gold dark
  secondary: '#93beb8',     // Med Luxe Teal
  accent: '#e8a0c0',        // Med Luxe Rose
  cream: '#FEF7E6',         // Cream highlight (like reference yellow)
  warmGray: '#998577',      // Med Luxe Warm Gray
  dark: '#2D2D2D',          // Main text
  gray: '#6B7280',          // Muted text
  lightGray: '#F8F6F3',     // Light background
  border: '#E5E2DD',        // Border color
  white: '#FFFFFF',
  background: '#FDFCFA',    // Page background
  success: '#10b981',       // Green for discounts
  tableHeader: '#A67C52',   // Gold header like orange in reference
}

// Styles inspired by the reference design
const styles = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica',
    fontSize: 10,
    padding: 0,
    backgroundColor: colors.white,
  },

  // Top decorative bar (like reference)
  topBar: {
    height: 8,
    backgroundColor: colors.primary,
  },

  // Main content area
  content: {
    padding: 40,
    paddingTop: 30,
  },

  // Header section
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  logoContainer: {
    flexDirection: 'column',
    alignItems: 'flex-start',
  },
  logo: {
    width: 140,
    height: 60,
    objectFit: 'contain',
  },
  companyInfo: {
    marginTop: 8,
  },
  companyInfoText: {
    fontSize: 8,
    color: colors.gray,
    marginBottom: 2,
  },

  // Quote title section (right side)
  quoteInfo: {
    alignItems: 'flex-end',
  },
  quoteTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.dark,
    letterSpacing: 1,
  },
  quoteNumber: {
    fontSize: 11,
    color: colors.gray,
    marginTop: 6,
  },
  quoteDate: {
    fontSize: 10,
    color: colors.gray,
    marginTop: 4,
  },

  // Client info section (like "INVOICE TO" in reference)
  clientSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 25,
  },
  clientBox: {
    width: '48%',
  },
  clientLabel: {
    fontSize: 10,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  clientCard: {
    backgroundColor: colors.lightGray,
    padding: 14,
    borderRadius: 4,
    borderLeftWidth: 3,
    borderLeftColor: colors.primary,
  },
  clientName: {
    fontSize: 12,
    fontWeight: 'bold',
    color: colors.dark,
    marginBottom: 6,
  },
  clientText: {
    fontSize: 9,
    color: colors.gray,
    marginBottom: 3,
  },

  // Contact info (right side like reference)
  contactInfo: {
    alignItems: 'flex-end',
  },
  contactText: {
    fontSize: 9,
    color: colors.gray,
    marginBottom: 3,
    textAlign: 'right',
  },

  // Table section title
  sectionLabel: {
    fontSize: 11,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  // Items Table (styled like reference with gold header)
  table: {
    marginBottom: 20,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: colors.tableHeader,
    paddingVertical: 12,
    paddingHorizontal: 10,
  },
  tableHeaderCell: {
    color: colors.white,
    fontSize: 9,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  tableRowAlt: {
    backgroundColor: colors.lightGray,
  },
  tableCell: {
    fontSize: 9,
    color: colors.dark,
  },
  tableCellMuted: {
    fontSize: 9,
    color: colors.gray,
  },

  // Column widths (matching reference layout)
  colDescription: { width: '40%' },
  colPrice: { width: '18%', textAlign: 'center' },
  colQty: { width: '12%', textAlign: 'center' },
  colTotal: { width: '18%', textAlign: 'right' },
  colDiscount: { width: '12%', textAlign: 'center' },

  // Totals section (like reference - bottom right)
  totalsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 15,
  },
  paymentMethodBox: {
    width: '45%',
  },
  paymentMethodTitle: {
    fontSize: 10,
    fontWeight: 'bold',
    color: colors.dark,
    marginBottom: 10,
  },
  paymentMethodText: {
    fontSize: 9,
    color: colors.gray,
    marginBottom: 4,
  },

  totalsBox: {
    width: '45%',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  totalLabel: {
    fontSize: 10,
    fontWeight: 'bold',
    color: colors.dark,
  },
  totalValue: {
    fontSize: 10,
    color: colors.dark,
  },
  discountValue: {
    fontSize: 10,
    color: colors.success,
  },
  taxRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: colors.lightGray,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  taxLabel: {
    fontSize: 10,
    fontWeight: 'bold',
    color: colors.gray,
  },
  grandTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 12,
    backgroundColor: colors.tableHeader,
  },
  grandTotalLabel: {
    fontSize: 11,
    fontWeight: 'bold',
    color: colors.white,
    textTransform: 'uppercase',
  },
  grandTotalValue: {
    fontSize: 13,
    fontWeight: 'bold',
    color: colors.white,
  },

  // Validity notice (cream/yellow box like reference)
  validityBox: {
    marginTop: 20,
    padding: 12,
    backgroundColor: colors.cream,
    borderRadius: 4,
    alignItems: 'center',
  },
  validityText: {
    fontSize: 9,
    color: colors.primaryDark,
    textAlign: 'center',
  },

  // Terms and conditions section
  termsSection: {
    marginTop: 20,
  },
  termsTitle: {
    fontSize: 10,
    fontWeight: 'bold',
    color: colors.dark,
    marginBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingBottom: 6,
  },
  termsList: {
    paddingLeft: 8,
  },
  termsItem: {
    fontSize: 8,
    color: colors.gray,
    marginBottom: 4,
    lineHeight: 1.5,
  },

  // Notes section
  notesSection: {
    marginTop: 15,
  },
  notesTitle: {
    fontSize: 10,
    fontWeight: 'bold',
    color: colors.dark,
    marginBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingBottom: 6,
  },
  notesText: {
    fontSize: 9,
    color: colors.gray,
    lineHeight: 1.5,
  },

  // Thank you message (like reference)
  thankYouSection: {
    marginTop: 30,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  thankYouText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  signatureBox: {
    alignItems: 'flex-end',
  },
  signatureLine: {
    width: 120,
    height: 1,
    backgroundColor: colors.dark,
    marginBottom: 6,
  },
  signatureName: {
    fontSize: 10,
    fontWeight: 'bold',
    color: colors.dark,
  },

  // Bottom decorative bars (like reference)
  bottomDecoration: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 30,
    flexDirection: 'row',
  },
  bottomBar1: {
    width: '70%',
    height: 8,
    backgroundColor: colors.primary,
    position: 'absolute',
    bottom: 20,
    left: 0,
  },
  bottomBar2: {
    width: '60%',
    height: 8,
    backgroundColor: colors.primary,
    position: 'absolute',
    bottom: 8,
    left: 0,
  },

  // Status badge
  statusBadge: {
    position: 'absolute',
    top: 50,
    right: 40,
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 3,
  },
  statusDraft: {
    backgroundColor: colors.gray,
  },
  statusSent: {
    backgroundColor: '#3B82F6',
  },
  statusAccepted: {
    backgroundColor: colors.success,
  },
  statusRejected: {
    backgroundColor: '#EF4444',
  },
  statusExpired: {
    backgroundColor: '#F59E0B',
  },
  statusText: {
    fontSize: 8,
    color: colors.white,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
})

export interface QuotationPDFData {
  quoteNumber: string
  createdAt: string
  validUntil: string
  status: string
  // Client
  clientName: string
  clientEmail?: string
  clientPhone?: string
  clientAddress?: string
  // Company
  companyName?: string
  companyAddress?: string
  companyPhone?: string
  companyEmail?: string
  // Items
  items: Array<{
    description: string
    quantity: number
    unitPrice: number
    discount: number
    discountType: 'percentage' | 'fixed'
    subtotal: number
  }>
  // Totals
  subtotal: number
  discountTotal: number
  taxRate: number
  taxAmount: number
  total: number
  currency: string
  // Content
  notes?: string
  termsConditions?: string
}

const formatCurrency = (amount: number, currency: string = 'DOP') => {
  const symbol = currency === 'DOP' ? 'RD$' : 'US$'
  return `${symbol}${amount.toLocaleString('es-DO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString('es-DO', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

const getStatusStyle = (status: string) => {
  switch (status) {
    case 'sent': return styles.statusSent
    case 'accepted': return styles.statusAccepted
    case 'rejected': return styles.statusRejected
    case 'expired': return styles.statusExpired
    default: return styles.statusDraft
  }
}

const getStatusLabel = (status: string) => {
  const labels: Record<string, string> = {
    draft: 'BORRADOR',
    sent: 'ENVIADA',
    accepted: 'ACEPTADA',
    rejected: 'RECHAZADA',
    expired: 'EXPIRADA',
    converted: 'FACTURADA',
  }
  return labels[status] || status.toUpperCase()
}

// Med Luxe logo URL
const LOGO_URL = 'https://res.cloudinary.com/dbftvu8ab/image/upload/v1765388675/Med_Luxe_Logo_zq8fsv.png'

export function QuotationPDF({ data }: { data: QuotationPDFData }) {
  const {
    quoteNumber,
    createdAt,
    validUntil,
    status,
    clientName,
    clientEmail,
    clientPhone,
    items,
    subtotal,
    discountTotal,
    taxRate,
    taxAmount,
    total,
    currency,
    notes,
    termsConditions,
  } = data

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Top decorative bar */}
        <View style={styles.topBar} />

        {/* Status Badge */}
        {status !== 'draft' && (
          <View style={[styles.statusBadge, getStatusStyle(status)]}>
            <Text style={styles.statusText}>{getStatusLabel(status)}</Text>
          </View>
        )}

        {/* Main Content */}
        <View style={styles.content}>
          {/* Header with Logo and Quote Info */}
          <View style={styles.header}>
            <View style={styles.logoContainer}>
              <Image src={LOGO_URL} style={styles.logo} />
              <View style={styles.companyInfo}>
                <Text style={styles.companyInfoText}>www.medluxeclinic.com</Text>
                <Text style={styles.companyInfoText}>info@medluxeclinic.com</Text>
              </View>
            </View>
            <View style={styles.quoteInfo}>
              <Text style={styles.quoteTitle}>COTIZACION</Text>
              <Text style={styles.quoteNumber}>No. {quoteNumber}</Text>
              <Text style={styles.quoteDate}>Fecha: {formatDate(createdAt)}</Text>
            </View>
          </View>

          {/* Client Section */}
          <View style={styles.clientSection}>
            <View style={styles.clientBox}>
              <Text style={styles.clientLabel}>Cliente:</Text>
              <View style={styles.clientCard}>
                <Text style={styles.clientName}>{clientName}</Text>
                {clientEmail && <Text style={styles.clientText}>{clientEmail}</Text>}
                {clientPhone && <Text style={styles.clientText}>{clientPhone}</Text>}
              </View>
            </View>
            <View style={styles.contactInfo}>
              <Text style={styles.contactText}>+1 (809) 555-0123</Text>
              <Text style={styles.contactText}>info@medluxeclinic.com</Text>
              <Text style={styles.contactText}>Santo Domingo, Rep. Dominicana</Text>
            </View>
          </View>

          {/* Items Table */}
          <Text style={styles.sectionLabel}>Servicios y Productos Cotizados</Text>
          <View style={styles.table}>
            {/* Table Header */}
            <View style={styles.tableHeader}>
              <Text style={[styles.tableHeaderCell, styles.colDescription]}>Descripcion</Text>
              <Text style={[styles.tableHeaderCell, styles.colPrice]}>Precio</Text>
              <Text style={[styles.tableHeaderCell, styles.colQty]}>Cant.</Text>
              <Text style={[styles.tableHeaderCell, styles.colDiscount]}>Desc.</Text>
              <Text style={[styles.tableHeaderCell, styles.colTotal]}>Total</Text>
            </View>

            {/* Table Rows */}
            {items.map((item, index) => (
              <View key={index} style={[styles.tableRow, index % 2 === 1 ? styles.tableRowAlt : {}]}>
                <Text style={[styles.tableCell, styles.colDescription]}>{item.description}</Text>
                <Text style={[styles.tableCellMuted, styles.colPrice]}>{formatCurrency(item.unitPrice, currency)}</Text>
                <Text style={[styles.tableCell, styles.colQty]}>{item.quantity}</Text>
                <Text style={[styles.tableCellMuted, styles.colDiscount]}>
                  {item.discount > 0
                    ? item.discountType === 'percentage'
                      ? `${item.discount}%`
                      : formatCurrency(item.discount, currency)
                    : '-'}
                </Text>
                <Text style={[styles.tableCell, styles.colTotal]}>{formatCurrency(item.subtotal, currency)}</Text>
              </View>
            ))}
          </View>

          {/* Payment Method & Totals */}
          <View style={styles.totalsContainer}>
            {/* Payment Method (left side) */}
            <View style={styles.paymentMethodBox}>
              <Text style={styles.paymentMethodTitle}>Metodo de Pago</Text>
              <Text style={styles.paymentMethodText}>Transferencia / Efectivo / Tarjeta</Text>
              <Text style={styles.paymentMethodText}>Banco: Popular Dominicano</Text>
              <Text style={styles.paymentMethodText}>Cuenta: XXXX-XXXX-XXXX</Text>
            </View>

            {/* Totals (right side) */}
            <View style={styles.totalsBox}>
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>SUB-TOTAL</Text>
                <Text style={styles.totalValue}>{formatCurrency(subtotal + discountTotal, currency)}</Text>
              </View>
              {discountTotal > 0 && (
                <View style={styles.totalRow}>
                  <Text style={styles.totalLabel}>DESCUENTO</Text>
                  <Text style={styles.discountValue}>-{formatCurrency(discountTotal, currency)}</Text>
                </View>
              )}
              {taxRate > 0 && (
                <View style={styles.taxRow}>
                  <Text style={styles.taxLabel}>ITBIS ({taxRate}%)</Text>
                  <Text style={styles.totalValue}>{formatCurrency(taxAmount, currency)}</Text>
                </View>
              )}
              <View style={styles.grandTotalRow}>
                <Text style={styles.grandTotalLabel}>TOTAL</Text>
                <Text style={styles.grandTotalValue}>{formatCurrency(total, currency)}</Text>
              </View>
            </View>
          </View>

          {/* Validity Notice */}
          <View style={styles.validityBox}>
            <Text style={styles.validityText}>
              Esta cotizacion es valida hasta el {formatDate(validUntil)}
            </Text>
          </View>

          {/* Terms and Conditions */}
          {termsConditions && (
            <View style={styles.termsSection}>
              <Text style={styles.termsTitle}>Terminos y Condiciones</Text>
              <View style={styles.termsList}>
                {termsConditions.split('\n').filter(t => t.trim()).map((term, idx) => (
                  <Text key={idx} style={styles.termsItem}>
                    {term.startsWith('*') || term.startsWith('-') || term.startsWith('•')
                      ? term
                      : `* ${term}`}
                  </Text>
                ))}
              </View>
            </View>
          )}

          {/* Notes */}
          {notes && (
            <View style={styles.notesSection}>
              <Text style={styles.notesTitle}>Notas Adicionales</Text>
              <Text style={styles.notesText}>{notes}</Text>
            </View>
          )}

          {/* Thank You Section */}
          <View style={styles.thankYouSection}>
            <View>
              <Text style={styles.thankYouText}>GRACIAS POR</Text>
              <Text style={styles.thankYouText}>SU PREFERENCIA</Text>
            </View>
            <View style={styles.signatureBox}>
              <View style={styles.signatureLine} />
              <Text style={styles.signatureName}>Med Luxe Clinic</Text>
            </View>
          </View>
        </View>

        {/* Bottom Decorative Bars */}
        <View style={styles.bottomDecoration}>
          <View style={styles.bottomBar1} />
          <View style={styles.bottomBar2} />
        </View>
      </Page>
    </Document>
  )
}
