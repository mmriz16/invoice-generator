export interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  price: number;
  total: number;
}

export interface InvoiceData {
  invoiceNumber: string;
  invoiceDate: Date;
  dueDate: Date;
  senderCompany: string;
  senderAddress: string;
  recipientCompany: string;
  recipientAddress: string;
  items: InvoiceItem[];
  notes?: string;
  accountName: string;
  accountNumber: string;
  bankName: string;
  currency: string;
  subtotal: number;
  taxType: 'percentage' | 'fixed';
  taxRate: number;
  taxAmount: number;
  grandTotal: number;
}

export interface InvoiceTemplate {
  id: string;
  name: string;
  senderCompany: string;
  senderAddress: string;
  recipientCompany: string;
  recipientAddress: string;
  accountName: string;
  accountNumber: string;
  bankName: string;
  createdAt: Date;
}
