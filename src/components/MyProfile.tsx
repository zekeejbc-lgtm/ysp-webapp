import React, { useState, useEffect, useRef } from 'react';
import { User, Mail, Phone, Calendar, MapPin, Briefcase, IdCard, Users, Eye, EyeOff, Loader2, AlertCircle, Camera, Upload } from 'lucide-react';
import { userAPI, UserProfile } from '../services/api';

interface MyProfileProps {
  currentUser: any;
}

export default function MyProfile({ currentUser }: MyProfileProps) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
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
        console.log('Username:', currentUser.username);
        console.log('ID Code:', currentUser.id);

        // Fetch profile using username or idCode
        const response = await userAPI.getProfile(
          currentUser.username || undefined,
          currentUser.id || undefined
        );

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
          const response = await userAPI.uploadProfilePicture(
            base64Image,
            `profile_${currentUser.username || currentUser.id}.jpg`,
            currentUser.username || undefined,
            currentUser.id || undefined,
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

  // Default profile picture if not provided
  const profilePicture = profile.profilePictureURL || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(profile.fullName) + '&size=200&background=f6421f&color=fff';

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header with Profile Picture */}
      <div className="ysp-card text-center">
        <div className="relative inline-block">
          <img
            src={profilePicture}
            alt={profile.fullName}
            className="w-32 h-32 rounded-full object-cover mx-auto shadow-lg ring-4 ring-[#f6421f]/20"
            onError={(e) => {
              // Fallback to initials avatar if image fails to load
              e.currentTarget.src = 'https://ui-avatars.com/api/?name=' + encodeURIComponent(profile.fullName) + '&size=200&background=f6421f&color=fff';
            }}
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
          
          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
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
          <div className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <Mail size={20} className="text-[#f6421f] mt-1 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm text-gray-500 dark:text-gray-400">Email Address</p>
              <p className="break-all font-medium">{profile.email}</p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <Phone size={20} className="text-[#f6421f] mt-1 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm text-gray-500 dark:text-gray-400">Contact Number</p>
              <p className="font-medium">{profile.contactNumber || 'Not provided'}</p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <Calendar size={20} className="text-[#f6421f] mt-1 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm text-gray-500 dark:text-gray-400">Birthday</p>
              <p className="font-medium">{profile.birthday}</p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <User size={20} className="text-[#f6421f] mt-1 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm text-gray-500 dark:text-gray-400">Age</p>
              <p className="font-medium">{profile.age} years old</p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg md:col-span-2">
            <Users size={20} className="text-[#f6421f] mt-1 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm text-gray-500 dark:text-gray-400">Gender & Pronouns</p>
              <p className="font-medium">{profile.gender} ({profile.pronouns})</p>
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
          <div className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <IdCard size={20} className="text-[#f6421f] mt-1 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm text-gray-500 dark:text-gray-400">ID Code</p>
              <p className="font-medium font-mono">{profile.idCode}</p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <User size={20} className="text-[#f6421f] mt-1 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm text-gray-500 dark:text-gray-400">Civil Status</p>
              <p className="font-medium">{profile.civilStatus}</p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <MapPin size={20} className="text-[#f6421f] mt-1 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm text-gray-500 dark:text-gray-400">Religion</p>
              <p className="font-medium">{profile.religion}</p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <MapPin size={20} className="text-[#f6421f] mt-1 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm text-gray-500 dark:text-gray-400">Nationality</p>
              <p className="font-medium">{profile.nationality}</p>
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
              <p className="font-medium font-mono">{profile.username}</p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div className="relative flex-1 min-w-0">
              <button
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-0 top-0 p-1 text-[#f6421f] hover:text-[#ee8724] transition-colors z-10"
                title={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
              <div className="flex items-start gap-3">
                <IdCard size={20} className="text-[#f6421f] mt-1 flex-shrink-0" />
                <div className="flex-1 min-w-0 pr-8">
                  <p className="text-sm text-gray-500 dark:text-gray-400">Password</p>
                  <p className="font-medium font-mono break-all">
                    {showPassword ? profile.password : '••••••••'}
                  </p>
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

      {/* Footer Note */}
      <div className="ysp-card bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-l-4 border-blue-500">
        <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
          📝 This information is read-only. To update your profile, please contact an administrator.
        </p>
      </div>
    </div>
  );
}
