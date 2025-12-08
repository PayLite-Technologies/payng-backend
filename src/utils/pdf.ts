import { PDFDocument, rgb, StandardFonts } from 'pdf-lib'
import { config } from '@/core/config'

export interface ReceiptData {
  receiptNumber: string
  schoolName: string
  schoolAddress?: string
  schoolPhone?: string
  schoolEmail?: string
  studentName: string
  studentId?: string
  parentName?: string
  parentEmail?: string
  parentPhone?: string
  amount: number
  currency: string
  paymentDate: string
  paymentMethod: string
  transactionId?: string
  feeItems: Array<{
    name: string
    amount: number
    description?: string
  }>
  academicYear?: string
  term?: string
  notes?: string
}

export class PDFReceiptGenerator {
  private doc: PDFDocument
  private page: any
  private font: any
  private boldFont: any
  private currentY: number = 750

  constructor() {
    this.doc = null as any
    this.page = null as any
    this.font = null as any
    this.boldFont = null as any
  }

  async generateReceipt(data: ReceiptData): Promise<Buffer> {
    // Create a new PDF document
    this.doc = await PDFDocument.create()
    this.page = this.doc.addPage([600, 800])

    // Embed fonts
    this.font = await this.doc.embedFont(StandardFonts.Helvetica)
    this.boldFont = await this.doc.embedFont(StandardFonts.HelveticaBold)

    // Reset position
    this.currentY = 750

    // Draw the receipt
    this.drawHeader(data)
    this.drawSchoolInfo(data)
    this.drawReceiptInfo(data)
    this.drawStudentInfo(data)
    this.drawPaymentDetails(data)
    this.drawFeeBreakdown(data)
    this.drawTotal(data)
    this.drawFooter(data)

    // Serialize the PDF
    const pdfBytes = await this.doc.save()
    return Buffer.from(pdfBytes)
  }

  private drawHeader(data: ReceiptData) {
    const { page } = this

    // Main title
    page.drawText('PAYMENT RECEIPT', {
      x: 200,
      y: this.currentY,
      size: 24,
      font: this.boldFont,
      color: rgb(0, 0.2, 0.6), // Navy Blue
    })

    this.currentY -= 40

    // Decorative line
    page.drawLine({
      start: { x: 50, y: this.currentY },
      end: { x: 550, y: this.currentY },
      thickness: 2,
      color: rgb(0, 0.2, 0.6),
    })

    this.currentY -= 30
  }

  private drawSchoolInfo(data: ReceiptData) {
    const { page } = this

    // School name
    page.drawText(data.schoolName.toUpperCase(), {
      x: 50,
      y: this.currentY,
      size: 18,
      font: this.boldFont,
      color: rgb(0.1, 0.1, 0.1),
    })

    this.currentY -= 25

    // School contact info
    if (data.schoolAddress) {
      page.drawText(`Address: ${data.schoolAddress}`, {
        x: 50,
        y: this.currentY,
        size: 10,
        font: this.font,
        color: rgb(0.3, 0.3, 0.3),
      })
      this.currentY -= 15
    }

    if (data.schoolPhone || data.schoolEmail) {
      const contactText = [data.schoolPhone, data.schoolEmail].filter(Boolean).join(' | ')
      page.drawText(`Contact: ${contactText}`, {
        x: 50,
        y: this.currentY,
        size: 10,
        font: this.font,
        color: rgb(0.3, 0.3, 0.3),
      })
      this.currentY -= 25
    } else {
      this.currentY -= 10
    }
  }

  private drawReceiptInfo(data: ReceiptData) {
    const { page } = this

    // Receipt number box
    page.drawRectangle({
      x: 350,
      y: this.currentY - 5,
      width: 200,
      height: 60,
      borderColor: rgb(0, 0.2, 0.6),
      borderWidth: 1,
      color: rgb(0.95, 0.97, 1),
    })

    page.drawText('Receipt No:', {
      x: 360,
      y: this.currentY + 35,
      size: 11,
      font: this.font,
      color: rgb(0.2, 0.2, 0.2),
    })

    page.drawText(data.receiptNumber, {
      x: 360,
      y: this.currentY + 20,
      size: 12,
      font: this.boldFont,
      color: rgb(0, 0.2, 0.6),
    })

    page.drawText('Date:', {
      x: 360,
      y: this.currentY + 5,
      size: 11,
      font: this.font,
      color: rgb(0.2, 0.2, 0.2),
    })

    page.drawText(data.paymentDate, {
      x: 400,
      y: this.currentY + 5,
      size: 11,
      font: this.font,
      color: rgb(0.1, 0.1, 0.1),
    })

    this.currentY -= 80
  }

