'use client';

import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Building2, LogOut, Home, BarChart3, Car } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface NavigationProps {
  className?: string;
}

export function Navigation({ className }: NavigationProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, logout } = useAuth();

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
          isActive: pathname === '/matrix/amc'
        },
        {
          href: '/matrix/stickers',
          label: 'Car Stickers',
          icon: Car,
          isActive: pathname === '/matrix/stickers'
        }
      ]
    }
  ];

  if (!user) {
    return null;
  }

  return (
    <div className={cn('flex items-center space-x-2 sm:space-x-4', className)}>
      {/* Navigation Items */}
      {navigationItems.map((item) => {
        const Icon = item.icon;
        const isActive = item.isActive;
        
        return (
          <div key={item.href} className="relative group">
            <button
              onClick={() => router.push(item.href)}
              className={cn(
                'inline-flex items-center p-2 sm:px-4 sm:py-2 border border-transparent text-sm font-medium rounded-md transition-all duration-200',
                'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500',
                isActive
                  ? 'text-white bg-blue-600 hover:bg-blue-700 shadow-md'
                  : 'text-white bg-white/10 hover:bg-white/20 backdrop-blur-sm'
              )}
              aria-label={item.label}
              aria-current={isActive ? 'page' : undefined}
            >
              <Icon className="h-4 w-4 sm:mr-1" />
              <span className="sr-only sm:not-sr-only sm:inline">{item.label}</span>
            </button>
            
            {/* Dropdown for Matrix Views */}
            {item.children && (
              <div className="absolute top-full left-0 mt-1 w-48 bg-white rounded-md shadow-lg border border-gray-200 py-1 z-50 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                {item.children.map((child) => {
                  const ChildIcon = child.icon;
                  return (
                    <button
                      key={child.href}
                      onClick={() => router.push(child.href)}
                      className={cn(
                        'w-full flex items-center px-4 py-2 text-sm text-left transition-colors',
                        child.isActive
                          ? 'bg-blue-50 text-blue-700 font-medium'
                          : 'text-gray-700 hover:bg-gray-50'
                      )}
                    >
                      <ChildIcon className="h-4 w-4 mr-2" />
                      {child.label}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}

      {/* Logout Button */}
      <button
        onClick={logout}
        className="inline-flex items-center p-2 sm:px-4 sm:py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors duration-200"
        aria-label="Logout"
      >
        <LogOut className="h-4 w-4 sm:mr-1" />
        <span className="sr-only sm:not-sr-only sm:inline">Logout</span>
      </button>
    </div>
  );
}