import React, { useState, useEffect, useRef } from 'react';
import { User, Mail, Phone, Calendar, MapPin, Briefcase, IdCard, Users, Eye, EyeOff, Loader2, AlertCircle, Camera, Upload, Edit2, Save, X } from 'lucide-react';
import { userAPI, UserProfile } from '../services/api';
import { toast } from 'sonner';

interface MyProfileProps {
  currentUser: any;
}

/**
 * Helper function to get a displayable Google Drive image URL
 * Converts various Google Drive URL formats to the thumbnail format which works better
 */
function getDisplayableGoogleDriveUrl(url: string): string {
  if (!url || url.trim() === '') return '';
  
  // Extract file ID from various Google Drive URL formats
  let fileId = '';
  
  // Format 1: https://drive.google.com/uc?export=view&id=FILE_ID
  if (url.includes('drive.google.com/uc')) {
    const match = url.match(/[?&]id=([^&]+)/);
    if (match) fileId = match[1];
  }
  // Format 2: https://drive.google.com/file/d/FILE_ID/view
  else if (url.includes('drive.google.com/file/d/')) {
    const match = url.match(/\/file\/d\/([^/]+)/);
    if (match) fileId = match[1];
  }
  // Format 3: https://drive.google.com/open?id=FILE_ID
  else if (url.includes('drive.google.com/open')) {
    const match = url.match(/[?&]id=([^&]+)/);
    if (match) fileId = match[1];
  }
  
  // If we found a file ID, return the thumbnail URL which has fewer CORS issues
  if (fileId) {
    return `https://drive.google.com/thumbnail?id=${fileId}&sz=w400`;
  }
  
  // If it's not a Google Drive URL or we couldn't parse it, return as-is
  return url;
}

