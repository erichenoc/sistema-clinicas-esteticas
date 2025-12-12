'use client'

import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer'

// Med Luxe logo URL
const LOGO_URL = 'https://res.cloudinary.com/dbftvu8ab/image/upload/v1765388675/Med_Luxe_Logo_zq8fsv.png'

// Brand colors matching the email template
const colors = {
  primary: '#A67C52',       // Med Luxe Gold
  primaryDark: '#8a6543',   // Gold dark for gradients
  dark: '#1f2937',          // Footer background
  text: '#333333',          // Main text
  gray: '#666666',          // Muted text
  lightGray: '#9ca3af',     // Light muted text
  border: '#e5e5e5',        // Border color
  white: '#FFFFFF',
  cream: '#fffbeb',         // Terms background (amber tint)
  creamBorder: '#f59e0b',   // Terms border (amber)
  creamText: '#92400e',     // Terms title
  creamTextDark: '#78350f', // Terms content
  tableHeader: '#f3f4f6',   // Table header background
  background: '#f9fafb',    // Section background
}

// Styles matching the email template exactly
const styles = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica',
    fontSize: 10,
    padding: 0,
    backgroundColor: colors.white,
  },

  // Header gradient bar (gold)
  headerBar: {
    height: 80,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 20,
    paddingBottom: 20,
  },
  headerLogo: {
    width: 120,
    height: 50,
    marginBottom: 5,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: colors.white,
    letterSpacing: 3,
  },
  headerSubtitle: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.9)',
    letterSpacing: 2,
    marginTop: 4,
  },

  // Main content
  content: {
    padding: 30,
    paddingTop: 25,
  },

  // Title section
  titleSection: {
    alignItems: 'center',
    marginBottom: 25,
  },
  mainTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 8,
  },
  quoteNumber: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.gray,
  },

  // Client info box
  clientBox: {
    backgroundColor: colors.background,
    borderRadius: 6,
    padding: 16,
    marginBottom: 20,
  },
  clientRow: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  clientLabel: {
    fontSize: 10,
    fontWeight: 'bold',
    color: colors.text,
    width: 80,
  },
  clientValue: {
    fontSize: 10,
    color: colors.text,
  },

  // Items table
  table: {
    marginBottom: 20,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: colors.tableHeader,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderBottomWidth: 2,
    borderBottomColor: colors.border,
  },
  tableHeaderCell: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#374151',
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  tableCell: {
    fontSize: 10,
    color: colors.text,
  },

  // Column widths
  colDescription: { width: '40%' },
  colQty: { width: '15%', textAlign: 'center' },
  colPrice: { width: '22%', textAlign: 'right' },
  colSubtotal: { width: '23%', textAlign: 'right' },

  // Totals section
  totalsBox: {
    backgroundColor: colors.background,
    borderRadius: 6,
    padding: 16,
    marginBottom: 20,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  totalLabel: {
    fontSize: 10,
    color: colors.gray,
  },
  totalValue: {
    fontSize: 10,
    color: colors.text,
  },
  totalDivider: {
    height: 2,
    backgroundColor: colors.border,
    marginVertical: 10,
  },
  grandTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 8,
  },
  grandTotalLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.text,
  },
  grandTotalValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.primary,
  },

  // Terms section (amber/cream box)
  termsBox: {
    backgroundColor: colors.cream,
    borderRadius: 6,
    padding: 14,
    borderLeftWidth: 4,
    borderLeftColor: colors.creamBorder,
    marginBottom: 20,
  },
  termsTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    color: colors.creamText,
    marginBottom: 8,
  },
  termsText: {
    fontSize: 10,
    color: colors.creamTextDark,
    lineHeight: 1.6,
  },

  // Footer
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.dark,
    padding: 20,
    alignItems: 'center',
  },
  footerQuestion: {
    fontSize: 11,
    color: colors.lightGray,
    marginBottom: 8,
  },
  footerEmail: {
    fontSize: 11,
    color: colors.primary,
    marginBottom: 6,
  },
  footerAddress: {
    fontSize: 10,
    color: colors.lightGray,
    textAlign: 'center',
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

export function QuotationPDF({ data }: { data: QuotationPDFData }) {
  const {
    quoteNumber,
    createdAt,
    validUntil,
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
    termsConditions,
  } = data

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header with Logo */}
        <View style={styles.headerBar}>
          <Image src={LOGO_URL} style={styles.headerLogo} />
        </View>

        {/* Main Content */}
        <View style={styles.content}>
          {/* Title Section */}
          <View style={styles.titleSection}>
            <Text style={styles.mainTitle}>Cotizacion</Text>
            <Text style={styles.quoteNumber}>{quoteNumber}</Text>
          </View>

          {/* Client Info Box */}
          <View style={styles.clientBox}>
            <View style={styles.clientRow}>
              <Text style={styles.clientLabel}>Cliente:</Text>
              <Text style={styles.clientValue}>{clientName}</Text>
            </View>
            <View style={styles.clientRow}>
              <Text style={styles.clientLabel}>Fecha:</Text>
              <Text style={styles.clientValue}>{formatDate(createdAt)}</Text>
            </View>
            <View style={styles.clientRow}>
              <Text style={styles.clientLabel}>Valida hasta:</Text>
              <Text style={styles.clientValue}>{formatDate(validUntil)}</Text>
            </View>
          </View>

          {/* Items Table */}
          <View style={styles.table}>
            {/* Table Header */}
            <View style={styles.tableHeader}>
              <Text style={[styles.tableHeaderCell, styles.colDescription]}>Descripcion</Text>
              <Text style={[styles.tableHeaderCell, styles.colQty]}>Cant.</Text>
              <Text style={[styles.tableHeaderCell, styles.colPrice]}>Precio</Text>
              <Text style={[styles.tableHeaderCell, styles.colSubtotal]}>Subtotal</Text>
            </View>

            {/* Table Rows */}
            {items.map((item, index) => (
              <View key={index} style={styles.tableRow}>
                <Text style={[styles.tableCell, styles.colDescription]}>{item.description}</Text>
                <Text style={[styles.tableCell, styles.colQty]}>{item.quantity}</Text>
                <Text style={[styles.tableCell, styles.colPrice]}>{formatCurrency(item.unitPrice, currency)}</Text>
                <Text style={[styles.tableCell, styles.colSubtotal]}>{formatCurrency(item.subtotal, currency)}</Text>
              </View>
            ))}
          </View>

          {/* Totals Box */}
          <View style={styles.totalsBox}>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Subtotal:</Text>
              <Text style={styles.totalValue}>{formatCurrency(subtotal + discountTotal, currency)}</Text>
            </View>
            {discountTotal > 0 && (
              <View style={styles.totalRow}>
                <Text style={[styles.totalLabel, { color: '#16a34a' }]}>Descuento:</Text>
                <Text style={[styles.totalValue, { color: '#16a34a' }]}>-{formatCurrency(discountTotal, currency)}</Text>
              </View>
            )}
            {taxRate > 0 && (
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>ITBIS ({taxRate}%):</Text>
                <Text style={styles.totalValue}>{formatCurrency(taxAmount, currency)}</Text>
              </View>
            )}
            <View style={styles.totalDivider} />
            <View style={styles.grandTotalRow}>
              <Text style={styles.grandTotalLabel}>Total:</Text>
              <Text style={styles.grandTotalValue}>{formatCurrency(total, currency)}</Text>
            </View>
          </View>

          {/* Terms and Conditions */}
          {termsConditions && (
            <View style={styles.termsBox}>
              <Text style={styles.termsTitle}>Terminos y Condiciones:</Text>
              <Text style={styles.termsText}>{termsConditions}</Text>
            </View>
          )}
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerQuestion}>Tienes preguntas? Contactanos</Text>
          <Text style={styles.footerEmail}>info@medluxeclinic.com</Text>
          <Text style={styles.footerAddress}>Med Luxe Aesthetics & Wellness</Text>
          <Text style={styles.footerAddress}>Santo Domingo, Republica Dominicana</Text>
        </View>
      </Page>
    </Document>
  )
}
