'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Camera, Calendar, ChevronDown, ChevronUp, ExternalLink, Loader2, ImageOff } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { getPatientPhotoHistory, type SessionImageData } from '@/actions/sessions'

// Body zones for display
const BODY_ZONES: Record<string, string> = {
  face_full: 'Rostro completo',
  face_forehead: 'Frente',
  face_cheeks: 'Mejillas',
  face_chin: 'Menton',
  face_nose: 'Nariz',
  face_perioral: 'Zona Perioral',
  face_periocular: 'Zona Periocular',
  neck: 'Cuello',
  decolletage: 'Escote',
  hands: 'Manos',
  arms: 'Brazos',
  abdomen: 'Abdomen',
  back: 'Espalda',
  legs: 'Piernas',
  other: 'Otra zona',
}

interface PhotoSession {
  sessionId: string
  treatmentName: string
  date: string
  images: SessionImageData[]
}

interface PatientPhotoHistoryProps {
  patientId: string
  compact?: boolean
  maxSessions?: number
}

export function PatientPhotoHistory({
  patientId,
  compact = false,
  maxSessions,
}: PatientPhotoHistoryProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [sessions, setSessions] = useState<PhotoSession[]>([])
  const [totalImages, setTotalImages] = useState(0)
  const [expandedSessions, setExpandedSessions] = useState<Set<string>>(new Set())
  const [selectedImage, setSelectedImage] = useState<SessionImageData | null>(null)

  useEffect(() => {
    async function loadHistory() {
      setIsLoading(true)
      try {
        const result = await getPatientPhotoHistory(patientId)
        const sessionsToShow = maxSessions ? result.sessions.slice(0, maxSessions) : result.sessions
        setSessions(sessionsToShow)
        setTotalImages(result.totalImages)
        // Auto-expand first session
        if (sessionsToShow.length > 0) {
          setExpandedSessions(new Set([sessionsToShow[0].sessionId]))
        }
      } catch (error) {
        console.error('Error loading photo history:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadHistory()
  }, [patientId, maxSessions])

  const toggleSession = (sessionId: string) => {
    setExpandedSessions(prev => {
      const next = new Set(prev)
      if (next.has(sessionId)) {
        next.delete(sessionId)
      } else {
        next.add(sessionId)
      }
      return next
    })
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-DO', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })
  }

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'before':
        return 'Antes'
      case 'during':
        return 'Durante'
      case 'after':
        return 'Despues'
      default:
        return type
    }
  }

  const getTypeBadgeVariant = (type: string) => {
    switch (type) {
      case 'before':
        return 'secondary' as const
      case 'after':
        return 'default' as const
      default:
        return 'outline' as const
    }
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    )
  }

  if (sessions.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Camera className="h-5 w-5 text-[#3c3731]" />
            Historial de Fotos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
            <ImageOff className="h-12 w-12 mb-4" />
            <p>No hay fotos registradas para este paciente</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Camera className="h-5 w-5 text-[#3c3731]" />
            Historial de Fotos
          </CardTitle>
          <CardDescription>
            {totalImages} {totalImages === 1 ? 'foto' : 'fotos'} en {sessions.length}{' '}
            {sessions.length === 1 ? 'sesion' : 'sesiones'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {sessions.map(session => (
            <Collapsible
              key={session.sessionId}
              open={expandedSessions.has(session.sessionId)}
              onOpenChange={() => toggleSession(session.sessionId)}
            >
              <div className="border rounded-lg">
                <CollapsibleTrigger asChild>
                  <Button
                    variant="ghost"
                    className="w-full justify-between px-4 py-3 h-auto"
                  >
                    <div className="flex items-center gap-3 text-left">
                      <div className="flex-1">
                        <p className="font-medium">{session.treatmentName}</p>
                        <p className="text-sm text-muted-foreground flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {formatDate(session.date)}
                        </p>
                      </div>
                      <Badge variant="secondary">
                        {session.images.length} {session.images.length === 1 ? 'foto' : 'fotos'}
                      </Badge>
                    </div>
                    {expandedSessions.has(session.sessionId) ? (
                      <ChevronUp className="h-4 w-4 ml-2" />
                    ) : (
                      <ChevronDown className="h-4 w-4 ml-2" />
                    )}
                  </Button>
                </CollapsibleTrigger>

                <CollapsibleContent>
                  <div className="px-4 pb-4 pt-2 border-t">
                    {/* Group images by type */}
                    {(['before', 'during', 'after'] as const).map(type => {
                      const typeImages = session.images.filter(img => img.type === type)
                      if (typeImages.length === 0) return null

                      return (
                        <div key={type} className="mb-4 last:mb-0">
                          <Badge variant={getTypeBadgeVariant(type)} className="mb-2">
                            {getTypeLabel(type)}
                          </Badge>
                          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
                            {typeImages.map(image => (
                              <button
                                key={image.id}
                                className="aspect-square rounded-lg overflow-hidden bg-muted border hover:border-primary transition-colors relative group"
                                onClick={() => setSelectedImage(image)}
                              >
                                <Image
                                  src={image.thumbnail_url || image.image_url}
                                  alt={image.caption || `${getTypeLabel(type)} - ${session.treatmentName}`}
                                  fill
                                  className="object-cover"
                                />
                                {image.body_zone && (
                                  <div className="absolute bottom-0 inset-x-0 bg-black/60 text-white text-xs px-1 py-0.5 truncate">
                                    {BODY_ZONES[image.body_zone] || image.body_zone}
                                  </div>
                                )}
                              </button>
                            ))}
                          </div>
                        </div>
                      )
                    })}

                    {!compact && (
                      <Link href={`/sesiones/${session.sessionId}`}>
                        <Button variant="outline" size="sm" className="w-full mt-2">
                          <ExternalLink className="h-4 w-4 mr-2" />
                          Ver sesion completa
                        </Button>
                      </Link>
                    )}
                  </div>
                </CollapsibleContent>
              </div>
            </Collapsible>
          ))}

          {maxSessions && sessions.length >= maxSessions && (
            <p className="text-sm text-center text-muted-foreground">
              Mostrando las ultimas {maxSessions} sesiones con fotos
            </p>
          )}
        </CardContent>
      </Card>

      {/* Image lightbox dialog */}
      <Dialog open={!!selectedImage} onOpenChange={() => setSelectedImage(null)}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Badge variant={selectedImage ? getTypeBadgeVariant(selectedImage.type) : 'outline'}>
                {selectedImage ? getTypeLabel(selectedImage.type) : ''}
              </Badge>
              {selectedImage?.body_zone && (
                <span className="text-muted-foreground font-normal">
                  - {BODY_ZONES[selectedImage.body_zone] || selectedImage.body_zone}
                </span>
              )}
            </DialogTitle>
          </DialogHeader>
          {selectedImage && (
            <div className="relative aspect-[4/3] w-full">
              <Image
                src={selectedImage.image_url}
                alt={selectedImage.caption || 'Foto de sesion'}
                fill
                className="object-contain"
              />
            </div>
          )}
          {selectedImage?.caption && (
            <p className="text-sm text-muted-foreground text-center">
              {selectedImage.caption}
            </p>
          )}
          {selectedImage?.taken_at && (
            <p className="text-xs text-muted-foreground text-center">
              Tomada el {new Date(selectedImage.taken_at).toLocaleString('es-DO')}
            </p>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
