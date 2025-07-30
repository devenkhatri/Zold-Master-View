'use client';

import { MatrixNavigation } from '@/components/matrix/MatrixNavigation';
import ProtectedRoute from '@/components/ProtectedRoute';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Building2, BarChart3, Car } from 'lucide-react';

function MatrixIndexPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-600 to-green-700 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-3">
            <Building2 className="h-8 w-8 text-white" />
            <div>
              <h1 className="text-2xl font-bold">Matrix Views</h1>
              <p className="text-blue-100 text-sm">Analyze property data in structured matrix format</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Navigation Component */}
        <MatrixNavigation className="mb-6" />

        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-blue-600" />
                AMC Payment Matrix
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                View AMC payments organized by block and flat for each year. Quickly identify payment patterns and gaps in collections.
              </p>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Year-based filtering</li>
                <li>• Payment amount visualization</li>
                <li>• Block and flat totals</li>
                <li>• Hover tooltips with payment details</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Car className="h-5 w-5 text-purple-600" />
                Car Sticker Matrix
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                View car sticker assignments organized by block and flat. Identify unassigned units and multiple sticker assignments.
              </p>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Sticker assignment visualization</li>
                <li>• Unassigned flat identification</li>
                <li>• Multiple sticker tracking</li>
                <li>• Assignment statistics</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default function MatrixPage() {
  return (
    <ProtectedRoute>
      <MatrixIndexPage />
    </ProtectedRoute>
  );
}