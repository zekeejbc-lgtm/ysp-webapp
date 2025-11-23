export type UserRole = 'Admin' | 'Head' | 'Auditor' | 'Member' | 'Guest';

export interface User {
  name: string;
  id?: string;          // Add id property
  idCode: string;
  username?: string;    // Add username property
  role: UserRole;
  email?: string;
  position?: string;
}

export interface AccessLog {
  id: number;
  name: string;
  idCode: string;
  role: UserRole;
  timestamp: string;
}

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
}

export interface LoginResponse extends ApiResponse<User> {
  name: string;
  idCode: string;
  role: UserRole;
}

export interface AccessLogsResponse extends ApiResponse<{
  logs: AccessLog[];
}> {
  logs: AccessLog[];
}