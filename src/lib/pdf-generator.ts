import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { InvoiceData } from '@/types/invoice';
import { formatCurrency, formatDate } from './utils';

export async function generatePDF(invoiceData: InvoiceData) {
  // Create a temporary div to render the invoice
  const invoiceElement = createInvoiceHTML(invoiceData);
  document.body.appendChild(invoiceElement);

  try {
    // Convert HTML to canvas
    const canvas = await html2canvas(invoiceElement, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
    });

    // Create PDF
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    const imgData = canvas.toDataURL('image/png');
    const imgWidth = 210; // A4 width in mm
    const pageHeight = 295; // A4 height in mm
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    let heightLeft = imgHeight;

    let position = 0;

    // Add first page
    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;

    // Add additional pages if needed
    while (heightLeft >= 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
    }

    // Download the PDF
    pdf.save(`invoice-${invoiceData.invoiceNumber}.pdf`);
  } finally {
    // Clean up
    document.body.removeChild(invoiceElement);
  }
}

function createInvoiceHTML(data: InvoiceData): HTMLElement {
  const div = document.createElement('div');
  div.style.position = 'absolute';
  div.style.left = '-9999px';
  div.style.width = '794px'; // A4 width in pixels at 96 DPI
  div.style.backgroundColor = 'white';
  div.style.fontFamily = 'Arial, sans-serif';
  div.style.fontSize = '14px';
  div.style.lineHeight = '1.4';
  div.style.color = '#000';
  div.style.padding = '40px';

  div.innerHTML = `
    <div style="margin-bottom: 30px;">
      <!-- Header -->
      <div style="background: linear-gradient(135deg, #166534 0%, #15803d 100%); color: white; padding: 30px; border-radius: 8px; margin-bottom: 30px;">
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <div>
            <h1 style="margin: 0; font-size: 28px; font-weight: bold; display: flex; align-items: center; gap: 10px;">
              ✨ PT Aghatis Karya Indonesia
            </h1>
            <p style="margin: 10px 0 0 0; color: #bbf7d0; font-size: 16px;">Professional Invoice Generator</p>
          </div>
          <div style="text-align: right;">
            <div style="font-size: 24px; font-weight: bold; margin-bottom: 5px;">INVOICE</div>
            <div style="color: #bbf7d0; font-size: 16px;">${data.invoiceNumber}</div>
          </div>
        </div>
      </div>

      <!-- Invoice Details -->
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-bottom: 30px;">
        <div>
          <h3 style="margin: 0 0 15px 0; font-size: 18px; color: #166534; border-bottom: 2px solid #166534; padding-bottom: 5px;">Invoice Information</h3>
          <div style="margin-bottom: 10px;"><strong>Invoice Number:</strong> ${data.invoiceNumber}</div>
          <div style="margin-bottom: 10px;"><strong>Invoice Date:</strong> ${formatDate(data.invoiceDate)}</div>
          <div style="margin-bottom: 10px;"><strong>Due Date:</strong> ${formatDate(data.dueDate)}</div>
        </div>
        <div>
          <h3 style="margin: 0 0 15px 0; font-size: 18px; color: #166534; border-bottom: 2px solid #166534; padding-bottom: 5px;">Payment Information</h3>
          <div style="background: #f8fafc; padding: 15px; border-radius: 6px;">
            <div style="margin-bottom: 8px;"><strong>Account Name:</strong> ${data.accountName}</div>
            <div style="margin-bottom: 8px;"><strong>Account Number:</strong> ${data.accountNumber}</div>
            <div><strong>Bank Name:</strong> ${data.bankName}</div>
          </div>
        </div>
      </div>

      <!-- From/To Section -->
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-bottom: 30px;">
        <div>
          <h3 style="margin: 0 0 15px 0; font-size: 18px; color: #166534; border-bottom: 2px solid #166534; padding-bottom: 5px;">From</h3>
          <div style="font-weight: bold; margin-bottom: 5px;">${data.senderCompany}</div>
          <div style="white-space: pre-line; color: #64748b;">${data.senderAddress}</div>
        </div>
        <div>
          <h3 style="margin: 0 0 15px 0; font-size: 18px; color: #166534; border-bottom: 2px solid #166534; padding-bottom: 5px;">To</h3>
          <div style="font-weight: bold; margin-bottom: 5px;">${data.recipientCompany}</div>
          <div style="white-space: pre-line; color: #64748b;">${data.recipientAddress}</div>
        </div>
      </div>

      <!-- Items Table -->
      <div style="margin-bottom: 30px;">
        <h3 style="margin: 0 0 15px 0; font-size: 18px; color: #166534; border-bottom: 2px solid #166534; padding-bottom: 5px;">Items & Services</h3>
        <table style="width: 100%; border-collapse: collapse; border: 1px solid #e2e8f0;">
          <thead>
            <tr style="background: #f8fafc;">
              <th style="padding: 12px; text-align: left; border: 1px solid #e2e8f0; font-weight: bold;">Description</th>
              <th style="padding: 12px; text-align: center; border: 1px solid #e2e8f0; font-weight: bold; width: 80px;">Qty</th>
              <th style="padding: 12px; text-align: right; border: 1px solid #e2e8f0; font-weight: bold; width: 120px;">Price</th>
              <th style="padding: 12px; text-align: right; border: 1px solid #e2e8f0; font-weight: bold; width: 120px;">Total</th>
            </tr>
          </thead>
          <tbody>
            ${data.items.map(item => `
              <tr>
                <td style="padding: 12px; border: 1px solid #e2e8f0;">${item.description}</td>
                <td style="padding: 12px; text-align: center; border: 1px solid #e2e8f0;">${item.quantity}</td>
                <td style="padding: 12px; text-align: right; border: 1px solid #e2e8f0; font-family: monospace;">${formatCurrency(item.price, data.currency)}</td>
                <td style="padding: 12px; text-align: right; border: 1px solid #e2e8f0; font-family: monospace; font-weight: bold;">${formatCurrency(item.total, data.currency)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>

      <!-- Totals -->
      <div style="display: flex; justify-content: flex-end; margin-bottom: 30px;">
        <div style="width: 300px;">
          <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e2e8f0;">
            <span>Subtotal:</span>
            <span style="font-family: monospace;">${formatCurrency(data.subtotal, data.currency)}</span>
          </div>
          <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e2e8f0;">
            <span>Tax (${data.taxRate}%):</span>
            <span style="font-family: monospace;">${formatCurrency(data.taxAmount, data.currency)}</span>
          </div>
          <div style="display: flex; justify-content: space-between; padding: 12px 0; font-size: 18px; font-weight: bold; background: #f8fafc; margin-top: 10px; padding-left: 15px; padding-right: 15px; border-radius: 6px;">
            <span>Grand Total:</span>
            <span style="font-family: monospace; color: #166534;">${formatCurrency(data.grandTotal, data.currency)}</span>
          </div>
        </div>
      </div>

      ${data.notes && data.notes.trim() ? `
        <!-- Notes -->
        <div style="margin-bottom: 30px;">
          <h3 style="margin: 0 0 15px 0; font-size: 18px; color: #166534; border-bottom: 2px solid #166534; padding-bottom: 5px;">Notes</h3>
          <div style="background: #f8fafc; padding: 15px; border-radius: 6px; white-space: pre-line;">${data.notes}</div>
        </div>
      ` : ''}

      <!-- Footer -->
      <div style="text-align: center; padding-top: 20px; border-top: 1px solid #e2e8f0; color: #64748b; font-size: 12px;">
        <p style="margin: 0;">Thank you for your business! ✨</p>
        <p style="margin: 5px 0 0 0;">Generated by PT Aghatis Karya Indonesia Invoice System</p>
      </div>
    </div>
  `;

  return div;
}

export function printInvoice(invoiceData: InvoiceData) {
  const printWindow = window.open('', '_blank');
  if (!printWindow) return;

  const invoiceHTML = createInvoiceHTML(invoiceData);
  
  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Invoice ${invoiceData.invoiceNumber}</title>
      <style>
        body { margin: 0; padding: 20px; font-family: Arial, sans-serif; }
        @media print {
          body { margin: 0; }
          .no-print { display: none; }
        }
      </style>
    </head>
    <body>
      ${invoiceHTML.innerHTML}
    </body>
    </html>
  `);
  
  printWindow.document.close();
  printWindow.focus();
  printWindow.print();
}