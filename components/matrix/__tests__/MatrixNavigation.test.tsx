import React from 'react';
import { render, screen } from '@testing-library/react';
import { usePathname } from 'next/navigation';
import { MatrixNavigation } from '../MatrixNavigation';

// Mock Next.js navigation
jest.mock('next/navigation', () => ({
  usePathname: jest.fn(),
}));

// Mock Next.js Link component
jest.mock('next/link', () => {
  return function MockLink({ children, href, ...props }: any) {
    return (
      <a href={href} {...props}>
        {children}
      </a>
    );
  };
});

const mockUsePathname = usePathname as jest.MockedFunction<typeof usePathname>;

describe('MatrixNavigation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders breadcrumb navigation correctly on home page', () => {
    mockUsePathname.mockReturnValue('/');
    
    render(<MatrixNavigation />);
    
    expect(screen.getByText('Home')).toBeInTheDocument();
    expect(screen.getByLabelText('Breadcrumb')).toBeInTheDocument();
  });

  it('renders matrix navigation when on matrix pages', () => {
    mockUsePathname.mockReturnValue('/matrix/amc');
    
    render(<MatrixNavigation />);
    
    expect(screen.getAllByText('Matrix Views')).toHaveLength(2); // One in breadcrumb, one in header
    expect(screen.getByText('AMC Matrix')).toBeInTheDocument();
    expect(screen.getByText('Car Sticker Matrix')).toBeInTheDocument();
  });

  it('shows active state for current matrix view', () => {
    mockUsePathname.mockReturnValue('/matrix/amc');
    
    render(<MatrixNavigation />);
    
    const amcLink = screen.getByRole('link', { name: /AMC Matrix/ });
    expect(amcLink).toHaveAttribute('aria-current', 'page');
  });

  it('renders breadcrumb with correct hierarchy on matrix pages', () => {
    mockUsePathname.mockReturnValue('/matrix/stickers');
    
    render(<MatrixNavigation />);
    
    expect(screen.getByText('Home')).toBeInTheDocument();
    expect(screen.getAllByText('Matrix Views')).toHaveLength(2); // One in breadcrumb, one in header
    expect(screen.getByText('Car Sticker Matrix')).toBeInTheDocument();
  });

  it('shows quick navigation on non-matrix pages', () => {
    mockUsePathname.mockReturnValue('/some-other-page');
    
    render(<MatrixNavigation />);
    
    expect(screen.getByText('Matrix Views Available')).toBeInTheDocument();
  });
});