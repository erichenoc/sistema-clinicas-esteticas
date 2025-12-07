'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { ArrowLeft, Loader2, Stethoscope, CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import {
  forgotPasswordSchema,
  type ForgotPasswordFormData,
} from '@/lib/validations/auth'
import { forgotPassword } from '@/actions/auth'
import { toast } from 'sonner'

export default function ForgotPasswordPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)

  const form = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: '',
    },
  })

  async function onSubmit(data: ForgotPasswordFormData) {
    setIsLoading(true)

    const formData = new FormData()
    formData.append('email', data.email)

    const result = await forgotPassword(formData)

    if (result?.error) {
      toast.error(result.error)
      setIsLoading(false)
    } else if (result?.success) {
      setIsSuccess(true)
      setIsLoading(false)
    }
  }

  if (isSuccess) {
    return (
      <div className="space-y-6">
        {/* Mobile Logo */}
        <div className="flex items-center justify-center gap-2 lg:hidden">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
            <Stethoscope className="h-6 w-6 text-primary-foreground" />
          </div>
          <span className="text-xl font-bold">Clínica Estética</span>
        </div>

        <div className="flex flex-col items-center space-y-4 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">
            Revisa tu correo
          </h1>
          <p className="text-muted-foreground">
            Te hemos enviado un enlace para restablecer tu contraseña a{' '}
            <span className="font-medium">{form.getValues('email')}</span>
          </p>
        </div>

        <Button asChild className="w-full">
          <Link href="/login">Volver al inicio de sesión</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Mobile Logo */}
      <div className="flex items-center justify-center gap-2 lg:hidden">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
          <Stethoscope className="h-6 w-6 text-primary-foreground" />
        </div>
        <span className="text-xl font-bold">Clínica Estética</span>
      </div>

      <div className="space-y-2 text-center">
        <h1 className="text-2xl font-bold tracking-tight">
          ¿Olvidaste tu contraseña?
        </h1>
        <p className="text-muted-foreground">
          Ingresa tu email y te enviaremos un enlace para restablecerla
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input
                    type="email"
                    placeholder="tu@email.com"
                    autoComplete="email"
                    disabled={isLoading}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Enviar enlace
          </Button>
        </form>
      </Form>

      <Link
        href="/login"
        className="flex items-center justify-center gap-2 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Volver al inicio de sesión
      </Link>
    </div>
  )
}
