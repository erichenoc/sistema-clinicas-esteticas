'use client'

import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer'

// Med Luxe logo URL (new logo with transparent background)
export const LOGO_URL = 'https://res.cloudinary.com/dbftvu8ab/image/upload/v1765430185/Med_Luxe_Logo_1_kohhy1.png'

// Brand colors — Med Luxe official palette
const colors = {
  // Primary: warm golden/bronze
  primary: '#eaa86a',       // Golden bronze (header/footer/accents)
  primaryDark: '#d4935a',   // Darker golden for hover/borders
  // Sage family (section accents)
  sage: '#93beb8',          // Sage teal
  sageLighter: '#d4e5e3',   // Light sage background
  sageLight: '#e9f2f1',     // Very light sage
  // Warm beige family (backgrounds)
  warmBeige: '#eeb988',     // Warm accent
  warmLight: '#fbeee1',     // Light warm background
  warmLighter: '#f7dcc3',   // Lighter warm
  // Rose family (subtle accents)
  roseLight: '#f1c6d9',     // Light rose
  // Neutrals
  text: '#3a3028',          // Dark warm text
  gray: '#7a6e66',          // Muted warm gray
  border: '#e8ddd5',        // Warm border
  white: '#FFFFFF',
}

const styles = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica',
    fontSize: 10,
    padding: 0,
    backgroundColor: colors.white,
  },

  // Header bar
  headerBar: {
    height: 110,
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 30,
  },
  headerLogo: {
    width: 220,
    height: 90,
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
  headerQuoteNumber: {
    fontSize: 12,
    color: colors.white,
    marginTop: 4,
  },

  // Main content — paddingBottom reserves space for footer
  content: {
    padding: 30,
    paddingTop: 25,
    paddingBottom: 100,
  },

  // Client info box
  clientBox: {
    backgroundColor: colors.warmLight,
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
    backgroundColor: colors.sageLighter,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderBottomWidth: 2,
    borderBottomColor: colors.sage,
  },
  tableHeaderCell: {
    fontSize: 10,
    fontWeight: 'bold',
    color: colors.text,
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
    backgroundColor: colors.warmLight,
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
    height: 1,
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

  // Bank accounts section — sage palette
  bankBox: {
    backgroundColor: colors.sageLight,
    borderRadius: 6,
    padding: 14,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: colors.sageLighter,
  },
  bankTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: colors.text,
    textAlign: 'center',
    marginBottom: 12,
  },
  bankGrid: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  bankAccount: {
    width: '50%',
    paddingHorizontal: 8,
  },
  bankType: {
    fontSize: 8,
    fontWeight: 'bold',
    color: colors.sage,
    marginBottom: 2,
  },
  bankName: {
    fontSize: 9,
    color: colors.text,
    marginBottom: 1,
  },
  bankNumber: {
    fontSize: 10,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 1,
  },
  bankHolder: {
    fontSize: 9,
    color: colors.gray,
    marginBottom: 1,
  },

  // Terms section — warm palette
  termsBox: {
    backgroundColor: colors.warmLight,
    borderRadius: 6,
    padding: 14,
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
    marginBottom: 20,
  },
  termsTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    color: colors.primaryDark,
    marginBottom: 8,
  },
  termsText: {
    fontSize: 10,
    color: colors.text,
    lineHeight: 1.6,
  },

  // Exchange rate note — sage palette
  exchangeRateBox: {
    backgroundColor: colors.sageLight,
    borderRadius: 6,
    padding: 10,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: colors.sage,
  },
  exchangeRateText: {
    fontSize: 9,
    color: colors.text,
    lineHeight: 1.5,
  },

  // Footer — fixed at bottom of every page
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.primary,
    paddingVertical: 16,
    paddingHorizontal: 30,
    alignItems: 'center',
  },
  footerQuestion: {
    fontSize: 10,
    color: colors.white,
    marginBottom: 4,
  },
  footerEmail: {
    fontSize: 10,
    color: colors.white,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  footerPhone: {
    fontSize: 10,
    color: colors.white,
    marginBottom: 4,
  },
  footerAddress: {
    fontSize: 9,
    color: colors.white,
    textAlign: 'center',
  },
  footerCompany: {
    fontSize: 10,
    color: colors.white,
    fontWeight: 'bold',
    marginBottom: 2,
  },
})

