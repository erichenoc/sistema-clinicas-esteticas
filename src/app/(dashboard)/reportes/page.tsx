export const dynamic = 'force-dynamic'

import { getAllReportData } from '@/actions/reports'
import { ReportesClient } from './_components/reportes-client'

export default async function ReportesPage() {
  const data = await getAllReportData('month')

  return (
    <ReportesClient
      financialSummary={data.financialSummary}
      revenueByCategory={data.revenueByCategory}
      monthlyRevenue={data.monthlyRevenue}
      patientStats={data.patientStats}
      patientsByAgeGroup={data.patientsByAgeGroup}
      topTreatments={data.topTreatments}
      appointmentStats={data.appointmentStats}
      professionalPerformance={data.professionalPerformance}
      inventoryAlerts={data.inventoryAlerts}
      inventoryStats={data.inventoryStats}
    />
  )
}
