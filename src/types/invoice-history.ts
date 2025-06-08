export interface InvoiceHistoryItem {
  id: string;
  invoiceNumber: string;
  invoiceDate: Date;
  dueDate: Date;
  senderCompany: string;
  recipientCompany: string;
  grandTotal: number;
  currency: string;
  status: 'draft' | 'sent' | 'paid' | 'overdue';
  createdAt: Date;
  updatedAt: Date;
  pdfGenerated: boolean;
  fullData: any; // Store complete invoice data for regeneration
}

export interface InvoiceHistoryFilters {
  status?: 'draft' | 'sent' | 'paid' | 'overdue' | 'all';
  dateFrom?: Date;
  dateTo?: Date;
  searchTerm?: string;
}

export interface InvoiceHistoryStats {
  total: number;
  draft: number;
  sent: number;
  paid: number;
  overdue: number;
  totalAmount: number;
}