import nodemailer from 'nodemailer'

// Create transporter lazily to ensure env vars are available
function createTransporter() {
  const host = process.env.SMTP_HOST || 'smtp.hostinger.com'
  const port = parseInt(process.env.SMTP_PORT || '465')
  const user = process.env.SMTP_USER || 'info@medluxeclinic.com'
  const pass = process.env.SMTP_PASSWORD || ''

  console.log('[Email] Creating transporter with:', { host, port, user, hasPassword: !!pass })

  return nodemailer.createTransport({
    host,
    port,
    secure: true, // SSL
    auth: {
      user,
      pass,
    },
  })
}

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
    const transporter = createTransporter()
    const fromEmail = process.env.SMTP_USER || 'info@medluxeclinic.com'

    console.log('[Email] Sending email to:', options.to)
    console.log('[Email] From:', fromEmail)

    await transporter.sendMail({
      from: `"Med Luxe Aesthetics & Wellness" <${fromEmail}>`,
      to: options.to,
      subject: options.subject,
      html: options.html,
      attachments: options.attachments,
    })

    console.log('[Email] Email sent successfully')
    return { success: true }
  } catch (error) {
    console.error('[Email] Error sending email:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error al enviar el email'
    }
  }
}

// Logo URL
const LOGO_URL = 'https://res.cloudinary.com/dbftvu8ab/image/upload/v1765430185/Med_Luxe_Logo_1_kohhy1.png'

// Generate quotation email HTML
export function generateQuotationEmailHTML(data: {
  quotationNumber: string
  clientName: string
  clientPhone?: string
  clientEmail?: string
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
        <!-- Header with Logo and Title -->
        <div style="background-color: #A67C52; padding: 20px 30px;">
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="width: 50%; vertical-align: middle;">
                <img src="${LOGO_URL}" alt="Med Luxe Logo" style="height: 60px; width: auto;" />
              </td>
              <td style="width: 50%; text-align: right; vertical-align: middle;">
                <p style="margin: 0; color: #ffffff; font-size: 22px; font-weight: 600;">Cotización</p>
                <p style="margin: 5px 0 0; color: #ffffff; font-size: 14px;">${data.quotationNumber}</p>
              </td>
            </tr>
          </table>
        </div>

        <!-- Content -->
        <div style="padding: 30px;">
          <!-- Client Info Box -->
          <div style="background: #f9fafb; border-radius: 8px; padding: 20px; margin-bottom: 25px;">
            <p style="margin: 0 0 8px;"><span style="color: #A67C52; font-weight: 600;">Cliente:</span> ${data.clientName}</p>
            ${data.clientPhone ? `<p style="margin: 0 0 8px;"><span style="color: #A67C52; font-weight: 600;">Teléfono:</span> ${data.clientPhone}</p>` : ''}
            ${data.clientEmail ? `<p style="margin: 0 0 8px;"><span style="color: #A67C52; font-weight: 600;">Correo:</span> ${data.clientEmail}</p>` : ''}
            <p style="margin: 0 0 8px;"><span style="color: #A67C52; font-weight: 600;">Fecha:</span> ${new Date().toLocaleDateString('es-DO', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
            <p style="margin: 0;"><span style="color: #A67C52; font-weight: 600;">Válida hasta:</span> ${new Date(data.validUntil).toLocaleDateString('es-DO', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
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
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 4px 0; color: #666;">Subtotal:</td>
                <td style="padding: 4px 0; text-align: right;">${formatPrice(data.subtotal + data.discountTotal)}</td>
              </tr>
              ${data.discountTotal > 0 ? `
              <tr style="color: #16a34a;">
                <td style="padding: 4px 0;">Descuento:</td>
                <td style="padding: 4px 0; text-align: right;">-${formatPrice(data.discountTotal)}</td>
              </tr>
              ` : ''}
              ${data.taxRate > 0 ? `
              <tr>
                <td style="padding: 4px 0; color: #666;">ITBIS (${data.taxRate}%):</td>
                <td style="padding: 4px 0; text-align: right;">${formatPrice(data.taxAmount)}</td>
              </tr>
              ` : ''}
              <tr>
                <td colspan="2" style="padding: 12px 0 0;"><hr style="border: none; border-top: 2px solid #e5e5e5; margin: 0;" /></td>
              </tr>
              <tr style="font-size: 18px; font-weight: bold;">
                <td style="padding: 8px 0 0;">Total:</td>
                <td style="padding: 8px 0 0; text-align: right; color: #A67C52;">${formatPrice(data.total)}</td>
              </tr>
            </table>
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

        <!-- Footer - Gold background with white text -->
        <div style="background-color: #A67C52; padding: 25px; text-align: center;">
          <p style="margin: 0 0 10px; color: #ffffff; font-size: 14px;">
            ¿Tienes preguntas? Contáctanos
          </p>
          <p style="margin: 0 0 5px; color: #ffffff; font-size: 14px;">
            <a href="mailto:info@medluxeclinic.com" style="color: #ffffff; text-decoration: underline;">info@medluxeclinic.com</a>
          </p>
          <p style="margin: 0 0 5px; color: #ffffff; font-size: 14px;">
            809-558-0911
          </p>
          <p style="margin: 10px 0 0; color: #ffffff; font-size: 12px;">
            Med Luxe Aesthetics & Wellness<br>
            Plaza Terranova Caribbean 2, Av. Barceló, Punta Cana 23000, República Dominicana
          </p>
        </div>
      </div>
    </body>
    </html>
  `
}
