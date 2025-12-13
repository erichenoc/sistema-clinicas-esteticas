'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft,
  Save,
  FileText,
  Plus,
  Trash2,
  Clock,
  User,
  Loader2,
  MessageSquare,
  Edit,
  Check,
  X,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { toast } from 'sonner'
import { format, formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'

// Mock session data
const mockSession = {
  id: '1',
  patientName: 'Maria Garcia Lopez',
  treatmentName: 'Limpieza Facial Profunda',
  professionalName: 'Dra. Maria Garcia',
  date: new Date().toISOString(),
}

// Mock notes
const mockNotes = [
  {
    id: '1',
    content: 'Paciente llego 10 minutos antes de la cita. Se realizo limpieza inicial.',
    createdBy: 'Dra. Maria Garcia',
    createdAt: new Date(Date.now() - 3600000).toISOString(),
    type: 'progress',
  },
  {
    id: '2',
    content: 'Se aplico mascarilla purificante. Paciente refiere sensacion de frescura.',
    createdBy: 'Dra. Maria Garcia',
    createdAt: new Date(Date.now() - 1800000).toISOString(),
    type: 'progress',
  },
]

type NoteType = 'progress' | 'observation' | 'warning' | 'recommendation'

const NOTE_TYPES: { value: NoteType; label: string; color: string }[] = [
  { value: 'progress', label: 'Progreso', color: 'bg-blue-500' },
  { value: 'observation', label: 'Observacion', color: 'bg-green-500' },
  { value: 'warning', label: 'Advertencia', color: 'bg-amber-500' },
  { value: 'recommendation', label: 'Recomendacion', color: 'bg-purple-500' },
]

interface Note {
  id: string
  content: string
  createdBy: string
  createdAt: string
  type: NoteType
}

export default function NotasSesionPage() {
  const params = useParams()
  const router = useRouter()
  const sessionId = params.id as string

  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [notes, setNotes] = useState<Note[]>([])
  const [newNote, setNewNote] = useState('')
  const [newNoteType, setNewNoteType] = useState<NoteType>('progress')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingContent, setEditingContent] = useState('')

  useEffect(() => {
    // Simulate loading
    setTimeout(() => {
      setNotes(mockNotes as Note[])
      setIsLoading(false)
    }, 500)
  }, [sessionId])

  const handleAddNote = async () => {
    if (!newNote.trim()) {
      toast.error('Escribe una nota antes de agregar')
      return
    }

    setIsSaving(true)
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 500))

      const note: Note = {
        id: Date.now().toString(),
        content: newNote,
        createdBy: 'Usuario Actual',
        createdAt: new Date().toISOString(),
        type: newNoteType,
      }

      setNotes([note, ...notes])
      setNewNote('')
      toast.success('Nota agregada')
    } catch (error) {
      toast.error('Error al agregar nota')
    } finally {
      setIsSaving(false)
    }
  }

  const handleEditNote = (note: Note) => {
    setEditingId(note.id)
    setEditingContent(note.content)
  }

  const handleSaveEdit = async (id: string) => {
    if (!editingContent.trim()) {
      toast.error('La nota no puede estar vacia')
      return
    }

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 500))

      setNotes(notes.map((n) => (n.id === id ? { ...n, content: editingContent } : n)))
      setEditingId(null)
      setEditingContent('')
      toast.success('Nota actualizada')
    } catch (error) {
      toast.error('Error al actualizar nota')
    }
  }

  const handleDeleteNote = async (id: string) => {
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 500))

      setNotes(notes.filter((n) => n.id !== id))
      toast.success('Nota eliminada')
    } catch (error) {
      toast.error('Error al eliminar nota')
    }
  }

  const getNoteTypeInfo = (type: NoteType) => {
    return NOTE_TYPES.find((t) => t.value === type) || NOTE_TYPES[0]
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-[#A67C52]" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href={`/sesiones/${sessionId}`}>
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Notas de Sesion</h1>
            <p className="text-muted-foreground">
              {mockSession.treatmentName} - {mockSession.patientName}
            </p>
          </div>
        </div>
      </div>

      {/* Session Info */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <Avatar className="h-12 w-12">
              <AvatarFallback className="bg-[#A67C52] text-white">
                {mockSession.patientName.split(' ').map((n) => n[0]).join('').slice(0, 2)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <p className="font-medium">{mockSession.patientName}</p>
              <p className="text-sm text-muted-foreground">{mockSession.treatmentName}</p>
            </div>
            <div className="text-right">
              <p className="text-sm font-medium">{mockSession.professionalName}</p>
              <p className="text-sm text-muted-foreground">
                {format(new Date(mockSession.date), "d 'de' MMMM, yyyy", { locale: es })}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Add New Note */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5 text-[#A67C52]" />
            Nueva Nota
          </CardTitle>
          <CardDescription>Agrega una nota al registro de esta sesion</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Tipo de nota</Label>
            <div className="flex flex-wrap gap-2">
              {NOTE_TYPES.map((type) => (
                <Badge
                  key={type.value}
                  variant={newNoteType === type.value ? 'default' : 'outline'}
                  className={`cursor-pointer transition-colors ${
                    newNoteType === type.value
                      ? type.color
                      : 'hover:bg-muted'
                  }`}
                  onClick={() => setNewNoteType(type.value)}
                >
                  {type.label}
                </Badge>
              ))}
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="newNote">Contenido</Label>
            <Textarea
              id="newNote"
              placeholder="Escribe tu nota aqui..."
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              rows={4}
            />
          </div>
          <Button
            onClick={handleAddNote}
            disabled={isSaving || !newNote.trim()}
            className="bg-[#A67C52] hover:bg-[#8a6543]"
          >
            {isSaving ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Plus className="h-4 w-4 mr-2" />
            )}
            Agregar Nota
          </Button>
        </CardContent>
      </Card>

      {/* Notes History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-[#A67C52]" />
            Historial de Notas
          </CardTitle>
          <CardDescription>{notes.length} notas registradas</CardDescription>
        </CardHeader>
        <CardContent>
          {notes.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No hay notas registradas</p>
              <p className="text-sm text-muted-foreground mt-1">
                Agrega la primera nota usando el formulario anterior
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {notes.map((note) => {
                const typeInfo = getNoteTypeInfo(note.type)
                return (
                  <div
                    key={note.id}
                    className="p-4 border rounded-lg hover:border-[#A67C52]/50 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge className={typeInfo.color}>{typeInfo.label}</Badge>
                          <span className="text-sm text-muted-foreground">
                            {formatDistanceToNow(new Date(note.createdAt), {
                              addSuffix: true,
                              locale: es,
                            })}
                          </span>
                        </div>
                        {editingId === note.id ? (
                          <div className="space-y-2">
                            <Textarea
                              value={editingContent}
                              onChange={(e) => setEditingContent(e.target.value)}
                              rows={3}
                            />
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                onClick={() => handleSaveEdit(note.id)}
                                className="bg-[#A67C52] hover:bg-[#8a6543]"
                              >
                                <Check className="h-4 w-4 mr-1" />
                                Guardar
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setEditingId(null)
                                  setEditingContent('')
                                }}
                              >
                                <X className="h-4 w-4 mr-1" />
                                Cancelar
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <p className="text-sm">{note.content}</p>
                        )}
                        <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                          <User className="h-3 w-3" />
                          {note.createdBy}
                          <span>•</span>
                          <Clock className="h-3 w-3" />
                          {format(new Date(note.createdAt), 'HH:mm')}
                        </div>
                      </div>
                      {editingId !== note.id && (
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEditNote(note)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteNote(note.id)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
