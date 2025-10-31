/**
 * Loading Skeleton Components
 * Provides better perceived performance than spinners
 */

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './table';

interface SkeletonProps {
  className?: string;
}

// Base Skeleton component with shimmer animation (respects dark mode)
export function Skeleton({ className = '' }: SkeletonProps) {
  return (
    <div
      className={`relative overflow-hidden bg-gray-200 dark:bg-gray-700 rounded ${className}`}
      aria-label="Loading..."
      role="status"
    >
      {/* Shimmer overlay */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            'linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.45) 50%, rgba(255,255,255,0) 100%)',
          // Use darker shimmer in dark mode via CSS variable fallback
          mixBlendMode: 'overlay',
          backgroundSize: '1000px 100%',
          backgroundRepeat: 'no-repeat',
          animation: 'shimmer 2s infinite',
        }}
      />
    </div>
  );
}

// Table Skeleton - for data tables (uses actual Table components)
export function TableSkeleton({ rows = 5, columns = 5 }: { rows?: number; columns?: number }) {
  return (
    <div className="w-full" role="status" aria-label="Loading table data">
      <Table>
        <TableHeader>
          <TableRow>
            {Array.from({ length: columns }).map((_, i) => (
              <TableHead key={i}>
                <Skeleton className="h-4 w-full" />
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {Array.from({ length: rows }).map((_, rowIndex) => (
            <TableRow key={rowIndex}>
              {Array.from({ length: columns }).map((_, colIndex) => (
                <TableCell key={colIndex}>
                  <Skeleton className="h-4 w-full" />
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

// Card Skeleton - for announcement/event cards
export function CardSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-4" role="status" aria-label="Loading cards">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="p-6 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 space-y-3"
        >
          {/* Card Header */}
          <div className="flex items-center justify-between">
            <Skeleton className="h-6 w-1/3" />
            <Skeleton className="h-4 w-24" />
          </div>
          
          {/* Card Content */}
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
          <Skeleton className="h-4 w-4/6" />
          
          {/* Card Footer */}
          <div className="flex gap-2 pt-2">
            <Skeleton className="h-8 w-20" />
            <Skeleton className="h-8 w-20" />
          </div>
        </div>
      ))}
    </div>
  );
}

// List Skeleton - for simple lists
export function ListSkeleton({ items = 6 }: { items?: number }) {
  return (
    <div className="space-y-3" role="status" aria-label="Loading list">
      {Array.from({ length: items }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <Skeleton className="h-10 w-10 rounded-full flex-shrink-0" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        </div>
      ))}
    </div>
  );
}

// Profile Skeleton - for user profile page
export function ProfileSkeleton() {
  return (
    <div className="max-w-4xl mx-auto space-y-6" role="status" aria-label="Loading profile">
      {/* Profile Header */}
      <div className="ysp-card">
        <div className="flex items-center gap-6">
          <Skeleton className="h-32 w-32 rounded-full flex-shrink-0" />
          <div className="flex-1 space-y-3">
            <Skeleton className="h-8 w-1/3" />
            <Skeleton className="h-5 w-1/4" />
            <Skeleton className="h-5 w-1/2" />
          </div>
        </div>
      </div>

      {/* Profile Details Grid */}
      <div className="ysp-card">
        <Skeleton className="h-6 w-1/4 mb-6" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-4 w-1/3" />
              <Skeleton className="h-10 w-full" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Stats Card Skeleton - for dashboard statistics
export function StatsCardSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" role="status" aria-label="Loading statistics">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="p-6 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 space-y-3"
        >
          <div className="flex items-center justify-between">
            <Skeleton className="h-5 w-20" />
            <Skeleton className="h-8 w-8 rounded-full" />
          </div>
          <Skeleton className="h-10 w-24" />
          <Skeleton className="h-3 w-32" />
        </div>
      ))}
    </div>
  );
}

// Chart Skeleton - for analytics charts
export function ChartSkeleton({ height = 'h-64' }: { height?: string }) {
  return (
    <div className="ysp-card space-y-4" role="status" aria-label="Loading chart">
      <div className="flex items-center justify-between">
        <Skeleton className="h-6 w-1/3" />
        <Skeleton className="h-8 w-24" />
      </div>
      <Skeleton className={`w-full ${height}`} />
      <div className="flex gap-4 justify-center">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-4 w-20" />
      </div>
    </div>
  );
}

// Form Skeleton - for loading forms
export function FormSkeleton({ fields = 5 }: { fields?: number }) {
  return (
    <div className="ysp-card space-y-6" role="status" aria-label="Loading form">
      <Skeleton className="h-8 w-1/3" />
      {Array.from({ length: fields }).map((_, i) => (
        <div key={i} className="space-y-2">
          <Skeleton className="h-5 w-1/4" />
          <Skeleton className="h-10 w-full" />
        </div>
      ))}
      <div className="flex gap-3 pt-4">
        <Skeleton className="h-10 w-24" />
        <Skeleton className="h-10 w-24" />
      </div>
    </div>
  );
}

// Text Block Skeleton - for loading text content
export function TextSkeleton({ lines = 3 }: { lines?: number }) {
  return (
    <div className="space-y-2" role="status" aria-label="Loading text">
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          className={`h-4 ${
            i === lines - 1 ? 'w-3/4' : 'w-full'
          }`}
        />
      ))}
    </div>
  );
}
