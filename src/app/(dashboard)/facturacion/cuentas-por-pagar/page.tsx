import { redirect } from 'next/navigation'

// Esta pantalla mostraba datos inventados en el codigo (proveedores y montos que
// no existian en la base de datos). Se reemplazo por /facturacion/gastos, que
// trabaja contra las tablas reales `expenses` y `expense_payments`.
export default function CuentasPorPagarPage() {
  redirect('/facturacion/gastos')
}
