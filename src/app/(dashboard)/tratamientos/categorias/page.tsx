'use client'

import { useState } from 'react'
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
import {
  categorySchema,
  type CategoryFormData,
  generateSlug,
} from '@/lib/validations/treatments'
import { toast } from 'sonner'

// Agregar AlertDialog a shadcn
import * as AlertDialogPrimitive from '@radix-ui/react-alert-dialog'

// Mock data
const mockCategories = [
  {
    id: '1',
    name: 'Facial',
    slug: 'facial',
    description: 'Tratamientos para el rostro',
    color: '#ec4899',
    icon: 'sparkles',
    sortOrder: 1,
    isActive: true,
    treatmentCount: 8,
  },
  {
    id: '2',
    name: 'Corporal',
    slug: 'corporal',
    description: 'Tratamientos para el cuerpo',
    color: '#8b5cf6',
    icon: 'body',
    sortOrder: 2,
    isActive: true,
    treatmentCount: 5,
  },
  {
    id: '3',
    name: 'Láser',
    slug: 'laser',
    description: 'Tratamientos con tecnología láser',
    color: '#ef4444',
    icon: 'zap',
    sortOrder: 3,
    isActive: true,
    treatmentCount: 4,
  },
  {
    id: '4',
    name: 'Inyectables',
    slug: 'inyectables',
    description: 'Toxina botulínica y rellenos',
    color: '#06b6d4',
    icon: 'syringe',
    sortOrder: 4,
    isActive: true,
    treatmentCount: 6,
  },
  {
    id: '5',
    name: 'Capilar',
    slug: 'capilar',
    description: 'Tratamientos para el cabello',
    color: '#f59e0b',
    icon: 'scissors',
    sortOrder: 5,
    isActive: false,
    treatmentCount: 2,
  },
]

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

export default function CategoriasPage() {
  const [categories, setCategories] = useState(mockCategories)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<typeof mockCategories[0] | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const form = useForm<CategoryFormData>({
    resolver: zodResolver(categorySchema),
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

  const openEditDialog = (category: typeof mockCategories[0]) => {
    setEditingCategory(category)
    form.reset({
      name: category.name,
      slug: category.slug,
      description: category.description || '',
      color: category.color,
      sortOrder: category.sortOrder,
      isActive: category.isActive,
    })
    setIsDialogOpen(true)
  }

  const handleDelete = async (id: string) => {
    // TODO: Llamar a Server Action
    setCategories(categories.filter((c) => c.id !== id))
    toast.success('Categoría eliminada')
  }

  async function onSubmit(data: CategoryFormData) {
    setIsLoading(true)

    try {
      if (editingCategory) {
        // Editar
        setCategories(
          categories.map((c) =>
            c.id === editingCategory.id
              ? { ...c, ...data, treatmentCount: c.treatmentCount }
              : c
          )
        )
        toast.success('Categoría actualizada')
      } else {
        // Crear
        const newCategory = {
          id: Date.now().toString(),
          ...data,
          description: data.description || '',
          icon: data.icon || '',
          treatmentCount: 0,
        }
        setCategories([...categories, newCategory])
        toast.success('Categoría creada')
      }

      setIsDialogOpen(false)
      form.reset()
    } catch (error) {
      toast.error('Error al guardar la categoría')
    } finally {
      setIsLoading(false)
    }
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
                  <Button type="submit" disabled={isLoading}>
                    {isLoading && (
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
            Arrastra para reordenar las categorías
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {categories
              .sort((a, b) => a.sortOrder - b.sortOrder)
              .map((category) => (
                <div
                  key={category.id}
                  className={`flex items-center gap-4 rounded-lg border p-4 ${
                    !category.isActive ? 'opacity-60' : ''
                  }`}
                >
                  <GripVertical className="h-5 w-5 cursor-grab text-muted-foreground" />

                  <div
                    className="h-10 w-10 rounded-lg flex items-center justify-center text-white"
                    style={{ backgroundColor: category.color }}
                  >
                    <span className="text-lg">✨</span>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium">{category.name}</h3>
                      {!category.isActive && (
                        <Badge variant="secondary">Inactiva</Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground truncate">
                      {category.description || 'Sin descripción'}
                    </p>
                  </div>

                  <Badge variant="outline">
                    {category.treatmentCount} tratamientos
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
        </CardContent>
      </Card>
    </div>
  )
}