export interface QuotationPDFData {
  logoSrc?: string
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
  exchangeRate?: number
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
    clientAddress,
    items,
    subtotal,
    discountTotal,
    taxRate,
    taxAmount,
    total,
    currency,
    termsConditions,
    logoSrc,
  } = data

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header with Logo and Title on right */}
        <View style={styles.headerBar}>
          <Image src={logoSrc || LOGO_URL} style={styles.headerLogo} />
          <View style={styles.headerTitleSection}>
            <Text style={styles.headerTitle}>Cotizacion</Text>
            <Text style={styles.headerQuoteNumber}>{quoteNumber}</Text>
          </View>
        </View>

        {/* Main Content */}
        <View style={styles.content}>
          {/* Client Info Box - All client data */}
          <View style={styles.clientBox}>
            <View style={styles.clientRow}>
              <Text style={styles.clientLabel}>Cliente:</Text>
              <Text style={styles.clientValue}>{clientName}</Text>
            </View>
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

          {/* Bank Accounts */}
          <View style={styles.bankBox}>
            <Text style={styles.bankTitle}>Cuentas Bancarias para Deposito</Text>
            <View style={styles.bankGrid}>
              <View style={styles.bankAccount}>
                <Text style={styles.bankType}>CUENTA DE AHORRO PESOS</Text>
                <Text style={styles.bankName}>Banco Popular</Text>
                <Text style={styles.bankNumber}>767971302</Text>
                <Text style={styles.bankHolder}>Pamela Moquete</Text>
              </View>
              <View style={styles.bankAccount}>
                <Text style={styles.bankType}>CUENTA DE AHORRO DOLARES</Text>
                <Text style={styles.bankName}>Banco Popular</Text>
                <Text style={styles.bankNumber}>796346815</Text>
                <Text style={styles.bankHolder}>Pamela Moquete</Text>
              </View>
            </View>
            <View style={styles.bankGrid}>
              <View style={styles.bankAccount}>
                <Text style={styles.bankType}>CUENTA DE AHORRO PESOS</Text>
                <Text style={styles.bankName}>Banco BHD</Text>
                <Text style={styles.bankNumber}>28002530016</Text>
                <Text style={styles.bankHolder}>CED 03700989902</Text>
                <Text style={styles.bankHolder}>Pamela Moquete</Text>
              </View>
              <View style={styles.bankAccount}>
                <Text style={styles.bankType}>CUENTA CORRIENTE EN PESOS</Text>
                <Text style={styles.bankName}>Banco de Reservas</Text>
                <Text style={styles.bankNumber}>0330034138</Text>
                <Text style={styles.bankHolder}>CED 03700989902</Text>
                <Text style={styles.bankHolder}>Pamela Moquete</Text>
              </View>
            </View>
          </View>

          {/* Exchange Rate Note (USD only) */}
          {currency === 'USD' && data.exchangeRate && (
            <View style={styles.exchangeRateBox}>
              <Text style={styles.exchangeRateText}>
                Tasa de cambio aplicada: 1 USD = RD${data.exchangeRate.toFixed(2)}{'\n'}
                Los precios en dolares (USD) pueden variar segun la tasa de cambio vigente al momento del pago.
              </Text>
            </View>
          )}

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
          <Text style={styles.footerPhone}>809-558-0911</Text>
          <Text style={styles.footerCompany}>Med Luxe Aesthetics & Wellness</Text>
          <Text style={styles.footerAddress}>Plaza Terranova Caribbean 2, Av. Barcelo, Punta Cana 23000, Republica Dominicana</Text>
        </View>
      </Page>
    </Document>
  )
}
