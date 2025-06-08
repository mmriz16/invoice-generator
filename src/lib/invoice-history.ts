import { InvoiceHistoryItem, InvoiceHistoryFilters, InvoiceHistoryStats } from '@/types/invoice-history';
import { InvoiceData } from '@/types/invoice';

const HISTORY_STORAGE_KEY = 'invoiceHistory';

export function saveInvoiceToHistory(invoiceData: InvoiceData): string {
  const historyItem: InvoiceHistoryItem = {
    id: generateHistoryId(),
    invoiceNumber: invoiceData.invoiceNumber,
    invoiceDate: invoiceData.invoiceDate,
    dueDate: invoiceData.dueDate,
    senderCompany: invoiceData.senderCompany,
    recipientCompany: invoiceData.recipientCompany,
    grandTotal: invoiceData.grandTotal,
    currency: invoiceData.currency,
    status: 'draft',
    createdAt: new Date(),
    updatedAt: new Date(),
    pdfGenerated: false,
    fullData: invoiceData
  };

  const history = getInvoiceHistory();
  history.unshift(historyItem); // Add to beginning of array
  
  try {
    localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(history));
    return historyItem.id;
  } catch (error) {
    console.error('Error saving invoice to history:', error);
    throw new Error('Failed to save invoice to history');
  }
}

export function getInvoiceHistory(): InvoiceHistoryItem[] {
  try {
    const historyData = localStorage.getItem(HISTORY_STORAGE_KEY);
    if (!historyData) return [];
    
    const history = JSON.parse(historyData);
    // Convert date strings back to Date objects
    return history.map((item: any) => ({
      ...item,
      invoiceDate: new Date(item.invoiceDate),
      dueDate: new Date(item.dueDate),
      createdAt: new Date(item.createdAt),
      updatedAt: new Date(item.updatedAt),
      fullData: {
        ...item.fullData,
        invoiceDate: new Date(item.fullData.invoiceDate),
        dueDate: new Date(item.fullData.dueDate)
      }
    }));
  } catch (error) {
    console.error('Error loading invoice history:', error);
    return [];
  }
}

export function getInvoiceById(id: string): InvoiceHistoryItem | null {
  const history = getInvoiceHistory();
  return history.find(item => item.id === id) || null;
}

export function updateInvoiceStatus(id: string, status: InvoiceHistoryItem['status']): void {
  const history = getInvoiceHistory();
  const index = history.findIndex(item => item.id === id);
  
  if (index !== -1) {
    history[index].status = status;
    history[index].updatedAt = new Date();
    
    if (status === 'sent') {
      history[index].pdfGenerated = true;
    }
    
    try {
      localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(history));
    } catch (error) {
      console.error('Error updating invoice status:', error);
      throw new Error('Failed to update invoice status');
    }
  }
}

export function deleteInvoiceFromHistory(id: string): void {
  const history = getInvoiceHistory();
  const filteredHistory = history.filter(item => item.id !== id);
  
  try {
    localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(filteredHistory));
  } catch (error) {
    console.error('Error deleting invoice from history:', error);
    throw new Error('Failed to delete invoice from history');
  }
}

export function filterInvoiceHistory(filters: InvoiceHistoryFilters): InvoiceHistoryItem[] {
  const history = getInvoiceHistory();
  
  return history.filter(item => {
    // Status filter
    if (filters.status && filters.status !== 'all' && item.status !== filters.status) {
      return false;
    }
    
    // Date range filter
    if (filters.dateFrom && item.invoiceDate < filters.dateFrom) {
      return false;
    }
    if (filters.dateTo && item.invoiceDate > filters.dateTo) {
      return false;
    }
    
    // Search term filter
    if (filters.searchTerm) {
      const searchLower = filters.searchTerm.toLowerCase();
      return (
        item.invoiceNumber.toLowerCase().includes(searchLower) ||
        item.senderCompany.toLowerCase().includes(searchLower) ||
        item.recipientCompany.toLowerCase().includes(searchLower)
      );
    }
    
    return true;
  });
}

export function getInvoiceHistoryStats(): InvoiceHistoryStats {
  const history = getInvoiceHistory();
  
  const stats: InvoiceHistoryStats = {
    total: history.length,
    draft: 0,
    sent: 0,
    paid: 0,
    overdue: 0,
    totalAmount: 0
  };
  
  const now = new Date();
  
  history.forEach(item => {
    stats[item.status]++;
    stats.totalAmount += item.grandTotal;
    
    // Check for overdue invoices
    if (item.status === 'sent' && item.dueDate < now) {
      stats.overdue++;
      stats.sent--;
    }
  });
  
  return stats;
}

function generateHistoryId(): string {
  return `inv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

export function clearInvoiceHistory(): void {
  try {
    localStorage.removeItem(HISTORY_STORAGE_KEY);
  } catch (error) {
    console.error('Error clearing invoice history:', error);
    throw new Error('Failed to clear invoice history');
  }
}