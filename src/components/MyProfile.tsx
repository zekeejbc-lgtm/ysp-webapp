import React from 'react';
import { User, Mail, Phone, Calendar, MapPin, Briefcase, IdCard, Users } from 'lucide-react';

interface MyProfileProps {
  darkMode: boolean;
  currentUser: any;
}

export default function MyProfile({ darkMode, currentUser }: MyProfileProps) {
  if (!currentUser) return null;

  // Extended profile data - In production, this would be fetched from User Profiles sheet
  const profileData = {
    ...currentUser,
    birthday: '1999-07-22',
    age: 25,
    gender: 'Female',
    pronouns: 'She/Her',
    civilStatus: 'Single',
    contact: '+63 923 456 7890',
    religion: 'Catholic',
    nationality: 'Filipino',
    username: currentUser.username || 'head',
    profilePic: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop'
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="ysp-card">
        <h2 className="text-[#f6421f] dark:text-[#ee8724] mb-6 text-center">My Profile</h2>

        <div className="text-center mb-8">
          <img
            src={profileData.profilePic}
            alt={profileData.fullName}
            className="w-40 h-40 rounded-full object-cover mx-auto mb-4 shadow-lg ring-4 ring-[#f6421f]/20"
          />
          <h3 className="text-[#f6421f] dark:text-[#ee8724] mb-1">{profileData.fullName}</h3>
          <p className="text-gray-600 dark:text-gray-400">{profileData.position}</p>
          <p className="text-sm text-gray-500">{profileData.role}</p>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div className="flex items-start gap-3 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <Mail size={24} className="text-[#f6421f] mt-1" />
            <div className="flex-1">
              <p className="text-sm text-gray-500">Email Address</p>
              <p className="break-all">{profileData.email}</p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <IdCard size={24} className="text-[#f6421f] mt-1" />
            <div className="flex-1">
              <p className="text-sm text-gray-500">ID Code</p>
              <p>{profileData.idCode}</p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <Phone size={24} className="text-[#f6421f] mt-1" />
            <div className="flex-1">
              <p className="text-sm text-gray-500">Contact Number</p>
              <p>{profileData.contact}</p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <Calendar size={24} className="text-[#f6421f] mt-1" />
            <div className="flex-1">
              <p className="text-sm text-gray-500">Birthday</p>
              <p>{profileData.birthday}</p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <User size={24} className="text-[#f6421f] mt-1" />
            <div className="flex-1">
              <p className="text-sm text-gray-500">Age</p>
              <p>{profileData.age} years old</p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <Users size={24} className="text-[#f6421f] mt-1" />
            <div className="flex-1">
              <p className="text-sm text-gray-500">Gender & Pronouns</p>
              <p>{profileData.gender} ({profileData.pronouns})</p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <User size={24} className="text-[#f6421f] mt-1" />
            <div className="flex-1">
              <p className="text-sm text-gray-500">Civil Status</p>
              <p>{profileData.civilStatus}</p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <MapPin size={24} className="text-[#f6421f] mt-1" />
            <div className="flex-1">
              <p className="text-sm text-gray-500">Religion</p>
              <p>{profileData.religion}</p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <MapPin size={24} className="text-[#f6421f] mt-1" />
            <div className="flex-1">
              <p className="text-sm text-gray-500">Nationality</p>
              <p>{profileData.nationality}</p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <User size={24} className="text-[#f6421f] mt-1" />
            <div className="flex-1">
              <p className="text-sm text-gray-500">Username</p>
              <p>{profileData.username}</p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg md:col-span-2">
            <Briefcase size={24} className="text-[#f6421f] mt-1" />
            <div className="flex-1">
              <p className="text-sm text-gray-500">Position & Role</p>
              <p>{profileData.position} - {profileData.role}</p>
            </div>
          </div>
        </div>

        <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-center">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            This information is read-only. Contact an administrator to update your profile.
          </p>
        </div>
      </div>
    </div>
  );
}
