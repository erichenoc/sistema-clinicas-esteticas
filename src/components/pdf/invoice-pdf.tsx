'use client'

import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer'

// Med Luxe logo URL (new logo with transparent background)
const LOGO_URL = 'https://res.cloudinary.com/dbftvu8ab/image/upload/v1765430185/Med_Luxe_Logo_1_kohhy1.png'

// Brand colors matching the email template
const colors = {
  primary: '#A67C52',       // Med Luxe Gold
  primaryDark: '#8a6543',   // Gold dark for gradients
  dark: '#1f2937',          // Dark background
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
  red: '#dc2626',           // Cancelled/Overdue
  green: '#16a34a',         // Paid
}

// Styles matching the email template exactly
const styles = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica',
    fontSize: 10,
    padding: 0,
    backgroundColor: colors.white,
  },

  // Header bar (gold background)
  headerBar: {
    height: 90,
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 30,
  },
  headerLogo: {
    width: 160,
    height: 65,
  },
  headerTitleSection: {
    alignItems: 'flex-end',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: colors.white,
    letterSpacing: 2,
  },
  headerInvoiceNumber: {
    fontSize: 12,
    color: colors.white,
    marginTop: 4,
  },

  // Main content
  content: {
    padding: 30,
    paddingTop: 25,
  },

  // Status badge
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 4,
    alignSelf: 'flex-start',
    marginBottom: 15,
  },
  statusText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: colors.white,
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
    width: 100,
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

  // Payment info box
  paymentBox: {
    backgroundColor: colors.cream,
    borderRadius: 6,
    padding: 14,
    borderLeftWidth: 4,
    borderLeftColor: colors.green,
    marginBottom: 20,
  },
  paymentTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    color: colors.green,
    marginBottom: 8,
  },
  paymentText: {
    fontSize: 10,
    color: colors.text,
    lineHeight: 1.6,
  },

  // Notes section
  notesBox: {
    backgroundColor: colors.background,
    borderRadius: 6,
    padding: 14,
    marginBottom: 20,
  },
  notesTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 8,
  },
  notesText: {
    fontSize: 10,
    color: colors.gray,
    lineHeight: 1.6,
  },

  // Footer (gold background with white text)
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.primary,
    padding: 20,
    alignItems: 'center',
  },
  footerQuestion: {
    fontSize: 11,
    color: colors.white,
    marginBottom: 8,
  },
  footerEmail: {
    fontSize: 11,
    color: colors.white,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  footerPhone: {
    fontSize: 11,
    color: colors.white,
    marginBottom: 6,
  },
  footerAddress: {
    fontSize: 10,
    color: colors.white,
    textAlign: 'center',
  },
  footerCompany: {
    fontSize: 10,
    color: colors.white,
    fontWeight: 'bold',
    marginBottom: 4,
  },
})

export interface InvoicePDFData {
  invoiceNumber: string
  ncf?: string
  issueDate: string
  dueDate?: string
  status: string
  // Client
  clientName: string
  clientEmail?: string
  clientPhone?: string
  clientRnc?: string
  clientAddress?: string
  // Items
  items: Array<{
    description: string
    quantity: number
    unitPrice: number
    total: number
  }>
  // Totals
  subtotal: number
  discountAmount: number
  taxAmount: number
  total: number
  paidAmount: number
  amountDue: number
  currency: string
  // Content
  notes?: string
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

const getStatusColor = (status: string) => {
  switch (status) {
    case 'paid':
      return colors.green
    case 'cancelled':
      return colors.gray
    case 'overdue':
      return colors.red
    case 'partial':
      return '#f59e0b'
    default:
      return colors.primary
  }
}

const getStatusLabel = (status: string) => {
  switch (status) {
    case 'pending':
      return 'Pendiente'
    case 'paid':
      return 'Pagada'
    case 'partial':
      return 'Pago Parcial'
    case 'overdue':
      return 'Vencida'
    case 'cancelled':
      return 'Anulada'
    default:
      return status
  }
}

export function InvoicePDF({ data }: { data: InvoicePDFData }) {
  const {
    invoiceNumber,
    ncf,
    issueDate,
    dueDate,
    status,
    clientName,
    clientEmail,
    clientPhone,
    clientRnc,
    clientAddress,
    items,
    subtotal,
    discountAmount,
    taxAmount,
    total,
    paidAmount,
    amountDue,
    currency,
    notes,
  } = data

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header with Logo and Title on right */}
        <View style={styles.headerBar}>
          <Image src={LOGO_URL} style={styles.headerLogo} />
          <View style={styles.headerTitleSection}>
            <Text style={styles.headerTitle}>Factura</Text>
            <Text style={styles.headerInvoiceNumber}>{invoiceNumber}</Text>
          </View>
        </View>

