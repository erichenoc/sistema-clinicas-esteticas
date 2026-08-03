// Datos en vivo detras de login: no se prerenderiza ni se cachea
export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { getConsentTemplates } from '@/actions/consents'
import { CONSENT_CATEGORIES } from '@/types/consents'
import { ArrowLeft, Plus, Search, FileText, MoreHorizontal, Copy, Pencil, Trash2, Eye } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

export default async function PlantillasConsentimientosPage() {
  const dbTemplates = await getConsentTemplates()

  const templates = dbTemplates.map((t) => ({
    id: t.id,
    name: t.name,
    category: CONSENT_CATEGORIES.find((c) => c.value === t.category)?.label || 'General',
    description: t.description || 'Sin descripcion',
    status: t.is_active ? 'active' : 'inactive',
    usageCount: t.total_signed,
    updatedAt: t.updated_at,
  }))

  const stats = {
    total: templates.length,
    active: templates.filter((t) => t.status === 'active').length,
    totalUsage: templates.reduce((acc, t) => acc + t.usageCount, 0),
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/consentimientos">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">Plantillas de Consentimientos</h1>
            <p className="text-muted-foreground">Gestiona las plantillas de consentimientos informados</p>
          </div>
        </div>
        <Link href="/consentimientos/plantillas/nueva">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Nueva Plantilla
          </Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Plantillas</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">plantillas creadas</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Activas</CardTitle>
            <FileText className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.active}</div>
            <p className="text-xs text-muted-foreground">en uso</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Usos Totales</CardTitle>
            <FileText className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalUsage}</div>
            <p className="text-xs text-muted-foreground">consentimientos firmados</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Buscar plantilla..." className="pl-10" />
        </div>
        <Select defaultValue="all">
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Categoria" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas</SelectItem>
            <SelectItem value="facial">Tratamientos Faciales</SelectItem>
            <SelectItem value="corporal">Tratamientos Corporales</SelectItem>
            <SelectItem value="general">General</SelectItem>
          </SelectContent>
        </Select>
        <Select defaultValue="active">
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Estado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="active">Activas</SelectItem>
            <SelectItem value="inactive">Inactivas</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Templates Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {templates.map((template) => (
          <Card key={template.id} className={template.status === 'inactive' ? 'opacity-60' : ''}>
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <CardTitle className="text-base">{template.name}</CardTitle>
                  <CardDescription>{template.category}</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={template.status === 'active' ? 'default' : 'secondary'}>
                    {template.status === 'active' ? 'Activa' : 'Inactiva'}
                  </Badge>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>
                        <Eye className="mr-2 h-4 w-4" />
                        Vista previa
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Pencil className="mr-2 h-4 w-4" />
                        Editar
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Copy className="mr-2 h-4 w-4" />
                        Duplicar
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem className="text-red-600">
                        <Trash2 className="mr-2 h-4 w-4" />
                        Eliminar
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground line-clamp-2">
                {template.description}
              </p>
              <div className="flex items-center justify-between pt-3 border-t text-sm">
                <div>
                  <span className="text-muted-foreground">Usos:</span>{' '}
                  <span className="font-medium">{template.usageCount}</span>
                </div>
                <div className="text-muted-foreground">
                  Actualizado: {new Date(template.updatedAt).toLocaleDateString('es-DO')}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {/* Add New Template Card */}
        <Link href="/consentimientos/plantillas/nueva">
          <Card className="h-full border-dashed cursor-pointer hover:bg-muted/50 transition-colors">
            <CardContent className="flex flex-col items-center justify-center h-full min-h-[200px] text-muted-foreground">
              <Plus className="h-10 w-10 mb-2" />
              <p className="font-medium">Crear nueva plantilla</p>
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  )
}
