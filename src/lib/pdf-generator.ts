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
  div.style.width = '595px'; // A4 width in pixels at 96 DPI
  div.style.backgroundColor = 'white';
  div.style.fontFamily = 'Plus Jakarta Sans, Arial, sans-serif';
  div.style.fontSize = '14px';
  div.style.lineHeight = '1.4';
  div.style.color = '#000';

  div.innerHTML = `
    <div style="position: relative; min-height: 805px; margin-bottom: 30px;">
      <!-- Header -->
      <div style="background: #20493C; color: white; padding: 30px;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px;">
          <div>
            <h1 style="margin: 0; font-size: 16px; font-weight: bold; display: flex; align-items: center; gap: 10px;">
              ${data.senderCompany}
            </h1>
            <p style="font-size: 10px;">${data.senderAddress}</p>
          </div>
          <div style="text-align: right;">
            <h1 style="margin: 0; font-size: 16px; font-weight: bold; display: flex; align-items: center; gap: 10px;">
              ${data.recipientCompany}
            </h1>
            <p style="font-size: 10px;">${data.recipientAddress}</p>
          </div>
        </div>
        <div style="display: flex; justify-content: space-between; align-items:start;">
          <div style="text-align: left;">
            <h1 style="margin: 0; font-size: 16px; font-weight: bold; display: flex; align-items: center;">
              INVOICE
            </h1>
            <p style="margin: 0; font-size: 10px;">${data.invoiceNumber}</p>
            <p style="margin: 0; font-size: 10px;">${formatDate(data.invoiceDate)}</p>
          </div>
          <div style="display: flex; flex-direction: column; width: 300px; justify-content: center; align-items: flex-start; padding: 20px; background: rgba(0, 0, 0, 0.10);">
            <p style="margin: 0; font-size: 10px; text-align: left">TOTAL</p>
            <div style="display: flex; justify-content: flex-end; align-items: center; width: 100%;">
              <h1 style="margin: 0; font-size: 30px; font-weight: bold; display: flex; align-items: center; text-align: right;">
              ${formatCurrency(data.grandTotal, data.currency)}
              </h1>
            </div>
          </div>
        </div>
      </div>

      <!-- Items Table -->
      <div style="padding: 30px; margin-bottom: 200px;">
        <table style="width: 100%; border-collapse: collapse; border-bottom: 1px solid #e2e8f0;">
          <thead>
            <tr style="font-size: 12px;">
              <th style="padding-bottom: 22px; padding-top: 0; text-align: left; border-bottom: 1px solid #e2e8f0; font-weight: bold;">DESCRIPTION</th>
              <th style="padding-bottom: 22px; padding-top: 0; text-align: center; border-bottom: 1px solid #e2e8f0; font-weight: bold; width: 80px;">QTY</th>
              <th style="padding-bottom: 22px; padding-top: 0; text-align: right; border-bottom: 1px solid #e2e8f0; font-weight: bold; width: 120px;">PRICE</th>
              <th style="padding-bottom: 22px; padding-top: 0; text-align: right; border-bottom: 1px solid #e2e8f0; font-weight: bold; width: 120px;">TOTAL</th>
            </tr>
          </thead>
          <tbody>
            ${data.items.map(item => `
              <tr style="font-size: 12px; margin: 0;">
                <td style="padding-bottom: 22px; padding-top: 10px; border-bottom: 1px solid #e2e8f0;">${item.description}</td>
                <td style="padding-bottom: 22px; padding-top: 10px; text-align: center; border-bottom: 1px solid #e2e8f0;">${item.quantity}</td>
                <td style="padding-bottom: 22px; padding-top: 10px; text-align: right; border-bottom: 1px solid #e2e8f0;">${formatCurrency(item.price, data.currency)}</td>
                <td style="padding-bottom: 22px; padding-top: 10px; text-align: right; border-bottom: 1px solid #e2e8f0;">${formatCurrency(item.total, data.currency)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>

      <!-- Bottom Section -->
      <div style="position: absolute; bottom: 0; left: 0; right: 0; padding: 30px;">
        <!-- Totals -->
        <div style="display: flex; justify-content: flex-end; margin-bottom: 20px;">
          <div style="display: flex; align-items: center; width: 100%; gap: 8px; background: #f7f7f7; padding-bottom: 10px; padding-left: 10px">
            <div style="padding: 8px 0;">
              <p style="margin: 0; font-size: 8px;">SUBTOTAL</p>
              <span style="margin-top: 8px; font-size: 14px; font-weight: 700"">${formatCurrency(data.subtotal, data.currency)}</span>
            </div>
            <div style="padding: 8px 0;">
              <h1 style="margin: 0; font-size: 12px; font-weight: 700">+</h1>
            </div>
            <div style="padding: 8px 0;">
              <p style="margin: 0; font-size: 8px;">TAX (${data.taxRate}%)</p>
              <span style="margin-top: 8px; font-size: 14px; font-weight: 700">${formatCurrency(data.taxAmount, data.currency)}</span>
            </div>
          </div>
          <div style="display: flex; color: #ffffff; align-items: center; background: #20493C; padding-bottom: 10px; padding-left: 10px; padding-right: 10px">
            <div style=""padding: 8px 0>
              <p style="margin: 0; font-size: 8px;">TOTAL:</p>
              <span style="margin-top: 8px; font-size: 14px; font-weight: 700">${formatCurrency(data.grandTotal, data.currency)}</span>
            </div>
          </div>
        </div>

        ${data.notes && data.notes.trim() ? `
          <!-- Notes -->
          <div style="border-bottom: 1px solid rgba(0, 0, 0, 0.1); display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
            <p style="margin: 0 0 10px 0; font-size: 12px; font-weight: bold;">Notes</p>
            <p style="font-size: 10px; font-style: italic">${data.notes}</p>
          </div>
        ` : ''}

        <!-- Footer -->
        <div style="text-align: left;">
          <p style="margin: 0; font-size: 10px; font-weight: 700">${data.accountName}</p>
          <p style="margin: 0; font-size: 10px;">${data.accountNumber}</p>
          <p style="margin: 0; font-size: 10px;">${data.bankName}</p>
        </div>
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
        body { margin: 0; padding: 20px; font-family: Plus Jakarta Sans, Arial, sans-serif; }
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