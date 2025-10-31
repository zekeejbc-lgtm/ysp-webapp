import { useState, useEffect } from 'react';
import { Search, User, Mail, Phone, Calendar, MapPin, Briefcase } from 'lucide-react';
import { motion } from 'framer-motion';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { userAPI, type UserProfile } from '../services/api';
import { toast } from 'sonner';
import { ListSkeleton, ProfileSkeleton } from './ui/skeletons';
import { OptimizedImage } from './OptimizedImage';
import { debounce } from '../utils/performance';

interface OfficerSearchProps {
  darkMode: boolean;
}

export default function OfficerSearch({ darkMode }: OfficerSearchProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProfile, setSelectedProfile] = useState<UserProfile | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [profileLoading, setProfileLoading] = useState(false);

  // keep darkMode referenced
  void darkMode;

  // Helper: Convert Google Drive URLs to thumbnail form for reliable display
  function getDisplayableGoogleDriveUrl(url: string): string {
    if (!url || url.trim() === '') return '';
    let fileId = '';
    if (url.includes('drive.google.com/uc')) {
      const match = url.match(/[?&]id=([^&]+)/);
      if (match) fileId = match[1];
    } else if (url.includes('drive.google.com/file/d/')) {
      const match = url.match(/\/file\/d\/([^/]+)/);
      if (match) fileId = match[1];
    } else if (url.includes('drive.google.com/open')) {
      const match = url.match(/[?&]id=([^&]+)/);
      if (match) fileId = match[1];
    }
    return fileId ? `https://drive.google.com/thumbnail?id=${fileId}&sz=w400` : url;
  }

  // Search profiles as user types with debouncing
  useEffect(() => {
    const searchProfiles = async () => {
      if (!searchTerm || searchTerm.length < 2) {
        setProfiles([]);
        return;
      }

      setIsLoading(true);
      try {
        const response: any = await userAPI.searchProfiles(searchTerm);
        if (response.success && response.profiles) {
          // Normalize backend keys to match UserProfile shape expected here
          const normalized: UserProfile[] = response.profiles.map((p: any) => ({
            fullName: p.fullName || '',
            username: p.username || '',
            idCode: p.idCode || '',
            email: p.email || '',
            contactNumber: p.contact || '',
            birthday: p.birthday || '',
            age: String(p.age ?? ''),
            gender: p.gender || '',
            pronouns: p.pronouns || '',
            civilStatus: p.civilStatus || '',
            religion: p.religion || '',
            nationality: p.nationality || '',
            password: '',
            position: p.position || '',
            role: p.role || '',
            profilePictureURL: getDisplayableGoogleDriveUrl(p.profilePic || p.profilePictureURL || ''),
          }));
          setProfiles(normalized);
        } else {
          setProfiles([]);
        }
      } catch (error) {
        console.error('Error searching profiles:', error);
        toast.error('Failed to search profiles');
        setProfiles([]);
      } finally {
        setIsLoading(false);
      }
    };

    // Debounce search for better performance
    const debouncedSearch = debounce(searchProfiles, 500);
    debouncedSearch();

    return () => {
      // Cleanup is handled by debounce function
    };
  }, [searchTerm]);

  const filteredProfiles = profiles;

  return (
    <div className="max-w-4xl mx-auto">
      <div className="ysp-card mb-6">
        <h2 className="text-[#f6421f] dark:text-[#ee8724] mb-4">Officer Directory Search</h2>
        
        <div className="relative">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <Input
                type="text"
                placeholder="Search by name or ID code..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setShowSuggestions(true);
                }}
                onFocus={() => setShowSuggestions(true)}
                className="pl-10"
              />
            </div>
          </div>

          {showSuggestions && filteredProfiles.length > 0 && (
            <div className="absolute z-10 w-full mt-2 bg-white dark:bg-gray-800 rounded-lg shadow-lg max-h-60 overflow-y-auto border border-gray-200 dark:border-gray-700">
              {filteredProfiles.map((profile) => (
                <motion.button
                  key={profile.idCode}
                  whileHover={{ scale: 1.02 }}
                  onClick={() => {
                    setProfileLoading(true);
                    setSelectedProfile(profile);
                    setSearchTerm(profile.fullName);
                    setShowSuggestions(false);
                  }}
                  className="w-full px-4 py-3 text-left hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex items-center gap-3"
                >
                  {profile.profilePictureURL && (
                    <img
                      src={profile.profilePictureURL}
                      alt={profile.fullName}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                  )}
                  {!profile.profilePictureURL && (
                    <div className="w-10 h-10 rounded-full bg-gradient-to-r from-[#f6421f] to-[#ee8724] flex items-center justify-center">
                      <User size={20} className="text-white" />
                    </div>
                  )}
                  <div>
                    <p className="font-medium">{profile.fullName}</p>
                    <p className="text-sm text-gray-500">{profile.idCode} - {profile.position}</p>
                  </div>
                </motion.button>
              ))}
            </div>
          )}

          {showSuggestions && isLoading && (
            <div className="absolute z-10 w-full mt-2 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
              <ListSkeleton items={3} />
            </div>
          )}

          {showSuggestions && !isLoading && searchTerm.length >= 2 && filteredProfiles.length === 0 && (
            <div className="absolute z-10 w-full mt-2 bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 text-center border border-gray-200 dark:border-gray-700">
              <p className="text-gray-500">No profiles found</p>
            </div>
          )}
        </div>
      </div>

      {selectedProfile && profileLoading && (
        <div className="ysp-card">
          <ProfileSkeleton />
        </div>
      )}

      {selectedProfile && !profileLoading && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="ysp-card"
        >
          <div className="text-center mb-6">
            {selectedProfile.profilePictureURL ? (
              <OptimizedImage
                src={selectedProfile.profilePictureURL}
                alt={selectedProfile.fullName}
                className="w-32 h-32 rounded-full object-cover mx-auto mb-4 shadow-lg"
                fallbackSrc={`https://ui-avatars.com/api/?name=${encodeURIComponent(selectedProfile.fullName)}&size=200&background=f6421f&color=fff`}
                loading="eager"
                onLoad={() => setProfileLoading(false)}
              />
            ) : (
              <div className="w-32 h-32 rounded-full bg-gradient-to-r from-[#f6421f] to-[#ee8724] flex items-center justify-center mx-auto mb-4 shadow-lg">
                <User size={48} className="text-white" />
              </div>
            )}
            <h3 className="text-[#f6421f] dark:text-[#ee8724] mb-1">{selectedProfile.fullName}</h3>
            <p className="text-gray-600 dark:text-gray-400">{selectedProfile.position}</p>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <User size={20} className="text-[#f6421f]" />
              <div>
                <p className="text-sm text-gray-500">ID Code</p>
                <p>{selectedProfile.idCode}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <Mail size={20} className="text-[#f6421f]" />
              <div>
                <p className="text-sm text-gray-500">Email</p>
                {selectedProfile.email ? (
                  <a
                    href={`mailto:${selectedProfile.email}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-[#f6421f] dark:text-[#ee8724] underline hover:opacity-90"
                  >
                    {selectedProfile.email}
                  </a>
                ) : (
                  <p className="text-sm">N/A</p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <Phone size={20} className="text-[#f6421f]" />
              <div>
                <p className="text-sm text-gray-500">Contact</p>
                {selectedProfile.contactNumber ? (
                  <a
                    href={`tel:${selectedProfile.contactNumber}`}
                    className="text-sm text-[#f6421f] dark:text-[#ee8724] underline hover:opacity-90"
                  >
                    {selectedProfile.contactNumber}
                  </a>
                ) : (
                  <p className="text-sm">N/A</p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <Calendar size={20} className="text-[#f6421f]" />
              <div>
                <p className="text-sm text-gray-500">Birthday & Age</p>
                <p className="text-sm">{selectedProfile.birthday} ({selectedProfile.age} years old)</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <User size={20} className="text-[#f6421f]" />
              <div>
                <p className="text-sm text-gray-500">Gender & Civil Status</p>
                <p className="text-sm">{selectedProfile.gender}, {selectedProfile.civilStatus}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <MapPin size={20} className="text-[#f6421f]" />
              <div>
                <p className="text-sm text-gray-500">Nationality & Religion</p>
                <p className="text-sm">{selectedProfile.nationality}, {selectedProfile.religion}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg md:col-span-2">
              <Briefcase size={20} className="text-[#f6421f]" />
              <div>
                <p className="text-sm text-gray-500">Position</p>
                <p>{selectedProfile.position}</p>
              </div>
            </div>
          </div>

          <Button
            onClick={() => {
              setSelectedProfile(null);
              setSearchTerm('');
            }}
            className="w-full mt-6 bg-gray-500 hover:bg-gray-600"
          >
            Clear
          </Button>
        </motion.div>
      )}
    </div>
  );
}