  private drawStudentInfo(data: ReceiptData) {
    const { page } = this

    // Student information section
    page.drawText('STUDENT INFORMATION', {
      x: 50,
      y: this.currentY,
      size: 14,
      font: this.boldFont,
      color: rgb(0.1, 0.1, 0.1),
    })

    this.currentY -= 5
    page.drawLine({
      start: { x: 50, y: this.currentY },
      end: { x: 250, y: this.currentY },
      thickness: 1,
      color: rgb(0.7, 0.7, 0.7),
    })

    this.currentY -= 20

    // Student details
    const studentInfo = [
      { label: 'Name:', value: data.studentName },
      { label: 'Student ID:', value: data.studentId || 'N/A' },
      { label: 'Academic Year:', value: data.academicYear || 'N/A' },
      { label: 'Term:', value: data.term || 'N/A' },
    ]

    studentInfo.forEach(info => {
      page.drawText(info.label, {
        x: 50,
        y: this.currentY,
        size: 11,
        font: this.font,
        color: rgb(0.3, 0.3, 0.3),
      })

      page.drawText(info.value, {
        x: 150,
        y: this.currentY,
        size: 11,
        font: this.boldFont,
        color: rgb(0.1, 0.1, 0.1),
      })

      this.currentY -= 18
    })

    // Parent information (if available)
    if (data.parentName) {
      this.currentY -= 10
      page.drawText('PARENT/GUARDIAN', {
        x: 300,
        y: this.currentY + 70,
        size: 14,
        font: this.boldFont,
        color: rgb(0.1, 0.1, 0.1),
      })

      page.drawLine({
        start: { x: 300, y: this.currentY + 65 },
        end: { x: 480, y: this.currentY + 65 },
        thickness: 1,
        color: rgb(0.7, 0.7, 0.7),
      })

      const parentInfo = [
        { label: 'Name:', value: data.parentName },
        { label: 'Email:', value: data.parentEmail || 'N/A' },
        { label: 'Phone:', value: data.parentPhone || 'N/A' },
      ]

      parentInfo.forEach((info, index) => {
        const yPos = this.currentY + 45 - (index * 18)
        page.drawText(info.label, {
          x: 300,
          y: yPos,
          size: 11,
          font: this.font,
          color: rgb(0.3, 0.3, 0.3),
        })

        page.drawText(info.value, {
          x: 350,
          y: yPos,
          size: 11,
          font: this.font,
          color: rgb(0.1, 0.1, 0.1),
        })
      })
    }

    this.currentY -= 30
  }

  private drawPaymentDetails(data: ReceiptData) {
    const { page } = this

    // Payment details section
    page.drawText('PAYMENT DETAILS', {
      x: 50,
      y: this.currentY,
      size: 14,
      font: this.boldFont,
      color: rgb(0.1, 0.1, 0.1),
    })

    this.currentY -= 5
    page.drawLine({
      start: { x: 50, y: this.currentY },
      end: { x: 200, y: this.currentY },
      thickness: 1,
      color: rgb(0.7, 0.7, 0.7),
    })

    this.currentY -= 20

    // Payment method and transaction ID
    const paymentDetails = [
      { label: 'Payment Method:', value: data.paymentMethod },
      { label: 'Transaction ID:', value: data.transactionId || 'N/A' },
    ]

    paymentDetails.forEach(detail => {
      page.drawText(detail.label, {
        x: 50,
        y: this.currentY,
        size: 11,
        font: this.font,
        color: rgb(0.3, 0.3, 0.3),
      })

      page.drawText(detail.value, {
        x: 180,
        y: this.currentY,
        size: 11,
        font: this.font,
        color: rgb(0.1, 0.1, 0.1),
      })

      this.currentY -= 18
    })

    this.currentY -= 20
  }

  private drawFeeBreakdown(data: ReceiptData) {
    const { page } = this

    // Fee breakdown table
    page.drawText('FEE BREAKDOWN', {
      x: 50,
      y: this.currentY,
      size: 14,
      font: this.boldFont,
      color: rgb(0.1, 0.1, 0.1),
    })

    this.currentY -= 25

    // Table header
    const headerY = this.currentY
    page.drawRectangle({
      x: 50,
      y: headerY - 20,
      width: 500,
      height: 25,
      color: rgb(0.9, 0.95, 1),
      borderColor: rgb(0.7, 0.7, 0.7),
      borderWidth: 1,
    })

    page.drawText('Description', {
      x: 60,
      y: headerY - 10,
      size: 12,
      font: this.boldFont,
      color: rgb(0.1, 0.1, 0.1),
    })

    page.drawText('Amount', {
      x: 480,
      y: headerY - 10,
      size: 12,
      font: this.boldFont,
      color: rgb(0.1, 0.1, 0.1),
    })

    this.currentY -= 25

    // Table rows
    data.feeItems.forEach((item, index) => {
      const rowY = this.currentY - (index * 25)

      // Alternate row colors
      if (index % 2 === 1) {
        page.drawRectangle({
          x: 50,
          y: rowY - 20,
          width: 500,
          height: 25,
          color: rgb(0.98, 0.98, 0.98),
        })
      }

      // Row border
      page.drawRectangle({
        x: 50,
        y: rowY - 20,
        width: 500,
        height: 25,
        borderColor: rgb(0.9, 0.9, 0.9),
        borderWidth: 0.5,
      })

      // Fee name
      page.drawText(item.name, {
        x: 60,
        y: rowY - 10,
        size: 11,
        font: this.font,
        color: rgb(0.2, 0.2, 0.2),
      })

      // Amount
      const formattedAmount = this.formatCurrency(item.amount, data.currency)
      page.drawText(formattedAmount, {
        x: 480,
        y: rowY - 10,
        size: 11,
        font: this.font,
        color: rgb(0.1, 0.1, 0.1),
      })
    })

    this.currentY -= data.feeItems.length * 25 + 10
  }

