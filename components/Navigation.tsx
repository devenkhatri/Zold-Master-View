'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Building2, LogOut, Home, BarChart3, Car, Menu, X, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

export interface NavigationProps {
  className?: string;
  variant?: 'desktop' | 'mobile' | 'auto';
}

export function Navigation({ className, variant = 'auto' }: NavigationProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Detect mobile screen size
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Close mobile menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMobileMenuOpen(false);
        setOpenDropdown(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
    setOpenDropdown(null);
  }, [pathname]);

  const navigationItems = [
    {
      href: '/',
      label: 'Home',
      icon: Home,
      isActive: pathname === '/'
    },
    {
      href: '/matrix',
      label: 'Matrix Views',
      icon: Building2,
      isActive: pathname.startsWith('/matrix'),
      children: [
        {
          href: '/matrix/amc',
          label: 'AMC Matrix',
          icon: BarChart3,
          isActive: pathname === '/matrix/amc',
          description: 'View AMC payment data'
        },
        {
          href: '/matrix/stickers',
          label: 'Car Stickers',
          icon: Car,
          isActive: pathname === '/matrix/stickers',
          description: 'Manage vehicle stickers'
        }
      ]
    }
  ];

  if (!user) {
    return null;
  }

  const handleNavigation = (href: string) => {
    router.push(href);
    setIsMobileMenuOpen(false);
    setOpenDropdown(null);
  };

  const handleLogout = () => {
    logout();
    setIsMobileMenuOpen(false);
  };

  const toggleDropdown = (itemHref: string) => {
    setOpenDropdown(openDropdown === itemHref ? null : itemHref);
  };

  const shouldShowMobile = variant === 'mobile' || (variant === 'auto' && isMobile);

  if (shouldShowMobile) {
    return (
      <div className={cn('relative', className)} ref={menuRef}>
        {/* Mobile Menu Button */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="text-white hover:bg-white/20 focus:bg-white/20"
          aria-label="Toggle navigation menu"
          aria-expanded={isMobileMenuOpen}
        >
          {isMobileMenuOpen ? (
            <X className="h-5 w-5" />
          ) : (
            <Menu className="h-5 w-5" />
          )}
        </Button>

        {/* Mobile Menu Overlay */}
        {isMobileMenuOpen && (
          <>
            <div 
              className="fixed inset-0 bg-black/50 z-40"
              onClick={() => setIsMobileMenuOpen(false)}
            />
            <div className="absolute top-full right-0 mt-2 w-64 bg-white rounded-lg shadow-xl border border-gray-200 py-2 z-50 max-h-[80vh] overflow-y-auto">
              {/* User Info */}
              <div className="px-4 py-3 border-b border-gray-100">
                <p className="text-sm font-medium text-gray-900">Welcome back!</p>
                <p className="text-xs text-gray-500">{user.username}</p>
              </div>

              {/* Navigation Items */}
              <div className="py-2">
                {navigationItems.map((item) => {
                  const Icon = item.icon;
                  const hasChildren = item.children && item.children.length > 0;
                  const isDropdownOpen = openDropdown === item.href;

                  return (
                    <div key={item.href}>
                      <button
                        onClick={() => hasChildren ? toggleDropdown(item.href) : handleNavigation(item.href)}
                        className={cn(
                          'w-full flex items-center justify-between px-4 py-3 text-sm font-medium transition-colors min-h-[44px]',
                          item.isActive
                            ? 'bg-primary/10 text-primary border-r-2 border-primary'
                            : 'text-gray-700 hover:bg-gray-50'
                        )}
                      >
                        <div className="flex items-center">
                          <Icon className="h-5 w-5 mr-3" />
                          {item.label}
                        </div>
                        {hasChildren && (
                          <ChevronDown className={cn(
                            'h-4 w-4 transition-transform duration-200',
                            isDropdownOpen && 'rotate-180'
                          )} />
                        )}
                      </button>

                      {/* Dropdown Items */}
                      {hasChildren && isDropdownOpen && (
                        <div className="bg-gray-50 border-t border-gray-100">
                          {item.children!.map((child) => {
                            const ChildIcon = child.icon;
                            return (
                              <button
                                key={child.href}
                                onClick={() => handleNavigation(child.href)}
                                className={cn(
                                  'w-full flex items-start px-8 py-3 text-sm transition-colors min-h-[44px]',
                                  child.isActive
                                    ? 'bg-primary/10 text-primary font-medium'
                                    : 'text-gray-600 hover:bg-gray-100'
                                )}
                              >
                                <ChildIcon className="h-4 w-4 mr-3 mt-0.5 flex-shrink-0" />
                                <div className="text-left">
                                  <div className="font-medium">{child.label}</div>
                                  {child.description && (
                                    <div className="text-xs text-gray-500 mt-0.5">{child.description}</div>
                                  )}
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Logout Button */}
              <div className="border-t border-gray-100 pt-2 mt-2">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center px-4 py-3 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors min-h-[44px]"
                >
                  <LogOut className="h-5 w-5 mr-3" />
                  Logout
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    );
  }

  // Desktop Navigation
  return (
    <div className={cn('flex items-center space-x-2 lg:space-x-4', className)}>
      {/* Navigation Items */}
      {navigationItems.map((item) => {
        const Icon = item.icon;
        const isActive = item.isActive;
        
        return (
          <div key={item.href} className="relative group">
            <Button
              variant={isActive ? 'default' : 'ghost'}
              size="sm"
              onClick={() => handleNavigation(item.href)}
              className={cn(
                'text-white border-white/20',
                isActive
                  ? 'bg-white/20 hover:bg-white/30 shadow-sm'
                  : 'hover:bg-white/10 backdrop-blur-sm'
              )}
              aria-label={item.label}
              aria-current={isActive ? 'page' : undefined}
            >
              <Icon className="h-4 w-4 mr-2" />
              {item.label}
            </Button>
            
            {/* Desktop Dropdown */}
            {item.children && (
              <div className="absolute top-full left-0 mt-2 w-56 bg-white rounded-lg shadow-xl border border-gray-200 py-2 z-50 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                {item.children.map((child) => {
                  const ChildIcon = child.icon;
                  return (
                    <button
                      key={child.href}
                      onClick={() => handleNavigation(child.href)}
                      className={cn(
                        'w-full flex items-start px-4 py-3 text-sm transition-colors',
                        child.isActive
                          ? 'bg-primary/10 text-primary font-medium'
                          : 'text-gray-700 hover:bg-gray-50'
                      )}
                    >
                      <ChildIcon className="h-4 w-4 mr-3 mt-0.5 flex-shrink-0" />
                      <div className="text-left">
                        <div className="font-medium">{child.label}</div>
                        {child.description && (
                          <div className="text-xs text-gray-500 mt-0.5">{child.description}</div>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}

      {/* Desktop Logout Button */}
      <Button
        variant="destructive"
        size="sm"
        onClick={handleLogout}
        className="ml-2"
        aria-label="Logout"
      >
        <LogOut className="h-4 w-4 mr-2" />
        Logout
      </Button>
    </div>
  );
}