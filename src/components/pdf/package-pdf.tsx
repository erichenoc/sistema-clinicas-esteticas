'use client'

import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer'

// Med Luxe logo URL
const LOGO_URL = 'https://res.cloudinary.com/dbftvu8ab/image/upload/v1765430185/Med_Luxe_Logo_1_kohhy1.png'

// Brand colors
const colors = {
  primary: '#3c3731',
  primaryDark: '#2a2622',
  text: '#333333',
  gray: '#666666',
  border: '#e5e5e5',
  white: '#FFFFFF',
  green: '#16a34a',
  greenLight: '#dcfce7',
  tableHeader: '#f3f4f6',
  background: '#f9fafb',
}

const styles = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica',
    fontSize: 10,
    padding: 0,
    backgroundColor: colors.white,
  },
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
  headerSubtitle: {
    fontSize: 12,
    color: colors.white,
    marginTop: 4,
  },
  content: {
    padding: 30,
    paddingTop: 25,
  },
  packageNameBox: {
    backgroundColor: colors.background,
    borderRadius: 6,
    padding: 20,
    marginBottom: 20,
    alignItems: 'center',
  },
  packageName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 8,
  },
  packageType: {
    fontSize: 11,
    color: colors.gray,
    backgroundColor: colors.white,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 4,
  },
  packageDescription: {
    fontSize: 11,
    color: colors.gray,
    marginTop: 10,
    textAlign: 'center',
    lineHeight: 1.5,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 12,
    marginTop: 10,
  },
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
  colTreatment: { width: '55%' },
  colQty: { width: '15%', textAlign: 'center' },
  colPrice: { width: '30%', textAlign: 'right' },
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
  savingsBox: {
    backgroundColor: colors.greenLight,
    borderRadius: 6,
    padding: 12,
    marginBottom: 20,
    alignItems: 'center',
  },
  savingsText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: colors.green,
  },
  validityBox: {
    backgroundColor: colors.background,
    borderRadius: 6,
    padding: 12,
    marginBottom: 20,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 20,
  },
  validityItem: {
    alignItems: 'center',
  },
  validityLabel: {
    fontSize: 9,
    color: colors.gray,
    marginBottom: 4,
  },
  validityValue: {
    fontSize: 11,
    fontWeight: 'bold',
    color: colors.text,
  },
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
  footerCompany: {
    fontSize: 10,
    color: colors.white,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  footerAddress: {
    fontSize: 10,
    color: colors.white,
    textAlign: 'center',
  },
})

export interface PackagePDFData {
  name: string
  description?: string | null
  type: 'bundle' | 'sessions_pack'
  items: Array<{
    treatmentName: string
    quantity: number
    price: number
  }>
  regularPrice: number
  salePrice: number
  validityDays: number
  currency?: string
}

const formatCurrency = (amount: number, currency: string = 'DOP') => {
  const symbol = currency === 'DOP' ? 'RD$' : 'US$'
  return `${symbol}${amount.toLocaleString('es-DO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

export function PackagePDF({ data }: { data: PackagePDFData }) {
  const {
    name,
    description,
    type,
    items,
    regularPrice,
    salePrice,
    validityDays,
    currency = 'DOP',
  } = data

  const discount = regularPrice - salePrice
  const discountPercent = regularPrice > 0 ? Math.round((discount / regularPrice) * 100) : 0
  const totalSessions = items.reduce((sum, item) => sum + item.quantity, 0)

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.headerBar}>
          <Image src={LOGO_URL} style={styles.headerLogo} />
          <View style={styles.headerTitleSection}>
            <Text style={styles.headerTitle}>Paquete</Text>
            <Text style={styles.headerSubtitle}>
              {type === 'sessions_pack' ? 'Bono de Sesiones' : 'Pack Combinado'}
            </Text>
          </View>
        </View>

        {/* Content */}
        <View style={styles.content}>
          {/* Package Name Box */}
          <View style={styles.packageNameBox}>
            <Text style={styles.packageName}>{name}</Text>
            <Text style={styles.packageType}>
              {type === 'sessions_pack' ? 'Bono de Sesiones' : 'Pack Combinado'}
            </Text>
            {description && (
              <Text style={styles.packageDescription}>{description}</Text>
            )}
          </View>

          {/* Validity Info */}
          <View style={styles.validityBox}>
            <View style={styles.validityItem}>
              <Text style={styles.validityLabel}>SESIONES INCLUIDAS</Text>
              <Text style={styles.validityValue}>{totalSessions}</Text>
            </View>
            <View style={styles.validityItem}>
              <Text style={styles.validityLabel}>VIGENCIA</Text>
              <Text style={styles.validityValue}>{validityDays} dias</Text>
            </View>
            <View style={styles.validityItem}>
              <Text style={styles.validityLabel}>AHORRO</Text>
              <Text style={styles.validityValue}>{discountPercent}%</Text>
            </View>
          </View>

          {/* Treatments Table */}
          <Text style={styles.sectionTitle}>Tratamientos Incluidos</Text>
          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <Text style={[styles.tableHeaderCell, styles.colTreatment]}>Tratamiento</Text>
              <Text style={[styles.tableHeaderCell, styles.colQty]}>Cant.</Text>
              <Text style={[styles.tableHeaderCell, styles.colPrice]}>Valor</Text>
            </View>
            {items.map((item, index) => (
              <View key={index} style={styles.tableRow}>
                <Text style={[styles.tableCell, styles.colTreatment]}>{item.treatmentName}</Text>
                <Text style={[styles.tableCell, styles.colQty]}>{item.quantity}</Text>
                <Text style={[styles.tableCell, styles.colPrice]}>
                  {formatCurrency(item.price * item.quantity, currency)}
                </Text>
              </View>
            ))}
          </View>

          {/* Totals */}
          <View style={styles.totalsBox}>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Precio Regular:</Text>
              <Text style={[styles.totalValue, { textDecoration: 'line-through' }]}>
                {formatCurrency(regularPrice, currency)}
              </Text>
            </View>
            {discount > 0 && (
              <View style={styles.totalRow}>
                <Text style={[styles.totalLabel, { color: colors.green }]}>Descuento ({discountPercent}%):</Text>
                <Text style={[styles.totalValue, { color: colors.green }]}>
                  -{formatCurrency(discount, currency)}
                </Text>
              </View>
            )}
            <View style={styles.totalDivider} />
            <View style={styles.grandTotalRow}>
              <Text style={styles.grandTotalLabel}>Precio Paquete:</Text>
              <Text style={styles.grandTotalValue}>{formatCurrency(salePrice, currency)}</Text>
            </View>
          </View>

          {/* Savings Highlight */}
          {discount > 0 && (
            <View style={styles.savingsBox}>
              <Text style={styles.savingsText}>
                Ahorro Total: {formatCurrency(discount, currency)}
              </Text>
            </View>
          )}
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerQuestion}>Tienes preguntas? Contactanos</Text>
          <Text style={styles.footerEmail}>info@medluxeclinic.com</Text>
          <Text style={styles.footerPhone}>809-558-0911</Text>
          <Text style={styles.footerCompany}>Med Luxe Aesthetics & Wellness</Text>
          <Text style={styles.footerAddress}>
            Plaza Terranova Caribbean 2, Av. Barcelo, Punta Cana 23000, Republica Dominicana
          </Text>
        </View>
      </Page>
    </Document>
  )
}