  private drawTotal(data: ReceiptData) {
    const { page } = this

    // Total amount box
    page.drawRectangle({
      x: 350,
      y: this.currentY - 25,
      width: 200,
      height: 35,
      color: rgb(0, 0.2, 0.6),
    })

    page.drawText('TOTAL PAID:', {
      x: 360,
      y: this.currentY - 10,
      size: 12,
      font: this.boldFont,
      color: rgb(1, 1, 1),
    })

    const totalFormatted = this.formatCurrency(data.amount, data.currency)
    page.drawText(totalFormatted, {
      x: 450,
      y: this.currentY - 10,
      size: 14,
      font: this.boldFont,
      color: rgb(1, 1, 1),
    })

    this.currentY -= 60
  }

  private drawFooter(data: ReceiptData) {
    const { page } = this

    // Status
    page.drawText('✓ PAYMENT SUCCESSFUL', {
      x: 50,
      y: this.currentY,
      size: 12,
      font: this.boldFont,
      color: rgb(0, 0.6, 0.2),
    })

    this.currentY -= 30

    // Notes
    if (data.notes) {
      page.drawText('Notes:', {
        x: 50,
        y: this.currentY,
        size: 11,
        font: this.boldFont,
        color: rgb(0.2, 0.2, 0.2),
      })

      this.currentY -= 15

      page.drawText(data.notes, {
        x: 50,
        y: this.currentY,
        size: 10,
        font: this.font,
        color: rgb(0.4, 0.4, 0.4),
      })

      this.currentY -= 30
    }

    // Footer line
    page.drawLine({
      start: { x: 50, y: this.currentY },
      end: { x: 550, y: this.currentY },
      thickness: 1,
      color: rgb(0.8, 0.8, 0.8),
    })

    this.currentY -= 20

    // Footer text
    page.drawText('This is a computer-generated receipt and does not require a signature.', {
      x: 50,
      y: this.currentY,
      size: 9,
      font: this.font,
      color: rgb(0.5, 0.5, 0.5),
    })

    this.currentY -= 15

    page.drawText(`Generated on ${new Date().toLocaleString()} | Powered by Payng`, {
      x: 50,
      y: this.currentY,
      size: 8,
      font: this.font,
      color: rgb(0.6, 0.6, 0.6),
    })

    // QR code placeholder (you can add actual QR code generation later)
    page.drawRectangle({
      x: 450,
      y: this.currentY - 60,
      width: 80,
      height: 80,
      borderColor: rgb(0.7, 0.7, 0.7),
      borderWidth: 1,
    })

    page.drawText('QR Code', {
      x: 475,
      y: this.currentY - 25,
      size: 8,
      font: this.font,
      color: rgb(0.5, 0.5, 0.5),
    })

    page.drawText('Scan to verify', {
      x: 465,
      y: this.currentY - 35,
      size: 7,
      font: this.font,
      color: rgb(0.5, 0.5, 0.5),
    })
  }

  private formatCurrency(amount: number, currency: string): string {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
    }).format(amount)
  }
}

// Helper function to generate receipt PDF
export async function generateReceiptPDF(data: ReceiptData): Promise<Buffer> {
  const generator = new PDFReceiptGenerator()
  return await generator.generateReceipt(data)
}

// Helper function to generate receipt with base64 encoding
export async function generateReceiptBase64(data: ReceiptData): Promise<string> {
  const pdfBuffer = await generateReceiptPDF(data)
  return pdfBuffer.toString('base64')
}

// Validate receipt data
export function validateReceiptData(data: Partial<ReceiptData>): ReceiptData {
  const required = ['receiptNumber', 'schoolName', 'studentName', 'amount', 'currency', 'paymentDate', 'paymentMethod']

  for (const field of required) {
    if (!data[field as keyof ReceiptData]) {
      throw new Error(`Missing required field: ${field}`)
    }
  }

  if (!data.feeItems || data.feeItems.length === 0) {
    throw new Error('At least one fee item is required')
  }

  if (data.amount! <= 0) {
    throw new Error('Amount must be greater than 0')
  }

  // Verify amount matches sum of fee items
  const feeItemsTotal = data.feeItems.reduce((sum, item) => sum + item.amount, 0)
  if (Math.abs(data.amount! - feeItemsTotal) > 0.01) {
    throw new Error('Amount does not match sum of fee items')
  }

  return data as ReceiptData
}

// Export singleton generator
export const pdfGenerator = new PDFReceiptGenerator()
