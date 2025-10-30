import { QueryClient } from '@tanstack/react-query';

// Create a client with optimized defaults
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Cache for 5 minutes
      staleTime: 5 * 60 * 1000,
      // Keep unused data for 10 minutes
      gcTime: 10 * 60 * 1000,
      // Retry failed requests 2 times
      retry: 2,
      // Refetch on window focus for fresh data
      refetchOnWindowFocus: true,
      // Don't refetch on reconnect by default
      refetchOnReconnect: false,
      // Don't refetch on mount by default (use cache)
      refetchOnMount: false,
    },
    mutations: {
      // Retry mutations once
      retry: 1,
    },
  },
});

// Query keys factory for consistency
export const queryKeys = {
  // Access Logs
  accessLogs: {
    all: ['accessLogs'] as const,
    list: (role?: string) => ['accessLogs', 'list', role] as const,
    search: (term: string, role?: string) => ['accessLogs', 'search', term, role] as const,
  },
  // User Profile
  users: {
    all: ['users'] as const,
    profile: (username?: string, idCode?: string) => ['users', 'profile', username, idCode] as const,
    search: (term: string) => ['users', 'search', term] as const,
  },
  // Events
  events: {
    all: ['events'] as const,
    list: () => ['events', 'list'] as const,
    detail: (id: string) => ['events', 'detail', id] as const,
    analytics: (id: string, committee?: string) => ['events', 'analytics', id, committee] as const,
  },
  // Announcements
  announcements: {
    all: ['announcements'] as const,
    list: (idCode: string) => ['announcements', 'list', idCode] as const,
  },
  // Feedback
  feedback: {
    all: ['feedback'] as const,
    list: (idCode: string, name: string, role: string) => ['feedback', 'list', idCode, name, role] as const,
  },
  // Homepage
  homepage: {
    content: () => ['homepage', 'content'] as const,
  },
  // Roles
  roles: {
    all: ['roles'] as const,
    list: () => ['roles', 'list'] as const,
  },
} as const;
