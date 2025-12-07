'use client'

import Link from 'next/link'
import { MoreVertical, Pencil, Trash2, Eye, EyeOff } from 'lucide-react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import type { TreatmentListItem } from '@/types/treatments'

interface TreatmentTableProps {
  treatments: TreatmentListItem[]
}

export function TreatmentTable({ treatments }: TreatmentTableProps) {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-DO', {
      style: 'currency',
      currency: 'DOP',
    }).format(price)
  }

  const formatDuration = (minutes: number) => {
    if (minutes < 60) return `${minutes} min`
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return mins > 0 ? `${hours}h ${mins}min` : `${hours}h`
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Tratamiento</TableHead>
            <TableHead>Categoría</TableHead>
            <TableHead>Duración</TableHead>
            <TableHead className="text-right">Precio</TableHead>
            <TableHead>Estado</TableHead>
            <TableHead className="w-[50px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {treatments.map((treatment) => (
            <TableRow
              key={treatment.id}
              className={!treatment.isActive ? 'opacity-60' : ''}
            >
              <TableCell>
                <div className="flex items-center gap-3">
                  <div
                    className="h-10 w-10 rounded-lg flex items-center justify-center"
                    style={{
                      backgroundColor: treatment.categoryColor || '#e5e7eb',
                    }}
                  >
                    {treatment.imageUrl ? (
                      <img
                        src={treatment.imageUrl}
                        alt={treatment.name}
                        className="h-full w-full object-cover rounded-lg"
                      />
                    ) : (
                      <span className="text-lg opacity-50">✨</span>
                    )}
                  </div>
                  <Link
                    href={`/tratamientos/${treatment.id}`}
                    className="font-medium hover:underline"
                  >
                    {treatment.name}
                  </Link>
                </div>
              </TableCell>
              <TableCell>
                {treatment.categoryName && (
                  <Badge
                    variant="secondary"
                    style={{
                      backgroundColor: `${treatment.categoryColor}20`,
                      color: treatment.categoryColor || undefined,
                    }}
                  >
                    {treatment.categoryName}
                  </Badge>
                )}
              </TableCell>
              <TableCell>{formatDuration(treatment.durationMinutes)}</TableCell>
              <TableCell className="text-right font-medium">
                {formatPrice(treatment.price)}
              </TableCell>
              <TableCell>
                <Badge variant={treatment.isActive ? 'default' : 'secondary'}>
                  {treatment.isActive ? 'Activo' : 'Inactivo'}
                </Badge>
              </TableCell>
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem asChild>
                      <Link href={`/tratamientos/${treatment.id}`}>
                        <Eye className="mr-2 h-4 w-4" />
                        Ver detalles
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href={`/tratamientos/${treatment.id}/editar`}>
                        <Pencil className="mr-2 h-4 w-4" />
                        Editar
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      {treatment.isActive ? (
                        <>
                          <EyeOff className="mr-2 h-4 w-4" />
                          Desactivar
                        </>
                      ) : (
                        <>
                          <Eye className="mr-2 h-4 w-4" />
                          Activar
                        </>
                      )}
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className="text-destructive">
                      <Trash2 className="mr-2 h-4 w-4" />
                      Eliminar
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
