// ======================================================
// YSP API Service - Centralized Backend Communication
// ======================================================

import { getCached, invalidateCache, CACHE_DURATION } from './cache';

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
    deploymentId: 'AKfycbwI4Pmh-r3RtpmqzRlnU-56ByzeWvRD6QKtCyDrKD9YU4jVhvaauN4lkxl2i7Wsl_Ps',
    webAppUrl: 'https://script.google.com/macros/s/AKfycbwI4Pmh-r3RtpmqzRlnU-56ByzeWvRD6QKtCyDrKD9YU4jVhvaauN4lkxl2i7Wsl_Ps/exec',
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
  const debug = (() => {
    try {
      if (typeof window === 'undefined') return false;
      if (new URLSearchParams(window.location.search).get('yspDebug') === '1') return true;
      return window.localStorage.getItem('yspDebug') === '1';
    } catch { return false; }
  })();

  const redact = (obj: any) => {
    try {
      const clone = JSON.parse(JSON.stringify(obj));
      if (clone?.imageBase64) clone.imageBase64 = `[base64:${(clone.imageBase64.length || 0)} bytes]`;
      if (clone?.password) clone.password = '[REDACTED]';
      return clone;
    } catch { return obj; }
  };

  const clientDebugId = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
  const requestBody = { action, clientDebugId, ...data };

  if (debug && (action === 'createFeedback' || action === 'getFeedback')) {
    // Collapsed group to keep console tidy
    // eslint-disable-next-line no-console
    console.groupCollapsed(`API → ${action} [${clientDebugId}]`);
    // eslint-disable-next-line no-console
    console.debug('Endpoint:', API_CONFIG.baseURL);
    // eslint-disable-next-line no-console
    console.debug('Request:', redact(requestBody));
    // eslint-disable-next-line no-console
    console.groupEnd();
  }

  // Small helper: fetch with timeout + retry + better error messages
  const fetchWithRetry = async (attempt = 1): Promise<Response> => {
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), Math.min(API_CONFIG.timeout || 30000, 30000));

    try {
      const res = await fetch(API_CONFIG.baseURL, {
        method: 'POST',
        mode: 'cors',
        credentials: 'omit',
        headers: {
          'Content-Type': 'application/json',
          'Origin': window.location.origin,
        },
        body: JSON.stringify(requestBody),
        signal: controller.signal,
      });
      window.clearTimeout(timeout);

      // Retry on transient statuses
      if ([429, 502, 503, 504].includes(res.status) && attempt < 3) {
        const backoff = 500 * Math.pow(2, attempt - 1);
        await new Promise((r) => setTimeout(r, backoff));
        return fetchWithRetry(attempt + 1);
      }
      return res;
    } catch (err: any) {
      window.clearTimeout(timeout);
      if (debug) {
        // eslint-disable-next-line no-console
        console.error(`API ✖ ${action} [${clientDebugId}] Network error:`, err);
      }
      // Retry on abort/network errors
      if (attempt < 3 && (err?.name === 'AbortError' || String(err).includes('TypeError'))) {
        const backoff = 500 * Math.pow(2, attempt - 1);
        await new Promise((r) => setTimeout(r, backoff));
        return fetchWithRetry(attempt + 1);
      }
      throw err;
    }
  };

  try {
    console.log(`[API Debug] ${action} - Starting request [${clientDebugId}]`);
    const response = await fetchWithRetry();
    console.log(`[API Debug] ${action} - Response received:`, {
      ok: response.ok,
      status: response.status,
      statusText: response.statusText
    });

    if (!response.ok) {
      const text = await response.text().catch(() => '');
      console.error(`[API Debug] ${action} - Non-OK response:`, {
        status: response.status,
        text: text.slice(0, 500)
      });
      
      const lower = text.toLowerCase();
      let friendly = `Request failed (HTTP ${response.status})`;
      if (lower.includes('service invoked too many times') || response.status === 429) {
        friendly = 'Server is busy (quota/rate limit). Please try again shortly.';
      } else if (lower.includes('exceeded maximum execution time')) {
        friendly = 'Server timed out processing your request. Please try again.';
      } else if (response.status >= 500) {
        friendly = 'Server error while processing your request. Please try again.';
      } else if (response.status === 404) {
        friendly = 'API endpoint not found. Please check your configuration.';
      } else if (response.status === 403) {
        friendly = 'Access denied. Please check your permissions.';
      }
      
      if (debug) {
        // eslint-disable-next-line no-console
        console.error(`API ✖ ${action} [${clientDebugId}]`, friendly, '\nResponse text:', text);
      }
      // Include snippet of raw response in debug mode
      const extra = text ? ` (${text.slice(0, 200)}${text.length > 200 ? '...' : ''})` : '';
      throw new Error(friendly + extra);
    }

    const contentType = response.headers.get('content-type');
    console.log(`[API Debug] ${action} - Content-Type:`, contentType);
    
    let result: any;
    try {
      const text = await response.text();
      console.log(`[API Debug] ${action} - Raw response text:`, text.slice(0, 500));
      result = JSON.parse(text);
      console.log(`[API Debug] ${action} - Parsed JSON:`, result);
    } catch (parseError) {
      console.error(`[API Debug] ${action} - JSON parse error:`, parseError);
      throw new Error('Server returned invalid JSON. Please try again.');
    }

    if (debug && (action === 'createFeedback' || action === 'getFeedback')) {
      // eslint-disable-next-line no-console
      console.info(`API ✓ ${action} [${clientDebugId}]`, result);
    }

    // Check if backend returned success: false
    if (result && result.success === false) {
      const errorMsg = result.message || 'Operation failed';
      console.error(`[API Debug] ${action} - Backend returned error:`, errorMsg);
      throw new Error(errorMsg);
    }

    return result;
  } catch (error) {
    console.error(`[API Debug] ${action} - Catch block error:`, error);
    const msg = error instanceof Error ? error.message : 'Network error. Please check your internet connection.';
    if (debug) {
      // eslint-disable-next-line no-console
      console.error(`API ✖ ${action} [${clientDebugId}]`, msg);
    }
    throw new Error(msg);
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
  fullName: string;
  username: string;
  idCode: string;
  email: string;
  contactNumber: string;
  birthday: string;
  age: string;
  gender: string;
  pronouns: string;
  civilStatus: string;
  religion: string;
  nationality: string;
  password: string;
  position: string;
  role: string;
  profilePictureURL: string;
}

