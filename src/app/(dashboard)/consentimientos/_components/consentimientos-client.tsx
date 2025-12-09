'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  Search,
  FileSignature,
  FileText,
  Eye,
  Download,
  MoreVertical,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Copy,
  Trash2,
  Edit,
  History,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import type { ConsentTemplateWithStats, SignedConsentDetails } from '@/types/consents'
import { CONSENT_CATEGORIES, CONSENT_STATUS_OPTIONS } from '@/types/consents'

interface ConsentimientosClientProps {
  templates: ConsentTemplateWithStats[]
  signedConsents: SignedConsentDetails[]
  stats: {
    totalTemplates: number
    activeTemplates: number
    totalSigned: number
    validSigned: number
    expiredOrRevoked: number
  }
}

export function ConsentimientosClient({
  templates,
  signedConsents,
  stats,
}: ConsentimientosClientProps) {
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')

  const filteredTemplates = templates.filter((template) => {
    if (categoryFilter !== 'all' && template.category !== categoryFilter) return false
    if (searchQuery && !template.name.toLowerCase().includes(searchQuery.toLowerCase())) return false
    return true
  })

  const filteredConsents = signedConsents.filter((consent) => {
    if (statusFilter !== 'all' && consent.status !== statusFilter) return false
    if (categoryFilter !== 'all' && consent.templateCategory !== categoryFilter) return false
    if (searchQuery && !consent.patientName.toLowerCase().includes(searchQuery.toLowerCase())) return false
    return true
  })

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-MX', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })
  }

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('es-MX', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const getCategoryBadge = (category: string) => {
    const config = CONSENT_CATEGORIES.find((c) => c.value === category)
    if (!config) return null
    return <Badge variant="outline">{config.label}</Badge>
  }

  const getStatusBadge = (status: string, isValid: boolean) => {
    if (status === 'signed' && !isValid) {
      return (
        <Badge className="bg-amber-100 text-amber-800">
          <AlertTriangle className="mr-1 h-3 w-3" />
          Expirado
        </Badge>
      )
    }
    const config = CONSENT_STATUS_OPTIONS.find((s) => s.value === status)
    if (!config) return null
    return (
      <Badge style={{ backgroundColor: config.color, color: 'white' }}>
        {status === 'signed' && <CheckCircle className="mr-1 h-3 w-3" />}
        {status === 'revoked' && <XCircle className="mr-1 h-3 w-3" />}
        {status === 'expired' && <Clock className="mr-1 h-3 w-3" />}
        {config.label}
      </Badge>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Consentimientos Informados</h1>
          <p className="text-muted-foreground">
            Gestiona plantillas y consentimientos firmados
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href="/consentimientos/plantillas/nueva">
              <FileText className="mr-2 h-4 w-4" />
              Nueva Plantilla
            </Link>
          </Button>
          <Button asChild>
            <Link href="/consentimientos/firmar">
              <FileSignature className="mr-2 h-4 w-4" />
              Firmar Consentimiento
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Plantillas Activas</CardDescription>
            <CardTitle className="text-3xl">{stats.activeTemplates}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              De {stats.totalTemplates} plantillas totales
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Consentimientos Firmados</CardDescription>
            <CardTitle className="text-3xl text-green-600">{stats.totalSigned}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              Este mes
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Consentimientos Vigentes</CardDescription>
            <CardTitle className="text-3xl text-blue-600">{stats.validSigned}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              {stats.expiredOrRevoked} expirados o revocados
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <div className="flex flex-col gap-4 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por nombre o paciente..."
            className="pl-9"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Categoria" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas las categorias</SelectItem>
            {CONSENT_CATEGORIES.map((cat) => (
              <SelectItem key={cat.value} value={cat.value}>
                {cat.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="templates" className="w-full">
        <TabsList>
          <TabsTrigger value="templates">Plantillas</TabsTrigger>
          <TabsTrigger value="signed">Firmados</TabsTrigger>
        </TabsList>

        {/* Tab: Plantillas */}
        <TabsContent value="templates" className="mt-4">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Codigo</TableHead>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Categoria</TableHead>
                    <TableHead>Version</TableHead>
                    <TableHead>Firmados</TableHead>
                    <TableHead>Vigencia</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTemplates.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                        No hay plantillas para mostrar
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredTemplates.map((template) => (
                      <TableRow key={template.id}>
                        <TableCell className="font-mono text-sm">
                          {template.code || '-'}
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{template.name}</p>
                            {template.description && (
                              <p className="text-xs text-muted-foreground line-clamp-1">
                                {template.description}
                              </p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>{getCategoryBadge(template.category)}</TableCell>
                        <TableCell>v{template.version}</TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <span className="font-medium">{template.activeSigned}</span>
                            <span className="text-muted-foreground"> / {template.totalSigned}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {template.expiryDays ? (
                            <span className="text-sm">{template.expiryDays} dias</span>
                          ) : (
                            <span className="text-sm text-muted-foreground">Indefinido</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {template.isActive ? (
                            <Badge className="bg-green-100 text-green-800">Activa</Badge>
                          ) : (
                            <Badge variant="secondary">Inactiva</Badge>
                          )}
                          {template.isRequired && (
                            <Badge variant="destructive" className="ml-1">
                              Obligatoria
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem>
                                <Eye className="mr-2 h-4 w-4" />
                                Ver plantilla
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <Edit className="mr-2 h-4 w-4" />
                                Editar
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <Copy className="mr-2 h-4 w-4" />
                                Duplicar
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <History className="mr-2 h-4 w-4" />
                                Historial de versiones
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem className="text-destructive">
                                <Trash2 className="mr-2 h-4 w-4" />
                                Desactivar
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Firmados */}
        <TabsContent value="signed" className="mt-4">
          <div className="mb-4">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los estados</SelectItem>
                {CONSENT_STATUS_OPTIONS.map((status) => (
                  <SelectItem key={status.value} value={status.value}>
                    <div className="flex items-center gap-2">
                      <span
                        className="h-2 w-2 rounded-full"
                        style={{ backgroundColor: status.color }}
                      />
                      {status.label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Paciente</TableHead>
                    <TableHead>Consentimiento</TableHead>
                    <TableHead>Tratamiento</TableHead>
                    <TableHead>Obtenido por</TableHead>
                    <TableHead>Expira</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredConsents.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                        No hay consentimientos firmados
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredConsents.map((consent) => (
                      <TableRow key={consent.id}>
                        <TableCell className="text-sm">
                          {formatDateTime(consent.patientSignedAt)}
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{consent.patientName}</p>
                            <p className="text-xs text-muted-foreground">
                              {consent.patientDocument}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="text-sm">{consent.templateName}</p>
                            <p className="text-xs text-muted-foreground">
                              {consent.templateCode} v{consent.templateVersion}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          {consent.treatmentName || (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell className="text-sm">
                          {consent.obtainedByName}
                        </TableCell>
                        <TableCell className="text-sm">
                          {consent.expiresAt ? formatDate(consent.expiresAt) : 'Indefinido'}
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(consent.status, consent.isValid)}
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem>
                                <Eye className="mr-2 h-4 w-4" />
                                Ver consentimiento
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <Download className="mr-2 h-4 w-4" />
                                Descargar PDF
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              {consent.status === 'signed' && (
                                <DropdownMenuItem className="text-destructive">
                                  <XCircle className="mr-2 h-4 w-4" />
                                  Revocar
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
