'use server'

import { createAdminClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { Patient } from '@/types/database'

// Get all patients for listing
export async function getPatients(): Promise<Patient[]> {
  const supabase = createAdminClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('patients')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching patients:', error)
    return []
  }

  return (data || []) as Patient[]
}

export interface MedicalHistoryData {
  id?: string
  patient_id: string
  allergies: string[]
  current_medications: string[]
  chronic_conditions: string[]
  previous_surgeries: string[]
  previous_aesthetic_treatments: string[]
  is_pregnant: boolean
  is_breastfeeding: boolean
  uses_retinoids: boolean
  sun_exposure_level: string
  additional_notes: string
}

export async function getMedicalHistory(patientId: string) {
  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from('patient_medical_history')
    .select('*')
    .eq('patient_id', patientId)
    .single()

  if (error && error.code !== 'PGRST116') {
    console.error('Error fetching medical history:', error)
    return null
  }

  return data
}

export async function saveMedicalHistory(data: MedicalHistoryData) {
  const supabase = createAdminClient()

  // Check if medical history already exists for this patient
  const { data: existing } = await supabase
    .from('patient_medical_history')
    .select('id')
    .eq('patient_id', data.patient_id)
    .single()

  let result

  const updateData = {
    allergies: data.allergies,
    current_medications: data.current_medications,
    chronic_conditions: data.chronic_conditions,
    previous_surgeries: data.previous_surgeries,
    previous_aesthetic_treatments: data.previous_aesthetic_treatments,
    is_pregnant: data.is_pregnant,
    is_breastfeeding: data.is_breastfeeding,
    uses_retinoids: data.uses_retinoids,
    sun_exposure_level: data.sun_exposure_level,
    additional_notes: data.additional_notes,
    updated_at: new Date().toISOString(),
  }

  if (existing) {
    // Update existing record
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    result = await (supabase as any)
      .from('patient_medical_history')
      .update(updateData)
      .eq('patient_id', data.patient_id)
      .select()
      .single()
  } else {
    // Insert new record
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    result = await (supabase as any)
      .from('patient_medical_history')
      .insert({
        patient_id: data.patient_id,
        ...updateData,
      })
      .select()
      .single()
  }

  if (result.error) {
    console.error('Error saving medical history:', result.error)
    throw new Error('Error al guardar el historial médico')
  }

  revalidatePath(`/pacientes/${data.patient_id}`)

  return result.data
}

export async function getPatientWithMedicalHistory(patientId: string) {
  const supabase = createAdminClient()

  const { data: patient, error: patientError } = await supabase
    .from('patients')
    .select('*')
    .eq('id', patientId)
    .single()

  if (patientError || !patient) {
    console.error('Error fetching patient:', patientError)
    return null
  }

  const { data: medicalHistory } = await supabase
    .from('patient_medical_history')
    .select('*')
    .eq('patient_id', patientId)
    .single()

  return {
    ...(patient as Record<string, unknown>),
    medicalHistory: medicalHistory || null,
  }
}
