import nodemailer from 'nodemailer'

// Email configuration for Hostinger SMTP
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.hostinger.com',
  port: parseInt(process.env.SMTP_PORT || '465'),
  secure: true, // SSL
  auth: {
    user: process.env.SMTP_USER || 'info@medluxeclinic.com',
    pass: process.env.SMTP_PASSWORD || '',
  },
})

export interface EmailOptions {
  to: string
  subject: string
  html: string
  attachments?: Array<{
    filename: string
    content: string | Buffer
    contentType?: string
  }>
}

export async function sendEmail(options: EmailOptions): Promise<{ success: boolean; error?: string }> {
  try {
    await transporter.sendMail({
      from: `"Med Luxe Aesthetics & Wellness" <${process.env.SMTP_USER || 'info@medluxeclinic.com'}>`,
      to: options.to,
      subject: options.subject,
      html: options.html,
      attachments: options.attachments,
    })
    return { success: true }
  } catch (error) {
    console.error('Error sending email:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error al enviar el email'
    }
  }
}

// Generate quotation email HTML
export function generateQuotationEmailHTML(data: {
  quotationNumber: string
  clientName: string
  items: Array<{
    description: string
    quantity: number
    unitPrice: number
    subtotal: number
  }>
  subtotal: number
  discountTotal: number
  taxRate: number
  taxAmount: number
  total: number
  currency: string
  validUntil: string
  notes?: string
  termsConditions?: string
}): string {
  const currencySymbol = data.currency === 'DOP' ? 'RD$' : 'US$'
  const formatPrice = (price: number) => `${currencySymbol}${price.toLocaleString('es-DO', { minimumFractionDigits: 2 })}`

  const itemsHTML = data.items.map(item => `
    <tr>
      <td style="padding: 12px; border-bottom: 1px solid #e5e5e5;">${item.description}</td>
      <td style="padding: 12px; border-bottom: 1px solid #e5e5e5; text-align: center;">${item.quantity}</td>
      <td style="padding: 12px; border-bottom: 1px solid #e5e5e5; text-align: right;">${formatPrice(item.unitPrice)}</td>
      <td style="padding: 12px; border-bottom: 1px solid #e5e5e5; text-align: right;">${formatPrice(item.subtotal)}</td>
    </tr>
  `).join('')

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Cotización ${data.quotationNumber}</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f5f5;">
      <div style="max-width: 650px; margin: 0 auto; background-color: #ffffff; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #8b5cf6 0%, #a855f7 100%); padding: 30px; text-align: center;">
          <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 300; letter-spacing: 2px;">MED LUXE</h1>
          <p style="margin: 5px 0 0; color: rgba(255,255,255,0.9); font-size: 12px; letter-spacing: 1px;">AESTHETICS & WELLNESS</p>
        </div>

        <!-- Content -->
        <div style="padding: 30px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h2 style="margin: 0 0 10px; color: #333; font-size: 24px;">Cotización</h2>
            <p style="margin: 0; color: #666; font-size: 16px;"><strong>${data.quotationNumber}</strong></p>
          </div>

          <div style="background: #f9fafb; border-radius: 8px; padding: 20px; margin-bottom: 25px;">
            <p style="margin: 0 0 8px;"><strong>Cliente:</strong> ${data.clientName}</p>
            <p style="margin: 0 0 8px;"><strong>Fecha:</strong> ${new Date().toLocaleDateString('es-DO', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
            <p style="margin: 0;"><strong>Válida hasta:</strong> ${new Date(data.validUntil).toLocaleDateString('es-DO', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
          </div>

          <!-- Items Table -->
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 25px;">
            <thead>
              <tr style="background: #f3f4f6;">
                <th style="padding: 12px; text-align: left; border-bottom: 2px solid #e5e5e5; color: #374151;">Descripción</th>
                <th style="padding: 12px; text-align: center; border-bottom: 2px solid #e5e5e5; color: #374151;">Cant.</th>
                <th style="padding: 12px; text-align: right; border-bottom: 2px solid #e5e5e5; color: #374151;">Precio</th>
                <th style="padding: 12px; text-align: right; border-bottom: 2px solid #e5e5e5; color: #374151;">Subtotal</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHTML}
            </tbody>
          </table>

          <!-- Totals -->
          <div style="background: #f9fafb; border-radius: 8px; padding: 20px;">
            <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
              <span style="color: #666;">Subtotal:</span>
              <span>${formatPrice(data.subtotal + data.discountTotal)}</span>
            </div>
            ${data.discountTotal > 0 ? `
            <div style="display: flex; justify-content: space-between; margin-bottom: 8px; color: #16a34a;">
              <span>Descuento:</span>
              <span>-${formatPrice(data.discountTotal)}</span>
            </div>
            ` : ''}
            ${data.taxRate > 0 ? `
            <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
              <span style="color: #666;">ITBIS (${data.taxRate}%):</span>
              <span>${formatPrice(data.taxAmount)}</span>
            </div>
            ` : ''}
            <div style="display: flex; justify-content: space-between; padding-top: 12px; border-top: 2px solid #e5e5e5; font-size: 18px; font-weight: bold;">
              <span>Total:</span>
              <span style="color: #8b5cf6;">${formatPrice(data.total)}</span>
            </div>
          </div>

          ${data.notes ? `
          <div style="margin-top: 25px;">
            <h3 style="margin: 0 0 10px; font-size: 14px; color: #374151;">Notas:</h3>
            <p style="margin: 0; color: #666; font-size: 14px; white-space: pre-line;">${data.notes}</p>
          </div>
          ` : ''}

          ${data.termsConditions ? `
          <div style="margin-top: 25px; padding: 15px; background: #fffbeb; border-radius: 8px; border-left: 4px solid #f59e0b;">
            <h3 style="margin: 0 0 10px; font-size: 14px; color: #92400e;">Términos y Condiciones:</h3>
            <p style="margin: 0; color: #78350f; font-size: 13px; white-space: pre-line;">${data.termsConditions}</p>
          </div>
          ` : ''}
        </div>

        <!-- Footer -->
        <div style="background: #1f2937; padding: 25px; text-align: center;">
          <p style="margin: 0 0 10px; color: #9ca3af; font-size: 14px;">
            ¿Tienes preguntas? Contáctanos
          </p>
          <p style="margin: 0 0 5px; color: #ffffff; font-size: 14px;">
            <a href="mailto:info@medluxeclinic.com" style="color: #a78bfa; text-decoration: none;">info@medluxeclinic.com</a>
          </p>
          <p style="margin: 0; color: #9ca3af; font-size: 12px;">
            Med Luxe Aesthetics & Wellness<br>
            Santo Domingo, República Dominicana
          </p>
        </div>
      </div>
    </body>
    </html>
  `
}
