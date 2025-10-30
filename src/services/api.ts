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
    const requestBody = {
      action,
      ...data,
    };
    
    console.log(`[API] Request [${action}]:`, requestBody);
    
    const response = await fetch(API_CONFIG.baseURL, {
      method: 'POST',
      mode: 'cors',
      credentials: 'omit',
      headers: {
        'Content-Type': 'application/json',
        'Origin': window.location.origin,
      },
      body: JSON.stringify(requestBody),
    });

    console.log(`[API] Response status [${action}]:`, response.status);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    console.log(`[API] Response data [${action}]:`, result);
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
   * Search user profiles
   */
  searchProfiles: async (searchTerm: string): Promise<UserProfileResponse> => {
    return apiRequest('searchProfiles', { search: searchTerm });
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
  replyTimestamp?: string;
  replyMessage?: string;
  replierName?: string; // Only visible to Admin/Auditor
  replierIdCode?: string; // Only visible to Admin/Auditor
}

export interface CreateFeedbackRequest {
  message: string;
  authorName: string;
  authorIdCode?: string; // Optional, defaults to "Guest" if not provided
}

export interface ReplyToFeedbackRequest {
  referenceId: string;
  reply: string;
  replierName: string;
  replierIdCode: string;
  replierRole: string;
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
}

export interface HomepageResponse {
  success: boolean;
  message?: string;
  content?: HomepageContent;
}

export const homepageAPI = {
  /**
   * Get homepage content from Google Sheets
   * Available to everyone
   */
  getContent: async (): Promise<HomepageResponse> => {
    return apiRequest('getHomepageContent', {});
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
    return apiRequest('addHomepageProject', { title, imageUrl, description, idCode });
  },

  /**
   * Delete a homepage project by number (Admin/Auditor only)
   */
  deleteProject: async (
    projectNumber: number,
    idCode: string
  ): Promise<{ success: boolean; message?: string; projectNumber?: number }> => {
    return apiRequest('deleteHomepageProject', { projectNumber, idCode });
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
