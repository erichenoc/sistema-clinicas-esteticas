'use client'

import { useState, useRef, useCallback } from 'react'
import Image from 'next/image'
import { Camera, Upload, X, Loader2, ImagePlus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
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
import { toast } from 'sonner'
import { uploadToCloudinary, getCloudinaryThumbnail } from '@/lib/cloudinary'
import {
  createSessionImage,
  deleteSessionImage,
  type SessionImageData,
  type SessionImageType,
} from '@/actions/sessions'

// Body zones for categorization
const BODY_ZONES = [
  { value: 'face_full', label: 'Rostro completo' },
  { value: 'face_forehead', label: 'Frente' },
  { value: 'face_cheeks', label: 'Mejillas' },
  { value: 'face_chin', label: 'Menton' },
  { value: 'face_nose', label: 'Nariz' },
  { value: 'face_perioral', label: 'Zona Perioral' },
  { value: 'face_periocular', label: 'Zona Periocular' },
  { value: 'neck', label: 'Cuello' },
  { value: 'decolletage', label: 'Escote' },
  { value: 'hands', label: 'Manos' },
  { value: 'arms', label: 'Brazos' },
  { value: 'abdomen', label: 'Abdomen' },
  { value: 'back', label: 'Espalda' },
  { value: 'legs', label: 'Piernas' },
  { value: 'other', label: 'Otra zona' },
]

interface SessionPhotoUploaderProps {
  sessionId: string
  patientId: string
  images: SessionImageData[]
  onImagesChange?: (images: SessionImageData[]) => void
  readOnly?: boolean
}

interface PendingUpload {
  id: string
  file: File
  preview: string
  type: SessionImageType
  bodyZone: string
  caption: string
  uploading: boolean
  error?: string
}

export function SessionPhotoUploader({
  sessionId,
  patientId,
  images: initialImages,
  onImagesChange,
  readOnly = false,
}: SessionPhotoUploaderProps) {
  const [images, setImages] = useState<SessionImageData[]>(initialImages)
  const [pendingUploads, setPendingUploads] = useState<PendingUpload[]>([])
  const [activeType, setActiveType] = useState<SessionImageType>('before')
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Filter images by type
  const beforeImages = images.filter(img => img.type === 'before')
  const duringImages = images.filter(img => img.type === 'during')
  const afterImages = images.filter(img => img.type === 'after')

  // Handle file selection
  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length === 0) return

    const newPendingUploads: PendingUpload[] = files.map(file => ({
      id: `pending-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      file,
      preview: URL.createObjectURL(file),
      type: activeType,
      bodyZone: '',
      caption: '',
      uploading: false,
    }))

    setPendingUploads(prev => [...prev, ...newPendingUploads])

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }, [activeType])

  // Update pending upload
  const updatePendingUpload = (id: string, updates: Partial<PendingUpload>) => {
    setPendingUploads(prev =>
      prev.map(upload =>
        upload.id === id ? { ...upload, ...updates } : upload
      )
    )
  }

  // Remove pending upload
  const removePendingUpload = (id: string) => {
    setPendingUploads(prev => {
      const upload = prev.find(u => u.id === id)
      if (upload) {
        URL.revokeObjectURL(upload.preview)
      }
      return prev.filter(u => u.id !== id)
    })
  }

  // Upload a single image
  const uploadImage = async (pending: PendingUpload) => {
    updatePendingUpload(pending.id, { uploading: true, error: undefined })

    try {
      // Upload to Cloudinary
      const cloudinaryResult = await uploadToCloudinary(pending.file, {
        folder: `sessions/${sessionId}`,
        tags: [patientId, sessionId, pending.type],
      })

      // Save to database
      const result = await createSessionImage({
        session_id: sessionId,
        patient_id: patientId,
        type: pending.type,
        body_zone: pending.bodyZone || undefined,
        image_url: cloudinaryResult.secure_url,
        thumbnail_url: getCloudinaryThumbnail(cloudinaryResult.secure_url),
        caption: pending.caption || undefined,
      })

      if (result.error) {
        throw new Error(result.error)
      }

      // Add to images list
      if (result.data) {
        const newImages = [...images, result.data]
        setImages(newImages)
        onImagesChange?.(newImages)
      }

      // Remove from pending
      removePendingUpload(pending.id)
      toast.success('Imagen subida correctamente')
    } catch (error) {
      console.error('Error uploading image:', error)
      updatePendingUpload(pending.id, {
        uploading: false,
        error: error instanceof Error ? error.message : 'Error al subir imagen',
      })
      toast.error('Error al subir la imagen')
    }
  }

  // Upload all pending images
  const uploadAllPending = async () => {
    setIsUploading(true)

    for (const pending of pendingUploads) {
      if (!pending.uploading && !pending.error) {
        await uploadImage(pending)
      }
    }

    setIsUploading(false)
  }

  // Delete an existing image
  const handleDeleteImage = async (imageId: string) => {
    const result = await deleteSessionImage(imageId)

    if (result.error) {
      toast.error(result.error)
      return
    }

    const newImages = images.filter(img => img.id !== imageId)
    setImages(newImages)
    onImagesChange?.(newImages)
    toast.success('Imagen eliminada')
  }

  // Render image grid for a type
  const renderImageGrid = (typeImages: SessionImageData[], type: SessionImageType) => {
    const typeLabel = {
      before: 'Antes',
      during: 'Durante',
      after: 'Despues',
    }[type]

    const typePending = pendingUploads.filter(p => p.type === type)

    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="font-medium flex items-center gap-2">
            <Badge variant={type === 'before' ? 'secondary' : type === 'after' ? 'default' : 'outline'}>
              {typeLabel}
            </Badge>
            <span className="text-sm text-muted-foreground">
              ({typeImages.length} fotos)
            </span>
          </h4>
          {!readOnly && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setActiveType(type)
                fileInputRef.current?.click()
              }}
            >
              <ImagePlus className="h-4 w-4 mr-1" />
              Agregar
            </Button>
          )}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {/* Existing images */}
          {typeImages.map(image => (
            <div key={image.id} className="relative group">
              <div className="aspect-square rounded-lg overflow-hidden bg-muted border">
                <Image
                  src={image.thumbnail_url || image.image_url}
                  alt={image.caption || `Foto ${typeLabel}`}
                  fill
                  className="object-cover"
                />
              </div>
              {!readOnly && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="absolute top-1 right-1 h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Eliminar imagen</AlertDialogTitle>
                      <AlertDialogDescription>
                        Esta accion no se puede deshacer. La imagen sera eliminada permanentemente.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction onClick={() => handleDeleteImage(image.id)}>
                        Eliminar
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
              {image.body_zone && (
                <Badge
                  variant="secondary"
                  className="absolute bottom-1 left-1 text-xs bg-black/60 text-white"
                >
                  {BODY_ZONES.find(z => z.value === image.body_zone)?.label || image.body_zone}
                </Badge>
              )}
            </div>
          ))}

          {/* Pending uploads for this type */}
          {typePending.map(pending => (
            <div key={pending.id} className="relative">
              <div className="aspect-square rounded-lg overflow-hidden bg-muted border relative">
                <Image
                  src={pending.preview}
                  alt="Preview"
                  fill
                  className="object-cover"
                />
                {pending.uploading && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                    <Loader2 className="h-8 w-8 text-white animate-spin" />
                  </div>
                )}
                {pending.error && (
                  <div className="absolute inset-0 bg-red-500/50 flex items-center justify-center">
                    <span className="text-white text-xs text-center px-2">{pending.error}</span>
                  </div>
                )}
              </div>
              {!pending.uploading && (
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  className="absolute top-1 right-1 h-7 w-7"
                  onClick={() => removePendingUpload(pending.id)}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          ))}

          {/* Empty state */}
          {typeImages.length === 0 && typePending.length === 0 && (
            <div
              className="aspect-square rounded-lg border-2 border-dashed flex flex-col items-center justify-center text-muted-foreground cursor-pointer hover:border-primary/50 transition-colors col-span-2"
              onClick={() => {
                if (!readOnly) {
                  setActiveType(type)
                  fileInputRef.current?.click()
                }
              }}
            >
              <Camera className="h-8 w-8 mb-2" />
              <span className="text-sm">
                {readOnly ? 'Sin fotos' : 'Agregar fotos'}
              </span>
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Camera className="h-5 w-5 text-[#3c3731]" />
          Fotografias de la Sesion
        </CardTitle>
        <CardDescription>
          Registro visual del antes, durante y despues del tratamiento
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={handleFileSelect}
        />

        {/* Image grids by type */}
        {renderImageGrid(beforeImages, 'before')}
        {renderImageGrid(duringImages, 'during')}
        {renderImageGrid(afterImages, 'after')}

        {/* Pending uploads configuration */}
        {pendingUploads.length > 0 && (
          <div className="border-t pt-4 space-y-4">
            <h4 className="font-medium">Configurar fotos pendientes</h4>
            {pendingUploads.map(pending => (
              <div key={pending.id} className="flex gap-4 items-start border rounded-lg p-3">
                <div className="w-20 h-20 rounded overflow-hidden bg-muted flex-shrink-0">
                  <Image
                    src={pending.preview}
                    alt="Preview"
                    width={80}
                    height={80}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1 space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label className="text-xs">Tipo</Label>
                      <Select
                        value={pending.type}
                        onValueChange={(v) => updatePendingUpload(pending.id, { type: v as SessionImageType })}
                      >
                        <SelectTrigger className="h-8">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="before">Antes</SelectItem>
                          <SelectItem value="during">Durante</SelectItem>
                          <SelectItem value="after">Despues</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-xs">Zona</Label>
                      <Select
                        value={pending.bodyZone}
                        onValueChange={(v) => updatePendingUpload(pending.id, { bodyZone: v })}
                      >
                        <SelectTrigger className="h-8">
                          <SelectValue placeholder="Seleccionar..." />
                        </SelectTrigger>
                        <SelectContent>
                          {BODY_ZONES.map(zone => (
                            <SelectItem key={zone.value} value={zone.value}>
                              {zone.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs">Descripcion (opcional)</Label>
                    <Input
                      className="h-8"
                      placeholder="Descripcion de la foto..."
                      value={pending.caption}
                      onChange={(e) => updatePendingUpload(pending.id, { caption: e.target.value })}
                    />
                  </div>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="text-destructive"
                  onClick={() => removePendingUpload(pending.id)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}

            <Button
              type="button"
              onClick={uploadAllPending}
              disabled={isUploading}
              className="w-full bg-[#3c3731] hover:bg-[#2a2622]"
            >
              {isUploading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Subiendo fotos...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Subir {pendingUploads.length} {pendingUploads.length === 1 ? 'foto' : 'fotos'}
                </>
              )}
            </Button>
          </div>
        )}

        {/* Upload button when no pending uploads */}
        {!readOnly && pendingUploads.length === 0 && (
          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className="h-4 w-4 mr-2" />
            Seleccionar fotos para subir
          </Button>
        )}
      </CardContent>
    </Card>
  )
}