export default function MyProfile({ currentUser }: MyProfileProps) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedProfile, setEditedProfile] = useState<Partial<UserProfile>>({});
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!currentUser) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        console.log('Fetching profile for user:', currentUser);
        console.log('Available properties:', Object.keys(currentUser));
        console.log('Username:', currentUser.username);
        console.log('ID Code:', currentUser.id);

        // Fetch profile using username or idCode
        // Ensure at least one parameter is provided and not empty
        const username = currentUser.username && currentUser.username.trim() !== '' ? currentUser.username : undefined;
        const idCode = currentUser.id && currentUser.id.trim() !== '' ? currentUser.id : undefined;
        
        console.log('Calling API with username:', username, 'and idCode:', idCode);
        
        // Check if we have at least one valid parameter
        if (!username && !idCode) {
          setError('User information is incomplete. Please log in again.');
          setLoading(false);
          return;
        }
        
        const response = await userAPI.getProfile(username, idCode);

        console.log('Profile response:', response);

        if (response.success && response.profile) {
          setProfile(response.profile);
        } else {
          setError(response.message || 'Failed to load profile');
        }
      } catch (err) {
        console.error('Error fetching profile:', err);
        setError('Failed to load profile. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [currentUser]);

  // Handle profile picture upload
  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('Image size should be less than 5MB');
      return;
    }

    try {
      setUploading(true);
      setUploadSuccess(false);
      setError(null);

      // Convert image to base64
      const reader = new FileReader();
      reader.onload = async (e) => {
        const base64Image = e.target?.result as string;

        try {
          // Upload to Google Drive via backend
          const username = currentUser.username && currentUser.username.trim() !== '' ? currentUser.username : undefined;
          const idCode = currentUser.id && currentUser.id.trim() !== '' ? currentUser.id : undefined;
          
          const response = await userAPI.uploadProfilePicture(
            base64Image,
            `profile_${username || idCode}.jpg`,
            username,
            idCode,
            file.type
          );

          if (response.success && response.profilePictureURL) {
            // Update local profile state immediately (real-time update)
            setProfile(prev => prev ? { ...prev, profilePictureURL: response.profilePictureURL! } : null);
            setUploadSuccess(true);
            
            // Hide success message after 3 seconds
            setTimeout(() => setUploadSuccess(false), 3000);
          } else {
            setError(response.message || 'Failed to upload profile picture');
          }
        } catch (err) {
          console.error('Upload error:', err);
          setError('Failed to upload profile picture. Please try again.');
        } finally {
          setUploading(false);
        }
      };

      reader.onerror = () => {
        setError('Failed to read image file');
        setUploading(false);
      };

      reader.readAsDataURL(file);
    } catch (err) {
      console.error('File handling error:', err);
      setError('Failed to process image file');
      setUploading(false);
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleEdit = () => {
    console.log('Edit button clicked - entering edit mode');
    setIsEditing(true);
    setEditedProfile({ ...profile });
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditedProfile({});
  };

  const handleSaveEdit = async () => {
    if (!profile || !editedProfile) return;

    try {
      setSaving(true);
      setError(null);

      // Call backend to update profile
      const response = await userAPI.updateProfile(profile.idCode, editedProfile);

      if (response.success) {
        // Update local state
        setProfile({ ...profile, ...editedProfile });
        setIsEditing(false);
        toast.success('Profile updated successfully!');
        
        // Refresh profile from backend
        setTimeout(async () => {
          const username = currentUser.username && currentUser.username.trim() !== '' ? currentUser.username : undefined;
          const idCode = currentUser.id && currentUser.id.trim() !== '' ? currentUser.id : undefined;
          const refreshResponse = await userAPI.getProfile(username, idCode);
          if (refreshResponse.success && refreshResponse.profile) {
            setProfile(refreshResponse.profile);
          }
        }, 500);
      } else {
        toast.error(response.message || 'Failed to update profile');
      }
    } catch (err) {
      console.error('Error updating profile:', err);
      toast.error('Failed to update profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleFieldChange = (field: keyof UserProfile, value: string) => {
    setEditedProfile(prev => ({ ...prev, [field]: value }));
  };

  if (!currentUser) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="ysp-card text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Please log in to view your profile.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="ysp-card text-center py-12">
          <Loader2 className="w-12 h-12 text-[#f6421f] animate-spin mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Loading your profile...</p>
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="ysp-card text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-600 dark:text-red-400 mb-4">{error || 'Profile not found'}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-gradient-to-r from-[#f6421f] to-[#ee8724] text-white rounded-lg hover:shadow-lg transition-all"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header with Profile Picture */}
      <div className="ysp-card text-center relative">
        {/* Edit/Save/Cancel Buttons */}
        <div className="absolute top-4 right-4 flex gap-2 z-10">
          {!isEditing ? (
            <button
              onClick={handleEdit}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#f6421f] to-[#ee8724] text-white rounded-lg hover:shadow-lg transition-all shadow-md"
            >
              <Edit2 size={16} />
              Edit Profile
            </button>
          ) : (
            <>
              <button
                onClick={handleSaveEdit}
                disabled={saving}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-all disabled:opacity-50 shadow-md"
              >
                {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                Save Changes
              </button>
              <button
                onClick={handleCancelEdit}
                disabled={saving}
                className="flex items-center gap-2 px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg transition-all disabled:opacity-50 shadow-md"
              >
                <X size={16} />
                Cancel
              </button>
            </>
          )}
        </div>

        <div className="relative inline-block">
          <img
            src={profile.profilePictureURL && profile.profilePictureURL.trim() !== '' 
              ? getDisplayableGoogleDriveUrl(profile.profilePictureURL)
              : `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.fullName)}&size=200&background=f6421f&color=fff`}
            alt={profile.fullName}
            className="w-32 h-32 rounded-full object-cover mx-auto shadow-lg ring-4 ring-[#f6421f]/20"
            onError={(e) => {
              console.error('Failed to load profile picture:', profile.profilePictureURL);
              console.error('Tried URL:', e.currentTarget.src);
              e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.fullName)}&size=200&background=f6421f&color=fff`;
            }}
            key={profile.profilePictureURL || 'default'}
          />
          
          {/* Upload Button Overlay */}
          <button
            onClick={handleUploadClick}
            disabled={uploading}
            className="absolute bottom-0 right-0 p-2 bg-gradient-to-r from-[#f6421f] to-[#ee8724] text-white rounded-full shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            title="Change profile picture"
          >
            {uploading ? (
              <Loader2 size={20} className="animate-spin" />
            ) : (
              <Camera size={20} />
            )}
          </button>
          
          {/* Hidden file input - NO visible text */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            style={{ display: 'none' }}
            aria-label="Upload profile picture"
          />
        </div>
        
        <h2 className="text-2xl font-bold text-[#f6421f] dark:text-[#ee8724] mt-4">{profile.fullName}</h2>
        <p className="text-gray-600 dark:text-gray-400 text-lg">{profile.username}</p>
        
        {/* Upload Status Messages */}
        {uploadSuccess && (
          <div className="mt-3 inline-flex items-center gap-2 px-4 py-2 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-lg text-sm animate-fade-in">
            <Upload size={16} />
            Profile picture updated successfully!
          </div>
        )}
        
        {error && !loading && (
          <div className="mt-3 inline-flex items-center gap-2 px-4 py-2 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-lg text-sm">
            <AlertCircle size={16} />
            {error}
          </div>
        )}
      </div>

      {/* Personal Information Card */}
      <div className="ysp-card">
        <h3 className="text-xl font-semibold text-[#f6421f] dark:text-[#ee8724] mb-4 flex items-center gap-2">
          <User size={24} />
          Personal Information
        </h3>
        <div className="grid md:grid-cols-2 gap-4">
          {/* Email */}
          <div className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <Mail size={20} className="text-[#f6421f] mt-1 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm text-gray-500 dark:text-gray-400">Email Address</p>
              {isEditing ? (
                <input
                  type="email"
                  value={editedProfile.email ?? profile.email}
                  onChange={(e) => handleFieldChange('email', e.target.value)}
                  className="w-full px-2 py-1 border rounded mt-1 text-sm"
                />
              ) : (
                <p className="break-all font-medium">{profile.email}</p>
              )}
            </div>
          </div>

          {/* Contact Number */}
          <div className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <Phone size={20} className="text-[#f6421f] mt-1 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm text-gray-500 dark:text-gray-400">Contact Number</p>
              {isEditing ? (
                <input
                  type="tel"
                  value={editedProfile.contactNumber ?? profile.contactNumber}
                  onChange={(e) => handleFieldChange('contactNumber', e.target.value)}
                  className="w-full px-2 py-1 border rounded mt-1 text-sm"
                />
              ) : (
                <p className="font-medium">{profile.contactNumber || 'Not provided'}</p>
              )}
            </div>
          </div>

          {/* Birthday */}
          <div className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <Calendar size={20} className="text-[#f6421f] mt-1 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm text-gray-500 dark:text-gray-400">Birthday</p>
              {isEditing ? (
                <input
                  type="text"
                  placeholder="e.g., January 15, 1990"
                  value={editedProfile.birthday ?? profile.birthday}
                  onChange={(e) => handleFieldChange('birthday', e.target.value)}
                  className="w-full px-2 py-1 border rounded mt-1 text-sm"
                />
              ) : (
                <p className="font-medium">{profile.birthday}</p>
              )}
            </div>
          </div>

          {/* Age */}
          <div className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <User size={20} className="text-[#f6421f] mt-1 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm text-gray-500 dark:text-gray-400">Age</p>
              {isEditing ? (
                <input
                  type="number"
                  value={editedProfile.age ?? profile.age}
                  onChange={(e) => handleFieldChange('age', e.target.value)}
                  className="w-full px-2 py-1 border rounded mt-1 text-sm"
                />
              ) : (
                <p className="font-medium">{profile.age} years old</p>
              )}
            </div>
          </div>

          {/* Gender & Pronouns */}
          <div className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg md:col-span-2">
            <Users size={20} className="text-[#f6421f] mt-1 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm text-gray-500 dark:text-gray-400">Gender & Pronouns</p>
              {isEditing ? (
                <div className="flex gap-2 mt-1">
                  <input
                    type="text"
                    placeholder="Gender"
                    value={editedProfile.gender ?? profile.gender}
                    onChange={(e) => handleFieldChange('gender', e.target.value)}
                    className="flex-1 px-2 py-1 border rounded text-sm"
                  />
                  <input
                    type="text"
                    placeholder="Pronouns"
                    value={editedProfile.pronouns ?? profile.pronouns}
                    onChange={(e) => handleFieldChange('pronouns', e.target.value)}
                    className="flex-1 px-2 py-1 border rounded text-sm"
                  />
                </div>
              ) : (
                <p className="font-medium">{profile.gender} ({profile.pronouns})</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Identity Card */}
      <div className="ysp-card">
        <h3 className="text-xl font-semibold text-[#f6421f] dark:text-[#ee8724] mb-4 flex items-center gap-2">
          <IdCard size={24} />
          Identity Information
        </h3>
        <div className="grid md:grid-cols-2 gap-4">
          {/* ID Code - Read only */}
          <div className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <IdCard size={20} className="text-[#f6421f] mt-1 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm text-gray-500 dark:text-gray-400">ID Code</p>
              <p className="font-medium font-mono">{profile.idCode}</p>
            </div>
          </div>

          {/* Civil Status */}
          <div className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <User size={20} className="text-[#f6421f] mt-1 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm text-gray-500 dark:text-gray-400">Civil Status</p>
              {isEditing ? (
                <select
                  value={editedProfile.civilStatus ?? profile.civilStatus}
                  onChange={(e) => handleFieldChange('civilStatus', e.target.value)}
                  className="w-full px-2 py-1 border rounded mt-1 text-sm"
                >
                  <option value="Single">Single</option>
                  <option value="Married">Married</option>
                  <option value="Divorced">Divorced</option>
                  <option value="Widowed">Widowed</option>
                </select>
              ) : (
                <p className="font-medium">{profile.civilStatus}</p>
              )}
            </div>
          </div>

          {/* Religion */}
          <div className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <MapPin size={20} className="text-[#f6421f] mt-1 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm text-gray-500 dark:text-gray-400">Religion</p>
              {isEditing ? (
                <input
                  type="text"
                  value={editedProfile.religion ?? profile.religion}
                  onChange={(e) => handleFieldChange('religion', e.target.value)}
                  className="w-full px-2 py-1 border rounded mt-1 text-sm"
                />
              ) : (
                <p className="font-medium">{profile.religion}</p>
              )}
            </div>
          </div>

          {/* Nationality */}
          <div className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <MapPin size={20} className="text-[#f6421f] mt-1 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm text-gray-500 dark:text-gray-400">Nationality</p>
              {isEditing ? (
                <input
                  type="text"
                  value={editedProfile.nationality ?? profile.nationality}
                  onChange={(e) => handleFieldChange('nationality', e.target.value)}
                  className="w-full px-2 py-1 border rounded mt-1 text-sm"
                />
              ) : (
                <p className="font-medium">{profile.nationality}</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Account Information Card */}
      <div className="ysp-card">
        <h3 className="text-xl font-semibold text-[#f6421f] dark:text-[#ee8724] mb-4 flex items-center gap-2">
          <Briefcase size={24} />
          Account Information
        </h3>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <User size={20} className="text-[#f6421f] mt-1 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm text-gray-500 dark:text-gray-400">Username</p>
              {isEditing ? (
                <input
                  type="text"
                  value={editedProfile.username ?? profile.username}
                  onChange={(e) => handleFieldChange('username', e.target.value)}
                  className="w-full px-2 py-1 border rounded mt-1 text-sm font-mono"
                />
              ) : (
                <p className="font-medium font-mono">{profile.username}</p>
              )}
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div className="relative flex-1 min-w-0">
              {!isEditing && (
                <button
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-0 top-0 p-1 text-[#f6421f] hover:text-[#ee8724] transition-colors z-10"
                  title={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              )}
              <div className="flex items-start gap-3">
                <IdCard size={20} className="text-[#f6421f] mt-1 flex-shrink-0" />
                <div className="flex-1 min-w-0 pr-8">
                  <p className="text-sm text-gray-500 dark:text-gray-400">Password</p>
                  {isEditing ? (
                    <input
                      type="text"
                      value={editedProfile.password ?? profile.password}
                      onChange={(e) => handleFieldChange('password', e.target.value)}
                      className="w-full px-2 py-1 border rounded mt-1 text-sm font-mono"
                      placeholder="Enter new password"
                    />
                  ) : (
                    <p className="font-medium font-mono break-all">
                      {showPassword ? profile.password : '••••••••'}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <Briefcase size={20} className="text-[#f6421f] mt-1 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm text-gray-500 dark:text-gray-400">Position</p>
              <p className="font-medium">{profile.position}</p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <Users size={20} className="text-[#f6421f] mt-1 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm text-gray-500 dark:text-gray-400">Role</p>
              <p className="font-medium">{profile.role}</p>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
