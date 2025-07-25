"use client";

import { Owner } from '@/types/property';
import { Check, X, User, Phone, Car, Bike, Hash, ChevronRight } from 'lucide-react';
import { useState } from 'react';

interface OwnerTableProps {
  owners: Owner[];
  isLoading: boolean;
}

export const OwnerTable = ({ owners, isLoading }: OwnerTableProps) => {
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

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        <div className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-6 bg-slate-200 rounded w-1/4"></div>
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="grid grid-cols-7 gap-4">
                  {[...Array(7)].map((_, j) => (
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

  if (owners.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="text-center py-8">
          <User className="h-12 w-12 text-slate-400 mx-auto mb-4" />
          <p className="text-slate-500">No owner data found for the selected filters.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
      <div className="px-6 py-4 bg-slate-50 border-b">
        <h3 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
          <User className="h-5 w-5" />
          Owner Details
        </h3>
      </div>
      
      {/* Desktop Table View */}
      <div className="hidden lg:block overflow-x-auto">
        <table className="w-full min-w-[800px]">
          <thead className="bg-blue-500 text-white">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-semibold">Owner?</th>
              <th className="px-4 py-3 text-left text-sm font-semibold">Mobile1</th>
              <th className="px-4 py-3 text-left text-sm font-semibold">Member Name</th>
              <th className="px-4 py-3 text-left text-sm font-semibold">Mobile2</th>
              <th className="px-4 py-3 text-left text-sm font-semibold">Cars</th>
              <th className="px-4 py-3 text-left text-sm font-semibold">Bikes</th>
              <th className="px-4 py-3 text-left text-sm font-semibold">Sticker Nos</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {owners.map((owner, index) => (
              <tr 
                key={owner.id} 
                className={`hover:bg-slate-50 transition-colors ${
                  index % 2 === 0 ? 'bg-white' : 'bg-slate-50/30'
                }`}
              >
                <td className="px-4 py-3">
                  <div className="flex items-center justify-center">
                    {owner.isOwner ? (
                      <Check className="h-4 w-4 text-green-600" />
                    ) : (
                      <X className="h-4 w-4 text-red-600" />
                    )}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-slate-400" />
                    <span className="text-sm text-slate-900">{owner.mobile1}</span>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className="text-sm font-medium text-slate-900">{owner.memberName}</span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-slate-400" />
                    <span className="text-sm text-slate-900">{owner.mobile2}</span>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <Car className="h-4 w-4 text-slate-400" />
                    <span className="text-sm text-slate-900">{owner.cars}</span>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <Bike className="h-4 w-4 text-slate-400" />
                    <span className="text-sm text-slate-900">{owner.bikes}</span>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <Hash className="h-4 w-4 text-slate-400" />
                    <span className="text-sm font-mono text-slate-900">{owner.stickerNos}</span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Card View */}
      <div className="lg:hidden divide-y divide-gray-200">
        {owners.map((owner, index) => (
          <div key={owner.id} className="p-4">
            <div 
              className="flex items-center justify-between cursor-pointer"
              onClick={() => toggleRow(owner.id)}
            >
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100">
                  {owner.isOwner ? (
                    <Check className="h-4 w-4 text-green-600" />
                  ) : (
                    <X className="h-4 w-4 text-red-600" />
                  )}
                </div>
                <div>
                  <h4 className="font-medium text-slate-900">{owner.memberName}</h4>
                  <p className="text-sm text-slate-500">Block {owner.blockNumber}, Flat {owner.flatNumber}</p>
                </div>
              </div>
              <ChevronRight 
                className={`h-5 w-5 text-slate-400 transition-transform ${
                  expandedRows.has(owner.id) ? 'rotate-90' : ''
                }`}
              />
            </div>
            
            {expandedRows.has(owner.id) && (
              <div className="mt-4 space-y-3 pl-11">
                <div className="grid grid-cols-1 gap-3">
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-slate-400" />
                    <span className="text-sm text-slate-600">Mobile 1:</span>
                    <span className="text-sm font-medium text-slate-900">{owner.mobile1}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-slate-400" />
                    <span className="text-sm text-slate-600">Mobile 2:</span>
                    <span className="text-sm font-medium text-slate-900">{owner.mobile2}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Car className="h-4 w-4 text-slate-400" />
                    <span className="text-sm text-slate-600">Cars:</span>
                    <span className="text-sm font-medium text-slate-900">{owner.cars}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Bike className="h-4 w-4 text-slate-400" />
                    <span className="text-sm text-slate-600">Bikes:</span>
                    <span className="text-sm font-medium text-slate-900">{owner.bikes}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Hash className="h-4 w-4 text-slate-400" />
                    <span className="text-sm text-slate-600">Sticker:</span>
                    <span className="text-sm font-mono font-medium text-slate-900">{owner.stickerNos}</span>
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