export interface UserProfileResponse {
  success: boolean;
  message?: string;
  profile?: UserProfile;
  profiles?: UserProfile[];
}

export interface UploadProfilePictureResponse {
  success: boolean;
  message: string;
  profilePictureURL?: string;
}

export const userAPI = {
  /**
   * Get user profile by username or ID code
   */
  getProfile: async (username?: string, idCode?: string): Promise<UserProfileResponse> => {
    return apiRequest('getUserProfile', { username, idCode });
  },

  /**
   * Search user profiles (with caching)
   */
  searchProfiles: async (searchTerm: string): Promise<UserProfileResponse> => {
    // Cache searches for faster repeat lookups
    const cacheKey = `profiles_search_${searchTerm.toLowerCase()}`;
    return getCached(
      cacheKey,
      () => apiRequest('searchProfiles', { search: searchTerm }),
      CACHE_DURATION.USER_PROFILES
    );
  },

  /**
   * Update user profile
   */
  updateProfile: async (idCode: string, updates: Record<string, any>): Promise<any> => {
    return apiRequest('updateProfile', { idCode, ...updates });
  },

  /**
   * Upload profile picture to Google Drive
   * @param base64Image - Base64 encoded image data
   * @param fileName - Name of the file
   * @param username - Username of the user
   * @param idCode - ID Code of the user
   * @param mimeType - MIME type of the image (e.g., 'image/jpeg', 'image/png')
   */
  uploadProfilePicture: async (
    base64Image: string,
    fileName: string,
    username?: string,
    idCode?: string,
    mimeType?: string
  ): Promise<UploadProfilePictureResponse> => {
    return apiRequest('uploadProfilePicture', {
      base64Image,
      fileName,
      username,
      idCode,
      mimeType: mimeType || 'image/jpeg',
    });
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

export interface EventAnalytics {
  Present: {
    count: number;
    attendees: Array<{
      idCode: string;
      name: string;
      position: string;
      idNumber: string;
      committee: string;
    }>;
  };
  Late: {
    count: number;
    attendees: Array<{
      idCode: string;
      name: string;
      position: string;
      idNumber: string;
      committee: string;
    }>;
  };
  Absent: {
    count: number;
    attendees: Array<{
      idCode: string;
      name: string;
      position: string;
      idNumber: string;
      committee: string;
    }>;
  };
  Excused: {
    count: number;
    attendees: Array<{
      idCode: string;
      name: string;
      position: string;
      idNumber: string;
      committee: string;
    }>;
  };
  'Not Recorded': {
    count: number;
    attendees: Array<{
      idCode: string;
      name: string;
      position: string;
      idNumber: string;
      committee: string;
    }>;
  };
}

export interface EventAnalyticsResponse {
  success: boolean;
  message?: string;
  event?: {
    id: string;
    name: string;
    date: string;
  };
  analytics?: EventAnalytics;
  totalAttendees?: number;
  committeeFilter?: string;
}

export interface EventsResponse {
  success: boolean;
  message: string;
  events?: Event[];
  event?: Event;
}

export const eventsAPI = {
  /**
   * Get all events (with caching)
   */
  getAll: async (): Promise<EventsResponse> => {
    return getCached(
      'events_all',
      () => apiRequest('getEvents'),
      CACHE_DURATION.EVENTS
    );
  },

  /**
   * Create new event
   */
  create: async (name: string, date: string): Promise<EventsResponse> => {
    // Invalidate events cache when creating new event
    invalidateCache('events_all');
    return apiRequest('createEvent', { name, date });
  },

  /**
   * Toggle event status
   */
  toggleStatus: async (eventId: string, currentStatus: string): Promise<EventsResponse> => {
    return apiRequest('toggleEventStatus', { eventId, currentStatus });
  },

  /**
   * Get event analytics with attendance breakdown by status
   */
  getAnalytics: async (eventId: string, committee?: string): Promise<EventAnalyticsResponse> => {
    return apiRequest('getEventAnalytics', { eventId, committee });
  },
};

// ======================================================
// ANNOUNCEMENTS API
// ======================================================

export interface Announcement {
  announcementId: string;
  timestamp: string;
  authorIdCode: string;
  authorName: string;
  title: string;
  subject: string;
  body: string;
  recipientType: 'All Members' | 'Only Heads' | 'Specific Committee' | 'Specific Person/s';
  recipientValue: string;
  emailStatus: string;
  readStatus?: 'Read' | 'Unread' | 'N/A';
}

export interface CreateAnnouncementRequest {
  title: string;
  subject: string;
  body: string;
  recipientType: 'All Members' | 'Only Heads' | 'Specific Committee' | 'Specific Person/s';
  recipientValue: string;
  authorIdCode: string;
  authorName: string;
}

export interface AnnouncementResponse {
  success: boolean;
  message: string;
  announcement?: Announcement;
  announcements?: Announcement[];
  announcementId?: string;
}

export const announcementsAPI = {
  /**
   * Create a new announcement
   * Only available to Heads (role === 'Head' AND ID Number in [25100-25700])
   */
  create: async (data: CreateAnnouncementRequest): Promise<AnnouncementResponse> => {
    return apiRequest('createAnnouncement', data);
  },

  /**
   * Get all announcements for a specific user
   * Returns only announcements where user is a recipient
   */
  getAll: async (idCode: string): Promise<AnnouncementResponse> => {
    return apiRequest('getAnnouncements', { idCode });
  },

  /**
   * Mark an announcement as read for a specific user
   */
  markAsRead: async (announcementId: string, idCode: string): Promise<AnnouncementResponse> => {
    return apiRequest('markAnnouncementAsRead', { announcementId, idCode });
  },
};

// ======================================================
// FEEDBACK API
// ======================================================

export interface Feedback {
  referenceId: string;
  timestamp: string;
  authorName: string;
  authorIdCode?: string; // Only visible to Admin/Auditor
  message: string;
  hasReply: boolean;
  category?: string;
  status?: 'Pending' | 'Reviewed' | 'Resolved' | string;
  visibility?: 'Private' | 'Public' | string;
  imageUrl?: string;
  rating?: number;
  email?: string;
  replyTimestamp?: string;
  replyMessage?: string;
  replierName?: string; // Only visible to Admin/Auditor
  replierIdCode?: string; // Only visible to Admin/Auditor
}

export interface CreateFeedbackRequest {
  message: string;
  authorName: string;
  authorIdCode?: string; // Optional, defaults to "Guest" if not provided
  anonymous?: boolean;
  category?: 'Complaint' | 'Suggestion' | 'Bug' | 'Compliment' | 'Inquiry' | 'Other' | string;
  visibility?: 'Private' | 'Public';
  imageUrl?: string;
  imageBase64?: string; // data URL or raw base64
  imageFilename?: string;
  rating?: number;
  email?: string;
}

export interface ReplyToFeedbackRequest {
  referenceId: string;
  reply: string;
  replierName: string;
  replierIdCode: string;
  replierRole: string;
  status?: 'Pending' | 'Reviewed' | 'Resolved';
  visibility?: 'Private' | 'Public';
}

export interface FeedbackResponse {
  success: boolean;
  message: string;
  feedback?: Feedback | Feedback[];
  reply?: {
    referenceId: string;
    replyTimestamp: string;
    replierName: string;
    replierIdCode: string;
    replyMessage: string;
  };
}

export const feedbackAPI = {
  /**
   * Create a new feedback
   * Available to everyone (including Guests)
   */
  create: async (data: CreateFeedbackRequest): Promise<FeedbackResponse> => {
    return apiRequest('createFeedback', data);
  },

  /**
   * Get all feedback for a specific user
   * Regular users see only their own feedback
   * Admin/Auditor see all feedback
   */
  getAll: async (idCode: string, name: string, role: string): Promise<FeedbackResponse> => {
    return apiRequest('getFeedback', { idCode, name, role });
  },

  /**
   * Reply to a feedback
   * Only available to Admin and Auditor
   */
  reply: async (data: ReplyToFeedbackRequest): Promise<FeedbackResponse> => {
    return apiRequest('replyToFeedback', data);
  },

  getByReference: async (referenceId: string): Promise<FeedbackResponse> => {
    return apiRequest('getFeedbackByRef', { referenceId });
  },

  setVisibility: async (referenceId: string, visibility: 'Private' | 'Public', role: string): Promise<FeedbackResponse> => {
    return apiRequest('setFeedbackVisibility', { referenceId, visibility, role });
  },

  /**
   * Update feedback details (status and/or visibility)
   * Only available to Admin and Auditor
   */
  updateDetails: async (referenceId: string, status?: 'Pending' | 'Reviewed' | 'Resolved', visibility?: 'Private' | 'Public', role?: string): Promise<FeedbackResponse> => {
    return apiRequest('updateFeedbackDetails', { referenceId, status, visibility, role });
  },
};

// ======================================================
// Homepage API
// ======================================================

export interface HomepageProject {
  number: number;
  title: string;
  image: string;
  description: string;
}

export interface HomepageContent {
  mission: string;
  vision: string;
  about: string;
  objectives: string[];
  orgChartUrl: string;
  founderName: string;
  email: string;
  facebookUrl: string;
  projects: HomepageProject[];
  motto?: string;
}

export interface HomepageResponse {
  success: boolean;
  message?: string;
  content?: HomepageContent;
}

export const homepageAPI = {
  /**
   * Get homepage content from Google Sheets (with caching)
   * Available to everyone
   */
  getContent: async (): Promise<HomepageResponse> => {
    return getCached(
      'homepage_content',
      () => apiRequest('getHomepageContent', {}),
      CACHE_DURATION.HOMEPAGE
    );
  },

  /**
   * Upload a project image to Google Drive (Admin/Auditor only)
   */
  uploadProjectImage: async (
    base64Image: string,
    fileName: string,
    mimeType: string,
    projectTitle: string,
    idCode: string
  ): Promise<{ success: boolean; message?: string; imageUrl?: string; fileName?: string }> => {
    return apiRequest('uploadProjectImage', { base64Image, fileName, mimeType, projectTitle, idCode });
  },

  /**
   * Add a new homepage project (Admin/Auditor only)
   */
  addProject: async (
    title: string,
    imageUrl: string,
    description: string,
    idCode: string
  ): Promise<{ success: boolean; message?: string; projectNumber?: number; title?: string }> => {
    // Invalidate homepage cache when adding project
    invalidateCache('homepage_content');
    return apiRequest('addHomepageProject', { title, imageUrl, description, idCode });
  },

  /**
   * Delete a homepage project by number (Admin/Auditor only)
   */
  deleteProject: async (
    projectNumber: number,
    idCode: string
  ): Promise<{ success: boolean; message?: string; projectNumber?: number }> => {
    // Invalidate homepage cache when deleting project
    invalidateCache('homepage_content');
    return apiRequest('deleteHomepageProject', { projectNumber, idCode });
  },

  /**
   * Upload an org chart image to Google Drive (Admin/Auditor only)
   */
  uploadOrgChartImage: async (
    base64Image: string,
    fileName: string,
    mimeType: string,
    idCode: string
  ): Promise<{ success: boolean; message?: string; imageUrl?: string; fileName?: string }> => {
    return apiRequest('uploadOrgChartImage', { base64Image, fileName, mimeType, idCode });
  },

  /**
   * Update the org chart URL in the sheet (Admin/Auditor only)
   */
  updateOrgChartUrl: async (
    imageUrl: string,
    idCode: string
  ): Promise<{ success: boolean; message?: string }> => {
    return apiRequest('updateOrgChartUrl', { imageUrl, idCode });
  },

  /**
   * Delete the org chart (clear link; optionally trash file server-side) (Admin/Auditor only)
   */
  deleteOrgChart: async (
    idCode: string
  ): Promise<{ success: boolean; message?: string }> => {
    return apiRequest('deleteOrgChart', { idCode });
  },
};

// Export API_CONFIG for direct access if needed
export { API_CONFIG };

// ======================================================
// SYSTEM / ADMIN API
// ======================================================

export const systemAPI = {
  /**
   * Auditor-only: Manually trigger age recomputation for all users
   */
  recalcAgesNow: async (auditorIdCode: string): Promise<{ success: boolean; message?: string; updated?: number; }> => {
    return apiRequest('recalcAgesNow', { idCode: auditorIdCode });
  },

  /**
   * Auditor-only: Install the daily 00:05 (Asia/Manila) trigger
   */
  installAgeRecalcTrigger: async (auditorIdCode: string): Promise<{ success: boolean; message?: string; }> => {
    return apiRequest('installAgeRecalcTrigger', { idCode: auditorIdCode });
  }
};

// ======================================================
// ROLE MANAGEMENT API (Auditor-only)
// ======================================================

export interface UserRoleInfo {
  fullName: string;
  idCode: string;
  role: string;
}

export interface AllUserRolesResponse {
  success: boolean;
  message: string;
  users?: UserRoleInfo[];
}

export interface UpdateRoleResponse {
  success: boolean;
  message: string;
  idCode?: string;
  newRole?: string;
}

export interface AssignRolesResponse {
  success: boolean;
  message: string;
  updated?: number;
}

export const roleManagementAPI = {
  /**
   * Auditor-only: Get all users with their ID Code, Name, and Role
   */
  getAllUsers: async (auditorIdCode: string): Promise<AllUserRolesResponse> => {
    return apiRequest('getAllUserRoles', { idCode: auditorIdCode });
  },

  /**
   * Auditor-only: Update a specific user's role manually
   * Valid roles: Admin, Auditor, Head, Member, Banned
   */
  updateUserRole: async (
    auditorIdCode: string,
    targetIdCode: string,
    newRole: 'Admin' | 'Auditor' | 'Head' | 'Member' | 'Banned'
  ): Promise<UpdateRoleResponse> => {
    return apiRequest('updateUserRole', { 
      idCode: auditorIdCode, 
      targetIdCode, 
      newRole 
    });
  },

  /**
   * Auditor-only: Trigger bulk role assignment (syncs with Officer Directory)
   */
  assignRoles: async (auditorIdCode: string): Promise<AssignRolesResponse> => {
    return apiRequest('assignRoles', { idCode: auditorIdCode });
  }
};
