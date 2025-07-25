"use client";

import { Receipt } from '@/types/property';
import { Receipt as ReceiptIcon, Calendar, IndianRupee, FileText, ChevronRight } from 'lucide-react';

import { useState } from 'react';

interface ReceiptTableProps {
  receipts: Receipt[];
  isLoading: boolean;
}

export const ReceiptTable = ({ receipts, isLoading }: ReceiptTableProps) => {
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  const toggleRow = (id: string) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedRows(newExpanded);
  };

  const formatDate = (dateString: string) => {
    try {
      const d = new Date(dateString);
      if (isNaN(d.getTime())) return dateString;
      // Format as yyyy-MM-dd (ISO style)
      return d.toLocaleDateString('en-IN', { year: 'numeric', month: '2-digit', day: '2-digit' });
    } catch {
      return dateString;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        <div className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-6 bg-slate-200 rounded w-1/4"></div>
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="grid grid-cols-6 gap-4">
                  {[...Array(6)].map((_, j) => (
                    <div key={j} className="h-4 bg-slate-200 rounded"></div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (receipts.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="text-center py-8">
          <ReceiptIcon className="h-12 w-12 text-slate-400 mx-auto mb-4" />
          <p className="text-slate-500">No receipt data found for the selected filters.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
      <div className="px-6 py-4 bg-slate-50 border-b">
        <h3 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
          <ReceiptIcon className="h-5 w-5" />
          Payment History
        </h3>
      </div>
      
      {/* Desktop Table View */}
      <div className="hidden lg:block overflow-x-auto">
        <table className="w-full min-w-[900px]">
          <thead className="bg-blue-500 text-white">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-semibold">Receipt No</th>
              <th className="px-4 py-3 text-left text-sm font-semibold">Receipt Date</th>
              <th className="px-4 py-3 text-left text-sm font-semibold">Name</th>
              <th className="px-4 py-3 text-left text-sm font-semibold">Payment Amount</th>
              <th className="px-4 py-3 text-left text-sm font-semibold">Payment Date</th>
              <th className="px-4 py-3 text-left text-sm font-semibold">Remarks</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {receipts.map((receipt: Receipt, index: number) => (
              <tr 
                key={receipt.id} 
                className={`hover:bg-slate-50 transition-colors ${
                  index % 2 === 0 ? 'bg-white' : 'bg-slate-50/30'
                }`}
              >
                <td className="px-4 py-3">
                  <span className="text-sm font-mono text-slate-900">{receipt.receiptNo}</span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-slate-400" />
                    <span className="text-sm text-slate-900">{formatDate(receipt.receiptDate)}</span>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className="text-sm font-medium text-slate-900">{receipt.name}</span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <IndianRupee className="h-4 w-4 text-green-600" />
                    <span className="text-sm font-semibold text-green-700">
                      {formatCurrency(receipt.paymentAmount)}
                    </span>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-slate-400" />
                    <span className="text-sm text-slate-900">{formatDate(receipt.paymentDate)}</span>
                  </div>
                </td>
                <td className="px-4 py-3 max-w-xs">
                  <div className="flex items-start gap-2">
                    <FileText className="h-4 w-4 text-slate-400 mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-slate-700 line-clamp-2">{receipt.remarks}</span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Card View */}
      <div className="lg:hidden divide-y divide-gray-200">
        {receipts.map((receipt: Receipt, index: number) => (
          <div key={receipt.id} className="p-4">
            <div 
              className="flex items-center justify-between cursor-pointer"
              onClick={() => toggleRow(receipt.id)}
            >
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-green-100">
                  <IndianRupee className="h-4 w-4 text-green-600" />
                </div>
                <div>
                  <h4 className="font-semibold text-green-700">
                    {formatCurrency(receipt.paymentAmount)}
                  </h4>
                  <p className="text-sm text-slate-500">Receipt #{receipt.receiptNo}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium text-slate-900">{receipt.name}</p>
                <p className="text-xs text-slate-500">{formatDate(receipt.paymentDate)}</p>
                <ChevronRight 
                  className={`h-4 w-4 text-slate-400 transition-transform ml-auto mt-1 ${
                    expandedRows.has(receipt.id) ? 'rotate-90' : ''
                  }`}
                />
              </div>
            </div>
            
            {expandedRows.has(receipt.id) && (
              <div className="mt-4 space-y-3">
                <div className="bg-slate-50 rounded-lg p-3 space-y-2">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-slate-400" />
                    <span className="text-sm text-slate-600">Receipt Date:</span>
                    <span className="text-sm font-medium text-slate-900">{formatDate(receipt.receiptDate)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-slate-400" />
                    <span className="text-sm text-slate-600">Payment Date:</span>
                    <span className="text-sm font-medium text-slate-900">{formatDate(receipt.paymentDate)}</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <FileText className="h-4 w-4 text-slate-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <span className="text-sm text-slate-600">Remarks:</span>
                      <p className="text-sm text-slate-900 mt-1">{receipt.remarks}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};