import React, { useState } from 'react';
import { Search, User, Mail, Phone, Calendar, MapPin, Briefcase } from 'lucide-react';
import { Input } from './ui/input';
import { Button } from './ui/button';

interface OfficerSearchProps {
  darkMode: boolean;
}

// Mock user profiles data
const mockProfiles = [
  { idCode: 'YSP-001', fullName: 'Juan Dela Cruz', email: 'juan@ysp.ph', position: 'President', birthday: '1998-03-15', contact: '+63 912 345 6789', gender: 'Male', age: 26, civilStatus: 'Single', nationality: 'Filipino', religion: 'Catholic', profilePic: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&h=200&fit=crop' },
  { idCode: 'YSP-002', fullName: 'Maria Santos', email: 'maria@ysp.ph', position: 'Committee Head', birthday: '1999-07-22', contact: '+63 923 456 7890', gender: 'Female', age: 25, civilStatus: 'Single', nationality: 'Filipino', religion: 'Catholic', profilePic: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop' },
  { idCode: 'YSP-003', fullName: 'Pedro Reyes', email: 'pedro@ysp.ph', position: 'Auditor', birthday: '1997-11-08', contact: '+63 934 567 8901', gender: 'Male', age: 27, civilStatus: 'Married', nationality: 'Filipino', religion: 'Catholic', profilePic: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop' },
  { idCode: 'YSP-004', fullName: 'Ana Garcia', email: 'ana@ysp.ph', position: 'Member', birthday: '2000-02-14', contact: '+63 945 678 9012', gender: 'Female', age: 24, civilStatus: 'Single', nationality: 'Filipino', religion: 'Born Again', profilePic: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&h=200&fit=crop' },
  { idCode: 'YSP-005', fullName: 'Carlos Martinez', email: 'carlos@ysp.ph', position: 'Vice President', birthday: '1998-09-30', contact: '+63 956 789 0123', gender: 'Male', age: 26, civilStatus: 'Single', nationality: 'Filipino', religion: 'Catholic', profilePic: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&h=200&fit=crop' }
];

export default function OfficerSearch({ darkMode }: OfficerSearchProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProfile, setSelectedProfile] = useState<typeof mockProfiles[0] | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const filteredProfiles = searchTerm
    ? mockProfiles.filter(p =>
        p.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.idCode.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : [];

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
            <div className="absolute z-10 w-full mt-2 bg-white dark:bg-gray-800 rounded-lg shadow-lg max-h-60 overflow-y-auto">
              {filteredProfiles.map((profile) => (
                <button
                  key={profile.idCode}
                  onClick={() => {
                    setSelectedProfile(profile);
                    setSearchTerm(profile.fullName);
                    setShowSuggestions(false);
                  }}
                  className="w-full px-4 py-3 text-left hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex items-center gap-3"
                >
                  <img
                    src={profile.profilePic}
                    alt={profile.fullName}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                  <div>
                    <p>{profile.fullName}</p>
                    <p className="text-sm text-gray-500">{profile.idCode} - {profile.position}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {selectedProfile && (
        <div className="ysp-card animate-[slideUp_0.3s_ease]">
          <div className="text-center mb-6">
            <img
              src={selectedProfile.profilePic}
              alt={selectedProfile.fullName}
              className="w-32 h-32 rounded-full object-cover mx-auto mb-4 shadow-lg"
            />
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
                <p className="text-sm">{selectedProfile.email}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <Phone size={20} className="text-[#f6421f]" />
              <div>
                <p className="text-sm text-gray-500">Contact</p>
                <p className="text-sm">{selectedProfile.contact}</p>
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
        </div>
      )}
    </div>
  );
}
