'use client'

import { useState } from 'react'
import {
  Plus,
  Trash2,
  Calendar,
  Syringe,
  Package,
  Edit,
  Eye,
  RotateCcw,
} from 'lucide-react'
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { FaceMapSVG } from './FaceMapSVG'
import type {
  InjectableTreatmentData,
  InjectableSessionRecord,
  InjectableTreatmentSubtype,
  InjectionPoint,
  FacialZone,
  BioestimulatorBrand,
} from '@/types/treatment-templates'
import {
  INJECTABLE_TREATMENT_SUBTYPES,
  BIOESTIMULATOR_BRANDS,
  FACIAL_ZONES,
  createEmptyInjectableSession,
  createEmptyInjectionPoint,
} from '@/types/treatment-templates'

interface InjectableTreatmentTemplateProps {
  data: InjectableTreatmentData
  onChange: (data: InjectableTreatmentData) => void
  readOnly?: boolean
  sessionNumber?: number
}

export function InjectableTreatmentTemplate({
  data,
  onChange,
  readOnly = false,
  sessionNumber,
}: InjectableTreatmentTemplateProps) {
  const [activeView, setActiveView] = useState<'frontal' | 'lateral_izq' | 'lateral_der'>('frontal')
  const [selectedPoint, setSelectedPoint] = useState<InjectionPoint | null>(null)
  const [showPointDialog, setShowPointDialog] = useState(false)
  const [expandedSession, setExpandedSession] = useState<number | null>(
    sessionNumber ?? (data.sessions.length > 0 ? data.sessions.length : null)
  )

  // Obtener sesión actual para edición
  const getCurrentSessionIndex = () => {
    if (sessionNumber) {
      return data.sessions.findIndex((s) => s.sessionNumber === sessionNumber)
    }
    return expandedSession
      ? data.sessions.findIndex((s) => s.sessionNumber === expandedSession)
      : data.sessions.length - 1
  }

  // Agregar nueva sesión
  const addSession = () => {
    const newSessionNumber = data.sessions.length + 1
    const newSession = createEmptyInjectableSession(newSessionNumber)
    onChange({
      ...data,
      sessions: [...data.sessions, newSession],
    })
    setExpandedSession(newSessionNumber)
  }

  // Actualizar sesión
  const updateSession = (index: number, updates: Partial<InjectableSessionRecord>) => {
    const newSessions = [...data.sessions]
    newSessions[index] = { ...newSessions[index], ...updates }
    onChange({ ...data, sessions: newSessions })
  }

  // Eliminar sesión
  const removeSession = (index: number) => {
    const newSessions = data.sessions.filter((_, i) => i !== index)
    newSessions.forEach((s, i) => {
      s.sessionNumber = i + 1
    })
    onChange({ ...data, sessions: newSessions })
  }

  // Agregar punto de inyección
  const addInjectionPoint = (x: number, y: number, zone: FacialZone) => {
    const sessionIndex = getCurrentSessionIndex()
    if (sessionIndex < 0) return

    const session = data.sessions[sessionIndex]
    const newPoint = createEmptyInjectionPoint(zone, x, y, activeView)

    // Pre-llenar con datos del tratamiento
    newPoint.product = session.treatmentSubtype

    updateSession(sessionIndex, {
      injectionPoints: [...session.injectionPoints, newPoint],
    })

    setSelectedPoint(newPoint)
    setShowPointDialog(true)
  }

  // Actualizar punto de inyección
  const updateInjectionPoint = (pointId: string, updates: Partial<InjectionPoint>) => {
    const sessionIndex = getCurrentSessionIndex()
    if (sessionIndex < 0) return

    const session = data.sessions[sessionIndex]
    const newPoints = session.injectionPoints.map((p) =>
      p.id === pointId ? { ...p, ...updates } : p
    )

    updateSession(sessionIndex, { injectionPoints: newPoints })

    if (selectedPoint?.id === pointId) {
      setSelectedPoint({ ...selectedPoint, ...updates })
    }
  }

  // Eliminar punto de inyección
  const removeInjectionPoint = (pointId: string) => {
    const sessionIndex = getCurrentSessionIndex()
    if (sessionIndex < 0) return

    const session = data.sessions[sessionIndex]
    updateSession(sessionIndex, {
      injectionPoints: session.injectionPoints.filter((p) => p.id !== pointId),
    })

    if (selectedPoint?.id === pointId) {
      setSelectedPoint(null)
      setShowPointDialog(false)
    }
  }

  // Filtrar sesiones
  const sessionsToShow = sessionNumber
    ? data.sessions.filter((s) => s.sessionNumber === sessionNumber)
    : data.sessions

  // Sesión actual para el mapa facial
  const currentSession = (() => {
    const idx = getCurrentSessionIndex()
    return idx >= 0 ? data.sessions[idx] : null
  })()

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Syringe className="h-5 w-5 text-[#A67C52]" />
            Control de Tratamientos Inyectables
          </CardTitle>
          <CardDescription>
            Rellenos de HA, Bioestimuladores, Hilos Tensores, Botox
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Paciente</Label>
              <Input
                value={data.patientName}
                onChange={(e) => onChange({ ...data, patientName: e.target.value })}
                placeholder="Nombre del paciente"
                disabled={readOnly}
              />
            </div>
            <div className="space-y-2">
              <Label>Profesional</Label>
              <Input
                value={data.professionalName}
                onChange={(e) => onChange({ ...data, professionalName: e.target.value })}
                placeholder="Nombre del profesional"
                disabled={readOnly}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Sesiones */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Sesiones de Tratamiento</CardTitle>
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
              <Syringe className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No hay sesiones registradas</p>
              {!readOnly && !sessionNumber && (
                <Button onClick={addSession} variant="link" className="mt-2">
                  Agregar primera sesión
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-6">
              {sessionsToShow.map((session, index) => {
                const isExpanded = expandedSession === session.sessionNumber ||
                  sessionNumber !== undefined ||
                  sessionsToShow.length === 1

                const actualIndex = data.sessions.findIndex(
                  (s) => s.sessionNumber === session.sessionNumber
                )

                return (
                  <Card key={session.sessionNumber} className="border-[#A67C52]/30">
                    {/* Header de sesión */}
                    <CardHeader
                      className="py-3 px-4 bg-[#A67C52]/5 cursor-pointer"
                      onClick={() => setExpandedSession(
                        expandedSession === session.sessionNumber ? null : session.sessionNumber
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Badge className="bg-[#A67C52]">
                            Sesión {session.sessionNumber}
                          </Badge>
                          <Badge variant="outline">
                            {INJECTABLE_TREATMENT_SUBTYPES.find(
                              (t) => t.value === session.treatmentSubtype
                            )?.label || session.treatmentSubtype}
                          </Badge>
                          <span className="text-sm text-muted-foreground flex items-center gap-1">
                            <Calendar className="h-3.5 w-3.5" />
                            {session.date || 'Sin fecha'}
                          </span>
                          <span className="text-sm text-muted-foreground">
                            ({session.injectionPoints.length} puntos)
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          {!readOnly && !sessionNumber && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-destructive h-7"
                              onClick={(e) => {
                                e.stopPropagation()
                                removeSession(actualIndex)
                              }}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                          {isExpanded ? (
                            <Eye className="h-4 w-4 text-muted-foreground" />
                          ) : (
                            <Edit className="h-4 w-4 text-muted-foreground" />
                          )}
                        </div>
                      </div>
                    </CardHeader>

                    {isExpanded && (
                      <CardContent className="p-4 space-y-6">
                        {/* Info básica de sesión */}
                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                          <div className="space-y-2">
                            <Label>Fecha</Label>
                            <Input
                              type="date"
                              value={session.date}
                              onChange={(e) =>
                                updateSession(actualIndex, { date: e.target.value })
                              }
                              disabled={readOnly}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Tipo de Tratamiento</Label>
                            <Select
                              value={session.treatmentSubtype}
                              onValueChange={(v) =>
                                updateSession(actualIndex, {
                                  treatmentSubtype: v as InjectableTreatmentSubtype,
                                })
                              }
                              disabled={readOnly}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {INJECTABLE_TREATMENT_SUBTYPES.map((type) => (
                                  <SelectItem key={type.value} value={type.value}>
                                    {type.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label>Marca/Producto</Label>
                            <Input
                              value={session.productBrand}
                              onChange={(e) =>
                                updateSession(actualIndex, { productBrand: e.target.value })
                              }
                              placeholder="Ej: Juvederm, Radiesse"
                              disabled={readOnly}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Lote</Label>
                            <Input
                              value={session.productLot}
                              onChange={(e) =>
                                updateSession(actualIndex, { productLot: e.target.value })
                              }
                              placeholder="LOT-XXXXX"
                              disabled={readOnly}
                            />
                          </div>
                        </div>

                        <Separator />

                        {/* Mapa Facial Interactivo */}
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <h4 className="font-medium flex items-center gap-2">
                              <Syringe className="h-4 w-4 text-[#A67C52]" />
                              Puntos de Inyección
                            </h4>
                            {!readOnly && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  updateSession(actualIndex, { injectionPoints: [] })
                                }}
                              >
                                <RotateCcw className="h-3 w-3 mr-1" />
                                Limpiar
                              </Button>
                            )}
                          </div>

                          {/* Tabs para vistas */}
                          <Tabs value={activeView} onValueChange={(v) => setActiveView(v as typeof activeView)}>
                            <TabsList className="grid w-full grid-cols-3">
                              <TabsTrigger value="frontal">Frontal</TabsTrigger>
                              <TabsTrigger value="lateral_izq">Lateral Izq.</TabsTrigger>
                              <TabsTrigger value="lateral_der">Lateral Der.</TabsTrigger>
                            </TabsList>

                            <TabsContent value="frontal" className="mt-4">
                              <div className="flex gap-4">
                                <div className="flex-1 max-w-md mx-auto">
                                  <FaceMapSVG
                                    view="frontal"
                                    injectionPoints={session.injectionPoints}
                                    onAddPoint={!readOnly ? addInjectionPoint : undefined}
                                    onSelectPoint={(point) => {
                                      setSelectedPoint(point)
                                      setShowPointDialog(true)
                                    }}
                                    selectedPointId={selectedPoint?.id}
                                    readOnly={readOnly}
                                    className="aspect-square border rounded-lg"
                                  />
                                </div>
                              </div>
                            </TabsContent>

                            <TabsContent value="lateral_izq" className="mt-4">
                              <div className="flex gap-4">
                                <div className="flex-1 max-w-md mx-auto">
                                  <FaceMapSVG
                                    view="lateral_izq"
                                    injectionPoints={session.injectionPoints}
                                    onAddPoint={!readOnly ? addInjectionPoint : undefined}
                                    onSelectPoint={(point) => {
                                      setSelectedPoint(point)
                                      setShowPointDialog(true)
                                    }}
                                    selectedPointId={selectedPoint?.id}
                                    readOnly={readOnly}
                                    className="aspect-square border rounded-lg"
                                  />
                                </div>
                              </div>
                            </TabsContent>

                            <TabsContent value="lateral_der" className="mt-4">
                              <div className="flex gap-4">
                                <div className="flex-1 max-w-md mx-auto">
                                  <FaceMapSVG
                                    view="lateral_der"
                                    injectionPoints={session.injectionPoints}
                                    onAddPoint={!readOnly ? addInjectionPoint : undefined}
                                    onSelectPoint={(point) => {
                                      setSelectedPoint(point)
                                      setShowPointDialog(true)
                                    }}
                                    selectedPointId={selectedPoint?.id}
                                    readOnly={readOnly}
                                    className="aspect-square border rounded-lg"
                                  />
                                </div>
                              </div>
                            </TabsContent>
                          </Tabs>

                          {!readOnly && (
                            <p className="text-sm text-muted-foreground text-center">
                              Haz clic en el rostro para agregar puntos de inyección
                            </p>
                          )}
                        </div>

                        {/* Tabla de puntos de inyección */}
                        {session.injectionPoints.length > 0 && (
                          <>
                            <Separator />
                            <div className="space-y-3">
                              <h4 className="font-medium flex items-center gap-2">
                                <Package className="h-4 w-4 text-[#A67C52]" />
                                Detalle de Aplicaciones
                              </h4>
                              <div className="overflow-x-auto border rounded-lg">
                                <Table>
                                  <TableHeader>
                                    <TableRow className="bg-muted/50">
                                      <TableHead className="w-12">#</TableHead>
                                      <TableHead>Zona</TableHead>
                                      <TableHead>Producto</TableHead>
                                      <TableHead>Dilución</TableHead>
                                      <TableHead>Lote</TableHead>
                                      <TableHead>Dosis</TableHead>
                                      {!readOnly && <TableHead className="w-16"></TableHead>}
                                    </TableRow>
                                  </TableHeader>
                                  <TableBody>
                                    {session.injectionPoints.map((point, idx) => (
                                      <TableRow
                                        key={point.id}
                                        className={
                                          selectedPoint?.id === point.id
                                            ? 'bg-[#A67C52]/10'
                                            : 'cursor-pointer hover:bg-muted/50'
                                        }
                                        onClick={() => {
                                          setSelectedPoint(point)
                                          setShowPointDialog(true)
                                        }}
                                      >
                                        <TableCell className="font-medium">{idx + 1}</TableCell>
                                        <TableCell>
                                          {FACIAL_ZONES.find((z) => z.value === point.zone)?.label ||
                                            point.zone}
                                        </TableCell>
                                        <TableCell>{point.product || '-'}</TableCell>
                                        <TableCell>{point.dilution || '-'}</TableCell>
                                        <TableCell>{point.lot || '-'}</TableCell>
                                        <TableCell>{point.dose || '-'}</TableCell>
                                        {!readOnly && (
                                          <TableCell>
                                            <Button
                                              variant="ghost"
                                              size="icon"
                                              className="h-7 w-7 text-destructive"
                                              onClick={(e) => {
                                                e.stopPropagation()
                                                removeInjectionPoint(point.id)
                                              }}
                                            >
                                              <Trash2 className="h-4 w-4" />
                                            </Button>
                                          </TableCell>
                                        )}
                                      </TableRow>
                                    ))}
                                  </TableBody>
                                </Table>
                              </div>
                            </div>
                          </>
                        )}

                        <Separator />

                        {/* Observaciones y recomendaciones */}
                        <div className="grid gap-4 sm:grid-cols-2">
                          <div className="space-y-2">
                            <Label>Observaciones</Label>
                            <Textarea
                              value={session.observations}
                              onChange={(e) =>
                                updateSession(actualIndex, { observations: e.target.value })
                              }
                              placeholder="Notas del procedimiento..."
                              rows={3}
                              disabled={readOnly}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Recomendaciones</Label>
                            <Textarea
                              value={session.recommendations}
                              onChange={(e) =>
                                updateSession(actualIndex, { recommendations: e.target.value })
                              }
                              placeholder="Cuidados post-tratamiento..."
                              rows={3}
                              disabled={readOnly}
                            />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label>Próxima Cita</Label>
                          <Input
                            type="date"
                            value={session.nextVisitDate || ''}
                            onChange={(e) =>
                              updateSession(actualIndex, { nextVisitDate: e.target.value })
                            }
                            disabled={readOnly}
                            className="max-w-xs"
                          />
                        </div>
                      </CardContent>
                    )}
                  </Card>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog para editar punto de inyección */}
      <Dialog open={showPointDialog} onOpenChange={setShowPointDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Syringe className="h-5 w-5 text-[#A67C52]" />
              Detalle del Punto de Inyección
            </DialogTitle>
            <DialogDescription>
              {selectedPoint
                ? FACIAL_ZONES.find((z) => z.value === selectedPoint.zone)?.label ||
                  selectedPoint.zone
                : ''}
            </DialogDescription>
          </DialogHeader>

          {selectedPoint && (
            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Zona</Label>
                  <Select
                    value={selectedPoint.zone}
                    onValueChange={(v) =>
                      updateInjectionPoint(selectedPoint.id, { zone: v as FacialZone })
                    }
                    disabled={readOnly}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {FACIAL_ZONES.map((zone) => (
                        <SelectItem key={zone.value} value={zone.value}>
                          {zone.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Producto/Tipo</Label>
                  <Select
                    value={selectedPoint.product}
                    onValueChange={(v) =>
                      updateInjectionPoint(selectedPoint.id, { product: v })
                    }
                    disabled={readOnly}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="botox">Toxina Botulínica</SelectItem>
                      <SelectItem value="relleno_ha">Ácido Hialurónico</SelectItem>
                      <SelectItem value="bioestimulador">Bioestimulador</SelectItem>
                      <SelectItem value="hilos_tensores">Hilos Tensores</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {selectedPoint.product === 'bioestimulador' && (
                <div className="space-y-2">
                  <Label>Marca</Label>
                  <Select
                    value={selectedPoint.brand || ''}
                    onValueChange={(v) =>
                      updateInjectionPoint(selectedPoint.id, {
                        brand: v as BioestimulatorBrand,
                      })
                    }
                    disabled={readOnly}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar marca" />
                    </SelectTrigger>
                    <SelectContent>
                      {BIOESTIMULATOR_BRANDS.map((brand) => (
                        <SelectItem key={brand.value} value={brand.value}>
                          {brand.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Dilución</Label>
                  <Input
                    value={selectedPoint.dilution || ''}
                    onChange={(e) =>
                      updateInjectionPoint(selectedPoint.id, { dilution: e.target.value })
                    }
                    placeholder="Ej: 2.5ml SS"
                    disabled={readOnly}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Lote</Label>
                  <Input
                    value={selectedPoint.lot}
                    onChange={(e) =>
                      updateInjectionPoint(selectedPoint.id, { lot: e.target.value })
                    }
                    placeholder="LOT-XXXXX"
                    disabled={readOnly}
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Dosis</Label>
                  <Input
                    value={selectedPoint.dose}
                    onChange={(e) =>
                      updateInjectionPoint(selectedPoint.id, { dose: e.target.value })
                    }
                    placeholder="Ej: 0.5ml o 10U"
                    disabled={readOnly}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Técnica</Label>
                  <Input
                    value={selectedPoint.technique || ''}
                    onChange={(e) =>
                      updateInjectionPoint(selectedPoint.id, { technique: e.target.value })
                    }
                    placeholder="Ej: Bolo, Retroinyección"
                    disabled={readOnly}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Notas</Label>
                <Textarea
                  value={selectedPoint.notes || ''}
                  onChange={(e) =>
                    updateInjectionPoint(selectedPoint.id, { notes: e.target.value })
                  }
                  placeholder="Observaciones adicionales..."
                  rows={2}
                  disabled={readOnly}
                />
              </div>

              {!readOnly && (
                <div className="flex justify-between pt-2">
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => removeInjectionPoint(selectedPoint.id)}
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    Eliminar
                  </Button>
                  <Button
                    variant="default"
                    size="sm"
                    onClick={() => setShowPointDialog(false)}
                    className="bg-[#A67C52] hover:bg-[#8a6543]"
                  >
                    Guardar
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default InjectableTreatmentTemplate
