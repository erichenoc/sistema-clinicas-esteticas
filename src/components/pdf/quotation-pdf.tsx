'use client'

import { Document, Page, Text, View, StyleSheet, Font } from '@react-pdf/renderer'

// Register fonts (using system fonts that work in PDF)
Font.register({
  family: 'Helvetica',
  fonts: [
    { src: 'Helvetica' },
    { src: 'Helvetica-Bold', fontWeight: 'bold' },
  ],
})

// Brand colors - Med Luxe official palette
const colors = {
  primary: '#A67C52',       // Med Luxe Gold
  primaryLight: '#c9a67a',  // Gold light
  primaryDark: '#8a6543',   // Gold dark
  secondary: '#93beb8',     // Med Luxe Teal
  accent: '#e8a0c0',        // Med Luxe Rose
  cream: '#fbeee1',         // Med Luxe Cream
  warmGray: '#998577',      // Med Luxe Warm Gray
  dark: '#3d3d3d',          // Main text
  gray: '#737373',          // Muted text
  lightGray: '#f5f3f0',     // Light background
  border: '#e8e4df',        // Border color
  white: '#FFFFFF',
  background: '#FDFCFA',    // Page background
  success: '#10b981',       // Green for positive numbers
}

// Styles
const styles = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica',
    fontSize: 10,
    padding: 40,
    backgroundColor: colors.background,
  },
  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 30,
    paddingBottom: 20,
    borderBottomWidth: 2,
    borderBottomColor: colors.primary,
  },
  logoContainer: {
    flexDirection: 'column',
  },
  logoText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.primary,
    letterSpacing: 2,
  },
  logoSubtext: {
    fontSize: 8,
    color: colors.gray,
    letterSpacing: 1,
    marginTop: 2,
  },
  quoteInfo: {
    alignItems: 'flex-end',
  },
  quoteTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.dark,
  },
  quoteNumber: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: 'bold',
    marginTop: 4,
  },
  quoteDate: {
    fontSize: 9,
    color: colors.gray,
    marginTop: 4,
  },

  // Client and Company Info
  infoSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 25,
  },
  infoBox: {
    width: '48%',
  },
  infoLabel: {
    fontSize: 8,
    color: colors.gray,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 6,
  },
  infoCard: {
    backgroundColor: colors.lightGray,
    padding: 12,
    borderRadius: 4,
  },
  infoName: {
    fontSize: 11,
    fontWeight: 'bold',
    color: colors.dark,
    marginBottom: 4,
  },
  infoText: {
    fontSize: 9,
    color: colors.gray,
    marginBottom: 2,
  },

  // Items Table
  table: {
    marginBottom: 25,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: colors.primary,
    padding: 10,
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
  },
  tableHeaderCell: {
    color: colors.white,
    fontSize: 9,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    padding: 10,
  },
  tableRowAlt: {
    backgroundColor: colors.lightGray,
  },
  tableCell: {
    fontSize: 9,
    color: colors.dark,
  },
  tableCellGray: {
    fontSize: 9,
    color: colors.gray,
  },

  // Column widths
  colDescription: { width: '40%' },
  colQty: { width: '10%', textAlign: 'center' },
  colPrice: { width: '18%', textAlign: 'right' },
  colDiscount: { width: '14%', textAlign: 'right' },
  colSubtotal: { width: '18%', textAlign: 'right' },

  // Totals Section
  totalsSection: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: 25,
  },
  totalsBox: {
    width: '45%',
    backgroundColor: colors.lightGray,
    padding: 15,
    borderRadius: 4,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  totalLabel: {
    fontSize: 9,
    color: colors.gray,
  },
  totalValue: {
    fontSize: 9,
    color: colors.dark,
  },
  discountValue: {
    fontSize: 9,
    color: colors.success,
  },
  grandTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
    paddingTop: 10,
    borderTopWidth: 2,
    borderTopColor: colors.primary,
  },
  grandTotalLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    color: colors.dark,
  },
  grandTotalValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.primary,
  },

  // Validity & Notes
  validitySection: {
    marginBottom: 20,
    padding: 12,
    backgroundColor: colors.cream,
    borderRadius: 4,
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
  },
  validityText: {
    fontSize: 9,
    color: colors.primaryDark,
    fontWeight: 'bold',
  },

  notesSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 10,
    fontWeight: 'bold',
    color: colors.dark,
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  notesText: {
    fontSize: 9,
    color: colors.gray,
    lineHeight: 1.5,
  },

  termsSection: {
    marginBottom: 25,
    padding: 12,
    backgroundColor: colors.lightGray,
    borderRadius: 4,
  },
  termsText: {
    fontSize: 8,
    color: colors.gray,
    lineHeight: 1.6,
  },

  // Footer
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    textAlign: 'center',
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  footerText: {
    fontSize: 8,
    color: colors.gray,
    marginBottom: 2,
  },
  footerLink: {
    fontSize: 8,
    color: colors.primary,
  },

  // Status Badge
  statusBadge: {
    position: 'absolute',
    top: 40,
    right: 40,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
    backgroundColor: colors.primary,
  },
  statusText: {
    fontSize: 8,
    color: colors.white,
    fontWeight: 'bold',
    textTransform: 'uppercase',
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
        {/* Status Badge */}
        {status !== 'draft' && (
          <View style={styles.statusBadge}>
            <Text style={styles.statusText}>{getStatusLabel(status)}</Text>
          </View>
        )}

        {/* Header */}
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <Text style={styles.logoText}>MED LUXE</Text>
            <Text style={styles.logoSubtext}>AESTHETICS & WELLNESS</Text>
          </View>
          <View style={styles.quoteInfo}>
            <Text style={styles.quoteTitle}>COTIZACION</Text>
            <Text style={styles.quoteNumber}>{quoteNumber}</Text>
            <Text style={styles.quoteDate}>Fecha: {formatDate(createdAt)}</Text>
          </View>
        </View>

        {/* Client and Company Info */}
        <View style={styles.infoSection}>
          <View style={styles.infoBox}>
            <Text style={styles.infoLabel}>Cliente</Text>
            <View style={styles.infoCard}>
              <Text style={styles.infoName}>{clientName}</Text>
              {clientEmail && <Text style={styles.infoText}>{clientEmail}</Text>}
              {clientPhone && <Text style={styles.infoText}>{clientPhone}</Text>}
            </View>
          </View>
          <View style={styles.infoBox}>
            <Text style={styles.infoLabel}>Emitido por</Text>
            <View style={styles.infoCard}>
              <Text style={styles.infoName}>Med Luxe Aesthetics & Wellness</Text>
              <Text style={styles.infoText}>info@medluxeclinic.com</Text>
              <Text style={styles.infoText}>Santo Domingo, Rep. Dominicana</Text>
            </View>
          </View>
        </View>

        {/* Items Table */}
        <View style={styles.table}>
          {/* Table Header */}
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderCell, styles.colDescription]}>Descripcion</Text>
            <Text style={[styles.tableHeaderCell, styles.colQty]}>Cant.</Text>
            <Text style={[styles.tableHeaderCell, styles.colPrice]}>Precio Unit.</Text>
            <Text style={[styles.tableHeaderCell, styles.colDiscount]}>Descuento</Text>
            <Text style={[styles.tableHeaderCell, styles.colSubtotal]}>Subtotal</Text>
          </View>

          {/* Table Rows */}
          {items.map((item, index) => (
            <View key={index} style={[styles.tableRow, index % 2 === 1 ? styles.tableRowAlt : {}]}>
              <Text style={[styles.tableCell, styles.colDescription]}>{item.description}</Text>
              <Text style={[styles.tableCell, styles.colQty]}>{item.quantity}</Text>
              <Text style={[styles.tableCell, styles.colPrice]}>{formatCurrency(item.unitPrice, currency)}</Text>
              <Text style={[styles.tableCellGray, styles.colDiscount]}>
                {item.discount > 0
                  ? item.discountType === 'percentage'
                    ? `${item.discount}%`
                    : formatCurrency(item.discount, currency)
                  : '-'}
              </Text>
              <Text style={[styles.tableCell, styles.colSubtotal]}>{formatCurrency(item.subtotal, currency)}</Text>
            </View>
          ))}
        </View>

        {/* Totals */}
        <View style={styles.totalsSection}>
          <View style={styles.totalsBox}>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Subtotal</Text>
              <Text style={styles.totalValue}>{formatCurrency(subtotal + discountTotal, currency)}</Text>
            </View>
            {discountTotal > 0 && (
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Descuento</Text>
                <Text style={styles.discountValue}>-{formatCurrency(discountTotal, currency)}</Text>
              </View>
            )}
            {taxRate > 0 && (
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>ITBIS ({taxRate}%)</Text>
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
        <View style={styles.validitySection}>
          <Text style={styles.validityText}>
            Esta cotizacion es valida hasta el {formatDate(validUntil)}
          </Text>
        </View>

        {/* Notes */}
        {notes && (
          <View style={styles.notesSection}>
            <Text style={styles.sectionTitle}>Notas</Text>
            <Text style={styles.notesText}>{notes}</Text>
          </View>
        )}

        {/* Terms and Conditions */}
        {termsConditions && (
          <View style={styles.termsSection}>
            <Text style={styles.sectionTitle}>Terminos y Condiciones</Text>
            <Text style={styles.termsText}>{termsConditions}</Text>
          </View>
        )}

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>Med Luxe Aesthetics & Wellness</Text>
          <Text style={styles.footerText}>Santo Domingo, Republica Dominicana</Text>
          <Text style={styles.footerLink}>www.medluxeclinic.com | info@medluxeclinic.com</Text>
        </View>
      </Page>
    </Document>
  )
}
