export const dynamic = 'force-dynamic'

import { getProfessionals, getCommissions, getAttendanceLogs, getProfessionalStats } from '@/actions/professionals'
import { ProfesionalesClient } from './_components/profesionales-client'
import type {
  ProfessionalSummary,
  CommissionWithDetails,
  AttendanceLogWithDetails,
  EmploymentType,
  ProfessionalStatus,
  CommissionType,
  CommissionStatus,
  AttendanceStatus,
  SalaryType,
} from '@/types/professionals'

export default async function ProfesionalesPage() {
  const today = new Date().toISOString().split('T')[0]

  const [dbProfessionals, dbCommissions, dbAttendance, dbStats] = await Promise.all([
    getProfessionals(),
    getCommissions(),
    getAttendanceLogs({ date: today }),
    getProfessionalStats(),
  ])

  // Transform professionals data
  const professionals: ProfessionalSummary[] = dbProfessionals.map((p) => ({
    id: p.id,
    clinicId: p.clinic_id,
    userId: p.user_id,
    firstName: p.first_name,
    lastName: p.last_name,
    email: p.email,
    phone: p.phone,
    fullName: p.full_name,
    professionalCode: p.professional_code,
    licenseNumber: p.license_number,
    licenseExpiry: p.license_expiry,
    specialties: p.specialties || [],
    title: p.title,
    jobTitle: p.job_title,
    bio: p.bio,
    employmentType: (p.employment_type || 'employee') as EmploymentType,
    hireDate: p.hire_date,
    terminationDate: p.termination_date,
    baseSalary: p.base_salary,
    salaryType: (p.salary_type || 'monthly') as SalaryType,
    defaultCommissionRate: p.default_commission_rate || 0,
    commissionType: (p.commission_type || 'percentage') as CommissionType,
    maxDailyAppointments: p.max_daily_appointments || 20,
    appointmentBufferMinutes: p.appointment_buffer_minutes || 15,
    acceptsWalkIns: p.accepts_walk_ins ?? true,
    canViewAllPatients: p.can_view_all_patients ?? false,
    canModifyPrices: p.can_modify_prices ?? false,
    canGiveDiscounts: p.can_give_discounts ?? false,
    maxDiscountPercent: p.max_discount_percent || 0,
    status: (p.status || 'active') as ProfessionalStatus,
    profileImageUrl: p.profile_image_url,
    signatureImageUrl: p.signature_image_url,
    displayOrder: p.display_order || 0,
    showOnBooking: p.show_on_booking ?? true,
    appointmentsThisMonth: p.appointments_this_month || 0,
    revenueThisMonth: p.revenue_this_month || 0,
    averageRating: p.average_rating || 0,
    totalRatings: p.total_ratings || 0,
    treatmentsCount: p.treatments_count || 0,
    createdAt: p.created_at,
    updatedAt: p.updated_at,
  }))

  // Transform commissions data
  const commissions: CommissionWithDetails[] = dbCommissions.map((c) => ({
    id: c.id,
    clinicId: c.clinic_id,
    professionalId: c.professional_id,
    referenceType: c.reference_type as 'session' | 'sale' | 'sale_item' | 'package',
    referenceId: c.reference_id,
    commissionRuleId: c.commission_rule_id,
    baseAmount: c.base_amount || 0,
    commissionRate: c.commission_rate || 0,
    commissionAmount: c.commission_amount || 0,
    status: (c.status || 'pending') as CommissionStatus,
    periodStart: c.period_start,
    periodEnd: c.period_end,
    paymentDate: c.payment_date,
    paymentReference: c.payment_reference,
    notes: c.notes,
    createdAt: c.created_at,
    approvedAt: c.approved_at,
    approvedBy: c.approved_by,
    paidAt: c.paid_at,
    paidBy: c.paid_by,
    professionalName: c.professional_name,
    referenceDescription: c.reference_description,
  }))

  // Transform attendance data
  const attendance: AttendanceLogWithDetails[] = dbAttendance.map((a) => ({
    id: a.id,
    clinicId: a.clinic_id,
    professionalId: a.professional_id,
    branchId: a.branch_id,
    branchName: a.branch_name,
    date: a.date,
    clockIn: a.clock_in,
    clockInMethod: a.clock_in_method,
    clockInNotes: a.clock_in_notes,
    clockOut: a.clock_out,
    clockOutMethod: a.clock_out_method,
    clockOutNotes: a.clock_out_notes,
    breakMinutes: a.break_minutes || 0,
    scheduledHours: a.scheduled_hours,
    workedHours: a.worked_hours,
    overtimeHours: a.overtime_hours || 0,
    status: (a.status || 'present') as AttendanceStatus,
    notes: a.notes,
    createdAt: a.created_at,
    updatedAt: a.updated_at,
    approvedBy: a.approved_by,
    professionalName: a.professional_name,
  }))

  // Transform stats
  const stats = {
    total: dbStats.total,
    active: dbStats.active,
    pendingCommissions: dbStats.pending_commissions,
    pendingAmount: dbStats.pending_amount,
    monthRevenue: dbStats.month_revenue,
    monthAppointments: dbStats.month_appointments,
  }

  return (
    <ProfesionalesClient
      professionals={professionals}
      commissions={commissions}
      attendance={attendance}
      stats={stats}
    />
  )
}
