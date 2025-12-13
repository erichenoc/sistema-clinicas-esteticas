'use client'

import { useState } from 'react'
import { pdf } from '@react-pdf/renderer'
import { Button } from '@/components/ui/button'
import { Download, Loader2 } from 'lucide-react'
import { InvoicePDF, type InvoicePDFData } from './invoice-pdf'
import { toast } from 'sonner'

interface DownloadInvoicePDFProps {
  data: InvoicePDFData
  variant?: 'default' | 'outline' | 'ghost' | 'secondary'
  size?: 'default' | 'sm' | 'lg' | 'icon'
  className?: string
}

export function DownloadInvoicePDF({
  data,
  variant = 'outline',
  size = 'default',
  className,
}: DownloadInvoicePDFProps) {
  const [isGenerating, setIsGenerating] = useState(false)

  const handleDownload = async () => {
    setIsGenerating(true)
    toast.loading('Generando PDF...', { id: 'pdf-generate' })

    try {
      // Generate PDF blob
      const blob = await pdf(<InvoicePDF data={data} />).toBlob()

      // Create download link
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `${data.invoiceNumber}.pdf`
      document.body.appendChild(link)
      link.click()

      // Cleanup
      document.body.removeChild(link)
      URL.revokeObjectURL(url)

      toast.dismiss('pdf-generate')
      toast.success('PDF descargado')
    } catch (error) {
      console.error('Error generating PDF:', error)
      toast.dismiss('pdf-generate')
      toast.error('Error al generar el PDF')
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleDownload}
      disabled={isGenerating}
      className={className}
    >
      {isGenerating ? (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      ) : (
        <Download className="mr-2 h-4 w-4" />
      )}
      {size === 'icon' ? '' : 'Descargar PDF'}
    </Button>
  )
}

// Helper function to generate and download PDF programmatically
export async function downloadInvoicePDF(data: InvoicePDFData): Promise<boolean> {
  try {
    const blob = await pdf(<InvoicePDF data={data} />).toBlob()
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${data.invoiceNumber}.pdf`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
    return true
  } catch (error) {
    console.error('Error generating PDF:', error)
    return false
  }
}

// Helper function to generate PDF blob for email attachment
export async function generateInvoicePDFBlob(data: InvoicePDFData): Promise<Blob | null> {
  try {
    const blob = await pdf(<InvoicePDF data={data} />).toBlob()
    return blob
  } catch (error) {
    console.error('Error generating PDF blob:', error)
    return null
  }
}
