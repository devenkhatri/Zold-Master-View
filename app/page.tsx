"use client";

import { FilterControls } from '@/components/FilterControls';
import { OwnerTable } from '@/components/OwnerTable';
import { ReceiptTable } from '@/components/ReceiptTable';
import { usePropertyData } from '@/hooks/usePropertyData';
import { MatrixNavigation } from '@/components/matrix/MatrixNavigation';
import { Building2, Database, Search, XCircle, User, CreditCard, Car, Check, LogOut, Home } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import ProtectedRoute from '@/components/ProtectedRoute';

function Dashboard() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const {
    filters,
    filteredData,
    isLoading,
    error,
    updateFilters,
    resetFilters
  } = usePropertyData();

  // Handle 'q' query parameter for auto-searching
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const searchParams = new URLSearchParams(window.location.search);
      const searchQuery = searchParams.get('q');

      if (searchQuery && searchQuery !== filters.searchTerm) {
        updateFilters({ searchTerm: searchQuery });
      }
    }
  }, [filters.searchTerm, updateFilters]);

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-600 to-green-700 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Building2 className="h-8 w-8 text-white" />
              <div>
                <h1 className="text-2xl font-bold">Zold Master View</h1>
                <p className="text-blue-100 text-sm">Property & Payment Management System</p>
              </div>
            </div>
            <div className="flex items-center space-x-2 sm:space-x-4">
              {user && (
                <>
                  <button
                    onClick={() => router.push('/matrix')}
                    className="inline-flex items-center p-2 sm:px-4 sm:py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    aria-label="Matrix Views"
                  >
                    <Building2 className="h-4 w-4 sm:mr-1" />
                    <span className="sr-only sm:not-sr-only sm:inline">Matrix Views</span>
                  </button>
                  <button
                    onClick={logout}
                    className="inline-flex items-center p-2 sm:px-4 sm:py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                    aria-label="Logout"
                  >
                    <LogOut className="h-4 w-4 sm:mr-1" />
                    <span className="sr-only sm:not-sr-only sm:inline">Logout</span>
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-3 py-4 sm:px-4">
          <div className="text-center">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900">
              <span className="text-blue-600">Zold Members & Payment Data Visualization</span>
            </h2>
            <p className="mt-2 sm:mt-3 text-base sm:text-lg text-gray-600 mx-auto max-w-2xl">
              Quickly find property owners, payment records, and more with our powerful search system
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-3 py-4 sm:px-4 sm:py-6">
        {/* Matrix Navigation */}
        <MatrixNavigation className="mb-6" />

        {/* Search Section */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100">
          <FilterControls
            filters={filters}
            onFiltersChange={updateFilters}
            onReset={resetFilters}
            isLoading={isLoading}
          />
        </div>

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6 rounded">
            <div className="flex">
              <div className="flex-shrink-0">
                <XCircle className="h-5 w-5 text-red-400" />
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Results Summary */}
        {filters.searchTerm && (
          <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-6 rounded">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Database className="h-5 w-5 text-blue-400" />
              </div>
              <div className="ml-3">
                <p className="text-sm text-blue-700">
                  Found {filteredData.owners.length} owner record(s) and {filteredData.receipts.length} payment record(s)
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Data Tables or Empty State */}
        <div className="space-y-8">
          {!filters.searchTerm ? (
            <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-200">
              <div className="p-8 text-center">
                <div className="mx-auto flex items-center justify-center h-24 w-24 rounded-full bg-blue-100 mb-4">
                  <Search className="h-12 w-12 text-blue-600" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Search for property records</h3>
                <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
                  Enter a search term to find property owners, payment records, vehicle information, and more.
                </p>

                <div className="mt-10 mb-6">
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center" aria-hidden="true">
                      <div className="w-full border-t border-gray-200" />
                    </div>
                    <div className="relative flex justify-center">
                      <span className="px-4 bg-white text-sm font-medium text-gray-500">Try searching for</span>
                    </div>
                  </div>
                  <div className="mt-6 flex flex-wrap justify-center gap-3">
                    {[
                      { text: "A-101", type: "Flat Number" },
                      { text: "John Doe", type: "Name" },
                      { text: "MH 01 AB 1234", type: "Vehicle" },
                      { text: "9876543210", type: "Phone" },
                      { text: "B-01", type: "Car Sticker" },
                      { text: "REC-2023-001", type: "Receipt" }
                    ].map(({ text, type }) => (
                      <div key={text} className="group relative">
                        <button
                          type="button"
                          onClick={() => {
                            updateFilters({ searchTerm: text });
                            const searchInput = document.querySelector('input[type="text"]') as HTMLInputElement;
                            if (searchInput) searchInput.value = text;
                          }}
                          className="relative z-10 inline-flex items-center px-4 py-2 border border-gray-200 shadow-sm text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-blue-50 hover:border-blue-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-150"
                        >
                          {text}
                        </button>
                        <span className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 text-xs text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                          {type}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Use Cases Section */}
              <div className="bg-gray-50 p-8 border-t border-gray-200">
                <h3 className="text-lg font-medium text-center text-gray-900 mb-6">How can I use this system?</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {[
                    {
                      title: "Find Property Owners",
                      description: "Quickly locate contact information for property owners and residents.",
                      icon: <User className="h-6 w-6 text-blue-600" />,
                      examples: ["Search by name", "Search by flat number"]
                    },
                    {
                      title: "Track Payments",
                      description: "View payment history and receipts for maintenance and other charges.",
                      icon: <CreditCard className="h-6 w-6 text-green-600" />,
                      examples: ["Search by receipt number", "Find payments by date"]
                    },
                    {
                      title: "Vehicle Management",
                      description: "Access vehicle information and sticker details for security purposes.",
                      icon: <Car className="h-6 w-6 text-purple-600" />,
                      examples: ["Search by vehicle number", "Find sticker numbers"]
                    }
                  ].map((useCase, index) => (
                    <div key={index} className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
                      <div className="h-10 w-10 rounded-full bg-blue-50 flex items-center justify-center mb-4">
                        {useCase.icon}
                      </div>
                      <h4 className="text-base font-medium text-gray-900 mb-2">{useCase.title}</h4>
                      <p className="text-sm text-gray-600 mb-3">{useCase.description}</p>
                      <ul className="space-y-1.5">
                        {useCase.examples.map((example, i) => (
                          <li key={i} className="text-xs text-gray-500 flex items-start">
                            <Check className="h-3.5 w-3.5 text-green-500 mr-1.5 mt-0.5 flex-shrink-0" />
                            <span>{example}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <>
              <OwnerTable owners={filteredData.owners} isLoading={isLoading} />
              <ReceiptTable receipts={filteredData.receipts} isLoading={isLoading} />
            </>
          )}
        </div>

        {/* Footer */}
        <div className="mt-12 pt-8 border-t border-gray-200">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="text-center md:text-left">
              <p className="text-sm text-gray-500">
                &copy; {new Date().getFullYear()} Zold Master View. All rights reserved.
              </p>
              {filteredData.lastUpdated && (
                <p className="text-xs text-gray-400 mt-1">
                  Last updated: {filteredData.lastUpdated}
                </p>
              )}
            </div>
            <div className="mt-4 md:mt-0">
              <a
                href="https://www.devengoratela.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-gray-500 hover:text-gray-700"
              >
                Made with ❤️ by Zold IT Team
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function HomePage() {
  return (
    <ProtectedRoute>
      <Dashboard />
    </ProtectedRoute>
  );
}