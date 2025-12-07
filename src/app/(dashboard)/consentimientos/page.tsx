'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  Plus,
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

// Mock data - Plantillas
const mockTemplates: ConsentTemplateWithStats[] = [
  {
    id: '1',
    clinicId: '1',
    name: 'Consentimiento General de Tratamiento',
    code: 'CON-001',
    description: 'Consentimiento básico para todos los tratamientos',
    category: 'general',
    treatmentIds: [],
    content: '# Consentimiento General...',
    risksSection: null,
    alternativesSection: null,
    contraindicationsSection: null,
    aftercareSection: null,
    requiredFields: [
      { key: 'allergies_confirmed', label: 'Confirmo alergias', type: 'boolean', required: true },
    ],
    version: 1,
    isCurrent: true,
    previousVersionId: null,
    isActive: true,
    isRequired: true,
    requiresWitness: false,
    requiresPhotoId: false,
    expiryDays: 365,
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-01-15T10:00:00Z',
    createdBy: '1',
    totalSigned: 156,
    activeSigned: 142,
    lastSignedAt: '2024-01-18T14:30:00Z',
  },
  {
    id: '2',
    clinicId: '1',
    name: 'Consentimiento para Botox',
    code: 'CON-002',
    description: 'Consentimiento específico para aplicación de toxina botulínica',
    category: 'inyectable',
    treatmentIds: ['t1', 't2'],
    content: '# Consentimiento Botox...',
    risksSection: 'Riesgos específicos del Botox...',
    alternativesSection: null,
    contraindicationsSection: 'Contraindicaciones: embarazo, lactancia...',
    aftercareSection: 'Cuidados post-tratamiento...',
    requiredFields: [
      { key: 'pregnant', label: '¿Está embarazada?', type: 'boolean', required: true },
      { key: 'last_botox_date', label: 'Última aplicación de Botox', type: 'date', required: false },
    ],
    version: 2,
    isCurrent: true,
    previousVersionId: null,
    isActive: true,
    isRequired: true,
    requiresWitness: false,
    requiresPhotoId: false,
    expiryDays: 180,
    createdAt: '2024-01-10T10:00:00Z',
    updatedAt: '2024-01-12T10:00:00Z',
    createdBy: '1',
    totalSigned: 89,
    activeSigned: 78,
    lastSignedAt: '2024-01-18T11:00:00Z',
  },
  {
    id: '3',
    clinicId: '1',
    name: 'Consentimiento para Láser',
    code: 'CON-003',
    description: 'Consentimiento para tratamientos con láser',
    category: 'laser',
    treatmentIds: ['t3', 't4', 't5'],
    content: '# Consentimiento Láser...',
    risksSection: 'Riesgos del tratamiento láser...',
    alternativesSection: null,
    contraindicationsSection: null,
    aftercareSection: null,
    requiredFields: [],
    version: 1,
    isCurrent: true,
    previousVersionId: null,
    isActive: true,
    isRequired: true,
    requiresWitness: false,
    requiresPhotoId: true,
    expiryDays: null,
    createdAt: '2024-01-05T10:00:00Z',
    updatedAt: '2024-01-05T10:00:00Z',
    createdBy: '1',
    totalSigned: 234,
    activeSigned: 234,
    lastSignedAt: '2024-01-18T16:00:00Z',
  },
]

