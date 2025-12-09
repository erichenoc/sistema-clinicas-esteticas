'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/server'
import type { UserRole } from '@/lib/auth/roles'

export interface CurrentUser {
  id: string
  email: string
  firstName: string
  lastName: string
  fullName: string
  role: UserRole
  clinicId: string
  avatarUrl: string | null
  isActive: boolean
}

// Obtener el usuario actual con su rol desde la tabla users
export async function getCurrentUser(): Promise<CurrentUser | null> {
  const supabase = await createClient()

  const { data: { user: authUser } } = await supabase.auth.getUser()

  if (!authUser) {
    return null
  }

  // Buscar datos del usuario en la tabla users
  const adminClient = createAdminClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: userData, error } = await (adminClient as any)
    .from('users')
    .select('*')
    .eq('id', authUser.id)
    .single()

  if (error || !userData) {
    // Usuario autenticado pero sin registro en tabla users
    // Retornar datos básicos con rol por defecto
    return {
      id: authUser.id,
      email: authUser.email || '',
      firstName: authUser.user_metadata?.first_name || 'Usuario',
      lastName: authUser.user_metadata?.last_name || '',
      fullName: `${authUser.user_metadata?.first_name || 'Usuario'} ${authUser.user_metadata?.last_name || ''}`.trim(),
      role: 'receptionist' as UserRole, // Rol por defecto
      clinicId: '',
      avatarUrl: null,
      isActive: true,
    }
  }

  const user = userData as {
    id: string
    email: string
    first_name: string
    last_name: string
    role: string
    clinic_id: string
    avatar_url: string | null
    is_active: boolean
  }

  return {
    id: user.id,
    email: user.email,
    firstName: user.first_name,
    lastName: user.last_name,
    fullName: `${user.first_name} ${user.last_name}`,
    role: (user.role as UserRole) || 'receptionist',
    clinicId: user.clinic_id,
    avatarUrl: user.avatar_url,
    isActive: user.is_active,
  }
}

// Obtener solo el rol del usuario actual (más ligero)
export async function getCurrentUserRole(): Promise<UserRole | null> {
  const user = await getCurrentUser()
  return user?.role || null
}

export async function login(formData: FormData) {
  const supabase = await createClient()

  const data = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  }

  const { error } = await supabase.auth.signInWithPassword(data)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/', 'layout')
  redirect('/')
}

export async function signup(formData: FormData) {
  const supabase = await createClient()

  const data = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
    options: {
      data: {
        first_name: formData.get('firstName') as string,
        last_name: formData.get('lastName') as string,
      },
    },
  }

  const { error } = await supabase.auth.signUp(data)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/', 'layout')
  redirect('/')
}

export async function logout() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  revalidatePath('/', 'layout')
  redirect('/login')
}

export async function forgotPassword(formData: FormData) {
  const supabase = await createClient()

  const email = formData.get('email') as string

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/reset-password`,
  })

  if (error) {
    return { error: error.message }
  }

  return { success: true }
}

export async function resetPassword(formData: FormData) {
  const supabase = await createClient()

  const password = formData.get('password') as string

  const { error } = await supabase.auth.updateUser({
    password,
  })

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/', 'layout')
  redirect('/login')
}
