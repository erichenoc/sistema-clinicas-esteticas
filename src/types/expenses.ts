// Catalogo de categorias de gasto tal como las maneja la clinica.
// Vive fuera de las server actions porque los archivos 'use server' solo
// pueden exportar funciones async.

export type ExpenseCategoryKey =
  | 'servicios'
  | 'inversion'
  | 'nomina'
  | 'equipos'
  | 'mantenimiento'
  | 'impuestos'
  | 'marketing'
  | 'transporte'
  | 'otros'

export interface ExpenseCategoryDef {
  key: ExpenseCategoryKey
  label: string
  description: string
  /** Detalles sugeridos; el campo admite texto libre */
  subcategories: string[]
}

export const EXPENSE_CATEGORIES: ExpenseCategoryDef[] = [
  {
    key: 'servicios',
    label: 'Servicios',
    description: 'Renta, luz, agua, comunicaciones y limpieza',
    subcategories: [
      'Renta / Alquiler',
      'Electricidad',
      'Agua',
      'Internet',
      'Telefono',
      'Limpieza',
      'Seguridad',
      'Basura',
    ],
  },
  {
    key: 'inversion',
    label: 'Inversion',
    description: 'Compra de productos e insumos para inventario',
    subcategories: [
      'Productos para reventa',
      'Insumos de tratamiento',
      'Inyectables',
      'Material desechable',
      'Cosmetica profesional',
    ],
  },
  {
    key: 'nomina',
    label: 'Nomina',
    description: 'Sueldos y pagos a empleados',
    subcategories: [
      'Sueldos fijos',
      'Comisiones',
      'Bonificaciones',
      'Regalia pascual',
      'TSS / Seguridad social',
      'Personal temporal',
    ],
  },
  {
    key: 'equipos',
    label: 'Equipos',
    description: 'Aparatos, mobiliario y activos fijos',
    subcategories: ['Aparatologia', 'Mobiliario', 'Computadoras', 'Instrumental'],
  },
  {
    key: 'mantenimiento',
    label: 'Mantenimiento',
    description: 'Reparaciones y mantenimiento de equipos o local',
    subcategories: ['Mantenimiento de equipos', 'Reparaciones del local', 'Aires acondicionados'],
  },
  {
    key: 'impuestos',
    label: 'Impuestos',
    description: 'DGII, arbitrios y tasas',
    subcategories: ['ITBIS', 'ISR', 'Anticipos', 'Arbitrios municipales'],
  },
  {
    key: 'marketing',
    label: 'Marketing',
    description: 'Publicidad, redes sociales y promocion',
    subcategories: ['Publicidad pagada', 'Disenos', 'Influencers', 'Material promocional'],
  },
  {
    key: 'transporte',
    label: 'Transporte',
    description: 'Combustible, delivery y mensajeria',
    subcategories: ['Combustible', 'Delivery', 'Mensajeria', 'Peajes'],
  },
  {
    key: 'otros',
    label: 'Otros',
    description: 'Gastos que no encajan en las demas categorias',
    subcategories: [],
  },
]

export const EXPENSE_CATEGORY_LABELS: Record<ExpenseCategoryKey, string> = EXPENSE_CATEGORIES.reduce(
  (acc, c) => ({ ...acc, [c.key]: c.label }),
  {} as Record<ExpenseCategoryKey, string>
)

export function getCategoryDef(key: string): ExpenseCategoryDef | undefined {
  return EXPENSE_CATEGORIES.find((c) => c.key === key)
}

export const EXPENSE_STATUS_LABELS: Record<string, string> = {
  pending: 'Pendiente',
  partial: 'Abonado',
  paid: 'Pagado',
  cancelled: 'Anulado',
}

export const EXPENSE_PAYMENT_METHOD_LABELS: Record<string, string> = {
  cash: 'Efectivo',
  card: 'Tarjeta',
  transfer: 'Transferencia',
  check: 'Cheque',
  other: 'Otro',
}
