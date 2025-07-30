# Design Document

## Overview

The matrix views feature adds two new screens to the property management application that display data in a 2-dimensional matrix format. The AMC Matrix View shows payment amounts organized by block (rows) and flat (columns) with year-based filtering, while the Car Sticker Matrix View shows sticker assignments in a similar layout. Both views integrate seamlessly with the existing Next.js application architecture and utilize the current Google Sheets data source.

## Architecture

### Component Structure
```
app/
├── matrix/
│   ├── amc/
│   │   └── page.tsx (AMC Matrix View)
│   └── stickers/
│       └── page.tsx (Car Sticker Matrix View)
components/
├── matrix/
│   ├── AmcMatrix.tsx (AMC matrix component)
│   ├── StickerMatrix.tsx (Car sticker matrix component)
│   ├── MatrixCell.tsx (Reusable cell component)
│   ├── MatrixNavigation.tsx (Navigation between views)
│   └── YearSelector.tsx (Year filtering component)
hooks/
└── useMatrixData.ts (Data processing hook)
```

### Data Flow
1. Existing `/api/sheets` endpoint provides raw owner and receipt data
2. New `useMatrixData` hook processes raw data into matrix format
3. Matrix components render the processed data in tabular format
4. Navigation component allows switching between matrix views

## Components and Interfaces

### Data Interfaces

```typescript
interface MatrixCell {
  blockNumber: string;
  flatNumber: string;
  value: string | number | null;
  metadata?: {
    paymentDate?: string;
    receiptNumber?: string;
    stickerCount?: number;
  };
}

interface MatrixData {
  blocks: string[];
  flats: string[];
  cells: MatrixCell[][];
  availableYears?: number[];
}

interface AmcMatrixData extends MatrixData {
  selectedYear: number;
  totalByBlock: Record<string, number>;
  totalByFlat: Record<string, number>;
}

interface StickerMatrixData extends MatrixData {
  unassignedFlats: string[];
  multipleStickers: string[];
}
```

### Core Components

#### AmcMatrix Component
- Displays payment amounts in matrix format
- Supports year-based filtering via dropdown
- Shows totals for blocks and flats
- Implements hover tooltips for payment details
- Provides export functionality

#### StickerMatrix Component  
- Displays car sticker assignments in matrix format
- Handles multiple stickers per flat
- Highlights unassigned flats
- Supports click-to-view details

#### MatrixCell Component
- Reusable cell component for both matrix types
- Handles different data types (currency, text, empty)
- Implements hover states and click handlers
- Responsive design for mobile devices

#### YearSelector Component
- Dropdown for selecting available years
- Automatically populates from receipt data
- Maintains selection state across navigation

### Navigation Integration

The matrix views integrate into the existing navigation structure by:
- Adding matrix navigation links to the main header
- Implementing breadcrumb navigation
- Maintaining consistent styling with existing components
- Using the same authentication wrapper (ProtectedRoute)

## Data Models

### Matrix Data Processing

The `useMatrixData` hook processes raw data as follows:

1. **Block and Flat Extraction**: Extract unique block and flat combinations from owner data
2. **Year Processing**: Extract available years from receipt dates for AMC matrix
3. **Cell Value Calculation**: 
   - AMC Matrix: Sum payment amounts by block/flat/year
   - Sticker Matrix: Concatenate sticker numbers by block/flat
4. **Metadata Enrichment**: Add payment dates, receipt numbers, and counts

### Data Transformation Logic

```typescript
// AMC Matrix Processing
const processAmcData = (owners: Owner[], receipts: Receipt[], year: number) => {
  // Group receipts by block/flat for selected year
  // Calculate totals and create matrix structure
  // Return AmcMatrixData
};

// Sticker Matrix Processing  
const processStickerData = (owners: Owner[]) => {
  // Group owners by block/flat
  // Extract and format sticker numbers
  // Identify unassigned and multiple assignments
  // Return StickerMatrixData
};
```

## Error Handling

### Data Loading Errors
- Display error messages when API calls fail
- Provide retry mechanisms for failed requests
- Show loading states during data processing
- Handle empty data scenarios gracefully

### Matrix Rendering Errors
- Validate data structure before rendering
- Handle missing block/flat combinations
- Provide fallback displays for malformed data
- Log errors for debugging purposes

### Export Errors
- Validate data before export operations
- Show user-friendly error messages for export failures
- Provide alternative export formats if primary fails

## Testing Strategy

### Unit Tests
- Test data processing functions in `useMatrixData` hook
- Test individual component rendering with mock data
- Test cell value calculations and formatting
- Test year filtering logic

### Integration Tests
- Test complete matrix rendering with real data structure
- Test navigation between matrix views
- Test export functionality end-to-end
- Test responsive behavior across screen sizes

### Component Tests
- Test MatrixCell component with different data types
- Test YearSelector component with various year ranges
- Test hover and click interactions
- Test loading and error states

### Accessibility Tests
- Verify keyboard navigation support
- Test screen reader compatibility
- Validate color contrast ratios
- Ensure proper ARIA labels and roles

## Performance Considerations

### Data Processing Optimization
- Implement memoization for expensive matrix calculations
- Use React.useMemo for derived data
- Optimize re-renders with React.memo for matrix cells
- Implement virtual scrolling for large matrices

### Rendering Optimization
- Lazy load matrix components
- Implement progressive rendering for large datasets
- Use CSS Grid for efficient matrix layout
- Minimize DOM updates during year changes

### Memory Management
- Clean up event listeners and subscriptions
- Implement proper dependency arrays in useEffect
- Avoid memory leaks in data processing functions

## Responsive Design

### Desktop Layout (≥1024px)
- Full matrix display with all blocks and flats visible
- Side-by-side totals display
- Hover tooltips for additional information
- Export controls in header area

### Tablet Layout (768px - 1023px)
- Horizontal scrolling for wide matrices
- Collapsible totals section
- Touch-friendly cell interactions
- Responsive navigation menu

### Mobile Layout (<768px)
- Vertical scrolling with fixed headers
- Simplified cell display
- Touch gestures for navigation
- Condensed export options

## Export Functionality

### CSV Export
- Generate CSV with proper headers
- Include metadata in separate columns
- Handle special characters and formatting
- Provide filename with timestamp

### Excel Export
- Create formatted Excel files with styling
- Include multiple sheets for different views
- Add charts and summaries where appropriate
- Maintain data types and formatting