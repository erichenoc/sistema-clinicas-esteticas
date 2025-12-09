'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  ArrowLeft,
  Plus,
  Pencil,
  Trash2,
  GripVertical,
  Loader2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { toast } from 'sonner'
import { z } from 'zod'
import {
  createCategory,
  updateCategory,
  deleteCategory,
  type CategoryWithCountData,
} from '@/actions/treatments'

// Schema para el formulario
const categoryFormSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido').max(100),
  slug: z.string().max(100).optional(),
  description: z.string().max(500).optional(),
  color: z.string().min(4).max(20),
  sortOrder: z.number().int().min(0).optional(),
  isActive: z.boolean(),
})

type CategoryFormValues = z.infer<typeof categoryFormSchema>

const colorOptions = [
  '#ef4444', // red
  '#f97316', // orange
  '#f59e0b', // amber
  '#84cc16', // lime
  '#22c55e', // green
  '#14b8a6', // teal
  '#06b6d4', // cyan
  '#0ea5e9', // sky
  '#3b82f6', // blue
  '#6366f1', // indigo
  '#8b5cf6', // violet
  '#a855f7', // purple
  '#d946ef', // fuchsia
  '#ec4899', // pink
  '#f43f5e', // rose
]

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
}

interface CategoriasClientProps {
  categories: CategoryWithCountData[]
}

export function CategoriasClient({ categories: initialCategories }: CategoriasClientProps) {
  const [categories, setCategories] = useState(initialCategories)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<CategoryWithCountData | null>(null)
  const [isPending, startTransition] = useTransition()

  const form = useForm<CategoryFormValues>({
    resolver: zodResolver(categoryFormSchema),
    defaultValues: {
      name: '',
      slug: '',
      description: '',
      color: '#6366f1',
      sortOrder: 0,
      isActive: true,
    },
  })

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value
    form.setValue('name', name)
    if (!editingCategory) {
      form.setValue('slug', generateSlug(name))
    }
  }

  const openCreateDialog = () => {
    setEditingCategory(null)
    form.reset({
      name: '',
      slug: '',
      description: '',
      color: '#6366f1',
      sortOrder: categories.length,
      isActive: true,
    })
    setIsDialogOpen(true)
  }

  const openEditDialog = (category: CategoryWithCountData) => {
    setEditingCategory(category)
    form.reset({
      name: category.name,
      slug: category.slug,
      description: category.description || '',
      color: category.color,
      sortOrder: category.sort_order,
      isActive: category.is_active,
    })
    setIsDialogOpen(true)
  }

  const handleDelete = async (id: string) => {
    startTransition(async () => {
      const result = await deleteCategory(id)
      if (result.success) {
        setCategories(categories.filter((c) => c.id !== id))
        toast.success('Categoría eliminada')
      } else {
        toast.error(result.error || 'Error al eliminar')
      }
    })
  }

  async function onSubmit(data: CategoryFormValues) {
    startTransition(async () => {
      if (editingCategory) {
        const result = await updateCategory(editingCategory.id, {
          name: data.name,
          slug: data.slug,
          description: data.description,
          color: data.color,
          sort_order: data.sortOrder,
          is_active: data.isActive,
        })
        if (result.data) {
          setCategories(
            categories.map((c) =>
              c.id === editingCategory.id
                ? { ...result.data!, treatment_count: c.treatment_count }
                : c
            )
          )
          toast.success('Categoría actualizada')
          setIsDialogOpen(false)
        } else {
          toast.error(result.error || 'Error al actualizar')
        }
      } else {
        const result = await createCategory({
          name: data.name,
          slug: data.slug,
          description: data.description,
          color: data.color,
          sort_order: data.sortOrder,
          is_active: data.isActive,
        })
        if (result.data) {
          setCategories([...categories, { ...result.data, treatment_count: 0 }])
          toast.success('Categoría creada')
          setIsDialogOpen(false)
          form.reset()
        } else {
          toast.error(result.error || 'Error al crear')
        }
      }
    })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/tratamientos">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Categorías</h1>
            <p className="text-muted-foreground">
              Organiza tus tratamientos por categorías
            </p>
          </div>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openCreateDialog}>
              <Plus className="mr-2 h-4 w-4" />
              Nueva Categoría
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>
                {editingCategory ? 'Editar Categoría' : 'Nueva Categoría'}
              </DialogTitle>
              <DialogDescription>
                {editingCategory
                  ? 'Modifica los datos de la categoría'
                  : 'Crea una nueva categoría para organizar tratamientos'}
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nombre *</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Ej: Facial"
                          {...field}
                          onChange={handleNameChange}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="slug"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Slug</FormLabel>
                      <FormControl>
                        <Input placeholder="facial" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Descripción</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Descripción breve..."
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="color"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Color</FormLabel>
                      <FormControl>
                        <div className="flex flex-wrap gap-2">
                          {colorOptions.map((color) => (
                            <button
                              key={color}
                              type="button"
                              className={`h-8 w-8 rounded-full border-2 transition-all ${
                                field.value === color
                                  ? 'border-foreground scale-110'
                                  : 'border-transparent'
                              }`}
                              style={{ backgroundColor: color }}
                              onClick={() => field.onChange(color)}
                            />
                          ))}
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="isActive"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between rounded-lg border p-3">
                      <FormLabel className="cursor-pointer">Activa</FormLabel>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsDialogOpen(false)}
                  >
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={isPending}>
                    {isPending && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    {editingCategory ? 'Guardar' : 'Crear'}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Lista de categorías */}
      <Card>
        <CardHeader>
          <CardTitle>Categorías de Tratamientos</CardTitle>
          <CardDescription>
            Gestiona las categorías de tus tratamientos
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {categories
              .sort((a, b) => a.sort_order - b.sort_order)
              .map((category) => (
                <div
                  key={category.id}
                  className={`flex items-center gap-4 rounded-lg border p-4 ${
                    !category.is_active ? 'opacity-60' : ''
                  }`}
                >
                  <GripVertical className="h-5 w-5 cursor-grab text-muted-foreground" />

                  <div
                    className="h-10 w-10 rounded-lg flex items-center justify-center text-white"
                    style={{ backgroundColor: category.color }}
                  >
                    <span className="text-lg">{category.icon || '✨'}</span>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium">{category.name}</h3>
                      {!category.is_active && (
                        <Badge variant="secondary">Inactiva</Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground truncate">
                      {category.description || 'Sin descripción'}
                    </p>
                  </div>

                  <Badge variant="outline">
                    {category.treatment_count} tratamientos
                  </Badge>

                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => openEditDialog(category)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>

                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>
                            ¿Eliminar categoría?
                          </AlertDialogTitle>
                          <AlertDialogDescription>
                            Esta acción no se puede deshacer. Los tratamientos
                            de esta categoría quedarán sin categoría asignada.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDelete(category.id)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Eliminar
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              ))}
          </div>

          {/* Empty state */}
          {categories.length === 0 && (
            <div className="text-center py-12">
              <div className="h-12 w-12 mx-auto rounded-lg bg-muted flex items-center justify-center mb-4">
                <Plus className="h-6 w-6 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-medium">No hay categorías</h3>
              <p className="text-muted-foreground mb-4">
                Crea tu primera categoría para organizar tratamientos
              </p>
              <Button onClick={openCreateDialog}>
                <Plus className="mr-2 h-4 w-4" />
                Nueva Categoría
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
