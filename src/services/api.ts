// ======================================================
// YSP API Service - Centralized Backend Communication
// ======================================================

/**
 * API Configuration
 * Change these values once, and all components will use them
 */
const API_CONFIG = {
  // Base URL for all API requests
  // Using Vercel proxy to avoid CORS issues
  baseURL: '/api/gas-proxy',
  
  // Google Apps Script Backend Details (for reference)
  backend: {
    scriptId: '1CEx53zlJZHarkYESoUzbuV3Jj04rA6YKVSpsh1n-sClm_PHjXJyeuSXf',
    deploymentId: 'AKfycbyepq64QJEfXRzACKaXGSevEXdb-TueUaxtnTEQCnnFsECZGq1AWqNqyKZ9GeMmvcao2g',
    webAppUrl: 'https://script.google.com/macros/s/AKfycbyepq64QJEfXRzACKaXGSevEXdb-TueUaxtnTEQCnnFsECZGq1AWqNqyKZ9GeMmvcao2g/exec',
  },
  
  // Google Sheets IDs (for reference)
  spreadsheetIds: {
    main: '1zTgBQw3ISAtagKOKhMYl6JWL6DnQSpcHt7L3UnBevuU',
  },
  
  // Request timeout (optional)
  timeout: 30000,
};

/**
 * Generic API request handler
 * All requests go through this function
 */
async function apiRequest<T = any>(action: string, data: Record<string, any> = {}): Promise<T> {
  try {
    const response = await fetch(API_CONFIG.baseURL, {
      method: 'POST',
      mode: 'cors',
      credentials: 'omit',
      headers: {
        'Content-Type': 'application/json',
        'Origin': window.location.origin,
      },
      body: JSON.stringify({
        action,
        ...data,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error(`API Request Error [${action}]:`, error);
    throw error;
  }
}

// ======================================================
// AUTH API - Login & Guest Login
// ======================================================

export interface LoginResponse {
  success: boolean;
  message?: string;
  user?: {
    id: string;
    username: string;
    role: string;
    firstName: string;
    lastName: string;
    middleName?: string;
    birthdate?: string;
    address?: string;
    contactNumber?: string;
    email?: string;
    guardianName?: string;
    guardianContact?: string;
    profilePicture?: string;
  };
}

export const authAPI = {
  /**
   * Regular user login
   */
  login: async (username: string, password: string): Promise<LoginResponse> => {
    return apiRequest<LoginResponse>('login', { username, password });
  },

  /**
   * Guest login
   */
  guestLogin: async (name: string): Promise<LoginResponse> => {
    return apiRequest<LoginResponse>('guestLogin', { name });
  },
};

// ======================================================
// ACCESS LOGS API
// ======================================================

export interface AccessLog {
  timestamp: string;
  idCode: string;
  name: string;
  role: string;
}

export interface AccessLogsResponse {
  success: boolean;
  message: string;
  logs?: AccessLog[];
}

export const accessLogsAPI = {
  /**
   * Get all access logs
   */
  getAll: async (role?: string): Promise<AccessLogsResponse> => {
    return apiRequest<AccessLogsResponse>('getAccessLogs', { role });
  },

  /**
   * Search access logs
   */
  search: async (searchTerm: string, role?: string): Promise<AccessLogsResponse> => {
    return apiRequest<AccessLogsResponse>('getAccessLogs', { search: searchTerm, role });
  },
};

// ======================================================
// ATTENDANCE API (Example for future expansion)
// ======================================================

export const attendanceAPI = {
  /**
   * Submit attendance
   */
  submit: async (eventId: string, idCode: string): Promise<any> => {
    return apiRequest('submitAttendance', { eventId, idCode });
  },

  /**
   * Get attendance records
   */
  getRecords: async (eventId?: string): Promise<any> => {
    return apiRequest('getAttendance', { eventId });
  },
};

// ======================================================
// USER PROFILE API (Example for future expansion)
// ======================================================

export interface UserProfile {
  idCode: string;
  fullName: string;
  email: string;
  position: string;
  birthday: string;
  contact: string;
  gender: string;
  age: number;
  civilStatus: string;
  nationality: string;
  religion: string;
  profilePic?: string;
}

export interface UserProfileResponse {
  success: boolean;
  message: string;
  profile?: UserProfile;
  profiles?: UserProfile[];
}

export const userAPI = {
  /**
   * Get user profile by ID code
   */
  getProfile: async (idCode: string): Promise<UserProfileResponse> => {
    return apiRequest('getUserProfile', { idCode });
  },

  /**
   * Search user profiles
   */
  searchProfiles: async (searchTerm: string): Promise<UserProfileResponse> => {
    return apiRequest('searchProfiles', { search: searchTerm });
  },

  /**
   * Update user profile
   */
  updateProfile: async (idCode: string, updates: Record<string, any>): Promise<any> => {
    return apiRequest('updateUserProfile', { idCode, ...updates });
  },
};

// ======================================================
// EVENTS API
// ======================================================

export interface Event {
  id: string;
  name: string;
  date: string;
  status: string;
}

export interface EventsResponse {
  success: boolean;
  message: string;
  events?: Event[];
  event?: Event;
}

export const eventsAPI = {
  /**
   * Get all events
   */
  getAll: async (): Promise<EventsResponse> => {
    return apiRequest('getEvents');
  },

  /**
   * Create new event
   */
  create: async (name: string, date: string): Promise<EventsResponse> => {
    return apiRequest('createEvent', { name, date });
  },

  /**
   * Toggle event status
   */
  toggleStatus: async (eventId: string, currentStatus: string): Promise<EventsResponse> => {
    return apiRequest('toggleEventStatus', { eventId, currentStatus });
  },
};

// Export API_CONFIG for direct access if needed
export { API_CONFIG };
