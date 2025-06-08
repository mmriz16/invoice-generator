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
      <div style="background: #20493C url('/img/bg.png') no-repeat; background-size: 595px auto; color: white; padding: 30px;">
        <div style="display: flex; gap: 16px">
          <svg width="36" height="40" viewBox="0 0 36 40" fill="none" xmlns="http://www.w3.org/2000/svg" style="margin-bottom: 10px;">
            <path d="M24.612 9.96855C23.7113 11.8334 22.0723 13.1068 20.2139 13.6061C19.445 11.8454 19.4209 9.77461 20.3216 7.90816C21.223 6.04172 22.8621 4.7683 24.7212 4.26983C25.4877 6.03049 25.5126 8.1021 24.612 9.96855Z" fill="white"/>
            <path d="M28.5681 18.2221C26.5442 18.6829 24.5244 18.1981 22.9753 17.0601C23.876 15.3635 25.4837 14.0525 27.5092 13.5916C29.5339 13.1308 31.5545 13.6149 33.1036 14.7545C32.2013 16.4502 30.5936 17.7613 28.5681 18.2221Z" fill="white"/>
            <path d="M24.5662 26.4524C22.9432 25.1614 22.0634 23.2837 21.9895 21.3668C23.8808 21.011 25.9111 21.4477 27.5349 22.7396C29.1586 24.0314 30.0384 25.9091 30.1115 27.8276C28.2194 28.181 26.1899 27.7443 24.5662 26.4532V26.4524Z" fill="white"/>
            <path d="M15.6768 7.90816C16.5775 9.77301 16.5534 11.8462 15.7861 13.6053C13.9269 13.1068 12.2879 11.835 11.3872 9.96855C10.4858 8.1021 10.5099 6.02969 11.2788 4.26903C13.1372 4.7691 14.7762 6.04091 15.6768 7.90736V7.90816Z" fill="white"/>
            <path d="M8.49082 13.5916C10.5147 14.0524 12.124 15.3635 13.0247 17.0585C11.4748 18.1973 9.45656 18.6829 7.43107 18.2213C5.40639 17.7605 3.79709 16.4494 2.89643 14.7521C4.44708 13.6149 6.46614 13.13 8.49082 13.5908V13.5916Z" fill="white"/>
            <path d="M8.4643 22.7396C10.0873 21.4485 12.1184 21.011 14.0089 21.366C13.9358 23.2845 13.0568 25.1614 11.433 26.4532C9.80927 27.7451 7.77816 28.1826 5.88685 27.8268C5.96237 25.9083 6.84054 24.0314 8.4643 22.7404V22.7396Z" fill="white"/>
            <path d="M16.8097 2.59011C16.8097 1.55471 17.2717 0.62669 17.9996 0C18.7283 0.62669 19.1903 1.55471 19.1903 2.59011C19.1903 3.62551 18.7283 4.55433 17.9996 5.18102C17.2709 4.55352 16.8097 3.62631 16.8097 2.59011Z" fill="white"/>
            <path d="M4.85363 9.47729C4.04215 8.83216 3.60266 7.89293 3.5657 6.93446C4.51136 6.75655 5.52611 6.97533 6.3384 7.62046C7.15068 8.26638 7.59016 9.20481 7.62712 10.1641C6.68147 10.3412 5.66591 10.1224 4.85443 9.47649L4.85363 9.47729Z" fill="white"/>
            <path d="M2.79679 23.0946C1.78526 23.3246 0.774522 23.0826 0 22.5136C0.44993 21.6649 1.25418 21.0102 2.26652 20.7794C3.27886 20.5486 4.28879 20.7914 5.06412 21.3604C4.61339 22.2082 3.80914 22.8638 2.79679 23.0938V23.0946Z" fill="white"/>
            <path d="M12.1891 33.1881C11.7391 34.121 10.9188 34.7573 9.99004 35.0065C9.60599 34.1266 9.59314 33.0904 10.0439 32.1576C10.4946 31.2239 11.3141 30.5876 12.2437 30.3384C12.627 31.2191 12.6398 32.2545 12.1891 33.1873V33.1881Z" fill="white"/>
            <path d="M25.9569 32.1576C26.4077 33.0904 26.3956 34.1266 26.0116 35.0065C25.082 34.7573 24.2625 34.1218 23.8117 33.1881C23.361 32.2553 23.3731 31.2191 23.7571 30.3384C24.6867 30.5884 25.5054 31.2239 25.9561 32.1576H25.9569Z" fill="white"/>
            <path d="M33.7327 20.7778C34.7442 21.0078 35.5493 21.6633 36 22.5112C35.2255 23.081 34.2155 23.323 33.2032 23.093C32.1909 22.863 31.3858 22.2074 30.9359 21.3588C31.7112 20.7898 32.7203 20.5478 33.7327 20.7778Z" fill="white"/>
            <path d="M29.66 7.61885C30.4715 6.97373 31.487 6.75415 32.4319 6.93126C32.3957 7.89053 31.9563 8.82896 31.144 9.47488C30.3325 10.1208 29.3169 10.3396 28.3705 10.1617C28.4082 9.20241 28.8469 8.26397 29.6592 7.61805L29.66 7.61885Z" fill="white"/>
            <path d="M22.331 39.9992L13.6674 40C15.3852 39.9615 16.7703 38.5799 16.8081 36.8666H16.8089V18.1804C16.8089 17.145 17.2709 16.217 17.9988 15.5903C18.7283 16.217 19.1895 17.145 19.1895 18.1804V36.8666H19.1903C19.2281 38.5799 20.6132 39.9615 22.331 39.9992Z" fill="white"/>
          </svg>
          <h1 style="font-size: 20px; font-weight: 700">Aghatis</h1>
        </div>
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px;">
          <div style="width: 200px">
            <h1 style="margin: 0; font-size: 16px; font-weight: bold;">
              ${data.senderCompany}
            </h1>
            <p style="font-size: 10px;">${data.senderAddress}</p>
          </div>
          <div style="display: flex; align-items: center;">
            <svg width="50" height="50" viewBox="0 0 51 50" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="25.5" cy="25" r="24" stroke="white" stroke-opacity="0.2" stroke-width="2"/>
              <path d="M39.2071 25.7071C39.5976 25.3166 39.5976 24.6834 39.2071 24.2929L32.8431 17.9289C32.4526 17.5384 31.8195 17.5384 31.4289 17.9289C31.0384 18.3195 31.0384 18.9526 31.4289 19.3431L37.0858 25L31.4289 30.6569C31.0384 31.0474 31.0384 31.6805 31.4289 32.0711C31.8195 32.4616 32.4526 32.4616 32.8431 32.0711L39.2071 25.7071ZM12.5 25V26H38.5V25V24H12.5V25Z" fill="white" fill-opacity="0.2"/>
            </svg>
          </div>
          <div style="text-align: right; width: 200px">
            <h1 style="margin: 0; font-size: 16px; font-weight: bold;">
              ${data.recipientCompany}
            </h1>
            <p style="font-size: 10px;">${data.recipientAddress}</p>
          </div>
        </div>
        <div style="display: flex; justify-content: space-between; align-items:start; margin-top: -10px">
          <div style="text-align: left;">
            <h1 style="margin: 0; font-size: 16px; font-weight: bold; display: flex; align-items: center;">
              INVOICE
            </h1>
            <p style="margin: 0; font-size: 10px;">${data.invoiceNumber}</p>
            <p style="margin: 0; font-size: 10px;">${formatDate(data.invoiceDate)}</p>
          </div>
          <div style="display: flex; flex-direction: column; width: 300px; justify-content: center; align-items: flex-start; padding: 20px; background: rgba(0, 0, 0, 0.10);">
            <p style="margin: 0; margin-top: -10px; font-size: 10px; text-align: left">TOTAL</p>
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
              <span style="margin-top: 8px; font-size: 14px; font-weight: 700">${formatCurrency(data.subtotal, data.currency)}</span>
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
            <div style="padding: 8px 0;">
              <p style="margin: 0; font-size: 8px;">TOTAL:</p>
              <span style="margin-top: 8px; font-size: 14px; font-weight: 700">${formatCurrency(data.grandTotal, data.currency)}</span>
            </div>
          </div>
        </div>

        ${data.notes && data.notes.trim() ? `
          <!-- Notes -->
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; margin-top: -10px">
            <p style="margin: 0 0 10px 0; font-size: 12px; font-weight: bold;">Notes</p>
            <p style="font-size: 10px; font-style: italic">${data.notes}</p>
          </div>
        ` : ''}

        <!-- Footer -->
        <div style="border-top: 1px solid rgba(0, 0, 0, 0.1); display: flex; justify-content: space-between; align-items: center; margin-top: -20px; padding-top: 10px">
          <div style="text-align: left;">
            <p style="margin: 0; font-size: 10px; font-weight: 700">${data.accountName}</p>
            <p style="margin: 0; font-size: 10px;">${data.accountNumber}</p>
            <p style="margin: 0; font-size: 10px;">${data.bankName}</p>
          </div>
          <div>
            <svg width="36" height="40" viewBox="0 0 36 40" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M24.612 9.96855C23.7113 11.8334 22.0723 13.1068 20.2139 13.6061C19.445 11.8454 19.4209 9.77461 20.3216 7.90816C21.223 6.04172 22.8621 4.7683 24.7212 4.26983C25.4877 6.03049 25.5126 8.1021 24.612 9.96855Z" fill="#20493C"/>
              <path d="M28.5681 18.2221C26.5442 18.6829 24.5244 18.1981 22.9753 17.0601C23.876 15.3635 25.4837 14.0525 27.5092 13.5916C29.5339 13.1308 31.5545 13.6149 33.1036 14.7545C32.2013 16.4502 30.5936 17.7613 28.5681 18.2221Z" fill="#20493C"/>
              <path d="M24.5662 26.4524C22.9432 25.1614 22.0634 23.2837 21.9895 21.3668C23.8808 21.011 25.9111 21.4477 27.5349 22.7396C29.1586 24.0314 30.0384 25.9091 30.1115 27.8276C28.2194 28.181 26.1899 27.7443 24.5662 26.4532V26.4524Z" fill="#20493C"/>
              <path d="M15.6768 7.90816C16.5775 9.77301 16.5534 11.8462 15.7861 13.6053C13.9269 13.1068 12.2879 11.835 11.3872 9.96855C10.4858 8.1021 10.5099 6.02969 11.2788 4.26903C13.1372 4.7691 14.7762 6.04091 15.6768 7.90736V7.90816Z" fill="#20493C"/>
              <path d="M8.49082 13.5916C10.5147 14.0524 12.124 15.3635 13.0247 17.0585C11.4748 18.1973 9.45656 18.6829 7.43107 18.2213C5.40639 17.7605 3.79709 16.4494 2.89643 14.7521C4.44708 13.6149 6.46614 13.13 8.49082 13.5908V13.5916Z" fill="#20493C"/>
              <path d="M8.4643 22.7396C10.0873 21.4485 12.1184 21.011 14.0089 21.366C13.9358 23.2845 13.0568 25.1614 11.433 26.4532C9.80927 27.7451 7.77816 28.1826 5.88685 27.8268C5.96237 25.9083 6.84054 24.0314 8.4643 22.7404V22.7396Z" fill="#20493C"/>
              <path d="M16.8097 2.59011C16.8097 1.55471 17.2717 0.62669 17.9996 0C18.7283 0.62669 19.1903 1.55471 19.1903 2.59011C19.1903 3.62551 18.7283 4.55433 17.9996 5.18102C17.2709 4.55352 16.8097 3.62631 16.8097 2.59011Z" fill="#20493C"/>
              <path d="M4.85363 9.47729C4.04215 8.83216 3.60266 7.89293 3.5657 6.93446C4.51136 6.75655 5.52611 6.97533 6.3384 7.62046C7.15068 8.26638 7.59016 9.20481 7.62712 10.1641C6.68147 10.3412 5.66591 10.1224 4.85443 9.47649L4.85363 9.47729Z" fill="#20493C"/>
              <path d="M2.79679 23.0946C1.78526 23.3246 0.774522 23.0826 0 22.5136C0.44993 21.6649 1.25418 21.0102 2.26652 20.7794C3.27886 20.5486 4.28879 20.7914 5.06412 21.3604C4.61339 22.2082 3.80914 22.8638 2.79679 23.0938V23.0946Z" fill="#20493C"/>
              <path d="M12.1891 33.1881C11.7391 34.121 10.9188 34.7573 9.99004 35.0065C9.60599 34.1266 9.59314 33.0904 10.0439 32.1576C10.4946 31.2239 11.3141 30.5876 12.2437 30.3384C12.627 31.2191 12.6398 32.2545 12.1891 33.1873V33.1881Z" fill="#20493C"/>
              <path d="M25.9569 32.1576C26.4077 33.0904 26.3956 34.1266 26.0116 35.0065C25.082 34.7573 24.2625 34.1218 23.8117 33.1881C23.361 32.2553 23.3731 31.2191 23.7571 30.3384C24.6867 30.5884 25.5054 31.2239 25.9561 32.1576H25.9569Z" fill="#20493C"/>
              <path d="M33.7327 20.7778C34.7442 21.0078 35.5493 21.6633 36 22.5112C35.2255 23.081 34.2155 23.323 33.2032 23.093C32.1909 22.863 31.3858 22.2074 30.9359 21.3588C31.7112 20.7898 32.7203 20.5478 33.7327 20.7778Z" fill="#20493C"/>
              <path d="M29.66 7.61885C30.4715 6.97373 31.487 6.75415 32.4319 6.93126C32.3957 7.89053 31.9563 8.82896 31.144 9.47488C30.3325 10.1208 29.3169 10.3396 28.3705 10.1617C28.4082 9.20241 28.8469 8.26397 29.6592 7.61805L29.66 7.61885Z" fill="#20493C"/>
              <path d="M22.331 39.9992L13.6674 40C15.3852 39.9615 16.7703 38.5799 16.8081 36.8666H16.8089V18.1804C16.8089 17.145 17.2709 16.217 17.9988 15.5903C18.7283 16.217 19.1895 17.145 19.1895 18.1804V36.8666H19.1903C19.2281 38.5799 20.6132 39.9615 22.331 39.9992Z" fill="#20493C"/>
            </svg>
          </div>
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