"use client";

import React, { useState, useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { format } from 'date-fns';
import { Plus, Trash2, Download, Send, Sparkles, ArrowLeftRight, History } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { InvoiceData } from '@/types/invoice';
import { generateInvoiceNumber, formatCurrency, formatDate, addDays, getCurrencySymbol } from '@/lib/utils';
import { generatePDF } from '@/lib/pdf-generator';
import { saveInvoiceToHistory, updateInvoiceStatus } from '@/lib/invoice-history';
import { InvoiceHistory } from './invoice-history';

const invoiceSchema = z.object({
  invoiceNumber: z.string().min(1, 'Invoice number is required'),
  invoiceDate: z.string().min(1, 'Invoice date is required'),
  senderCompany: z.string().min(1, 'Sender company is required'),
  senderAddress: z.string().min(1, 'Sender address is required'),
  recipientCompany: z.string().min(1, 'Recipient company is required'),
  recipientAddress: z.string().min(1, 'Recipient address is required'),
  items: z.array(z.object({
    description: z.string().min(1, 'Description is required'),
    quantity: z.number().min(1, 'Quantity must be at least 1'),
    price: z.number().min(0, 'Price must be positive'),
  })).min(1, 'At least one item is required'),
  notes: z.string().optional(),
  accountName: z.string().min(1, 'Account name is required'),
  accountNumber: z.string().min(1, 'Account number is required'),
  bankName: z.string().min(1, 'Bank name is required'),
  currency: z.string().min(1, 'Currency is required'),
  taxType: z.enum(['percentage', 'fixed']),
  taxRate: z.number().min(0),
});

type InvoiceFormData = z.infer<typeof invoiceSchema>;

export function InvoiceForm() {
  const [isClient, setIsClient] = useState(false);
  const [currentView, setCurrentView] = useState<'form' | 'history'>('form');
  const [isLoadingInvoice, setIsLoadingInvoice] = useState(false);

  // Load saved data from localStorage
  const loadSavedData = () => {
    if (typeof window !== 'undefined') {
      const savedData = localStorage.getItem('invoiceFormData');
      if (savedData) {
        try {
          return JSON.parse(savedData);
        } catch (error) {
          console.error('Error parsing saved form data:', error);
        }
      }
    }
    return null;
  };

  const savedData = loadSavedData();

  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<InvoiceFormData>({
    resolver: zodResolver(invoiceSchema),
    defaultValues: savedData || {
      invoiceNumber: '',
      invoiceDate: '',
      items: [{ description: '', quantity: 1, price: 0 }],
      taxType: 'percentage' as const,
      taxRate: 0,
      notes: '',
      accountName: '',
      accountNumber: '',
      bankName: '',
      currency: 'IDR',
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'items',
  });

  const watchedItems = watch('items');
  const watchedTaxRate = watch('taxRate');
  const watchedTaxType = watch('taxType');

  const subtotal = watchedItems.reduce((sum, item) => {
    return sum + (item.quantity || 0) * (item.price || 0);
  }, 0);

  const taxAmount = watchedTaxType === 'percentage'
    ? subtotal * (watchedTaxRate || 0) / 100
    : (watchedTaxRate || 0);
  const grandTotal = subtotal + taxAmount;

  // Initialize client-side values
  useEffect(() => {
    setIsClient(true);
    const currentDate = new Date().toISOString().split('T')[0];
    // Only set default values if no saved data exists
    if (!savedData) {
      setValue('invoiceDate', currentDate);
      setValue('invoiceNumber', generateInvoiceNumber(currentDate));
    }
  }, [setValue, savedData]);

  // Save form data to localStorage whenever form values change
  const formValues = watch();
  useEffect(() => {
    if (isClient && formValues) {
      // Debounce the save operation to avoid excessive localStorage writes
      const timeoutId = setTimeout(() => {
        try {
          localStorage.setItem('invoiceFormData', JSON.stringify(formValues));
        } catch (error) {
          console.error('Error saving form data to localStorage:', error);
        }
      }, 500); // Save after 500ms of inactivity

      return () => clearTimeout(timeoutId);
    }
  }, [formValues, isClient]);

  // Auto-calculate due date and regenerate invoice number when date changes
  const invoiceDate = watch('invoiceDate');
  useEffect(() => {
    if (invoiceDate && isClient) {
      // Due date is calculated but not stored in form, used for display only
      addDays(new Date(invoiceDate), 3);
      // Regenerate invoice number with the new year
      setValue('invoiceNumber', generateInvoiceNumber(invoiceDate));
    }
  }, [invoiceDate, isClient]);

  const onSubmit = async (data: InvoiceFormData) => {
    const invoiceData: InvoiceData = {
      ...data,
      invoiceDate: new Date(data.invoiceDate),
      dueDate: addDays(new Date(data.invoiceDate), 3),
      items: data.items.map((item, index) => ({
        id: `item-${index}`,
        ...item,
        total: item.quantity * item.price,
      })),
      subtotal,
      taxAmount,
      grandTotal,
    };

    try {
      // Save to history first
      const historyId = saveInvoiceToHistory(invoiceData);
      
      // Generate PDF
      await generatePDF(invoiceData);
      
      // Update status to sent after successful PDF generation
      updateInvoiceStatus(historyId, 'sent');
      
      // Clear saved data after successful PDF generation
      localStorage.removeItem('invoiceFormData');
      
      // Show success message or redirect to history
      console.log('Invoice saved and PDF generated successfully');
    } catch (error) {
      console.error('Error processing invoice:', error);
    }
  };

  const clearForm = () => {
    // Clear localStorage
    try {
      localStorage.removeItem('invoiceFormData');
    } catch (error) {
      console.error('Error clearing saved form data:', error);
    }
    
    // Reset form to default values
    const currentDate = new Date().toISOString().split('T')[0];
    setValue('invoiceNumber', generateInvoiceNumber(currentDate));
    setValue('invoiceDate', currentDate);
    setValue('senderCompany', '');
    setValue('senderAddress', '');
    setValue('recipientCompany', '');
    setValue('recipientAddress', '');
    setValue('items', [{ description: '', quantity: 1, price: 0 }]);
    setValue('notes', '');
    setValue('accountName', '');
    setValue('accountNumber', '');
    setValue('bankName', '');
    setValue('currency', 'IDR');
    setValue('taxType', 'percentage');
    setValue('taxRate', 0);
  };

  const handleLoadInvoice = (invoiceData: InvoiceData) => {
    setIsLoadingInvoice(true);
    try {
      // Convert the invoice data to form format
      const formData = {
         ...invoiceData,
         invoiceDate: format(invoiceData.invoiceDate, 'yyyy-MM-dd'),
         items: invoiceData.items.map(item => ({
           description: item.description,
           quantity: item.quantity,
           price: item.price
         }))
       };
       
       // Reset form with the loaded data
       Object.keys(formData).forEach(key => {
         setValue(key as keyof InvoiceFormData, formData[key as keyof InvoiceFormData] as any);
       });
      
      // Switch to form view
      setCurrentView('form');
    } catch (error) {
      console.error('Error loading invoice:', error);
    } finally {
      setIsLoadingInvoice(false);
    }
  };

  const handleCreateNew = () => {
    clearForm();
    setCurrentView('form');
  };

  const handleViewHistory = () => {
    setCurrentView('history');
  };



  const sendInvoice = () => {
    const formData = watch();
    const subject = `Invoice ${formData.invoiceNumber} from ${formData.senderCompany}`;
    const body = `Please find attached invoice ${formData.invoiceNumber}.\n\nDue Date: ${formatDate(addDays(new Date(formData.invoiceDate), 3))}\nTotal Amount: ${formatCurrency(grandTotal, formData.currency)}`;

    window.open(`mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`);
  };

  // Conditional rendering based on current view
  if (currentView === 'history') {
    return (
      <InvoiceHistory 
        onCreateNew={handleCreateNew}
        onLoadInvoice={handleLoadInvoice}
      />
    );
  }

  // Prevent hydration mismatch by not rendering until client-side
  if (!isClient) {
    return (
      <div className="max-w-7xl mx-auto p-6 flex gap-6">
        {/* Main Form Content */}
        <div className="flex-1 space-y-2">
          <div className="flex items-center justify-center h-64">
            <div className="text-lg">SABAR YA NGENTOT...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6 flex flex-col lg:flex-row gap-2">
      {/* Main Form Content */}
      <div className="flex-1 space-y-2">

      <form id="invoice-form" onSubmit={handleSubmit(onSubmit)} className="space-y-2">


        {/* 1. Invoice Information (Full Width) */}
        <Card>
          <CardHeader>
            <CardTitle>Invoice Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 p-4 lg:p-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="invoiceNumber">Invoice Number</Label>
                <Input
                  id="invoiceNumber"
                  {...register('invoiceNumber')}
                  className="font-mono"
                />
                {errors.invoiceNumber && (
                  <p className="text-sm text-red-500 mt-1">{errors.invoiceNumber.message}</p>
                )}
              </div>
              <div>
                <Label htmlFor="invoiceDate">Invoice Date</Label>
                <Input
                  id="invoiceDate"
                  type="date"
                  {...register('invoiceDate')}
                />
                {errors.invoiceDate && (
                  <p className="text-sm text-red-500 mt-1">{errors.invoiceDate.message}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 2. From (Sender - Width 1/2) To (Receipt - Width 1/2) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-2">
          {/* Sender Info */}
          <Card>
            <CardHeader>
              <CardTitle>From (Sender)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 p-4 lg:p-6">
              <div>
                <Label htmlFor="senderCompany">Company Name</Label>
                <Input
                  id="senderCompany"
                  {...register('senderCompany')}
                  placeholder="Your Company Name"
                />
                {errors.senderCompany && (
                  <p className="text-sm text-red-500 mt-1">{errors.senderCompany.message}</p>
                )}
              </div>
              <div>
                <Label htmlFor="senderAddress">Address</Label>
                <Textarea
                  id="senderAddress"
                  {...register('senderAddress')}
                  placeholder="Your company address"
                  rows={3}
                />
                {errors.senderAddress && (
                  <p className="text-sm text-red-500 mt-1">{errors.senderAddress.message}</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Recipient Info */}
          <Card>
            <CardHeader>
              <CardTitle>To (Recipient)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 p-4 lg:p-6">
              <div>
                <Label htmlFor="recipientCompany">Company Name</Label>
                <Input
                  id="recipientCompany"
                  {...register('recipientCompany')}
                  placeholder="Client Company Name"
                />
                {errors.recipientCompany && (
                  <p className="text-sm text-red-500 mt-1">{errors.recipientCompany.message}</p>
                )}
              </div>
              <div>
                <Label htmlFor="recipientAddress">Address</Label>
                <Textarea
                  id="recipientAddress"
                  {...register('recipientAddress')}
                  placeholder="Client company address"
                  rows={3}
                />
                {errors.recipientAddress && (
                  <p className="text-sm text-red-500 mt-1">{errors.recipientAddress.message}</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 3. Items & Service (Full Width) */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Items & Services
              <Button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  const currentItems = watch('items');
                  const hasEmptyDescription = currentItems.some(item => !item.description || item.description.trim() === '');
                  
                  if (!hasEmptyDescription) {
                    append({ description: '', quantity: 1, price: 0 });
                  }
                }}
                size="sm"
                disabled={watchedItems.some(item => !item.description || item.description.trim() === '')}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Item
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 lg:p-6">
            <div className="space-y-[-15px]">
              {fields.map((field, index) => (
                <div key={field.id} className="grid grid-cols-12 gap-2 items-end">
                  <div className={fields.length > 1 ? "col-span-7" : "col-span-8"}>
                    {index === 0 && <Label htmlFor={`items.${index}.description`}>Description</Label>}
                    <Input
                      {...register(`items.${index}.description`)}
                      placeholder="Task description"
                    />
                  </div>
                  <div className="col-span-2">
                    {index === 0 && <Label htmlFor={`items.${index}.quantity`}>Qty</Label>}
                    <Input
                      type="number"
                      {...register(`items.${index}.quantity`, { valueAsNumber: true })}
                      min="1"
                      className="[&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none [-moz-appearance:textfield]"
                      onKeyDown={(e) => {
                        // Allow: backspace, delete, tab, escape, enter, home, end, left, right, up, down
                        if ([8, 9, 27, 13, 46, 35, 36, 37, 39, 38, 40].indexOf(e.keyCode) !== -1 ||
                            // Allow Ctrl+A, Ctrl+C, Ctrl+V, Ctrl+X, Ctrl+Z
                            (e.keyCode === 65 && e.ctrlKey === true) ||
                            (e.keyCode === 67 && e.ctrlKey === true) ||
                            (e.keyCode === 86 && e.ctrlKey === true) ||
                            (e.keyCode === 88 && e.ctrlKey === true) ||
                            (e.keyCode === 90 && e.ctrlKey === true)) {
                          return;
                        }
                        // Ensure that it is a number and stop the keypress
                        if ((e.shiftKey || (e.keyCode < 48 || e.keyCode > 57)) && (e.keyCode < 96 || e.keyCode > 105)) {
                          e.preventDefault();
                        }
                      }}
                    />
                  </div>
                  <div className="col-span-2">
                    {index === 0 && <Label htmlFor={`items.${index}.price`}>Price</Label>}
                    <Input
                      type="number"
                      step={watch('currency') === 'IDR' ? "1000" : "0.01"}
                      {...register(`items.${index}.price`, { valueAsNumber: true })}
                      min="0"
                      placeholder="0"
                      className="[&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none [-moz-appearance:textfield]"
                      onKeyDown={(e) => {
                        // Handle Shift+Arrow shortcuts first
                        if (e.shiftKey && (e.key === 'ArrowUp' || e.key === 'ArrowDown')) {
                          e.preventDefault();
                          const currentValue = watch(`items.${index}.price`) || 0;
                          const increment = watch('currency') === 'IDR' ? 10000 : 0.1;
                          const newValue = e.key === 'ArrowUp' 
                            ? currentValue + increment 
                            : Math.max(0, currentValue - increment);
                          setValue(`items.${index}.price`, newValue);
                          return;
                        }
                        // Allow: backspace, delete, tab, escape, enter, home, end, left, right, up, down
                        if ([8, 9, 27, 13, 46, 35, 36, 37, 39, 38, 40].indexOf(e.keyCode) !== -1 ||
                            // Allow Ctrl+A, Ctrl+C, Ctrl+V, Ctrl+X, Ctrl+Z
                            (e.keyCode === 65 && e.ctrlKey === true) ||
                            (e.keyCode === 67 && e.ctrlKey === true) ||
                            (e.keyCode === 86 && e.ctrlKey === true) ||
                            (e.keyCode === 88 && e.ctrlKey === true) ||
                            (e.keyCode === 90 && e.ctrlKey === true) ||
                            // Allow decimal point for non-IDR currencies
                            (e.keyCode === 190 && watch('currency') !== 'IDR')) {
                          return;
                        }
                        // Ensure that it is a number and stop the keypress
                        if ((e.shiftKey || (e.keyCode < 48 || e.keyCode > 57)) && (e.keyCode < 96 || e.keyCode > 105)) {
                          e.preventDefault();
                        }
                      }}
                    />
                  </div>
                  {fields.length > 1 && (
                    <div className="col-span-1 flex justify-center">
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        onClick={() => remove(index)}
                        className="mt-6 w-full"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* 4. Summary (Full Width) */}
        <Card>
          <CardHeader>
            <CardTitle>Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 p-4 lg:p-6">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span className="font-mono">{formatCurrency(subtotal, watch('currency'))}</span>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Label htmlFor="taxRate" className="flex-1">
                    {watchedTaxType === 'percentage' ? 'Tax Rate (%)' : 'Tax Amount'}:
                  </Label>
                  <div className="flex items-center gap-2">
                    <div className="relative">
                      {watchedTaxType === 'fixed' && (
                        <span className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm pointer-events-none">
                          {getCurrencySymbol(watch('currency'))}
                        </span>
                      )}
                      <Input
                        id="taxRate"
                        type="number"
                        step={watchedTaxType === 'percentage' ? "1" : "1000"}
                        {...register('taxRate', { valueAsNumber: true })}
                        className={`w-24 text-right [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none [-moz-appearance:textfield] ${
                          watchedTaxType === 'percentage' ? 'pr-6' : 'pl-6 pr-2'
                        }`}
                        min="0"
                        max={watchedTaxType === 'percentage' ? "100" : undefined}
                        placeholder={watchedTaxType === 'percentage' ? '0.00' : '0'}
                        onKeyDown={(e) => {
                          // Handle Shift+Arrow shortcuts first
                          if (e.shiftKey && (e.key === 'ArrowUp' || e.key === 'ArrowDown')) {
                            e.preventDefault();
                            const currentValue = watch('taxRate') || 0;
                            const increment = watchedTaxType === 'percentage' ? 10 : 10000;
                            const newValue = e.key === 'ArrowUp' 
                              ? currentValue + increment 
                              : Math.max(0, currentValue - increment);
                            const maxValue = watchedTaxType === 'percentage' ? 100 : undefined;
                            const finalValue = maxValue !== undefined ? Math.min(newValue, maxValue) : newValue;
                            setValue('taxRate', finalValue);
                            return;
                          }
                          // Allow: backspace, delete, tab, escape, enter, home, end, left, right, up, down
                          if ([8, 9, 27, 13, 46, 35, 36, 37, 39, 38, 40].indexOf(e.keyCode) !== -1 ||
                              // Allow Ctrl+A, Ctrl+C, Ctrl+V, Ctrl+X, Ctrl+Z
                              (e.keyCode === 65 && e.ctrlKey === true) ||
                              (e.keyCode === 67 && e.ctrlKey === true) ||
                              (e.keyCode === 86 && e.ctrlKey === true) ||
                              (e.keyCode === 88 && e.ctrlKey === true) ||
                              (e.keyCode === 90 && e.ctrlKey === true) ||
                              // Allow decimal point for percentage mode
                              (e.keyCode === 190 && watchedTaxType === 'percentage')) {
                            return;
                          }
                          // Ensure that it is a number and stop the keypress
                          if ((e.shiftKey || (e.keyCode < 48 || e.keyCode > 57)) && (e.keyCode < 96 || e.keyCode > 105)) {
                            e.preventDefault();
                          }
                        }}
                      />
                      {watchedTaxType === 'percentage' && (
                        <span className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm pointer-events-none">
                          %
                        </span>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => setValue('taxType', watchedTaxType === 'percentage' ? 'fixed' : 'percentage')}
                      className="p-3 rounded-md border border-gray-300 hover:bg-gray-50 transition-colors"
                      title={`Switch to ${watchedTaxType === 'percentage' ? 'Fixed Amount' : 'Percentage'}`}
                    >
                      <ArrowLeftRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
              <div className="flex justify-between">
                <span>Tax Amount:</span>
                <span className="font-mono">{formatCurrency(taxAmount, watch('currency'))}</span>
              </div>
              <div className="flex justify-between text-lg font-bold border-t pt-2">
                <span>Total:</span>
                <span className="font-mono">{formatCurrency(grandTotal, watch('currency'))}</span>
              </div>
            </div>
          </CardContent>
        </Card>


      </form>
      </div>

      {/* Right Sidebar - Responsive: side on desktop, bottom on mobile */}
      <div className="w-full lg:w-80 space-y-2 order-last lg:order-none">
        {/* Additional Information */}
        <Card>
          <CardHeader>
            <CardTitle>Additional Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 p-4 lg:p-6">
            <div>
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                {...register('notes')}
                placeholder="Additional notes or terms"
                rows={3}
              />
            </div>
            <div className="space-y-3">
              <div>
                <Label htmlFor="accountName">Account Name</Label>
                <Input
                  id="accountName"
                  {...register('accountName')}
                  placeholder="Account holder name"
                />
                {errors.accountName && (
                  <p className="text-sm text-red-500 mt-1">{errors.accountName.message}</p>
                )}
              </div>
              <div>
                <Label htmlFor="accountNumber">Account Number</Label>
                <Input
                  id="accountNumber"
                  type="number"
                  {...register('accountNumber')}
                  placeholder="Account number"
                  onKeyDown={(e) => {
                    // Allow: backspace, delete, tab, escape, enter, home, end, left, right, up, down
                    if ([8, 9, 27, 13, 46, 35, 36, 37, 39, 38, 40].indexOf(e.keyCode) !== -1 ||
                        // Allow Ctrl+A, Ctrl+C, Ctrl+V, Ctrl+X, Ctrl+Z
                        (e.keyCode === 65 && e.ctrlKey === true) ||
                        (e.keyCode === 67 && e.ctrlKey === true) ||
                        (e.keyCode === 86 && e.ctrlKey === true) ||
                        (e.keyCode === 88 && e.ctrlKey === true) ||
                        (e.keyCode === 90 && e.ctrlKey === true)) {
                      return;
                    }
                    // Ensure that it is a number and stop the keypress
                    if ((e.shiftKey || (e.keyCode < 48 || e.keyCode > 57)) && (e.keyCode < 96 || e.keyCode > 105)) {
                      e.preventDefault();
                    }
                  }}
                />
                {errors.accountNumber && (
                  <p className="text-sm text-red-500 mt-1">{errors.accountNumber.message}</p>
                )}
              </div>
              <div>
                <Label htmlFor="bankName">Bank Name</Label>
                <Input
                  id="bankName"
                  {...register('bankName')}
                  placeholder="Bank name"
                />
                {errors.bankName && (
                  <p className="text-sm text-red-500 mt-1">{errors.bankName.message}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Currency Selection */}
        <Card>
          <CardHeader>
            <CardTitle>Settings</CardTitle>
          </CardHeader>
          <CardContent className="p-4 lg:p-6">
            <div>
              <Label htmlFor="currency">Currency</Label>
              <select
                id="currency"
                {...register('currency')}
                className="w-full p-2 border border-input rounded-md bg-background mt-1"
              >
                <option value="USD">USD - US Dollar</option>
                <option value="EUR">EUR - Euro</option>
                <option value="GBP">GBP - British Pound</option>
                <option value="JPY">JPY - Japanese Yen</option>
                <option value="IDR">IDR - Indonesian Rupiah</option>
                <option value="SGD">SGD - Singapore Dollar</option>
                <option value="MYR">MYR - Malaysian Ringgit</option>
              </select>
              {errors.currency && (
                <p className="text-sm text-red-500 mt-1">{errors.currency.message}</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <Card>
          <CardContent className="pt-6 p-4 lg:p-6">
            <div className="flex gap-2">
              <Button type="submit" size="lg" className="flex-1 sparkle" form="invoice-form">
                 <Download className="h-5 w-3 mr-2" />
                 Generate PDF
               </Button>
              <Button 
                type="button" 
                variant="outline" 
                size="icon" 
                className="flex-1 aspect-square h-[44px] w-[44px]" 
                onClick={handleViewHistory}
              >
                <History className="h-5 w-5" />
              </Button>
              <Button 
                type="button" 
                variant="outline" 
                size="icon" 
                className="flex-1 aspect-square h-[44px] w-[44px]" 
                onClick={clearForm}
              >
                <Trash2 className="h-5 w-5" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}