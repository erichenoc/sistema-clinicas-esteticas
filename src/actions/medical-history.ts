'use server'

import { createAdminClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

// Get all patients for listing
export async function getPatients() {
  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from('patients')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching patients:', error)
    return []
  }

  return data || []
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

  if (existing) {
    // Update existing record
    result = await supabase
      .from('patient_medical_history')
      .update({
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
      })
      .eq('patient_id', data.patient_id)
      .select()
      .single()
  } else {
    // Insert new record
    result = await supabase
      .from('patient_medical_history')
      .insert({
        patient_id: data.patient_id,
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

  if (patientError) {
    console.error('Error fetching patient:', patientError)
    return null
  }

  const { data: medicalHistory } = await supabase
    .from('patient_medical_history')
    .select('*')
    .eq('patient_id', patientId)
    .single()

  return {
    ...patient,
    medicalHistory: medicalHistory || null,
  }
}
