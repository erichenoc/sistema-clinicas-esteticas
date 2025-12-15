'use client'

import { useState } from 'react'
import { Plus, Trash2, Calendar, Clock, FlaskConical, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
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
import { Separator } from '@/components/ui/separator'
import type {
  FacialTreatmentData,
  FacialSessionRecord,
  FacialTreatmentSubtype,
} from '@/types/treatment-templates'
import {
  FACIAL_TREATMENT_SUBTYPES,
  COMMON_PEELING_TYPES,
  COMMON_MESOTHERAPY_PRODUCTS,
  createEmptyFacialSession,
} from '@/types/treatment-templates'

interface FacialTreatmentTemplateProps {
  data: FacialTreatmentData
  onChange: (data: FacialTreatmentData) => void
  readOnly?: boolean
  sessionNumber?: number // Si se proporciona, solo muestra esa sesión
}

export function FacialTreatmentTemplate({
  data,
  onChange,
  readOnly = false,
  sessionNumber,
}: FacialTreatmentTemplateProps) {
  const [expandedSession, setExpandedSession] = useState<number | null>(
    sessionNumber ?? (data.sessions.length > 0 ? data.sessions.length : null)
  )

  // Agregar nueva sesión
  const addSession = () => {
    const newSessionNumber = data.sessions.length + 1
    const newSession = createEmptyFacialSession(newSessionNumber)
    onChange({
      ...data,
      sessions: [...data.sessions, newSession],
    })
    setExpandedSession(newSessionNumber)
  }

  // Actualizar sesión
  const updateSession = (index: number, updates: Partial<FacialSessionRecord>) => {
    const newSessions = [...data.sessions]
    newSessions[index] = { ...newSessions[index], ...updates }
    onChange({ ...data, sessions: newSessions })
  }

  // Eliminar sesión
  const removeSession = (index: number) => {
    const newSessions = data.sessions.filter((_, i) => i !== index)
    // Renumerar sesiones
    newSessions.forEach((s, i) => {
      s.sessionNumber = i + 1
    })
    onChange({ ...data, sessions: newSessions })
  }

  // Actualizar datos del paciente
  const updatePatientData = (field: keyof FacialTreatmentData, value: string) => {
    onChange({ ...data, [field]: value })
  }

  // Filtrar sesiones si se especifica un número
  const sessionsToShow = sessionNumber
    ? data.sessions.filter((s) => s.sessionNumber === sessionNumber)
    : data.sessions

  return (
    <div className="space-y-6">
      {/* Header del paciente */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Sparkles className="h-5 w-5 text-[#A67C52]" />
            Control de Tratamientos Faciales
          </CardTitle>
          <CardDescription>
            Limpieza Facial, Dermapen, Mesoterapia, Peelings Químicos
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="patientName">Paciente</Label>
              <Input
                id="patientName"
                value={data.patientName}
                onChange={(e) => updatePatientData('patientName', e.target.value)}
                placeholder="Nombre del paciente"
                disabled={readOnly}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="allergies">Alergias</Label>
              <Input
                id="allergies"
                value={data.patientAllergies}
                onChange={(e) => updatePatientData('patientAllergies', e.target.value)}
                placeholder="Alergias conocidas"
                disabled={readOnly}
                className="border-amber-300 focus:border-amber-500"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="treatmentArea">Zona Tratada</Label>
              <Input
                id="treatmentArea"
                value={data.treatmentArea}
                onChange={(e) => updatePatientData('treatmentArea', e.target.value)}
                placeholder="Ej: Rostro completo"
                disabled={readOnly}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabla de Control de Sesiones */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Control de Tratamientos</CardTitle>
            {!readOnly && !sessionNumber && (
              <Button onClick={addSession} size="sm" variant="outline">
                <Plus className="h-4 w-4 mr-1" />
                Nueva Sesión
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {sessionsToShow.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <FlaskConical className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No hay sesiones registradas</p>
              {!readOnly && !sessionNumber && (
                <Button onClick={addSession} variant="link" className="mt-2">
                  Agregar primera sesión
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {/* Vista de tabla compacta para múltiples sesiones */}
              {!sessionNumber && sessionsToShow.length > 1 && (
                <div className="overflow-x-auto border rounded-lg">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/50">
                        <TableHead className="w-12">No.</TableHead>
                        <TableHead>Fecha</TableHead>
                        <TableHead>Tipo</TableHead>
                        <TableHead>Peeling</TableHead>
                        <TableHead>Tiempo</TableHead>
                        <TableHead>Mesoterapia</TableHead>
                        <TableHead className="w-20"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {sessionsToShow.map((session, index) => (
                        <TableRow
                          key={session.sessionNumber}
                          className="cursor-pointer hover:bg-muted/50"
                          onClick={() => setExpandedSession(
                            expandedSession === session.sessionNumber ? null : session.sessionNumber
                          )}
                        >
                          <TableCell className="font-medium">
                            {session.sessionNumber}
                          </TableCell>
                          <TableCell>{session.date || '-'}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-xs">
                              {FACIAL_TREATMENT_SUBTYPES.find(t => t.value === session.facialType)?.label || session.facialType}
                            </Badge>
                          </TableCell>
                          <TableCell className="max-w-[150px] truncate">
                            {session.peelingUsed || '-'}
                          </TableCell>
                          <TableCell>
                            {session.peelingTime ? `${session.peelingTime} min` : '-'}
                          </TableCell>
                          <TableCell className="max-w-[150px] truncate">
                            {session.mesotherapyProducts || '-'}
                          </TableCell>
                          <TableCell>
                            {!readOnly && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 text-destructive"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  removeSession(index)
                                }}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}

              {/* Vista detallada de sesión expandida o única */}
              {sessionsToShow.map((session, index) => {
                const isExpanded = expandedSession === session.sessionNumber || sessionNumber !== undefined || sessionsToShow.length === 1

                if (!isExpanded && sessionsToShow.length > 1) return null

                return (
                  <Card key={session.sessionNumber} className="border-[#A67C52]/30">
                    <CardHeader className="py-3 px-4 bg-[#A67C52]/5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Badge className="bg-[#A67C52]">
                            Sesión {session.sessionNumber}
                          </Badge>
                          <span className="text-sm text-muted-foreground flex items-center gap-1">
                            <Calendar className="h-3.5 w-3.5" />
                            {session.date || 'Sin fecha'}
                          </span>
                        </div>
                        {!readOnly && !sessionNumber && sessionsToShow.length > 1 && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-destructive h-7"
                            onClick={() => removeSession(index)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className="p-4 space-y-4">
                      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {/* Fecha */}
                        <div className="space-y-2">
                          <Label>Fecha</Label>
                          <Input
                            type="date"
                            value={session.date}
                            onChange={(e) => updateSession(index, { date: e.target.value })}
                            disabled={readOnly}
                          />
                        </div>

                        {/* Tipo de Facial */}
                        <div className="space-y-2">
                          <Label>Tipo de Tratamiento</Label>
                          <Select
                            value={session.facialType}
                            onValueChange={(v) => updateSession(index, { facialType: v as FacialTreatmentSubtype })}
                            disabled={readOnly}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Seleccionar tipo" />
                            </SelectTrigger>
                            <SelectContent>
                              {FACIAL_TREATMENT_SUBTYPES.map((type) => (
                                <SelectItem key={type.value} value={type.value}>
                                  {type.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        {/* Próxima visita */}
                        <div className="space-y-2">
                          <Label>Próxima Visita</Label>
                          <Input
                            type="date"
                            value={session.nextVisitDate || ''}
                            onChange={(e) => updateSession(index, { nextVisitDate: e.target.value })}
                            disabled={readOnly}
                          />
                        </div>
                      </div>

                      <Separator />

                      {/* Sección de Peeling */}
                      <div className="space-y-3">
                        <h4 className="font-medium text-sm flex items-center gap-2">
                          <FlaskConical className="h-4 w-4 text-[#A67C52]" />
                          Peeling
                        </h4>
                        <div className="grid gap-4 sm:grid-cols-2">
                          <div className="space-y-2">
                            <Label>Peeling Utilizado</Label>
                            <Select
                              value={session.peelingUsed || 'none'}
                              onValueChange={(v) => updateSession(index, { peelingUsed: v === 'none' ? '' : v })}
                              disabled={readOnly}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Seleccionar peeling" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="none">Sin peeling</SelectItem>
                                {COMMON_PEELING_TYPES.map((type) => (
                                  <SelectItem key={type} value={type}>
                                    {type}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label className="flex items-center gap-1">
                              <Clock className="h-3.5 w-3.5" />
                              Tiempo de Peeling (min)
                            </Label>
                            <Input
                              type="number"
                              min="0"
                              value={session.peelingTime || ''}
                              onChange={(e) => updateSession(index, { peelingTime: parseInt(e.target.value) || 0 })}
                              placeholder="0"
                              disabled={readOnly}
                            />
                          </div>
                        </div>
                      </div>

                      <Separator />

                      {/* Sección de Mesoterapia */}
                      <div className="space-y-3">
                        <h4 className="font-medium text-sm flex items-center gap-2">
                          <Sparkles className="h-4 w-4 text-[#A67C52]" />
                          Mesoterapia
                        </h4>
                        <div className="space-y-2">
                          <Label>Productos de Mesoterapia</Label>
                          <Select
                            value={session.mesotherapyProducts || 'none'}
                            onValueChange={(v) => updateSession(index, { mesotherapyProducts: v === 'none' ? '' : v })}
                            disabled={readOnly}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Seleccionar productos" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">Sin mesoterapia</SelectItem>
                              {COMMON_MESOTHERAPY_PRODUCTS.map((product) => (
                                <SelectItem key={product} value={product}>
                                  {product}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <Separator />

                      {/* Sección de Mascarilla */}
                      <div className="space-y-3">
                        <h4 className="font-medium text-sm">Mascarilla</h4>
                        <div className="grid gap-4 sm:grid-cols-2">
                          <div className="space-y-2">
                            <Label>Mascarilla Usada</Label>
                            <Input
                              value={session.maskUsed}
                              onChange={(e) => updateSession(index, { maskUsed: e.target.value })}
                              placeholder="Tipo de mascarilla"
                              disabled={readOnly}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label className="flex items-center gap-1">
                              <Clock className="h-3.5 w-3.5" />
                              Tiempo (min)
                            </Label>
                            <Input
                              type="number"
                              min="0"
                              value={session.maskTime || ''}
                              onChange={(e) => updateSession(index, { maskTime: parseInt(e.target.value) || 0 })}
                              placeholder="0"
                              disabled={readOnly}
                            />
                          </div>
                        </div>
                      </div>

                      <Separator />

                      {/* Otros productos y observaciones */}
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-2">
                          <Label>Otros Productos</Label>
                          <Textarea
                            value={session.otherProducts}
                            onChange={(e) => updateSession(index, { otherProducts: e.target.value })}
                            placeholder="Otros productos utilizados..."
                            rows={3}
                            disabled={readOnly}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Observaciones</Label>
                          <Textarea
                            value={session.observations}
                            onChange={(e) => updateSession(index, { observations: e.target.value })}
                            placeholder="Notas y observaciones..."
                            rows={3}
                            disabled={readOnly}
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default FacialTreatmentTemplate
