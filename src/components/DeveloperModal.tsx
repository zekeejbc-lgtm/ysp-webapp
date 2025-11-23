import { useState, useEffect } from 'react';
import { X, Facebook, Instagram, Twitter, Linkedin, Github, Globe, Mail, Phone, MapPin, Code2, Edit2, Save, Upload, Trash2, Plus } from 'lucide-react';
import { ImageWithFallback } from './figma/ImageWithFallback';
import uploadImageFile from '../services/uploadImage';
import { toast } from 'sonner';

interface DeveloperModalProps {
  isOpen: boolean;
  onClose: () => void;
  isDark: boolean;
  isAdmin: boolean;
  userIdCode?: string;
  onDataUpdated?: () => void;
  developerData?: any;
}

export default function DeveloperModal({ isOpen, onClose, isDark, isAdmin, userIdCode, onDataUpdated, developerData: backendDeveloperData }: DeveloperModalProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [visibleAchievementsCount, setVisibleAchievementsCount] = useState(10);
  const [developerData, setDeveloperData] = useState({
    name: '',
    title: '',
    organization: 'Youth Service Philippines - Tagum Chapter',
    position: 'Membership and Internal Affairs Officer',
    profileImage: '',
    about: '',
    background: '',
    expertise: [] as string[],
    projectHighlights: '',
    philosophy: '',
    socialLinks: {
      facebook: '',
      instagram: '',
      twitter: '',
      linkedin: '',
      github: '',
      website: ''
    },
    contact: {
      email: '',
      phone: '',
      location: ''
    },
    techStack: [] as Array<{name: string; category: string;}>
  });

  // Load data from backend (new schema)
  useEffect(() => {
    if (backendDeveloperData) {
      setDeveloperData({
        name: backendDeveloperData.name || '',
        title: backendDeveloperData.role || '',
        organization: 'Youth Service Philippines - Tagum Chapter',
        position: backendDeveloperData.affiliations?.[0]?.position || 'Membership and Internal Affairs Officer',
        profileImage: backendDeveloperData.profilePicture || '',
        about: backendDeveloperData.about || '',
        background: (backendDeveloperData.backgroundSegments || []).join('\n\n'),
        expertise: backendDeveloperData.backgroundSegments || [],
        projectHighlights: backendDeveloperData.projectHighlights || '',
        philosophy: backendDeveloperData.personalPhilosophy || '',
        socialLinks: {
          facebook: backendDeveloperData.social?.facebook || '',
          instagram: backendDeveloperData.social?.instagram || '',
          twitter: backendDeveloperData.social?.twitter || '',
          linkedin: backendDeveloperData.social?.linkedin || '',
          github: '',
          website: backendDeveloperData.social?.website || ''
        },
        contact: {
          email: backendDeveloperData.contact?.email || '',
          phone: backendDeveloperData.contact?.phone || '',
          location: backendDeveloperData.contact?.location || ''
        },
        techStack: []
      });
      setVisibleAchievementsCount(10); // Reset to show first 10 achievements
    }
  }, [backendDeveloperData]);

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
          action: 'updateDeveloperInfo',
          idCode: userIdCode,
          developerId: '1',
          name: developerData.name,
          role: developerData.title,
          about: developerData.about,
          backgrounds: developerData.expertise.join('||'),
          affiliations: `Youth Service Philippines - Tagum Chapter::${developerData.position}`,
          projectHighlights: developerData.projectHighlights,
            personalPhilosophy: developerData.philosophy,
          profilePicture: developerData.profileImage,
          facebook: developerData.socialLinks.facebook,
          instagram: developerData.socialLinks.instagram,
          twitter: developerData.socialLinks.twitter,
          linkedin: developerData.socialLinks.linkedin,
          website: developerData.socialLinks.website,
          email: developerData.contact.email,
          phone: developerData.contact.phone,
          location: developerData.contact.location,
          active: 'true'
        })
      });

      const data = await response.json();
      
      if (data.success) {
        setIsEditing(false);
        toast.success('Developer profile updated successfully');
        if (onDataUpdated) onDataUpdated();
      } else {
        toast.error(data.message || 'Failed to update developer profile');
      }
    } catch (error) {
      console.error('Error updating developer profile:', error);
      toast.error('Failed to update developer profile');
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const res = await uploadImageFile(file, { uploadType: 'developer', userIdCode: userIdCode });
    if (res && res.success) {
      setDeveloperData({ ...developerData, profileImage: res.imageUrl || res.publicUrl || res.profilePictureURL || '' });
      toast.success('Profile image uploaded');
    } else {
      toast.error(res?.message || 'Failed to upload image');
    }
  };

  const addExpertise = () => {
    setDeveloperData({ 
      ...developerData, 
      expertise: [...developerData.expertise, 'New Skill'] 
    });
  };

  const updateExpertise = (index: number, value: string) => {
    const newExpertise = [...developerData.expertise];
    newExpertise[index] = value;
    setDeveloperData({ ...developerData, expertise: newExpertise });
  };

  const removeExpertise = (index: number) => {
    const newExpertise = developerData.expertise.filter((_, i) => i !== index);
    setDeveloperData({ ...developerData, expertise: newExpertise });
  };

  const addTechStack = () => {
    setDeveloperData({ 
      ...developerData, 
      techStack: [...developerData.techStack, { name: 'New Tech', category: 'Category' }] 
    });
  };

  const updateTechStack = (index: number, field: 'name' | 'category', value: string) => {
    const newTechStack = [...developerData.techStack];
    newTechStack[index][field] = value;
    setDeveloperData({ ...developerData, techStack: newTechStack });
  };

  const removeTechStack = (index: number) => {
    const newTechStack = developerData.techStack.filter((_, i) => i !== index);
    setDeveloperData({ ...developerData, techStack: newTechStack });
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
            Developer Profile
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
                src={developerData.profileImage}
                alt={developerData.name}
                className="w-32 h-32 md:w-40 md:h-40 rounded-xl object-cover border-4 border-[#3b82f6] shadow-lg"
              />
              {isEditing && (
                <div className="mt-2">
                  <label className="flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg cursor-pointer transition-colors text-sm">
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
                    value={developerData.name}
                    onChange={(e) => setDeveloperData({ ...developerData, name: e.target.value })}
                    className="w-full px-3 py-2 mb-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    style={{ fontSize: '1.5rem', fontWeight: '600' }}
                  />
                  <input
                    type="text"
                    value={developerData.title}
                    onChange={(e) => setDeveloperData({ ...developerData, title: e.target.value })}
                    className="w-full px-3 py-2 mb-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300"
                  />
                  <input
                    type="text"
                    value={developerData.position}
                    onChange={(e) => setDeveloperData({ ...developerData, position: e.target.value })}
                    className="w-full px-3 py-2 mb-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300"
                  />
                  <input
                    type="text"
                    value={developerData.organization}
                    onChange={(e) => setDeveloperData({ ...developerData, organization: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300"
                  />
                </>
              ) : (
                <>
                  <h3
                    className="text-gray-900 dark:text-white mb-1"
                    style={{ fontSize: '1.5rem', fontWeight: '600' }}
                  >
                    {developerData.name}
                  </h3>
                  <p
                    className="text-[#3b82f6] mb-2"
                    style={{ fontSize: '1.125rem', fontWeight: '600' }}
                  >
                    <Code2 className="w-4 h-4 inline mr-1" />
                    {developerData.title}
                  </p>
                  <p
                    className="text-gray-700 dark:text-gray-300 mb-1"
                    style={{ fontSize: '1rem', fontWeight: '500' }}
                  >
                    {developerData.position}
                  </p>
                  <p
                    className="text-gray-600 dark:text-gray-400"
                    style={{ fontSize: '0.875rem', fontWeight: '500' }}
                  >
                    {developerData.organization}
                  </p>
                </>
              )}

              {/* Social Links */}
              {isEditing ? (
                <div className="mt-4 space-y-2">
                  <label className="text-xs text-gray-600 dark:text-gray-400">Social Links</label>
                  <input
                    type="url"
                    value={developerData.socialLinks.github}
                    onChange={(e) => setDeveloperData({ 
                      ...developerData, 
                      socialLinks: { ...developerData.socialLinks, github: e.target.value }
                    })}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    placeholder="GitHub URL"
                  />
                  <input
                    type="url"
                    value={developerData.socialLinks.facebook}
                    onChange={(e) => setDeveloperData({ 
                      ...developerData, 
                      socialLinks: { ...developerData.socialLinks, facebook: e.target.value }
                    })}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    placeholder="Facebook URL"
                  />
                  <input
                    type="url"
                    value={developerData.socialLinks.linkedin}
                    onChange={(e) => setDeveloperData({ 
                      ...developerData, 
                      socialLinks: { ...developerData.socialLinks, linkedin: e.target.value }
                    })}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    placeholder="LinkedIn URL"
                  />
                  <input
                    type="url"
                    value={developerData.socialLinks.twitter}
                    onChange={(e) => setDeveloperData({ 
                      ...developerData, 
                      socialLinks: { ...developerData.socialLinks, twitter: e.target.value }
                    })}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    placeholder="Twitter URL"
                  />
                  <input
                    type="url"
                    value={developerData.socialLinks.website}
                    onChange={(e) => setDeveloperData({ 
                      ...developerData, 
                      socialLinks: { ...developerData.socialLinks, website: e.target.value }
                    })}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    placeholder="Website URL"
                  />
                </div>
              ) : (
                <div className="flex flex-wrap gap-2 mt-4">
                  {developerData.socialLinks.github && (
                    <a
                      href={developerData.socialLinks.github}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                    >
                      <Github className="w-5 h-5 text-gray-900 dark:text-white" />
                    </a>
                  )}
                  {developerData.socialLinks.facebook && (
                    <a
                      href={developerData.socialLinks.facebook}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30 hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors"
                    >
                      <Facebook className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    </a>
                  )}
                  {developerData.socialLinks.linkedin && (
                    <a
                      href={developerData.socialLinks.linkedin}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30 hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors"
                    >
                      <Linkedin className="w-5 h-5 text-blue-700 dark:text-blue-400" />
                    </a>
                  )}
                  {developerData.socialLinks.twitter && (
                    <a
                      href={developerData.socialLinks.twitter}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 rounded-lg bg-sky-100 dark:bg-sky-900/30 hover:bg-sky-200 dark:hover:bg-sky-900/50 transition-colors"
                    >
                      <Twitter className="w-5 h-5 text-sky-600 dark:text-sky-400" />
                    </a>
                  )}
                  {developerData.socialLinks.website && (
                    <a
                      href={developerData.socialLinks.website}
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
                value={developerData.about}
                onChange={(e) => setDeveloperData({ ...developerData, about: e.target.value })}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white min-h-[150px]"
                style={{ fontSize: '1rem', lineHeight: '1.625' }}
              />
            ) : (
              <p
                className="text-gray-800 dark:text-gray-100 text-justify whitespace-pre-line"
                style={{ fontSize: '1rem', lineHeight: '1.625', fontWeight: '500' }}
              >
                {developerData.about}
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
              Background
            </h4>
            {isEditing ? (
              <textarea
                value={developerData.background}
                onChange={(e) => setDeveloperData({ ...developerData, background: e.target.value })}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white min-h-[150px]"
                style={{ fontSize: '1rem', lineHeight: '1.625' }}
              />
            ) : (
              <p
                className="text-gray-800 dark:text-gray-100 text-justify whitespace-pre-line"
                style={{ fontSize: '1rem', lineHeight: '1.625', fontWeight: '500' }}
              >
                {developerData.background}
              </p>
            )}
          </div>

          {/* Leadership Background Section */}
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
                Leadership Background
              </h4>
              {isEditing && (
                <button
                  onClick={addExpertise}
                  className="flex items-center gap-1 px-3 py-1 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Add Skill
                </button>
              )}
            </div>
            <ul className="space-y-2">
              {developerData.expertise.slice(0, visibleAchievementsCount).map((skill, index) => (
                <li key={index} className="flex gap-3">
                  {isEditing ? (
                    <>
                      <span className="text-[#3b82f6] font-bold shrink-0">•</span>
                      <input
                        type="text"
                        value={skill}
                        onChange={(e) => updateExpertise(index, e.target.value)}
                        className="flex-1 px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                        style={{ fontSize: '1rem' }}
                      />
                      <button
                        onClick={() => removeExpertise(index)}
                        className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </>
                  ) : (
                    <>
                      <span className="text-[#3b82f6] font-bold shrink-0">•</span>
                      <span
                        className="text-gray-800 dark:text-gray-100"
                        style={{ fontSize: '1rem', lineHeight: '1.625', fontWeight: '500' }}
                      >
                        {skill}
                      </span>
                    </>
                  )}
                </li>
              ))}
            </ul>
            {developerData.expertise.length > visibleAchievementsCount && (
              <div className="mt-4 text-center">
                <button
                  onClick={() => setVisibleAchievementsCount(prev => prev + 10)}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm font-medium"
                >
                  Show More Achievements ({developerData.expertise.length - visibleAchievementsCount} remaining)
                </button>
              </div>
            )}
          </div>

          {/* Affiliations Section */}
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
                Affiliations
              </h4>
              {isEditing && (
                <button
                  onClick={addTechStack}
                  className="flex items-center gap-1 px-3 py-1 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Add Affiliation
                </button>
              )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {developerData.techStack.map((tech, index) => (
                <div
                  key={index}
                  className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg"
                >
                  {isEditing ? (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={tech.name}
                          onChange={(e) => updateTechStack(index, 'name', e.target.value)}
                          className="flex-1 px-2 py-1 text-sm rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                          placeholder="Tech name"
                        />
                        <button
                          onClick={() => removeTechStack(index)}
                          className="p-1 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      <input
                        type="text"
                        value={tech.category}
                        onChange={(e) => updateTechStack(index, 'category', e.target.value)}
                        className="w-full px-2 py-1 text-xs rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                        placeholder="Category"
                      />
                    </div>
                  ) : (
                    <>
                      <p
                        className="text-gray-900 dark:text-white mb-1"
                        style={{ fontSize: '0.875rem', fontWeight: '600' }}
                      >
                        {tech.name}
                      </p>
                      <p
                        className="text-gray-600 dark:text-gray-400"
                        style={{ fontSize: '0.75rem', fontWeight: '500' }}
                      >
                        {tech.category}
                      </p>
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Project Highlights Section */}
          <div className="space-y-4">
            <h4
              style={{
                fontFamily: 'var(--font-headings)',
                fontSize: '1.125rem',
                fontWeight: '600',
                color: '#f6421f',
              }}
            >
              Project Highlights
            </h4>
            {isEditing ? (
              <textarea
                value={developerData.projectHighlights}
                onChange={(e) => setDeveloperData({ ...developerData, projectHighlights: e.target.value })}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white min-h-[200px]"
                style={{ fontSize: '1rem', lineHeight: '1.625' }}
              />
            ) : (
              <p
                className="text-gray-800 dark:text-gray-100 text-justify whitespace-pre-line"
                style={{ fontSize: '1rem', lineHeight: '1.625', fontWeight: '500' }}
              >
                {developerData.projectHighlights}
              </p>
            )}
          </div>

          {/* Philosophy Section */}
          <div className="space-y-4 p-4 md:p-6 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-2 border-blue-200 dark:border-blue-800 rounded-xl">
            <h4
              style={{
                fontFamily: 'var(--font-headings)',
                fontSize: '1.125rem',
                fontWeight: '600',
                color: '#f6421f',
              }}
            >
              Development Philosophy
            </h4>
            {isEditing ? (
              <textarea
                value={developerData.philosophy}
                onChange={(e) => setDeveloperData({ ...developerData, philosophy: e.target.value })}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white min-h-[100px]"
                style={{ fontSize: '1rem', lineHeight: '1.625' }}
              />
            ) : (
              <p
                className="text-gray-900 dark:text-white italic text-center"
                style={{ fontSize: '1.125rem', lineHeight: '1.625', fontWeight: '500' }}
              >
                {developerData.philosophy}
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
                    value={developerData.contact.email}
                    onChange={(e) => setDeveloperData({ 
                      ...developerData, 
                      contact: { ...developerData.contact, email: e.target.value }
                    })}
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Phone</label>
                  <input
                    type="tel"
                    value={developerData.contact.phone}
                    onChange={(e) => setDeveloperData({ 
                      ...developerData, 
                      contact: { ...developerData.contact, phone: e.target.value }
                    })}
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Location</label>
                  <input
                    type="text"
                    value={developerData.contact.location}
                    onChange={(e) => setDeveloperData({ 
                      ...developerData, 
                      contact: { ...developerData.contact, location: e.target.value }
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
                      href={`mailto:${developerData.contact.email}`}
                      className="text-sm text-gray-900 dark:text-white hover:text-[#f6421f] dark:hover:text-[#f6421f] transition-colors truncate block"
                    >
                      {developerData.contact.email}
                    </a>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <Phone className="w-5 h-5 text-green-600 dark:text-green-400 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-600 dark:text-gray-400">Phone</p>
                    <a 
                      href={`tel:${developerData.contact.phone}`}
                      className="text-sm text-gray-900 dark:text-white hover:text-[#f6421f] dark:hover:text-[#f6421f] transition-colors"
                    >
                      {developerData.contact.phone}
                    </a>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg md:col-span-2">
                  <MapPin className="w-5 h-5 text-purple-600 dark:text-purple-400 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-600 dark:text-gray-400">Location</p>
                    <p className="text-sm text-gray-900 dark:text-white">
                      {developerData.contact.location}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Support Notice */}
          <div className="p-4 bg-amber-50 dark:bg-amber-900/20 border-l-4 border-amber-500 dark:border-amber-600 rounded-r-lg">
            <p
              className="text-gray-900 dark:text-white"
              style={{ fontSize: '0.875rem', lineHeight: '1.625', fontWeight: '500' }}
            >
              <strong>Need Technical Support?</strong> Should you encounter any issues, errors, or technical difficulties while using this Web App, please feel free to reach out. Your feedback helps improve the platform for everyone.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
