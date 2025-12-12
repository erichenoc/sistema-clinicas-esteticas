'use client'

import { useState } from 'react'
import { pdf } from '@react-pdf/renderer'
import { Button } from '@/components/ui/button'
import { Download, Loader2 } from 'lucide-react'
import { QuotationPDF, type QuotationPDFData } from './quotation-pdf'
import { toast } from 'sonner'

interface DownloadQuotationPDFProps {
  data: QuotationPDFData
  variant?: 'default' | 'outline' | 'ghost' | 'secondary'
  size?: 'default' | 'sm' | 'lg' | 'icon'
  className?: string
}

export function DownloadQuotationPDF({
  data,
  variant = 'outline',
  size = 'default',
  className,
}: DownloadQuotationPDFProps) {
  const [isGenerating, setIsGenerating] = useState(false)

  const handleDownload = async () => {
    setIsGenerating(true)
    toast.loading('Generando PDF...', { id: 'pdf-generate' })

    try {
      // Generate PDF blob
      const blob = await pdf(<QuotationPDF data={data} />).toBlob()

      // Create download link
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `${data.quoteNumber}.pdf`
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
