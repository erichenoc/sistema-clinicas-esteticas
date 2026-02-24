'use client'

import { useState, useEffect, useRef } from 'react'
import { Trash2, Edit, Eye, History, Plus, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { toast } from 'sonner'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { FaceMap3D, type Gender } from './FaceMap3D'
import type {
  InjectionPoint,
  InjectionZone,
  InjectableTreatmentData,
  Point3D,
} from '@/types/treatment-templates'
import {
  INJECTION_ZONES,
  INJECTION_TECHNIQUES,
  INJECTABLE_PRODUCTS,
} from '@/types/treatment-templates'
import { getPatientTreatmentHistory } from '@/actions/sessions'
import {
  getInjectableProducts,
  addInjectableProduct,
  removeInjectableProduct,
} from '@/actions/injectable-products'

interface InjectableTreatmentTemplateProps {
  data: InjectableTreatmentData
  onChange: (data: InjectableTreatmentData) => void
  readOnly?: boolean
  patientId?: string // Para cargar historial de tratamientos anteriores
  patientGender?: Gender // Género del paciente para mostrar modelo 3D apropiado
  currentSessionId?: string // Para excluir la sesión actual del historial
}

const emptyPoint: Omit<InjectionPoint, 'id' | 'position3D'> = {
  zone: 'frente',
  product: '',
  dilution: null,
  lot: null,
  dose: '',
  technique: '',
  notes: '',
}

export function InjectableTreatmentTemplate({
  data,
  onChange,
  readOnly = false,
  patientId,
  patientGender,
  currentSessionId,
}: InjectableTreatmentTemplateProps) {
  const [selectedPoint, setSelectedPoint] = useState<InjectionPoint | null>(null)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [editingPoint, setEditingPoint] = useState<InjectionPoint | null>(null)
  const [historyPoints, setHistoryPoints] = useState<InjectionPoint[]>([])
  const [showHistory, setShowHistory] = useState(true)
  const [loadingHistory, setLoadingHistory] = useState(false)

  // Dynamic injectable products
  const [products, setProducts] = useState<string[]>(INJECTABLE_PRODUCTS)
  const [showAddProduct, setShowAddProduct] = useState(false)
  const [newProductName, setNewProductName] = useState('')
  const [addingProduct, setAddingProduct] = useState(false)
  const newProductInputRef = useRef<HTMLInputElement>(null)

  // Load products from DB
  useEffect(() => {
    getInjectableProducts().then(setProducts).catch(() => setProducts(INJECTABLE_PRODUCTS))
  }, [])

  const handleAddProduct = async () => {
    if (!newProductName.trim()) return
    setAddingProduct(true)
    const result = await addInjectableProduct(newProductName.trim())
    if (result.success) {
      setProducts(prev => [...prev, newProductName.trim()])
      setNewProductName('')
      setShowAddProduct(false)
      toast.success('Producto agregado')
    } else {
      toast.error(result.error || 'Error al agregar')
    }
    setAddingProduct(false)
  }

  const handleRemoveProduct = async (productName: string) => {
    const result = await removeInjectableProduct(productName)
    if (result.success) {
      setProducts(prev => prev.filter(p => p !== productName))
      toast.success('Producto eliminado')
    } else {
      toast.error(result.error || 'Error al eliminar')
    }
  }

  // Cargar historial de tratamientos del paciente
  useEffect(() => {
    async function loadHistory() {
      if (!patientId) return

      setLoadingHistory(true)
      try {
        const history = await getPatientTreatmentHistory(patientId, {
          excludeSessionId: currentSessionId,
          limit: 10,
        })
        setHistoryPoints(history)
      } catch (error) {
        console.error('Error loading treatment history:', error)
      } finally {
        setLoadingHistory(false)
      }
    }

    loadHistory()
  }, [patientId, currentSessionId])

  const handleAddPoint = (position: Point3D, zone: InjectionZone) => {
    const newPoint: InjectionPoint = {
      ...emptyPoint,
      id: crypto.randomUUID(),
      position3D: position,
      zone, // Use the auto-detected zone from FaceMap3D
    }
    setEditingPoint(newPoint)
    setEditDialogOpen(true)
  }

  const handlePointClick = (point: InjectionPoint) => {
    setSelectedPoint(point)
    if (!readOnly) {
      setEditingPoint({ ...point })
      setEditDialogOpen(true)
    }
  }

  const savePoint = () => {
    if (!editingPoint) return

    const existingIndex = data.injectionPoints.findIndex((p) => p.id === editingPoint.id)
    let newPoints: InjectionPoint[]

    if (existingIndex >= 0) {
      newPoints = [...data.injectionPoints]
      newPoints[existingIndex] = editingPoint
    } else {
      newPoints = [...data.injectionPoints, editingPoint]
    }

    onChange({
      ...data,
      injectionPoints: newPoints,
    })
    setEditDialogOpen(false)
    setEditingPoint(null)
    setSelectedPoint(editingPoint)
  }

  const deletePoint = (id: string) => {
    onChange({
      ...data,
      injectionPoints: data.injectionPoints.filter((p) => p.id !== id),
    })
    if (selectedPoint?.id === id) {
      setSelectedPoint(null)
    }
    setEditDialogOpen(false)
    setEditingPoint(null)
  }

  const getZoneLabel = (zone: InjectionZone) => {
    return INJECTION_ZONES.find((z) => z.value === zone)?.label || zone
  }

  const totalPoints = data.injectionPoints.length

  return (
    <div className="space-y-6">
      {/* 3D Face Map Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center justify-between">
            <span>Mapa de Inyecciones 3D</span>
            <div className="flex items-center gap-4">
              {patientId && historyPoints.length > 0 && (
                <div className="flex items-center gap-2">
                  <History className="h-4 w-4 text-muted-foreground" />
                  <Label htmlFor="show-history" className="text-sm font-normal cursor-pointer">
                    Mostrar historial ({historyPoints.length})
                  </Label>
                  <Switch
                    id="show-history"
                    checked={showHistory}
                    onCheckedChange={setShowHistory}
                  />
                </div>
              )}
              <Badge variant="outline">{totalPoints} puntos</Badge>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <FaceMap3D
            points={data.injectionPoints}
            historyPoints={showHistory ? historyPoints : []}
            onPointClick={handlePointClick}
            onAddPoint={readOnly ? undefined : handleAddPoint}
            selectedPointId={selectedPoint?.id}
            readOnly={readOnly}
            showHistory={showHistory}
            gender={patientGender}
            className="mx-auto"
          />

          {!readOnly && (
            <p className="text-sm text-muted-foreground text-center mt-4">
              Arrastra para rotar el modelo, scroll para zoom, clic para agregar punto
            </p>
          )}

          {loadingHistory && (
            <p className="text-sm text-muted-foreground text-center mt-2">
              Cargando historial...
            </p>
          )}
        </CardContent>
      </Card>

      {/* Injection Points Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Detalle de Aplicaciones</CardTitle>
        </CardHeader>
        <CardContent>
          {data.injectionPoints.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No hay puntos de inyeccion registrados.
              {!readOnly && ' Haz clic en el modelo 3D para agregar.'}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>#</TableHead>
                    <TableHead>Zona</TableHead>
                    <TableHead>Producto</TableHead>
                    <TableHead>Dilucion</TableHead>
                    <TableHead>Lote</TableHead>
                    <TableHead>Dosis</TableHead>
                    <TableHead>Tecnica</TableHead>
                    <TableHead className="w-20">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.injectionPoints.map((point, index) => (
                    <TableRow
                      key={point.id}
                      className={`cursor-pointer ${
                        selectedPoint?.id === point.id ? 'bg-muted' : ''
                      }`}
                      onClick={() => setSelectedPoint(point)}
                    >
                      <TableCell>
                        <Badge variant="secondary" className="font-mono">
                          {index + 1}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium">{getZoneLabel(point.zone)}</TableCell>
                      <TableCell>{point.product || '-'}</TableCell>
                      <TableCell>{point.dilution || '-'}</TableCell>
                      <TableCell className="font-mono text-xs">{point.lot || '-'}</TableCell>
                      <TableCell>{point.dose || '-'}</TableCell>
                      <TableCell>{point.technique || '-'}</TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          {!readOnly && (
                            <>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  setEditingPoint({ ...point })
                                  setEditDialogOpen(true)
                                }}
                              >
                                <Edit className="h-3 w-3" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 text-destructive"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  deletePoint(point.id)
                                }}
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </>
                          )}
                          {readOnly && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              onClick={(e) => {
                                e.stopPropagation()
                                setSelectedPoint(point)
                              }}
                            >
                              <Eye className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Product Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Producto Principal
            </CardTitle>
          </CardHeader>
          <CardContent>
            {readOnly ? (
              <p className="font-medium">{data.productUsed || '-'}</p>
            ) : (
              <Select
                value={data.productUsed}
                onValueChange={(value) => {
                  if (value === '__add_new__') {
                    setShowAddProduct(true)
                    return
                  }
                  onChange({ ...data, productUsed: value })
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar producto" />
                </SelectTrigger>
                <SelectContent>
                  {products.map((product) => (
                    <SelectItem key={product} value={product}>
                      {product}
                    </SelectItem>
                  ))}
                  <div className="border-t mt-1 pt-1">
                    <SelectItem value="__add_new__" className="text-primary font-medium">
                      <div className="flex items-center gap-2">
                        <Plus className="h-3 w-3" />
                        Gestionar productos
                      </div>
                    </SelectItem>
                  </div>
                </SelectContent>
              </Select>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Numero de Lote
            </CardTitle>
          </CardHeader>
          <CardContent>
            {readOnly ? (
              <p className="font-mono">{data.lotNumber || '-'}</p>
            ) : (
              <Input
                value={data.lotNumber}
                onChange={(e) => onChange({ ...data, lotNumber: e.target.value })}
                placeholder="LOT-XXXX"
              />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Dosis Total
            </CardTitle>
          </CardHeader>
          <CardContent>
            {readOnly ? (
              <p className="font-medium">{data.totalDose || '-'}</p>
            ) : (
              <Input
                value={data.totalDose}
                onChange={(e) => onChange({ ...data, totalDose: e.target.value })}
                placeholder="Ej: 50U, 1ml"
              />
            )}
          </CardContent>
        </Card>
      </div>

      {/* Observations & Recommendations */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Observaciones</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              value={data.observations}
              onChange={(e) => onChange({ ...data, observations: e.target.value })}
              placeholder="Observaciones del procedimiento..."
              rows={4}
              disabled={readOnly}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Recomendaciones</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              value={data.recommendations}
              onChange={(e) => onChange({ ...data, recommendations: e.target.value })}
              placeholder="Recomendaciones post-tratamiento..."
              rows={4}
              disabled={readOnly}
            />
          </CardContent>
        </Card>
      </div>

      {/* Manage Products Dialog */}
      <Dialog open={showAddProduct && !editDialogOpen} onOpenChange={setShowAddProduct}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Gestionar Productos Inyectables</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {/* Add new product */}
            <div className="space-y-2">
              <Label>Agregar Nuevo Producto</Label>
              <div className="flex gap-2">
                <Input
                  value={newProductName}
                  onChange={(e) => setNewProductName(e.target.value)}
                  placeholder="Ej: Juvederm Volux"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') { e.preventDefault(); handleAddProduct() }
                  }}
                  disabled={addingProduct}
                  autoFocus
                />
                <Button
                  onClick={handleAddProduct}
                  disabled={addingProduct || !newProductName.trim()}
                  size="sm"
                  className="shrink-0"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Agregar
                </Button>
              </div>
            </div>

            {/* Existing products list */}
            <div className="space-y-2">
              <Label className="text-sm text-muted-foreground">
                Productos existentes ({products.length})
              </Label>
              <div className="max-h-64 overflow-y-auto space-y-1 border rounded-md p-2">
                {products.map((product) => (
                  <div
                    key={product}
                    className="flex items-center justify-between py-1.5 px-2 rounded hover:bg-muted text-sm"
                  >
                    <span>{product}</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={() => handleRemoveProduct(product)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddProduct(false)}>
              Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Point Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingPoint && data.injectionPoints.find((p) => p.id === editingPoint.id)
                ? 'Editar Punto de Inyeccion'
                : 'Nuevo Punto de Inyeccion'}
            </DialogTitle>
          </DialogHeader>

          {editingPoint && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Zona</Label>
                  <Select
                    value={editingPoint.zone}
                    onValueChange={(value) =>
                      setEditingPoint({ ...editingPoint, zone: value as InjectionZone })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {INJECTION_ZONES.map((zone) => (
                        <SelectItem key={zone.value} value={zone.value}>
                          {zone.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Producto</Label>
                  {showAddProduct ? (
                    <div className="flex gap-1">
                      <Input
                        ref={newProductInputRef}
                        value={newProductName}
                        onChange={(e) => setNewProductName(e.target.value)}
                        placeholder="Nombre del producto"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') { e.preventDefault(); handleAddProduct() }
                          if (e.key === 'Escape') setShowAddProduct(false)
                        }}
                        disabled={addingProduct}
                        autoFocus
                      />
                      <Button size="icon" variant="ghost" onClick={handleAddProduct} disabled={addingProduct}>
                        <Plus className="h-4 w-4" />
                      </Button>
                      <Button size="icon" variant="ghost" onClick={() => setShowAddProduct(false)}>
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <Select
                      value={editingPoint.product}
                      onValueChange={(value) => {
                        if (value === '__add_new__') {
                          setShowAddProduct(true)
                          return
                        }
                        setEditingPoint({ ...editingPoint, product: value })
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar" />
                      </SelectTrigger>
                      <SelectContent>
                        {products.map((product) => (
                          <SelectItem key={product} value={product}>
                            <div className="flex items-center justify-between w-full gap-2">
                              <span>{product}</span>
                            </div>
                          </SelectItem>
                        ))}
                        <div className="border-t mt-1 pt-1">
                          <SelectItem value="__add_new__" className="text-primary font-medium">
                            <div className="flex items-center gap-2">
                              <Plus className="h-3 w-3" />
                              Gestionar productos
                            </div>
                          </SelectItem>
                        </div>
                      </SelectContent>
                    </Select>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Dilucion</Label>
                  <Input
                    value={editingPoint.dilution || ''}
                    onChange={(e) =>
                      setEditingPoint({
                        ...editingPoint,
                        dilution: e.target.value || null,
                      })
                    }
                    placeholder="Ej: 2.5ml NaCl"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Lote</Label>
                  <Input
                    value={editingPoint.lot || ''}
                    onChange={(e) =>
                      setEditingPoint({
                        ...editingPoint,
                        lot: e.target.value || null,
                      })
                    }
                    placeholder="LOT-XXXX"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Dosis</Label>
                  <Input
                    value={editingPoint.dose}
                    onChange={(e) =>
                      setEditingPoint({ ...editingPoint, dose: e.target.value })
                    }
                    placeholder="Ej: 5U, 0.1ml"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Tecnica</Label>
                  <Select
                    value={editingPoint.technique}
                    onValueChange={(value) =>
                      setEditingPoint({ ...editingPoint, technique: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar" />
                    </SelectTrigger>
                    <SelectContent>
                      {INJECTION_TECHNIQUES.map((tech) => (
                        <SelectItem key={tech} value={tech}>
                          {tech}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Notas</Label>
                <Textarea
                  value={editingPoint.notes}
                  onChange={(e) =>
                    setEditingPoint({ ...editingPoint, notes: e.target.value })
                  }
                  placeholder="Notas adicionales..."
                  rows={2}
                />
              </div>
            </div>
          )}

          <DialogFooter className="flex justify-between">
            <div>
              {editingPoint && data.injectionPoints.find((p) => p.id === editingPoint.id) && (
                <Button
                  variant="destructive"
                  onClick={() => deletePoint(editingPoint.id)}
                >
                  Eliminar
                </Button>
              )}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={savePoint}>Guardar</Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default InjectableTreatmentTemplate
