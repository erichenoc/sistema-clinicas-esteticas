'use client'

import { useState } from 'react'
import { Plus, Trash2, Calendar } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type { FacialSession, FacialTreatmentData } from '@/types/treatment-templates'
import { PEELING_TYPES, FACIAL_TYPES } from '@/types/treatment-templates'

interface FacialTreatmentTemplateProps {
  data: FacialTreatmentData
  onChange: (data: FacialTreatmentData) => void
  readOnly?: boolean
}

const emptySession: Omit<FacialSession, 'id' | 'sessionNumber'> = {
  date: new Date().toISOString().split('T')[0],
  facialType: '',
  peelingType: null,
  peelingTime: null,
  mesotherapyProducts: [],
  maskUsed: null,
  maskTime: null,
  otherProducts: [],
  observations: '',
  nextVisit: null,
}

export function FacialTreatmentTemplate({
  data,
  onChange,
  readOnly = false,
}: FacialTreatmentTemplateProps) {
  const [editingSession, setEditingSession] = useState<FacialSession | null>(null)
  const [mesotherapyInput, setMesotherapyInput] = useState('')
  const [otherProductInput, setOtherProductInput] = useState('')

  const addSession = () => {
    const newSession: FacialSession = {
      ...emptySession,
      id: crypto.randomUUID(),
      sessionNumber: data.sessions.length + 1,
    }
    setEditingSession(newSession)
  }

  const saveSession = () => {
    if (!editingSession) return

    const existingIndex = data.sessions.findIndex((s) => s.id === editingSession.id)
    let newSessions: FacialSession[]

    if (existingIndex >= 0) {
      newSessions = [...data.sessions]
      newSessions[existingIndex] = editingSession
    } else {
      newSessions = [...data.sessions, editingSession]
    }

    onChange({
      ...data,
      sessions: newSessions,
    })
    setEditingSession(null)
  }

  const deleteSession = (id: string) => {
    onChange({
      ...data,
      sessions: data.sessions
        .filter((s) => s.id !== id)
        .map((s, idx) => ({ ...s, sessionNumber: idx + 1 })),
    })
  }

  const addMesotherapyProduct = () => {
    if (!mesotherapyInput.trim() || !editingSession) return
    setEditingSession({
      ...editingSession,
      mesotherapyProducts: [...editingSession.mesotherapyProducts, mesotherapyInput.trim()],
    })
    setMesotherapyInput('')
  }

  const removeMesotherapyProduct = (index: number) => {
    if (!editingSession) return
    setEditingSession({
      ...editingSession,
      mesotherapyProducts: editingSession.mesotherapyProducts.filter((_, i) => i !== index),
    })
  }

  const addOtherProduct = () => {
    if (!otherProductInput.trim() || !editingSession) return
    setEditingSession({
      ...editingSession,
      otherProducts: [...editingSession.otherProducts, otherProductInput.trim()],
    })
    setOtherProductInput('')
  }

  const removeOtherProduct = (index: number) => {
    if (!editingSession) return
    setEditingSession({
      ...editingSession,
      otherProducts: editingSession.otherProducts.filter((_, i) => i !== index),
    })
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('es-MX', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })
  }

  return (
    <div className="space-y-6">
      {/* Sessions Table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg">Sesiones de Tratamiento Facial</CardTitle>
          {!readOnly && (
            <Button onClick={addSession} size="sm">
              <Plus className="h-4 w-4 mr-1" />
              Nueva Sesión
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {data.sessions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No hay sesiones registradas. Haz clic en "Nueva Sesión" para comenzar.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-16">#</TableHead>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Tipo de Facial</TableHead>
                    <TableHead>Peeling</TableHead>
                    <TableHead>Mesoterapia</TableHead>
                    <TableHead>Mascarilla</TableHead>
                    <TableHead>Próxima Visita</TableHead>
                    {!readOnly && <TableHead className="w-20">Acciones</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.sessions.map((session) => (
                    <TableRow
                      key={session.id}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => !readOnly && setEditingSession(session)}
                    >
                      <TableCell className="font-medium">{session.sessionNumber}</TableCell>
                      <TableCell>{formatDate(session.date)}</TableCell>
                      <TableCell>{session.facialType || '-'}</TableCell>
                      <TableCell>
                        {session.peelingType ? (
                          <span>
                            {session.peelingType}
                            {session.peelingTime && (
                              <span className="text-muted-foreground ml-1">
                                ({session.peelingTime} min)
                              </span>
                            )}
                          </span>
                        ) : (
                          '-'
                        )}
                      </TableCell>
                      <TableCell>
                        {session.mesotherapyProducts.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {session.mesotherapyProducts.slice(0, 2).map((p, i) => (
                              <Badge key={i} variant="secondary" className="text-xs">
                                {p}
                              </Badge>
                            ))}
                            {session.mesotherapyProducts.length > 2 && (
                              <Badge variant="outline" className="text-xs">
                                +{session.mesotherapyProducts.length - 2}
                              </Badge>
                            )}
                          </div>
                        ) : (
                          '-'
                        )}
                      </TableCell>
                      <TableCell>
                        {session.maskUsed ? (
                          <span>
                            {session.maskUsed}
                            {session.maskTime && (
                              <span className="text-muted-foreground ml-1">
                                ({session.maskTime} min)
                              </span>
                            )}
                          </span>
                        ) : (
                          '-'
                        )}
                      </TableCell>
                      <TableCell>
                        {session.nextVisit ? (
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {formatDate(session.nextVisit)}
                          </span>
                        ) : (
                          '-'
                        )}
                      </TableCell>
                      {!readOnly && (
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive"
                            onClick={(e) => {
                              e.stopPropagation()
                              deleteSession(session.id)
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
          )}
        </CardContent>
      </Card>

      {/* Session Edit Form */}
      {editingSession && !readOnly && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              {data.sessions.find((s) => s.id === editingSession.id)
                ? `Editar Sesión #${editingSession.sessionNumber}`
                : `Nueva Sesión #${editingSession.sessionNumber}`}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Fecha de Sesión</Label>
                <Input
                  type="date"
                  value={editingSession.date}
                  onChange={(e) =>
                    setEditingSession({ ...editingSession, date: e.target.value })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label>Tipo de Facial</Label>
                <Select
                  value={editingSession.facialType}
                  onValueChange={(value) =>
                    setEditingSession({ ...editingSession, facialType: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    {FACIAL_TYPES.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Próxima Visita</Label>
                <Input
                  type="date"
                  value={editingSession.nextVisit || ''}
                  onChange={(e) =>
                    setEditingSession({
                      ...editingSession,
                      nextVisit: e.target.value || null,
                    })
                  }
                />
              </div>
            </div>

            {/* Peeling Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Peeling Utilizado</Label>
                <Select
                  value={editingSession.peelingType || ''}
                  onValueChange={(value) =>
                    setEditingSession({
                      ...editingSession,
                      peelingType: value || null,
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar peeling" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Sin peeling</SelectItem>
                    {PEELING_TYPES.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Tiempo de Peeling (minutos)</Label>
                <Input
                  type="number"
                  min={0}
                  value={editingSession.peelingTime || ''}
                  onChange={(e) =>
                    setEditingSession({
                      ...editingSession,
                      peelingTime: e.target.value ? parseInt(e.target.value) : null,
                    })
                  }
                  placeholder="Ej: 5"
                />
              </div>
            </div>

            {/* Mesotherapy Products */}
            <div className="space-y-2">
              <Label>Productos de Mesoterapia</Label>
              <div className="flex gap-2">
                <Input
                  value={mesotherapyInput}
                  onChange={(e) => setMesotherapyInput(e.target.value)}
                  placeholder="Agregar producto..."
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addMesotherapyProduct())}
                />
                <Button type="button" onClick={addMesotherapyProduct} size="sm">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              {editingSession.mesotherapyProducts.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {editingSession.mesotherapyProducts.map((product, index) => (
                    <Badge key={index} variant="secondary" className="gap-1">
                      {product}
                      <button
                        type="button"
                        onClick={() => removeMesotherapyProduct(index)}
                        className="ml-1 hover:text-destructive"
                      >
                        &times;
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            {/* Mask Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Mascarilla Usada</Label>
                <Input
                  value={editingSession.maskUsed || ''}
                  onChange={(e) =>
                    setEditingSession({
                      ...editingSession,
                      maskUsed: e.target.value || null,
                    })
                  }
                  placeholder="Ej: Mascarilla de colágeno"
                />
              </div>

              <div className="space-y-2">
                <Label>Tiempo de Mascarilla (minutos)</Label>
                <Input
                  type="number"
                  min={0}
                  value={editingSession.maskTime || ''}
                  onChange={(e) =>
                    setEditingSession({
                      ...editingSession,
                      maskTime: e.target.value ? parseInt(e.target.value) : null,
                    })
                  }
                  placeholder="Ej: 15"
                />
              </div>
            </div>

            {/* Other Products */}
            <div className="space-y-2">
              <Label>Otros Productos</Label>
              <div className="flex gap-2">
                <Input
                  value={otherProductInput}
                  onChange={(e) => setOtherProductInput(e.target.value)}
                  placeholder="Agregar producto..."
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addOtherProduct())}
                />
                <Button type="button" onClick={addOtherProduct} size="sm">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              {editingSession.otherProducts.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {editingSession.otherProducts.map((product, index) => (
                    <Badge key={index} variant="outline" className="gap-1">
                      {product}
                      <button
                        type="button"
                        onClick={() => removeOtherProduct(index)}
                        className="ml-1 hover:text-destructive"
                      >
                        &times;
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            {/* Observations */}
            <div className="space-y-2">
              <Label>Observaciones</Label>
              <Textarea
                value={editingSession.observations}
                onChange={(e) =>
                  setEditingSession({ ...editingSession, observations: e.target.value })
                }
                placeholder="Notas sobre la sesión..."
                rows={3}
              />
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditingSession(null)}
              >
                Cancelar
              </Button>
              <Button type="button" onClick={saveSession}>
                Guardar Sesión
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* General Notes */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Notas Generales</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            value={data.generalNotes}
            onChange={(e) => onChange({ ...data, generalNotes: e.target.value })}
            placeholder="Notas generales del tratamiento..."
            rows={3}
            disabled={readOnly}
          />
        </CardContent>
      </Card>
    </div>
  )
}

export default FacialTreatmentTemplate
