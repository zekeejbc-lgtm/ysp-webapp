import { useState, useEffect } from 'react';
import { X, Facebook, Instagram, Twitter, Linkedin, Globe, Mail, Phone, MapPin, ExternalLink, Edit2, Save, Upload, Trash2, Plus } from 'lucide-react';
import { ImageWithFallback } from './figma/ImageWithFallback';
import uploadImageFile from '../services/uploadImage';
import { toast } from 'sonner';

interface FounderModalProps {
  isOpen: boolean;
  onClose: () => void;
  isDark: boolean;
  isAdmin: boolean;
  userIdCode?: string;
  onDataUpdated?: () => void;
  founderData?: any;
}

export default function FounderModal({ isOpen, onClose, isDark, isAdmin, userIdCode, onDataUpdated, founderData: backendFounderData }: FounderModalProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [founderData, setFounderData] = useState({
    name: '',
    nickname: '',
    title: '',
    profileImage: '',
    about: '',
    background: '',
    achievements: [] as string[],
    organizationImpact: '',
    philosophy: '',
    socialLinks: {
      facebook: '',
      instagram: '',
      twitter: '',
      linkedin: '',
      website: ''
    },
    contact: {
      email: '',
      phone: '',
      office: ''
    }
  });

  // Load data from backend when available
  // Load data from backend (new schema)
  useEffect(() => {
    if (backendFounderData) {
      setFounderData({
        name: backendFounderData.name || '',
        nickname: backendFounderData.nickname ? `a.k.a ${backendFounderData.nickname}` : 'a.k.a Wacky Racho',
        title: backendFounderData.role || '',
        profileImage: backendFounderData.profilePicture || '',
        about: backendFounderData.about || '',
        background: backendFounderData.backgroundJourney || '',
        achievements: backendFounderData.achievements || [],
        organizationImpact: backendFounderData.organizationalImpact || '',
        philosophy: backendFounderData.leadershipPhilosophy || '',
        socialLinks: {
          facebook: backendFounderData.social?.facebook || '',
          instagram: backendFounderData.social?.instagram || '',
          twitter: backendFounderData.social?.twitter || '',
          linkedin: backendFounderData.social?.linkedin || '',
          website: backendFounderData.social?.website || ''
        },
        contact: {
          email: backendFounderData.contact?.email || '',
          phone: backendFounderData.contact?.phone || '',
          office: backendFounderData.contact?.officeLocation || ''
        }
      });
    }
  }, [backendFounderData]);

  if (!isOpen) return null;

  const handleSave = async () => {
    if (!userIdCode) {
      toast.error('Please login to save changes');
      return;
    }

    try {
      const response = await fetch(import.meta.env.VITE_GAS_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          action: 'updateFounderInfo',
          idCode: userIdCode,
          founderId: '1',
          name: founderData.name,
          nickname: founderData.nickname.replace(/^a\.k\.a /,'') || '',
          role: founderData.title,
          about: founderData.about,
          backgroundJourney: founderData.background,
          achievements: founderData.achievements.join('||'),
          organizationalImpact: founderData.organizationImpact,
          leadershipPhilosophy: founderData.philosophy,
          profilePicture: founderData.profileImage,
          facebook: founderData.socialLinks.facebook,
          instagram: founderData.socialLinks.instagram,
          twitter: founderData.socialLinks.twitter,
          linkedin: founderData.socialLinks.linkedin,
          website: founderData.socialLinks.website,
          email: founderData.contact.email,
          phone: founderData.contact.phone,
          officeLocation: founderData.contact.office,
          active: 'true'
        })
      });

      const data = await response.json();
      
      if (data.success) {
        setIsEditing(false);
        toast.success('Founder profile updated successfully');
        if (onDataUpdated) onDataUpdated();
      } else {
        toast.error(data.message || 'Failed to update founder profile');
      }
    } catch (error) {
      console.error('Error updating founder profile:', error);
      toast.error('Failed to update founder profile');
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const res = await uploadImageFile(file, { uploadType: 'founder', userIdCode: userIdCode });
    if (res && res.success) {
      setFounderData({ ...founderData, profileImage: res.imageUrl || res.publicUrl || '' });
      toast.success('Profile image uploaded');
    } else {
      toast.error(res?.message || 'Failed to upload image');
    }
  };

  const addAchievement = () => {
    setFounderData({ 
      ...founderData, 
      achievements: [...founderData.achievements, 'New Achievement'] 
    });
  };

  const updateAchievement = (index: number, value: string) => {
    const newAchievements = [...founderData.achievements];
    newAchievements[index] = value;
    setFounderData({ ...founderData, achievements: newAchievements });
  };

  const removeAchievement = (index: number) => {
    const newAchievements = founderData.achievements.filter((_, i) => i !== index);
    setFounderData({ ...founderData, achievements: newAchievements });
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div 
        className={`relative w-full max-h-[90vh] overflow-y-auto rounded-2xl shadow-2xl ${
          isDark 
            ? 'bg-gray-900 border border-gray-700' 
            : 'bg-white border border-gray-200'
        }`}
        style={{
          maxWidth: '42rem',
          scrollbarWidth: 'thin',
          scrollbarColor: isDark ? '#4B5563 #1F2937' : '#D1D5DB #F3F4F6'
        }}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md">
          <h2
            style={{
              fontFamily: 'var(--font-headings)',
              fontSize: '1.5rem',
              fontWeight: 'var(--font-weight-bold)',
              color: '#f6421f',
              letterSpacing: '-0.01em',
            }}
          >
            Founder Profile
          </h2>
          <div className="flex items-center gap-2">
            {isAdmin && (
              <button
                onClick={() => isEditing ? handleSave() : setIsEditing(true)}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                aria-label={isEditing ? "Save changes" : "Edit profile"}
              >
                {isEditing ? (
                  <Save className="w-5 h-5 text-green-600" />
                ) : (
                  <Edit2 className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                )}
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              aria-label="Close modal"
            >
              <X className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Profile Header */}
          <div className="flex flex-col md:flex-row gap-6 items-start">
            {/* Profile Image */}
            <div className="shrink-0">
              <ImageWithFallback
                src={founderData.profileImage}
                alt={founderData.name}
                className="w-32 h-32 md:w-40 md:h-40 rounded-xl object-cover border-4 border-[#f6421f] shadow-lg"
              />
              {isEditing && (
                <div className="mt-2">
                  <label className="flex items-center justify-center gap-2 px-3 py-2 bg-[#f6421f] hover:bg-[#ee8724] text-white rounded-lg cursor-pointer transition-colors text-sm">
                    <Upload className="w-4 h-4" />
                    Upload Image
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/jpg"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                  </label>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 text-center">Max 5MB</p>
                </div>
              )}
            </div>

            {/* Basic Info */}
            <div className="flex-1">
              {isEditing ? (
                <>
                  <input
                    type="text"
                    value={founderData.name}
                    onChange={(e) => setFounderData({ ...founderData, name: e.target.value })}
                    className="w-full px-3 py-2 mb-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    style={{ fontSize: '1.5rem', fontWeight: '600' }}
                  />
                  <input
                    type="text"
                    value={founderData.nickname}
                    onChange={(e) => setFounderData({ ...founderData, nickname: e.target.value })}
                    className="w-full px-3 py-2 mb-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300"
                  />
                  <input
                    type="text"
                    value={founderData.title}
                    onChange={(e) => setFounderData({ ...founderData, title: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300"
                  />
                </>
              ) : (
                <>
                  <h3
                    className="text-gray-900 dark:text-white mb-1"
                    style={{ fontSize: '1.5rem', fontWeight: '600' }}
                  >
                    {founderData.name}
                  </h3>
                  <p
                    className="text-gray-700 dark:text-gray-300 italic mb-2"
                    style={{ fontSize: '1rem', fontWeight: '500' }}
                  >
                    {founderData.nickname}
                  </p>
                  <p
                    className="text-[#ee8724] mb-4"
                    style={{ fontSize: '1.125rem', fontWeight: '600' }}
                  >
                    {founderData.title}
                  </p>
                </>
              )}

              {/* Social Links */}
              {isEditing ? (
                <div className="mt-4 space-y-2">
                  <label className="text-xs text-gray-600 dark:text-gray-400">Social Links</label>
                  <input
                    type="url"
                    value={founderData.socialLinks.facebook}
                    onChange={(e) => setFounderData({ 
                      ...founderData, 
                      socialLinks: { ...founderData.socialLinks, facebook: e.target.value }
                    })}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    placeholder="Facebook URL"
                  />
                  <input
                    type="url"
                    value={founderData.socialLinks.instagram}
                    onChange={(e) => setFounderData({ 
                      ...founderData, 
                      socialLinks: { ...founderData.socialLinks, instagram: e.target.value }
                    })}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    placeholder="Instagram URL"
                  />
                  <input
                    type="url"
                    value={founderData.socialLinks.twitter}
                    onChange={(e) => setFounderData({ 
                      ...founderData, 
                      socialLinks: { ...founderData.socialLinks, twitter: e.target.value }
                    })}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    placeholder="Twitter URL"
                  />
                  <input
                    type="url"
                    value={founderData.socialLinks.linkedin}
                    onChange={(e) => setFounderData({ 
                      ...founderData, 
                      socialLinks: { ...founderData.socialLinks, linkedin: e.target.value }
                    })}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    placeholder="LinkedIn URL"
                  />
                  <input
                    type="url"
                    value={founderData.socialLinks.website}
                    onChange={(e) => setFounderData({ 
                      ...founderData, 
                      socialLinks: { ...founderData.socialLinks, website: e.target.value }
                    })}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    placeholder="Website URL"
                  />
                </div>
              ) : (
                <div className="flex flex-wrap gap-2 mt-4">
                  {founderData.socialLinks.facebook && (
                    <a
                      href={founderData.socialLinks.facebook}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30 hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors"
                    >
                      <Facebook className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    </a>
                  )}
                  {founderData.socialLinks.instagram && (
                    <a
                      href={founderData.socialLinks.instagram}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 rounded-lg bg-pink-100 dark:bg-pink-900/30 hover:bg-pink-200 dark:hover:bg-pink-900/50 transition-colors"
                    >
                      <Instagram className="w-5 h-5 text-pink-600 dark:text-pink-400" />
                    </a>
                  )}
                  {founderData.socialLinks.twitter && (
                    <a
                      href={founderData.socialLinks.twitter}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 rounded-lg bg-sky-100 dark:bg-sky-900/30 hover:bg-sky-200 dark:hover:bg-sky-900/50 transition-colors"
                    >
                      <Twitter className="w-5 h-5 text-sky-600 dark:text-sky-400" />
                    </a>
                  )}
                  {founderData.socialLinks.linkedin && (
                    <a
                      href={founderData.socialLinks.linkedin}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30 hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors"
                    >
                      <Linkedin className="w-5 h-5 text-blue-700 dark:text-blue-400" />
                    </a>
                  )}
                  {founderData.socialLinks.website && (
                    <a
                      href={founderData.socialLinks.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                    >
                      <Globe className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                    </a>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* About Section */}
          <div className="space-y-4">
            <h4
              style={{
                fontFamily: 'var(--font-headings)',
                fontSize: '1.125rem',
                fontWeight: '600',
                color: '#f6421f',
              }}
            >
              About
            </h4>
            {isEditing ? (
              <textarea
                value={founderData.about}
                onChange={(e) => setFounderData({ ...founderData, about: e.target.value })}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white min-h-[150px]"
                style={{ fontSize: '1rem', lineHeight: '1.625' }}
              />
            ) : (
              <p
                className="text-gray-800 dark:text-gray-100 text-justify whitespace-pre-line"
                style={{ fontSize: '1rem', lineHeight: '1.625', fontWeight: '500' }}
              >
                {founderData.about}
              </p>
            )}
          </div>

          {/* Background Section */}
          <div className="space-y-4">
            <h4
              style={{
                fontFamily: 'var(--font-headings)',
                fontSize: '1.125rem',
                fontWeight: '600',
                color: '#f6421f',
              }}
            >
              Background & Journey
            </h4>
            {isEditing ? (
              <textarea
                value={founderData.background}
                onChange={(e) => setFounderData({ ...founderData, background: e.target.value })}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white min-h-[150px]"
                style={{ fontSize: '1rem', lineHeight: '1.625' }}
              />
            ) : (
              <p
                className="text-gray-800 dark:text-gray-100 text-justify whitespace-pre-line"
                style={{ fontSize: '1rem', lineHeight: '1.625', fontWeight: '500' }}
              >
                {founderData.background}
              </p>
            )}
          </div>

          {/* Key Achievements Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4
                style={{
                  fontFamily: 'var(--font-headings)',
                  fontSize: '1.125rem',
                  fontWeight: '600',
                  color: '#f6421f',
                }}
              >
                Key Achievements
              </h4>
              {isEditing && (
                <button
                  onClick={addAchievement}
                  className="flex items-center gap-1 px-3 py-1 text-sm bg-[#f6421f] hover:bg-[#ee8724] text-white rounded-lg transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Add Achievement
                </button>
              )}
            </div>
            <ul className="space-y-2">
              {founderData.achievements.map((achievement, index) => (
                <li key={index} className="flex gap-3">
                  {isEditing ? (
                    <>
                      <span className="text-[#f6421f] font-bold shrink-0">•</span>
                      <input
                        type="text"
                        value={achievement}
                        onChange={(e) => updateAchievement(index, e.target.value)}
                        className="flex-1 px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                        style={{ fontSize: '1rem' }}
                      />
                      <button
                        onClick={() => removeAchievement(index)}
                        className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </>
                  ) : (
                    <>
                      <span className="text-[#f6421f] font-bold shrink-0">•</span>
                      <span
                        className="text-gray-800 dark:text-gray-100"
                        style={{ fontSize: '1rem', lineHeight: '1.625', fontWeight: '500' }}
                      >
                        {achievement}
                      </span>
                    </>
                  )}
                </li>
              ))}
            </ul>
          </div>

          {/* Organization Impact Section */}
          <div className="space-y-4">
            <h4
              style={{
                fontFamily: 'var(--font-headings)',
                fontSize: '1.125rem',
                fontWeight: '600',
                color: '#f6421f',
              }}
            >
              Organizational Impact
            </h4>
            {isEditing ? (
              <textarea
                value={founderData.organizationImpact}
                onChange={(e) => setFounderData({ ...founderData, organizationImpact: e.target.value })}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white min-h-[200px]"
                style={{ fontSize: '1rem', lineHeight: '1.625' }}
              />
            ) : (
              <p
                className="text-gray-800 dark:text-gray-100 text-justify whitespace-pre-line"
                style={{ fontSize: '1rem', lineHeight: '1.625', fontWeight: '500' }}
              >
                {founderData.organizationImpact}
              </p>
            )}
          </div>

          {/* Philosophy Section */}
          <div className="space-y-4 p-4 md:p-6 bg-gradient-to-r from-orange-50 to-yellow-50 dark:from-orange-900/20 dark:to-yellow-900/20 border-2 border-orange-200 dark:border-orange-800 rounded-xl">
            <h4
              style={{
                fontFamily: 'var(--font-headings)',
                fontSize: '1.125rem',
                fontWeight: '600',
                color: '#f6421f',
              }}
            >
              Leadership Philosophy
            </h4>
            {isEditing ? (
              <textarea
                value={founderData.philosophy}
                onChange={(e) => setFounderData({ ...founderData, philosophy: e.target.value })}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white min-h-[100px]"
                style={{ fontSize: '1rem', lineHeight: '1.625' }}
              />
            ) : (
              <p
                className="text-gray-900 dark:text-white italic text-center"
                style={{ fontSize: '1.125rem', lineHeight: '1.625', fontWeight: '500' }}
              >
                {founderData.philosophy}
              </p>
            )}
          </div>

          {/* Contact Information */}
          <div className="space-y-4">
            <h4
              style={{
                fontFamily: 'var(--font-headings)',
                fontSize: '1.125rem',
                fontWeight: '600',
                color: '#f6421f',
              }}
            >
              Contact Information
            </h4>
            {isEditing ? (
              <div className="space-y-3">
                <div>
                  <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Email</label>
                  <input
                    type="email"
                    value={founderData.contact.email}
                    onChange={(e) => setFounderData({ 
                      ...founderData, 
                      contact: { ...founderData.contact, email: e.target.value }
                    })}
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Phone</label>
                  <input
                    type="tel"
                    value={founderData.contact.phone}
                    onChange={(e) => setFounderData({ 
                      ...founderData, 
                      contact: { ...founderData.contact, phone: e.target.value }
                    })}
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Office Location</label>
                  <input
                    type="text"
                    value={founderData.contact.office}
                    onChange={(e) => setFounderData({ 
                      ...founderData, 
                      contact: { ...founderData.contact, office: e.target.value }
                    })}
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  />
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <Mail className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-600 dark:text-gray-400">Email</p>
                    <a 
                      href={`mailto:${founderData.contact.email}`}
                      className="text-sm text-gray-900 dark:text-white hover:text-[#f6421f] dark:hover:text-[#f6421f] transition-colors truncate block"
                    >
                      {founderData.contact.email}
                    </a>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <Phone className="w-5 h-5 text-green-600 dark:text-green-400 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-600 dark:text-gray-400">Phone</p>
                    <a 
                      href={`tel:${founderData.contact.phone}`}
                      className="text-sm text-gray-900 dark:text-white hover:text-[#f6421f] dark:hover:text-[#f6421f] transition-colors"
                    >
                      {founderData.contact.phone}
                    </a>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg md:col-span-2">
                  <MapPin className="w-5 h-5 text-purple-600 dark:text-purple-400 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-600 dark:text-gray-400">Office Location</p>
                    <p className="text-sm text-gray-900 dark:text-white">
                      {founderData.contact.office}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