// Mock data - Consentimientos firmados
const mockSignedConsents: SignedConsentDetails[] = [
  {
    id: 's1',
    clinicId: '1',
    branchId: null,
    templateId: '1',
    patientId: 'p1',
    sessionId: null,
    appointmentId: null,
    treatmentId: null,
    obtainedBy: 'u1',
    templateVersion: 1,
    contentSnapshot: '...',
    additionalFields: { allergies_confirmed: true },
    patientSignatureUrl: '/signatures/s1.png',
    patientSignatureData: null,
    patientSignedAt: '2024-01-18T14:30:00Z',
    professionalSignatureUrl: null,
    professionalSignedAt: null,
    witnessName: null,
    witnessIdNumber: null,
    witnessSignatureUrl: null,
    witnessSignedAt: null,
    patientIdPhotoUrl: null,
    ipAddress: '192.168.1.1',
    userAgent: 'Mozilla/5.0...',
    deviceInfo: null,
    pdfUrl: '/consents/s1.pdf',
    pdfGeneratedAt: '2024-01-18T14:31:00Z',
    status: 'signed',
    revokedAt: null,
    revokedBy: null,
    revocationReason: null,
    expiresAt: '2025-01-18',
    createdAt: '2024-01-18T14:30:00Z',
    updatedAt: '2024-01-18T14:30:00Z',
    templateName: 'Consentimiento General de Tratamiento',
    templateCategory: 'general',
    templateCode: 'CON-001',
    patientName: 'María García López',
    patientDocument: '12345678A',
    obtainedByName: 'Dra. Ana López',
    treatmentName: null,
    isValid: true,
  },
  {
    id: 's2',
    clinicId: '1',
    branchId: null,
    templateId: '2',
    patientId: 'p2',
    sessionId: 'ses1',
    appointmentId: null,
    treatmentId: 't1',
    obtainedBy: 'u2',
    templateVersion: 2,
    contentSnapshot: '...',
    additionalFields: { pregnant: false, last_botox_date: '2023-06-15' },
    patientSignatureUrl: '/signatures/s2.png',
    patientSignatureData: null,
    patientSignedAt: '2024-01-18T11:00:00Z',
    professionalSignatureUrl: '/signatures/s2_prof.png',
    professionalSignedAt: '2024-01-18T11:01:00Z',
    witnessName: null,
    witnessIdNumber: null,
    witnessSignatureUrl: null,
    witnessSignedAt: null,
    patientIdPhotoUrl: null,
    ipAddress: '192.168.1.2',
    userAgent: 'Mozilla/5.0...',
    deviceInfo: null,
    pdfUrl: '/consents/s2.pdf',
    pdfGeneratedAt: '2024-01-18T11:02:00Z',
    status: 'signed',
    revokedAt: null,
    revokedBy: null,
    revocationReason: null,
    expiresAt: '2024-07-18',
    createdAt: '2024-01-18T11:00:00Z',
    updatedAt: '2024-01-18T11:00:00Z',
    templateName: 'Consentimiento para Botox',
    templateCategory: 'inyectable',
    templateCode: 'CON-002',
    patientName: 'Carlos Rodríguez',
    patientDocument: '87654321B',
    obtainedByName: 'Dr. Pedro Sánchez',
    treatmentName: 'Botox - Frente',
    isValid: true,
  },
  {
    id: 's3',
    clinicId: '1',
    branchId: null,
    templateId: '1',
    patientId: 'p3',
    sessionId: null,
    appointmentId: null,
    treatmentId: null,
    obtainedBy: 'u1',
    templateVersion: 1,
    contentSnapshot: '...',
    additionalFields: {},
    patientSignatureUrl: '/signatures/s3.png',
    patientSignatureData: null,
    patientSignedAt: '2023-01-15T10:00:00Z',
    professionalSignatureUrl: null,
    professionalSignedAt: null,
    witnessName: null,
    witnessIdNumber: null,
    witnessSignatureUrl: null,
    witnessSignedAt: null,
    patientIdPhotoUrl: null,
    ipAddress: '192.168.1.3',
    userAgent: 'Mozilla/5.0...',
    deviceInfo: null,
    pdfUrl: '/consents/s3.pdf',
    pdfGeneratedAt: '2023-01-15T10:01:00Z',
    status: 'expired',
    revokedAt: null,
    revokedBy: null,
    revocationReason: null,
    expiresAt: '2024-01-15',
    createdAt: '2023-01-15T10:00:00Z',
    updatedAt: '2024-01-15T00:00:00Z',
    templateName: 'Consentimiento General de Tratamiento',
    templateCategory: 'general',
    templateCode: 'CON-001',
    patientName: 'Laura Fernández',
    patientDocument: '11223344C',
    obtainedByName: 'Dra. Ana López',
    treatmentName: null,
    isValid: false,
  },
]

export default function ConsentimientosPage() {
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')

  const filteredTemplates = mockTemplates.filter((template) => {
    if (categoryFilter !== 'all' && template.category !== categoryFilter) return false
    if (searchQuery && !template.name.toLowerCase().includes(searchQuery.toLowerCase())) return false
    return true
  })

  const filteredConsents = mockSignedConsents.filter((consent) => {
    if (statusFilter !== 'all' && consent.status !== statusFilter) return false
    if (categoryFilter !== 'all' && consent.templateCategory !== categoryFilter) return false
    if (searchQuery && !consent.patientName.toLowerCase().includes(searchQuery.toLowerCase())) return false
    return true
  })

  const activeTemplates = mockTemplates.filter((t) => t.isActive).length
  const totalSigned = mockSignedConsents.length
  const validConsents = mockSignedConsents.filter((c) => c.isValid).length

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
            <CardTitle className="text-3xl">{activeTemplates}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              De {mockTemplates.length} plantillas totales
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Consentimientos Firmados</CardDescription>
            <CardTitle className="text-3xl text-green-600">{totalSigned}</CardTitle>
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
            <CardTitle className="text-3xl text-blue-600">{validConsents}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              {totalSigned - validConsents} expirados o revocados
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
            <SelectValue placeholder="Categoría" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas las categorías</SelectItem>
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
                    <TableHead>Código</TableHead>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Categoría</TableHead>
                    <TableHead>Versión</TableHead>
                    <TableHead>Firmados</TableHead>
                    <TableHead>Vigencia</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTemplates.map((template) => (
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
                          <span className="text-sm">{template.expiryDays} días</span>
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
                  ))}
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
                  {filteredConsents.map((consent) => (
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
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
