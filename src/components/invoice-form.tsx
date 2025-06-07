"use client";

import React, { useState, useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Plus, Trash2, Download, Send, Sparkles, ArrowLeftRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { InvoiceData } from '@/types/invoice';
import { generateInvoiceNumber, formatCurrency, formatDate, addDays, getCurrencySymbol } from '@/lib/utils';
import { generatePDF } from '@/lib/pdf-generator';

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

  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<InvoiceFormData>({
    resolver: zodResolver(invoiceSchema),
    defaultValues: {
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
    setValue('invoiceDate', currentDate);
    setValue('invoiceNumber', generateInvoiceNumber(currentDate));
  }, [setValue]);

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

  const onSubmit = (data: InvoiceFormData) => {
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

    generatePDF(invoiceData);
  };



  const sendInvoice = () => {
    const formData = watch();
    const subject = `Invoice ${formData.invoiceNumber} from ${formData.senderCompany}`;
    const body = `Please find attached invoice ${formData.invoiceNumber}.\n\nDue Date: ${formatDate(addDays(new Date(formData.invoiceDate), 3))}\nTotal Amount: ${formatCurrency(grandTotal, formData.currency)}`;

    window.open(`mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`);
  };

  // Prevent hydration mismatch by not rendering until client-side
  if (!isClient) {
    return (
      <div className="max-w-7xl mx-auto p-6 flex gap-6">
        {/* Main Form Content */}
        <div className="flex-1 space-y-2">
          <div className="flex items-center justify-center h-64">
            <div className="text-lg">Loading...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6 flex gap-6">
      {/* Main Form Content */}
      <div className="flex-1 space-y-2">
      {/* Header */}
      <div className="invoice-header text-white p-8 rounded-lg">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Sparkles className="h-8 w-8" />
              PT Aghatis Karya Indonesia
            </h1>
            <p className="text-green-100 mt-2">Professional Invoice Generator</p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold">INVOICE</div>
            <div className="text-green-100">{watch('invoiceNumber')}</div>
          </div>
        </div>
      </div>

      <form id="invoice-form" onSubmit={handleSubmit(onSubmit)} className="space-y-2">


        {/* 1. Invoice Information (Full Width) */}
        <Card>
          <CardHeader>
            <CardTitle>Invoice Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
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
              <div>
                <Label>Due Date</Label>
                <div className="p-2 bg-muted rounded-md text-sm">
                  {watch('invoiceDate') ? formatDate(addDays(new Date(watch('invoiceDate')), 3)) : 'Select invoice date'}
                </div>
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
            <CardContent className="space-y-4">
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
            <CardContent className="space-y-4">
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
          <CardContent>
            <div className="space-y-4">
              {fields.map((field, index) => (
                <div key={field.id} className="grid grid-cols-12 gap-2 items-end">
                  <div className={fields.length > 1 ? "col-span-7" : "col-span-8"}>
                    <Label htmlFor={`items.${index}.description`}>Description</Label>
                    <Input
                      {...register(`items.${index}.description`)}
                      placeholder="Task description"
                    />
                  </div>
                  <div className="col-span-2">
                    <Label htmlFor={`items.${index}.quantity`}>Qty</Label>
                    <Input
                      type="number"
                      {...register(`items.${index}.quantity`, { valueAsNumber: true })}
                      min="1"
                      className="[&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none [-moz-appearance:textfield]"
                    />
                  </div>
                  <div className="col-span-2">
                    <Label htmlFor={`items.${index}.price`}>Price</Label>
                    <Input
                      type="number"
                      step={watch('currency') === 'IDR' ? "1000" : "0.01"}
                      {...register(`items.${index}.price`, { valueAsNumber: true })}
                      min="0"
                      className="[&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none [-moz-appearance:textfield]"
                      onKeyDown={(e) => {
                        if (e.shiftKey && (e.key === 'ArrowUp' || e.key === 'ArrowDown')) {
                          e.preventDefault();
                          const currentValue = watch(`items.${index}.price`) || 0;
                          const increment = watch('currency') === 'IDR' ? 10000 : 0.1;
                          const newValue = e.key === 'ArrowUp' 
                            ? currentValue + increment 
                            : Math.max(0, currentValue - increment);
                          setValue(`items.${index}.price`, newValue);
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
          <CardContent className="space-y-4">
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
                <span>Grand Total:</span>
                <span className="font-mono">{formatCurrency(grandTotal, watch('currency'))}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 5. Additional Information (Full Width) */}
        <Card>
          <CardHeader>
            <CardTitle>Additional Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                {...register('notes')}
                placeholder="Additional notes or terms"
                rows={3}
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                  {...register('accountNumber')}
                  placeholder="Account number"
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
      </form>
      </div>

      {/* Right Sidebar */}
      <div className="w-80 space-y-2">
        {/* Currency Selection */}
        <Card>
          <CardHeader>
            <CardTitle>Settings</CardTitle>
          </CardHeader>
          <CardContent>
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

        {/* Generate PDF Button */}
        <Card>
          <CardContent className="pt-6">
            <Button type="submit" size="lg" className="w-full sparkle" form="invoice-form">
              <Download className="h-5 w-5 mr-2" />
              Generate PDF
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}