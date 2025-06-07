import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number, currency: string = 'IDR'): string {
  const localeMap: { [key: string]: string } = {
    'USD': 'en-US',
    'EUR': 'en-EU',
    'GBP': 'en-GB',
    'JPY': 'ja-JP',
    'IDR': 'id-ID',
    'SGD': 'en-SG',
    'MYR': 'ms-MY',
  };
  
  const locale = localeMap[currency] || 'en-US';
  
  // For IDR, don't show decimal places
  const formatOptions: Intl.NumberFormatOptions = {
    style: 'currency',
    currency: currency,
  };
  
  if (currency === 'IDR') {
    formatOptions.minimumFractionDigits = 0;
    formatOptions.maximumFractionDigits = 0;
  }
  
  return new Intl.NumberFormat(locale, formatOptions).format(amount)
}

export function getCurrencySymbol(currency: string = 'IDR'): string {
  const localeMap: { [key: string]: string } = {
    'USD': 'en-US',
    'EUR': 'en-EU',
    'GBP': 'en-GB',
    'JPY': 'ja-JP',
    'IDR': 'id-ID',
    'SGD': 'en-SG',
    'MYR': 'ms-MY',
  };
  
  const locale = localeMap[currency] || 'en-US';
  
  const formatOptions: Intl.NumberFormatOptions = {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  };
  
  // Format a small number and extract just the symbol
  const formatted = new Intl.NumberFormat(locale, formatOptions).format(0);
  // Remove digits and spaces to get just the symbol
  return formatted.replace(/[0-9\s]/g, '');
}

export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(date)
}

export function addDays(date: Date, days: number): Date {
  const result = new Date(date)
  result.setDate(result.getDate() + days)
  return result
}

export function generateInvoiceNumber(invoiceDate?: string): string {
  // Get year from invoice date or current date
  const year = invoiceDate ? new Date(invoiceDate).getFullYear() : new Date().getFullYear()
  
  // Generate sequential number (you might want to store this in localStorage for persistence)
  const storedCounter = localStorage.getItem('invoiceCounter')
  let counter = storedCounter ? parseInt(storedCounter) + 1 : 1
  
  // Reset counter at the beginning of each year
  const storedYear = localStorage.getItem('invoiceYear')
  if (storedYear && parseInt(storedYear) !== year) {
    counter = 1
  }
  
  // Store updated counter and year
  localStorage.setItem('invoiceCounter', counter.toString())
  localStorage.setItem('invoiceYear', year.toString())
  
  // Format: 001/VI/AGS-I/2025
  const sequentialNumber = counter.toString().padStart(3, '0')
  return `${sequentialNumber}/VI/AGS-I/${year}`
}