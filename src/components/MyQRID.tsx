import { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { User, IdCard, Briefcase } from 'lucide-react';
import { userAPI, type UserProfile } from '../services/api';
import { toast } from 'sonner';

interface MyQRIDProps {
  currentUser: any;
}

export default function MyQRID({ currentUser }: MyQRIDProps) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!currentUser || !currentUser.idCode) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        const response = await userAPI.searchProfiles(currentUser.idCode);
        
        if (response.success && response.profiles && response.profiles.length > 0) {
          // Find the exact match by ID Code
          const matchedProfile = response.profiles.find(p => p.idCode === currentUser.idCode);
          setProfile(matchedProfile || response.profiles[0]);
        } else {
          // Fallback to currentUser data if API doesn't return profile
          setProfile({
            idCode: currentUser.idCode || '',
            fullName: currentUser.name || 'N/A',
            email: currentUser.email || '',
            position: 'Member', // Default position
            birthday: currentUser.birthdate || '',
            contact: currentUser.contactNumber || '',
            gender: '',
            age: 0,
            civilStatus: '',
            nationality: '',
            religion: '',
            profilePic: currentUser.profilePicture || '',
          });
        }
      } catch (error) {
        console.error('Error fetching profile:', error);
        toast.error('Failed to load profile data');
        // Set fallback data
        setProfile({
          idCode: currentUser.idCode || '',
          fullName: currentUser.name || 'N/A',
          email: currentUser.email || '',
          position: 'Member',
          birthday: '',
          contact: '',
          gender: '',
          age: 0,
          civilStatus: '',
          nationality: '',
          religion: '',
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfile();
  }, [currentUser]);

  if (!currentUser) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="ysp-card text-center">
          <p className="text-gray-500">Please log in to view your QR ID</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="ysp-card text-center">
          <p className="text-gray-500">Loading your QR ID...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="ysp-card text-center">
        <h2 className="text-[#f6421f] dark:text-[#ee8724] mb-6">My QR ID</h2>
        
        <div className="bg-white dark:bg-gray-800 p-8 rounded-lg inline-block shadow-lg mb-6">
          <QRCodeSVG
            value={profile?.idCode || currentUser.idCode || 'NO-ID'}
            size={256}
            level="H"
            includeMargin={true}
          />
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-center gap-3 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <User size={24} className="text-[#f6421f]" />
            <div className="text-left">
              <p className="text-sm text-gray-500">Full Name</p>
              <p className="font-medium">{profile?.fullName || currentUser.name || 'N/A'}</p>
            </div>
          </div>

          <div className="flex items-center justify-center gap-3 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <IdCard size={24} className="text-[#f6421f]" />
            <div className="text-left">
              <p className="text-sm text-gray-500">ID Code</p>
              <p className="font-medium">{profile?.idCode || currentUser.idCode || 'N/A'}</p>
            </div>
          </div>

          <div className="flex items-center justify-center gap-3 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <Briefcase size={24} className="text-[#f6421f]" />
            <div className="text-left">
              <p className="text-sm text-gray-500">Position</p>
              <p className="font-medium">{profile?.position || 'Member'}</p>
            </div>
          </div>
        </div>

        <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Present this QR code during events for attendance recording
          </p>
        </div>
      </div>
    </div>
  );
}