        {/* Main Content */}
        <View style={styles.content}>
          {/* Status Badge */}
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(status) }]}>
            <Text style={styles.statusText}>{getStatusLabel(status)}</Text>
          </View>

          {/* Client Info Box */}
          <View style={styles.clientBox}>
            <View style={styles.clientRow}>
              <Text style={styles.clientLabel}>Cliente:</Text>
              <Text style={styles.clientValue}>{clientName}</Text>
            </View>
            {clientRnc && (
              <View style={styles.clientRow}>
                <Text style={styles.clientLabel}>RNC/Cedula:</Text>
                <Text style={styles.clientValue}>{clientRnc}</Text>
              </View>
            )}
            {clientPhone && (
              <View style={styles.clientRow}>
                <Text style={styles.clientLabel}>Telefono:</Text>
                <Text style={styles.clientValue}>{clientPhone}</Text>
              </View>
            )}
            {clientEmail && (
              <View style={styles.clientRow}>
                <Text style={styles.clientLabel}>Correo:</Text>
                <Text style={styles.clientValue}>{clientEmail}</Text>
              </View>
            )}
            {clientAddress && (
              <View style={styles.clientRow}>
                <Text style={styles.clientLabel}>Direccion:</Text>
                <Text style={styles.clientValue}>{clientAddress}</Text>
              </View>
            )}
            <View style={styles.clientRow}>
              <Text style={styles.clientLabel}>Fecha Emision:</Text>
              <Text style={styles.clientValue}>{formatDate(issueDate)}</Text>
            </View>
            {dueDate && (
              <View style={styles.clientRow}>
                <Text style={styles.clientLabel}>Vencimiento:</Text>
                <Text style={styles.clientValue}>{formatDate(dueDate)}</Text>
              </View>
            )}
            {ncf && (
              <View style={styles.clientRow}>
                <Text style={styles.clientLabel}>NCF:</Text>
                <Text style={[styles.clientValue, { fontWeight: 'bold' }]}>{ncf}</Text>
              </View>
            )}
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
            {items.length > 0 ? (
              items.map((item, index) => (
                <View key={index} style={styles.tableRow}>
                  <Text style={[styles.tableCell, styles.colDescription]}>{item.description}</Text>
                  <Text style={[styles.tableCell, styles.colQty]}>{item.quantity}</Text>
                  <Text style={[styles.tableCell, styles.colPrice]}>{formatCurrency(item.unitPrice, currency)}</Text>
                  <Text style={[styles.tableCell, styles.colSubtotal]}>{formatCurrency(item.total, currency)}</Text>
                </View>
              ))
            ) : (
              <View style={styles.tableRow}>
                <Text style={[styles.tableCell, { width: '100%', textAlign: 'center', color: colors.gray }]}>
                  No hay items en esta factura
                </Text>
              </View>
            )}
          </View>

          {/* Totals Box */}
          <View style={styles.totalsBox}>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Subtotal:</Text>
              <Text style={styles.totalValue}>{formatCurrency(subtotal, currency)}</Text>
            </View>
            {discountAmount > 0 && (
              <View style={styles.totalRow}>
                <Text style={[styles.totalLabel, { color: colors.green }]}>Descuento:</Text>
                <Text style={[styles.totalValue, { color: colors.green }]}>-{formatCurrency(discountAmount, currency)}</Text>
              </View>
            )}
            {taxAmount > 0 && (
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>ITBIS (18%):</Text>
                <Text style={styles.totalValue}>{formatCurrency(taxAmount, currency)}</Text>
              </View>
            )}
            <View style={styles.totalDivider} />
            <View style={styles.grandTotalRow}>
              <Text style={styles.grandTotalLabel}>Total:</Text>
              <Text style={styles.grandTotalValue}>{formatCurrency(total, currency)}</Text>
            </View>
            {paidAmount > 0 && (
              <>
                <View style={[styles.totalRow, { marginTop: 10 }]}>
                  <Text style={[styles.totalLabel, { color: colors.green }]}>Total Pagado:</Text>
                  <Text style={[styles.totalValue, { color: colors.green }]}>{formatCurrency(paidAmount, currency)}</Text>
                </View>
                <View style={styles.totalRow}>
                  <Text style={[styles.totalLabel, { fontWeight: 'bold' }]}>Saldo Pendiente:</Text>
                  <Text style={[styles.totalValue, { fontWeight: 'bold', color: amountDue > 0 ? colors.red : colors.green }]}>
                    {formatCurrency(amountDue, currency)}
                  </Text>
                </View>
              </>
            )}
          </View>

          {/* Notes */}
          {notes && (
            <View style={styles.notesBox}>
              <Text style={styles.notesTitle}>Notas:</Text>
              <Text style={styles.notesText}>{notes}</Text>
            </View>
          )}
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerQuestion}>Tienes preguntas? Contactanos</Text>
          <Text style={styles.footerEmail}>info@medluxeclinic.com</Text>
          <Text style={styles.footerPhone}>809-558-0911</Text>
          <Text style={styles.footerCompany}>Med Luxe Aesthetics & Wellness</Text>
          <Text style={styles.footerAddress}>Plaza Terranova Caribbean 2, Av. Barcelo, Punta Cana 23000, Republica Dominicana</Text>
        </View>
      </Page>
    </Document>
  )
}
