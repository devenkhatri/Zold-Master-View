# Requirements Document

## Introduction

This feature adds two new matrix-based screens to the property management application to provide summarized views of AMC payments and car sticker usage. The first screen displays a 2-dimensional matrix showing AMC amounts paid by each flat organized by block and year. The second screen shows car sticker assignments in a similar matrix format organized by block and flat.

## Requirements

### Requirement 1

**User Story:** As a property manager, I want to view AMC payments in a matrix format organized by block and flat for each year, so that I can quickly assess payment patterns and identify any gaps in collections.

#### Acceptance Criteria

1. WHEN the user navigates to the AMC matrix screen THEN the system SHALL display a 2-dimensional matrix with blocks as rows and flats as columns
2. WHEN the matrix is displayed THEN the system SHALL show the AMC amount paid by each flat in the corresponding cell
3. WHEN multiple years of data are available THEN the system SHALL provide separate matrix views for each available year
4. WHEN a year is selected THEN the system SHALL update the matrix to show only data for that specific year
5. WHEN a flat has not paid AMC for a given year THEN the system SHALL display an empty cell or zero amount indicator
6. WHEN the user hovers over a cell THEN the system SHALL display additional details such as payment date and method

### Requirement 2

**User Story:** As a property manager, I want to view car sticker assignments in a matrix format organized by block and flat, so that I can quickly see which flats have been assigned car stickers and identify any unassigned units.

#### Acceptance Criteria

1. WHEN the user navigates to the car sticker matrix screen THEN the system SHALL display a 2-dimensional matrix with blocks as rows and flats as columns
2. WHEN the matrix is displayed THEN the system SHALL show the car sticker identifier used by each flat in the corresponding cell
3. WHEN a flat has no assigned car sticker THEN the system SHALL display an empty cell or "Not Assigned" indicator
4. WHEN a flat has multiple car stickers THEN the system SHALL display all sticker identifiers in the cell
5. WHEN the user clicks on a cell THEN the system SHALL show detailed information about the car sticker assignment

### Requirement 3

**User Story:** As a property manager, I want to navigate between the AMC matrix and car sticker matrix screens easily, so that I can efficiently review both types of information.

#### Acceptance Criteria

1. WHEN the user is on either matrix screen THEN the system SHALL provide navigation links to switch between AMC and car sticker views
2. WHEN the user switches between matrix views THEN the system SHALL maintain the current block/flat selection context where applicable
3. WHEN the user accesses matrix screens THEN the system SHALL integrate them into the existing navigation structure

### Requirement 4

**User Story:** As a property manager, I want the matrix views to be responsive and readable on different screen sizes, so that I can access the information on various devices.

#### Acceptance Criteria

1. WHEN the matrix is displayed on a large screen THEN the system SHALL show all blocks and flats in a single view
2. WHEN the matrix is displayed on smaller screens THEN the system SHALL provide horizontal scrolling to maintain readability
3. WHEN the matrix contains many blocks or flats THEN the system SHALL implement appropriate scrolling mechanisms
4. WHEN viewing on mobile devices THEN the system SHALL ensure cell content remains readable and interactive

### Requirement 5

**User Story:** As a property manager, I want to export matrix data, so that I can use the information in reports or share it with stakeholders.

#### Acceptance Criteria

1. WHEN the user is viewing a matrix screen THEN the system SHALL provide an export option
2. WHEN the user exports matrix data THEN the system SHALL generate a downloadable file in CSV or Excel format
3. WHEN exporting AMC matrix data THEN the system SHALL include year information in the export
4. WHEN exporting car sticker matrix data THEN the system SHALL include all sticker assignments and empty cells