// Google Apps Script API Wrapper
const GAS_URL = import.meta.env.VITE_GAS_URL;

if (!GAS_URL) {
  console.error('VITE_GAS_URL is not defined in environment variables');
}

export interface LoginResponse {
  success: boolean;
  message?: string;
  user?: {
    id: string;
    username: string;
    role: string;
    firstName?: string;
    lastName?: string;
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

async function callGAS(action: string, data: any = {}): Promise<any> {
  try {
    // Use URL-encoded form data to avoid CORS preflight
    const formData = new URLSearchParams();
    formData.append('action', action);

    // Add all data fields to form
    Object.keys(data).forEach(key => {
      formData.append(key, typeof data[key] === 'object' ? JSON.stringify(data[key]) : data[key]);
    });

    const response = await fetch(GAS_URL, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const text = await response.text();
    return JSON.parse(text);
  } catch (error) {
    console.error(`GAS API Error (${action}):`, error);
    throw error;
  }
}

export async function loginWithGAS(username: string, password: string): Promise<LoginResponse> {
  try {
    const result = await callGAS('login', { username, password });

    if (result.success && result.user) {
      // Normalize the response to match expected format
      return {
        success: true,
        user: {
          id: result.user.id,
          username: result.user.username,
          role: result.user.role,
          firstName: result.user.firstName || '',
          lastName: result.user.lastName || '',
          middleName: result.user.middleName || '',
          birthdate: result.user.birthdate || '',
          address: result.user.address || '',
          contactNumber: result.user.contactNumber || '',
          email: result.user.email || '',
          guardianName: result.user.guardianName || '',
          guardianContact: result.user.guardianContact || '',
          profilePicture: result.user.profilePicture || '',
        },
      };
    }

    return {
      success: false,
      message: result.message || 'Login failed',
    };
  } catch (error) {
    console.error('Login error:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Login failed. Please try again.',
    };
  }
}

export async function guestLoginWithGAS(name: string): Promise<LoginResponse> {
  try {
    const result = await callGAS('guestLogin', { name });
    return result;
  } catch (error) {
    console.error('Guest login error:', error);
    return {
      success: false,
      message: 'Guest login failed',
    };
  }
}

export async function getHomepageContentFromGAS() {
  try {
    // Add timestamp to prevent caching
    const result = await callGAS('getHomepageContent', { _t: Date.now() });
    return result;
  } catch (error) {
    console.error('Error fetching homepage content:', error);
    return null;
  }
}

export async function getAccessLogsFromGAS(idCode: string) {
  try {
    const result = await callGAS('getAccessLogs', { idCode });
    return result;
  } catch (error) {
    console.error('Error fetching access logs:', error);
    return { success: false, logs: [] };
  }
}

export async function searchProfilesFromGAS(searchTerm: string) {
  try {
    const result = await callGAS('searchProfiles', { search: searchTerm });
    return result;
  } catch (error) {
    console.error('Error searching profiles:', error);
    return { success: false, profiles: [] };
  }
}

// Export the generic callGAS function for other uses
export { callGAS };

export async function getDatabaseSchema() {
  try {
    const result = await callGAS('getDatabaseSchema');
    return result;
  } catch (error) {
    console.error('Error fetching database schema:', error);
    return { success: false, message: error instanceof Error ? error.message : 'Unknown error' };
  }
}

export async function getDonationsFromGAS() {
  try {
    const result = await callGAS('getDonations');
    return result;
  } catch (error) {
    console.error('Error fetching donations:', error);
    return { success: false, donations: [] };
  }
}

export async function getDonationCampaignsFromGAS() {
  try {
    const result = await callGAS('getDonationCampaigns');
    return result;
  } catch (error) {
    console.error('Error fetching donation campaigns:', error);
    return { success: false, campaigns: [] };
  }
}

export async function getDonationSettingsFromGAS() {
  try {
    const result = await callGAS('getDonationSettings');
    return result;
  } catch (error) {
    console.error('Error fetching donation settings:', error);
    return { success: false, settings: [] };
  }
}

export async function getEventsFromGAS() {
  try {
    const result = await callGAS('getEvents');
    return result;
  } catch (error) {
    console.error('Error fetching events:', error);
    return { success: false, events: [] };
  }
}

export async function recordAttendanceInGAS(idCode: string, eventId: string) {
  try {
    const result = await callGAS('recordAttendance', { idCode, eventId });
    return result;
  } catch (error) {
    console.error('Error recording attendance:', error);
    return { success: false, message: error instanceof Error ? error.message : 'Unknown error' };
  }
}

export async function recordManualAttendanceInGAS(data: any) {
  try {
    const result = await callGAS('recordManualAttendance', data);
    return result;
  } catch (error) {
    console.error('Error recording manual attendance:', error);
    return { success: false, message: error instanceof Error ? error.message : 'Unknown error' };
  }
}

export async function getEventAnalyticsFromGAS(eventId: string, committee: string) {
  try {
    const result = await callGAS('getEventAnalytics', { eventId, committee });
    return result;
  } catch (error) {
    console.error('Error fetching event analytics:', error);
    return { success: false, analytics: [] };
  }
}

export async function createEventInGAS(eventData: any) {
  try {
    const result = await callGAS('createEvent', eventData);
    return result;
  } catch (error) {
    console.error('Error creating event:', error);
    return { success: false, message: error instanceof Error ? error.message : 'Unknown error' };
  }
}


export async function toggleEventStatusInGAS(eventId: string, status: string) {
  try {
    const result = await callGAS('toggleEventStatus', { eventId, status });
    return result;
  } catch (error) {
    console.error('Error toggling event status:', error);
    return { success: false, message: error instanceof Error ? error.message : 'Unknown error' };
  }
}

export async function getUserProfileFromGAS(idCode: string) {
  try {
    const result = await callGAS('getUserProfile', { idCode });
    return result;
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return { success: false, message: error instanceof Error ? error.message : 'Unknown error' };
  }
}


export async function updateProfileInGAS(profileData: any) {
  try {
    const result = await callGAS('updateProfile', profileData);
    return result;
  } catch (error) {
    console.error('Error updating user profile:', error);
    return { success: false, message: error instanceof Error ? error.message : 'Unknown error' };
  }
}

export async function getPendingApplicationsFromGAS() {
  try {
    const result = await callGAS('getPendingApplications');
    return result;
  } catch (error) {
    console.error('Error fetching pending applications:', error);
    return { success: false, applications: [] };
  }
}

export async function approveApplicationInGAS(applicationId: string) {
  try {
    const result = await callGAS('approveApplication', { applicationId });
    return result;
  } catch (error) {
    console.error('Error approving application:', error);
    return { success: false, message: error instanceof Error ? error.message : 'Unknown error' };
  }
}

export async function rejectApplicationInGAS(applicationId: string) {
  try {
    const result = await callGAS('rejectApplication', { applicationId });
    return result;
  } catch (error) {
    console.error('Error rejecting application:', error);
    return { success: false, message: error instanceof Error ? error.message : 'Unknown error' };
  }
}

export async function addMemberToGAS(memberData: any) {
  try {
    const result = await callGAS('addMember', memberData);
    return result;
  } catch (error) {
    console.error('Error adding member:', error);
    return { success: false, message: error instanceof Error ? error.message : 'Unknown error' };
  }
}

export async function exportMembersFromGAS() {
  try {
    const result = await callGAS('exportMembers');
    return result;
  } catch (error) {
    console.error('Error exporting members:', error);
    return { success: false, members: [] };
  }
}
