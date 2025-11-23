/**
 * =============================================================================
 * MY PROFILE PAGE
 * =============================================================================
 * 
 * SMART SPEC COMPLIANCE:
 * ✅ Uses PageLayout master component
 * ✅ Profile image: 120px with orange border (4px)
 * ✅ Form inputs: 44px height
 * ✅ Button components: Edit, Save, Cancel variants
 * ✅ Two-column layout with proper spacing
 * 
 * =============================================================================
 */

import { useState, useEffect } from "react";
import { User as UserIcon, Eye, EyeOff, Save, Edit, Camera, Upload } from "lucide-react";
import { ImageWithFallback } from './figma/ImageWithFallback';
import { toast } from "sonner";
import uploadImageFile from '../services/uploadImage';
import { getUserProfileFromGAS, updateProfileInGAS } from '../services/gasApi';
import { PageLayout, Button, DESIGN_TOKENS, getGlassStyle } from "./design-system";

interface MyProfilePageProps {
  onClose: () => void;
  isDark: boolean;
  userIdCode?: string;
  userProfilePicture?: string;
}

export default function MyProfilePage({ onClose, isDark, userIdCode, userProfilePicture }: MyProfilePageProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showSocialModal, setShowSocialModal] = useState(false);
  const [socialPlatform, setSocialPlatform] = useState('');
  const [socialValue, setSocialValue] = useState('');
  const popularPlatforms = ['LinkedIn', 'TikTok', 'YouTube', 'Website', 'Snapchat', 'Telegram', 'WhatsApp'];

  const [profile, setProfile] = useState({
    // Personal Info
    fullName: "",
    username: "",
    email: "",
    contactNumber: "",
    birthday: "",
    age: "",
    gender: "",
    pronouns: "",
    // Identity
    idCode: "",
    civilStatus: "",
    religion: "",
    nationality: "",
    // Address
    address: "",
    barangay: "",
    city: "",
    province: "",
    zipCode: "",
    // YSP Information
    chapter: "",
    committee: "",
    dateJoined: "",
    membershipType: "",
    // Social Media
    facebook: "",
    instagram: "",
    twitter: "",
    // Emergency Contact
    emergencyContactName: "",
    emergencyContactRelation: "",
    emergencyContactNumber: "",
    // Account
    password: "",
    position: "",
    role: "",
  });

  // Load user profile data on component mount
  useEffect(() => {
    console.log('[MyProfilePage] Loading profile for userIdCode:', userIdCode);
    console.log('[MyProfilePage] userProfilePicture available:', userProfilePicture);

    // If we have a profile picture from login, use it immediately
    if (userProfilePicture) {
      setProfileImage(userProfilePicture);
    }

    loadUserProfile();
  }, [userIdCode, userProfilePicture]);

  const loadUserProfile = async () => {
    try {
      setIsLoading(true);
      console.log('[MyProfilePage] Fetching profile from GAS URL:', import.meta.env.VITE_GAS_URL);
      console.log('[MyProfilePage] Using userIdCode:', userIdCode);

      if (!userIdCode) {
        console.warn('[MyProfilePage] No User ID Code provided');
        setIsLoading(false);
        return;
      }

      const data = await getUserProfileFromGAS(userIdCode);

      console.log('[MyProfilePage] Response data:', data);

      if (data.success && data.profile) {
        const userProfile = data.profile;
        console.log('[MyProfilePage] User profile:', userProfile);
        setProfile({
          fullName: userProfile.fullName || "",
          username: userProfile.username || "",
          email: userProfile.email || "",
          contactNumber: userProfile.contactNumber || "",
          birthday: userProfile.birthday ? userProfile.birthday.split(' ')[0] : "", // Extract date part only
          age: userProfile.age || "",
          gender: userProfile.gender || "",
          pronouns: userProfile.pronouns || "",
          idCode: userProfile.idCode || "",
          civilStatus: userProfile.civilStatus || "",
          religion: userProfile.religion || "",
          nationality: userProfile.nationality || "",
          address: userProfile.address || "",
          barangay: userProfile.barangay || "",
          city: userProfile.city || "",
          province: userProfile.province || "",
          zipCode: userProfile.zipCode || "",
          chapter: userProfile.chapter || "",
          committee: userProfile.committee || "",
          dateJoined: userProfile.dateJoined || "",
          membershipType: userProfile.membershipType || "",
          facebook: userProfile.facebook || "",
          instagram: userProfile.instagram || "",
          twitter: userProfile.twitter || "",
          emergencyContactName: userProfile.emergencyContactName || "",
          emergencyContactRelation: userProfile.emergencyContactRelation || "",
          emergencyContactNumber: userProfile.emergencyContactNumber || "",
          password: "••••••••",
          position: userProfile.position || "",
          role: userProfile.role || "",
        });

        // Set profile image if available
        if (userProfile.profilePictureURL) {
          console.log('[MyProfilePage] Setting profile image:', userProfile.profilePictureURL);
          setProfileImage(userProfile.profilePictureURL);
        } else {
          console.log('[MyProfilePage] No profile picture URL in response');
        }
      } else {
        console.error('[MyProfilePage] Failed to load profile:', data.message);
        toast.error('Failed to load profile', {
          description: data.message || 'Could not retrieve your profile data'
        });
      }
    } catch (error) {
      console.error('[MyProfilePage] Error loading profile:', error);
      toast.error('Failed to load profile', {
        description: 'An unexpected error occurred'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleProfileImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    console.log('[MyProfilePage] Uploading profile image:', file.name);
    const res = await uploadImageFile(file, { uploadType: 'profile', userIdCode: userIdCode });
    console.log('[MyProfilePage] Upload response:', res);
    if (res && res.success) {
      setProfileImage(res.profilePictureURL || res.imageUrl || res.publicUrl || '');
      setHasUnsavedChanges(true);
      toast.success('Profile picture updated successfully!');
    } else {
      toast.error(res?.message || 'Failed to upload image');
    }
  };

  const handleAddSocialLink = () => {
    if (!isEditing) return;
    setSocialPlatform('');
    setSocialValue('');
    setShowSocialModal(true);
  };

  const submitSocialModal = async () => {
    const platform = socialPlatform && socialPlatform.trim() !== '' ? socialPlatform.trim() : null;
    if (!platform) {
      toast.error('Please select or enter a platform name');
      return;
    }
    if (!socialValue || socialValue.trim() === '') {
      toast.error('Please enter a URL or handle');
      return;
    }

    try {
      toast.loading('Adding social link...');

      // We will not call addSocialLink individually; instead, set local state and let handleSave persist via socialLinks
      const key = platform.toLowerCase().replace(/\s+/g, '_');
      const val = socialValue.trim();
      (setProfile as any)((prev: any) => ({ ...prev, [key]: val }));

      toast.success('Social link added locally — click Save to persist');
      setShowSocialModal(false);
    } catch (err) {
      console.error('Error adding social link (modal)', err);
      toast.error('Error adding social link');
    }
  };

  const handleChange = (field: string, value: string) => {
    setProfile({ ...profile, [field]: value });
    setHasUnsavedChanges(true);
  };

  const handleSave = async () => {
    if (!userIdCode) {
      toast.error('Session invalid', {
        description: 'Please log in again'
      });
      return;
    }

    try {
      setIsSaving(true);

      // Prepare data for backend update
      const updateData: any = {
        action: 'updateProfile',
        idCode: userIdCode,
        email: profile.email,
        birthday: profile.birthday,
        gender: profile.gender,
        pronouns: profile.pronouns,
        civilStatus: profile.civilStatus,
        contactNumber: profile.contactNumber,
        religion: profile.religion,
        nationality: profile.nationality,
        personalEmail: profile.email, // Using same email for personal email
        username: profile.username,
        // Address fields
        address: profile.address,
        barangay: profile.barangay,
        city: profile.city,
        province: profile.province,
        zipCode: profile.zipCode,
        // Social Media fields
        facebook: profile.facebook,
        instagram: profile.instagram,
        twitter: profile.twitter,
        // Emergency Contact fields
        emergencyContactName: profile.emergencyContactName,
        emergencyContactRelation: profile.emergencyContactRelation,
        emergencyContactNumber: profile.emergencyContactNumber,
        // YSP Information fields
        chapter: profile.chapter,
        committee: profile.committee,
        dateJoined: profile.dateJoined,
        membershipType: profile.membershipType
      };

      // Only include password if it was changed from the placeholder
      if (profile.password && profile.password !== "••••••••") {
        updateData.password = profile.password;
      }

      // Collect dynamic social links from profile state
      const socialLinks: Record<string, string> = {};
      const coreSocialKeys = ['facebook', 'instagram', 'twitter'];
      Object.keys(profile).forEach((k) => {
        if (coreSocialKeys.indexOf(k) === -1) {
          const val = (profile as any)[k];
          // consider snake_cased or custom keys (they'll have underscores)
          if (k.indexOf('_') !== -1 && val) {
            // convert to readable header name (Title Case with spaces)
            const headerName = k.split('_').map((s) => s.charAt(0).toUpperCase() + s.slice(1)).join(' ');
            socialLinks[headerName] = val;
          }
        }
      });

      if (Object.keys(socialLinks).length > 0) {
        updateData.socialLinks = JSON.stringify(socialLinks);
      }

      const data = await updateProfileInGAS(updateData);



      if (data.success) {
        toast.success("Profile Updated Successfully", {
          description: "Your changes have been saved to the backend.",
        });
        setIsEditing(false);
        setHasUnsavedChanges(false);

        // Reload profile data to reflect any server-side changes (like age recalculation)
        await loadUserProfile();
      } else {
        toast.error('Failed to save profile', {
          description: data.message || 'Could not update your profile'
        });
      }
    } catch (error) {
      console.error('Error saving profile:', error);
      toast.error('Failed to save profile', {
        description: 'An unexpected error occurred'
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    if (hasUnsavedChanges) {
      if (confirm("Discard unsaved changes?")) {
        setIsEditing(false);
        setHasUnsavedChanges(false);
      }
    } else {
      setIsEditing(false);
    }
  };

  const glassStyle = getGlassStyle(isDark);

  const inputStyle = {
    height: `${DESIGN_TOKENS.interactive.input.height}px`,
    paddingLeft: `${DESIGN_TOKENS.interactive.input.paddingX}px`,
    paddingRight: `${DESIGN_TOKENS.interactive.input.paddingX}px`,
    borderRadius: `${DESIGN_TOKENS.radius.input}px`,
    fontSize: `${DESIGN_TOKENS.typography.fontSize.body}px`,
    fontWeight: DESIGN_TOKENS.typography.fontWeight.normal,
    borderWidth: "2px",
    transitionDuration: `${DESIGN_TOKENS.motion.duration.fast}ms`,
  };

  return (
    <PageLayout
      title="My Profile"
      subtitle="View and manage your personal information"
      isDark={isDark}
      onClose={onClose}
      breadcrumbs={[
        { label: "Home", onClick: onClose },
        { label: "My Profile", onClick: undefined },
      ]}
      actions={
        !isEditing && !isLoading ? (
          <Button
            variant="primary"
            onClick={() => setIsEditing(true)}
            icon={<Edit className="w-5 h-5" />}
          >
            Edit Profile
          </Button>
        ) : null
      }
    >
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#f6421f] mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">Loading your profile...</p>
          </div>
        </div>
      ) : (
        <>
          {/* Profile Header Card */}
          <div
            className="border rounded-lg text-center mb-6"
            style={{
              borderRadius: `${DESIGN_TOKENS.radius.card}px`,
              padding: `${DESIGN_TOKENS.spacing.scale["2xl"]}px`,
              borderColor: isDark
                ? "rgba(255, 255, 255, 0.1)"
                : "rgba(0, 0, 0, 0.1)",
              ...glassStyle,
            }}
          >
            {/* Profile Picture */}
            <div className="relative inline-block">
              <div
                className="rounded-full flex items-center justify-center text-white overflow-hidden"
                style={{
                  width: `${DESIGN_TOKENS.media.profileImage.size}px`,
                  height: `${DESIGN_TOKENS.media.profileImage.size}px`,
                  background: `linear-gradient(135deg, ${DESIGN_TOKENS.colors.brand.red} 0%, ${DESIGN_TOKENS.colors.brand.orange} 100%)`,
                  border: `4px solid ${DESIGN_TOKENS.colors.brand.orange}`,
                }}
              >
                {profileImage ? (
                  <ImageWithFallback
                    src={profileImage}
                    alt="Profile"
                    className="w-full h-full object-cover"
                    width={240}
                  />
                ) : (
                  <UserIcon className="w-16 h-16" />
                )}
              </div>

              {/* Change Picture Button */}
              {isEditing && (
                <label
                  className="absolute bottom-0 right-0 cursor-pointer rounded-full p-2 transition-all hover:scale-110"
                  style={{
                    background: `linear-gradient(135deg, ${DESIGN_TOKENS.colors.brand.red} 0%, ${DESIGN_TOKENS.colors.brand.orange} 100%)`,
                    boxShadow: "0 4px 12px rgba(246, 66, 31, 0.3)",
                  }}
                >
                  <Camera className="w-5 h-5 text-white" />
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/jpg"
                    onChange={handleProfileImageUpload}
                    className="hidden"
                  />
                </label>
              )}
            </div>

            {/* Name and Username */}
            <h2
              className="mt-4"
              style={{
                fontFamily: DESIGN_TOKENS.typography.fontFamily.headings,
                fontSize: `${DESIGN_TOKENS.typography.fontSize.h2}px`,
                fontWeight: DESIGN_TOKENS.typography.fontWeight.semibold,
                color: DESIGN_TOKENS.colors.brand.red,
                marginBottom: `${DESIGN_TOKENS.spacing.scale.xs}px`,
              }}
            >
              {profile.fullName}
            </h2>
            <p
              style={{
                fontSize: `${DESIGN_TOKENS.typography.fontSize.h3}px`,
                fontWeight: DESIGN_TOKENS.typography.fontWeight.medium,
                color: DESIGN_TOKENS.colors.brand.orange,
              }}
            >
              @{profile.username}
            </p>
          </div>

          {/* Personal Information */}
          <div
            className="border rounded-lg mb-6"
            style={{
              borderRadius: `${DESIGN_TOKENS.radius.card}px`,
              padding: `${DESIGN_TOKENS.spacing.scale.xl}px`,
              borderColor: isDark
                ? "rgba(255, 255, 255, 0.1)"
                : "rgba(0, 0, 0, 0.1)",
              ...glassStyle,
            }}
          >
            <h3
              className="mb-4"
              style={{
                fontFamily: DESIGN_TOKENS.typography.fontFamily.headings,
                fontSize: `${DESIGN_TOKENS.typography.fontSize.h3}px`,
                fontWeight: DESIGN_TOKENS.typography.fontWeight.semibold,
                color: DESIGN_TOKENS.colors.brand.orange,
              }}
            >
              Personal Information
            </h3>
            <div
              className="grid md:grid-cols-2"
              style={{
                gap: `${DESIGN_TOKENS.spacing.scale.lg}px`,
              }}
            >
              {[
                { label: "Email", value: profile.email, key: "email", editable: true },
                { label: "Contact Number", value: profile.contactNumber, key: "contactNumber", editable: true },
                { label: "Birthday", value: profile.birthday, key: "birthday", editable: true, type: "date" },
                { label: "Age", value: profile.age.toString(), key: "age", editable: false },
                { label: "Gender", value: profile.gender, key: "gender", editable: true },
                { label: "Pronouns", value: profile.pronouns, key: "pronouns", editable: true },
              ].map((field) => (
                <div key={field.key}>
                  <label
                    className="block text-muted-foreground mb-2"
                    style={{
                      fontSize: `${DESIGN_TOKENS.typography.fontSize.caption}px`,
                      fontWeight: DESIGN_TOKENS.typography.fontWeight.medium,
                    }}
                  >
                    {field.label}
                  </label>
                  <input
                    type={field.type || "text"}
                    value={field.value}
                    onChange={(e) => handleChange(field.key, e.target.value)}
                    disabled={!isEditing || !field.editable}
                    className="w-full border-2 bg-white/50 dark:bg-white/5 backdrop-blur-sm transition-all disabled:opacity-60 focus:outline-none focus:border-[#f6421f] focus:ring-2 focus:ring-[#f6421f]/20"
                    style={{
                      ...inputStyle,
                      borderColor: isDark
                        ? "rgba(255, 255, 255, 0.1)"
                        : "rgba(0, 0, 0, 0.1)",
                    }}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Identity Information */}
          <div
            className="border rounded-lg mb-6"
            style={{
              borderRadius: `${DESIGN_TOKENS.radius.card}px`,
              padding: `${DESIGN_TOKENS.spacing.scale.xl}px`,
              borderColor: isDark
                ? "rgba(255, 255, 255, 0.1)"
                : "rgba(0, 0, 0, 0.1)",
              ...glassStyle,
            }}
          >
            <h3
              className="mb-4"
              style={{
                fontFamily: DESIGN_TOKENS.typography.fontFamily.headings,
                fontSize: `${DESIGN_TOKENS.typography.fontSize.h3}px`,
                fontWeight: DESIGN_TOKENS.typography.fontWeight.semibold,
                color: DESIGN_TOKENS.colors.brand.orange,
              }}
            >
              Identity Information
            </h3>
            <div
              className="grid md:grid-cols-2"
              style={{
                gap: `${DESIGN_TOKENS.spacing.scale.lg}px`,
              }}
            >
              {[
                { label: "ID Code", value: profile.idCode, key: "idCode", editable: false },
                { label: "Civil Status", value: profile.civilStatus, key: "civilStatus", editable: true },
                { label: "Religion", value: profile.religion, key: "religion", editable: true },
                { label: "Nationality", value: profile.nationality, key: "nationality", editable: true },
              ].map((field) => (
                <div key={field.key}>
                  <label
                    className="block text-muted-foreground mb-2"
                    style={{
                      fontSize: `${DESIGN_TOKENS.typography.fontSize.caption}px`,
                      fontWeight: DESIGN_TOKENS.typography.fontWeight.medium,
                    }}
                  >
                    {field.label}
                  </label>
                  <input
                    type="text"
                    value={field.value}
                    onChange={(e) => handleChange(field.key, e.target.value)}
                    disabled={!isEditing || !field.editable}
                    className="w-full border-2 bg-white/50 dark:bg-white/5 backdrop-blur-sm transition-all disabled:opacity-60 focus:outline-none focus:border-[#f6421f] focus:ring-2 focus:ring-[#f6421f]/20"
                    style={{
                      ...inputStyle,
                      borderColor: isDark
                        ? "rgba(255, 255, 255, 0.1)"
                        : "rgba(0, 0, 0, 0.1)",
                    }}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Address Information */}
          <div
            className="border rounded-lg mb-6"
            style={{
              borderRadius: `${DESIGN_TOKENS.radius.card}px`,
              padding: `${DESIGN_TOKENS.spacing.scale.xl}px`,
              borderColor: isDark
                ? "rgba(255, 255, 255, 0.1)"
                : "rgba(0, 0, 0, 0.1)",
              ...glassStyle,
            }}
          >
            <h3
              className="mb-4"
              style={{
                fontFamily: DESIGN_TOKENS.typography.fontFamily.headings,
                fontSize: `${DESIGN_TOKENS.typography.fontSize.h3}px`,
                fontWeight: DESIGN_TOKENS.typography.fontWeight.semibold,
                color: DESIGN_TOKENS.colors.brand.orange,
              }}
            >
              Address Information
            </h3>
            <div
              className="grid md:grid-cols-2"
              style={{
                gap: `${DESIGN_TOKENS.spacing.scale.lg}px`,
              }}
            >
              {[
                { label: "Address", value: profile.address, key: "address", editable: true },
                { label: "Barangay", value: profile.barangay, key: "barangay", editable: true },
                { label: "City", value: profile.city, key: "city", editable: true },
                { label: "Province", value: profile.province, key: "province", editable: true },
                { label: "Zip Code", value: profile.zipCode, key: "zipCode", editable: true },
              ].map((field) => (
                <div key={field.key}>
                  <label
                    className="block text-muted-foreground mb-2"
                    style={{
                      fontSize: `${DESIGN_TOKENS.typography.fontSize.caption}px`,
                      fontWeight: DESIGN_TOKENS.typography.fontWeight.medium,
                    }}
                  >
                    {field.label}
                  </label>
                  <input
                    type="text"
                    value={field.value}
                    onChange={(e) => handleChange(field.key, e.target.value)}
                    disabled={!isEditing || !field.editable}
                    className="w-full border-2 bg-white/50 dark:bg-white/5 backdrop-blur-sm transition-all disabled:opacity-60 focus:outline-none focus:border-[#f6421f] focus:ring-2 focus:ring-[#f6421f]/20"
                    style={{
                      ...inputStyle,
                      borderColor: isDark
                        ? "rgba(255, 255, 255, 0.1)"
                        : "rgba(0, 0, 0, 0.1)",
                    }}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* YSP Information */}
          <div
            className="border rounded-lg mb-6"
            style={{
              borderRadius: `${DESIGN_TOKENS.radius.card}px`,
              padding: `${DESIGN_TOKENS.spacing.scale.xl}px`,
              borderColor: isDark
                ? "rgba(255, 255, 255, 0.1)"
                : "rgba(0, 0, 0, 0.1)",
              ...glassStyle,
            }}
          >
            <h3
              className="mb-4"
              style={{
                fontFamily: DESIGN_TOKENS.typography.fontFamily.headings,
                fontSize: `${DESIGN_TOKENS.typography.fontSize.h3}px`,
                fontWeight: DESIGN_TOKENS.typography.fontWeight.semibold,
                color: DESIGN_TOKENS.colors.brand.orange,
              }}
            >
              YSP Information
            </h3>
            <div
              className="grid md:grid-cols-2"
              style={{
                gap: `${DESIGN_TOKENS.spacing.scale.lg}px`,
              }}
            >
              {[
                { label: "Chapter", value: profile.chapter, key: "chapter", editable: true },
                { label: "Committee", value: profile.committee, key: "committee", editable: true },
                { label: "Date Joined", value: profile.dateJoined, key: "dateJoined", editable: true, type: "date" },
                { label: "Membership Type", value: profile.membershipType, key: "membershipType", editable: true },
              ].map((field) => (
                <div key={field.key}>
                  <label
                    className="block text-muted-foreground mb-2"
                    style={{
                      fontSize: `${DESIGN_TOKENS.typography.fontSize.caption}px`,
                      fontWeight: DESIGN_TOKENS.typography.fontWeight.medium,
                    }}
                  >
                    {field.label}
                  </label>
                  <input
                    type={field.type || "text"}
                    value={field.value}
                    onChange={(e) => handleChange(field.key, e.target.value)}
                    disabled={!isEditing || !field.editable}
                    className="w-full border-2 bg-white/50 dark:bg-white/5 backdrop-blur-sm transition-all disabled:opacity-60 focus:outline-none focus:border-[#f6421f] focus:ring-2 focus:ring-[#f6421f]/20"
                    style={{
                      ...inputStyle,
                      borderColor: isDark
                        ? "rgba(255, 255, 255, 0.1)"
                        : "rgba(0, 0, 0, 0.1)",
                    }}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Social Media Information */}
          <div
            className="border rounded-lg mb-6"
            style={{
              borderRadius: `${DESIGN_TOKENS.radius.card}px`,
              padding: `${DESIGN_TOKENS.spacing.scale.xl}px`,
              borderColor: isDark
                ? "rgba(255, 255, 255, 0.1)"
                : "rgba(0, 0, 0, 0.1)",
              ...glassStyle,
            }}
          >
            <h3
              className="mb-4"
              style={{
                fontFamily: DESIGN_TOKENS.typography.fontFamily.headings,
                fontSize: `${DESIGN_TOKENS.typography.fontSize.h3}px`,
                fontWeight: DESIGN_TOKENS.typography.fontWeight.semibold,
                color: DESIGN_TOKENS.colors.brand.orange,
              }}
            >
              Social Media Information
            </h3>
            <div
              className="grid md:grid-cols-2"
              style={{
                gap: `${DESIGN_TOKENS.spacing.scale.lg}px`,
              }}
            >
              {[
                { label: "Facebook", value: profile.facebook, key: "facebook", editable: true },
                { label: "Instagram", value: profile.instagram, key: "instagram", editable: true },
                { label: "Twitter", value: profile.twitter, key: "twitter", editable: true },
              ].map((field) => (
                <div key={field.key}>
                  <label
                    className="block text-muted-foreground mb-2"
                    style={{
                      fontSize: `${DESIGN_TOKENS.typography.fontSize.caption}px`,
                      fontWeight: DESIGN_TOKENS.typography.fontWeight.medium,
                    }}
                  >
                    {field.label}
                  </label>
                  <input
                    type="text"
                    value={field.value}
                    onChange={(e) => handleChange(field.key, e.target.value)}
                    disabled={!isEditing || !field.editable}
                    className="w-full border-2 bg-white/50 dark:bg-white/5 backdrop-blur-sm transition-all disabled:opacity-60 focus:outline-none focus:border-[#f6421f] focus:ring-2 focus:ring-[#f6421f]/20"
                    style={{
                      ...inputStyle,
                      borderColor: isDark
                        ? "rgba(255, 255, 255, 0.1)"
                        : "rgba(0, 0, 0, 0.1)",
                    }}
                  />
                </div>
              ))}
            </div>
            {isEditing && (
              <div className="mt-4">
                <Button variant="outline" onClick={handleAddSocialLink} icon={<Upload className="w-4 h-4" />}>
                  Add Social Link
                </Button>
              </div>
            )}
          </div>

          {/* Emergency Contact Information */}
          <div
            className="border rounded-lg mb-6"
            style={{
              borderRadius: `${DESIGN_TOKENS.radius.card}px`,
              padding: `${DESIGN_TOKENS.spacing.scale.xl}px`,
              borderColor: isDark
                ? "rgba(255, 255, 255, 0.1)"
                : "rgba(0, 0, 0, 0.1)",
              ...glassStyle,
            }}
          >
            <h3
              className="mb-4"
              style={{
                fontFamily: DESIGN_TOKENS.typography.fontFamily.headings,
                fontSize: `${DESIGN_TOKENS.typography.fontSize.h3}px`,
                fontWeight: DESIGN_TOKENS.typography.fontWeight.semibold,
                color: DESIGN_TOKENS.colors.brand.orange,
              }}
            >
              Emergency Contact Information
            </h3>
            <div
              className="grid md:grid-cols-2"
              style={{
                gap: `${DESIGN_TOKENS.spacing.scale.lg}px`,
              }}
            >
              {[
                { label: "Name", value: profile.emergencyContactName, key: "emergencyContactName", editable: true },
                { label: "Relation", value: profile.emergencyContactRelation, key: "emergencyContactRelation", editable: true },
                { label: "Contact Number", value: profile.emergencyContactNumber, key: "emergencyContactNumber", editable: true },
              ].map((field) => (
                <div key={field.key}>
                  <label
                    className="block text-muted-foreground mb-2"
                    style={{
                      fontSize: `${DESIGN_TOKENS.typography.fontSize.caption}px`,
                      fontWeight: DESIGN_TOKENS.typography.fontWeight.medium,
                    }}
                  >
                    {field.label}
                  </label>
                  <input
                    type="text"
                    value={field.value}
                    onChange={(e) => handleChange(field.key, e.target.value)}
                    disabled={!isEditing || !field.editable}
                    className="w-full border-2 bg-white/50 dark:bg-white/5 backdrop-blur-sm transition-all disabled:opacity-60 focus:outline-none focus:border-[#f6421f] focus:ring-2 focus:ring-[#f6421f]/20"
                    style={{
                      ...inputStyle,
                      borderColor: isDark
                        ? "rgba(255, 255, 255, 0.1)"
                        : "rgba(0, 0, 0, 0.1)",
                    }}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Account Information */}
          <div
            className="border rounded-lg mb-6"
            style={{
              borderRadius: `${DESIGN_TOKENS.radius.card}px`,
              padding: `${DESIGN_TOKENS.spacing.scale.xl}px`,
              borderColor: isDark
                ? "rgba(255, 255, 255, 0.1)"
                : "rgba(0, 0, 0, 0.1)",
              ...glassStyle,
            }}
          >
            <h3
              className="mb-4"
              style={{
                fontFamily: DESIGN_TOKENS.typography.fontFamily.headings,
                fontSize: `${DESIGN_TOKENS.typography.fontSize.h3}px`,
                fontWeight: DESIGN_TOKENS.typography.fontWeight.semibold,
                color: DESIGN_TOKENS.colors.brand.orange,
              }}
            >
              Account Information
            </h3>
            <div
              className="grid md:grid-cols-2"
              style={{
                gap: `${DESIGN_TOKENS.spacing.scale.lg}px`,
              }}
            >
              <div>
                <label
                  className="block text-muted-foreground mb-2"
                  style={{
                    fontSize: `${DESIGN_TOKENS.typography.fontSize.caption}px`,
                    fontWeight: DESIGN_TOKENS.typography.fontWeight.medium,
                  }}
                >
                  Username
                </label>
                <input
                  type="text"
                  value={profile.username}
                  onChange={(e) => handleChange("username", e.target.value)}
                  disabled={!isEditing}
                  className="w-full border-2 bg-white/50 dark:bg-white/5 backdrop-blur-sm transition-all disabled:opacity-60 focus:outline-none focus:border-[#f6421f] focus:ring-2 focus:ring-[#f6421f]/20"
                  style={{
                    ...inputStyle,
                    borderColor: isDark
                      ? "rgba(255, 255, 255, 0.1)"
                      : "rgba(0, 0, 0, 0.1)",
                  }}
                />
              </div>

              <div>
                <label
                  className="block text-muted-foreground mb-2"
                  style={{
                    fontSize: `${DESIGN_TOKENS.typography.fontSize.caption}px`,
                    fontWeight: DESIGN_TOKENS.typography.fontWeight.medium,
                  }}
                >
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={profile.password}
                    onChange={(e) => handleChange("password", e.target.value)}
                    disabled={!isEditing}
                    className="w-full border-2 bg-white/50 dark:bg-white/5 backdrop-blur-sm transition-all disabled:opacity-60 focus:outline-none focus:border-[#f6421f] focus:ring-2 focus:ring-[#f6421f]/20"
                    style={{
                      ...inputStyle,
                      paddingRight: "48px",
                      borderColor: isDark
                        ? "rgba(255, 255, 255, 0.1)"
                        : "rgba(0, 0, 0, 0.1)",
                    }}
                  />
                  {isEditing && (
                    <button
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      type="button"
                    >
                      {showPassword ? (
                        <EyeOff className="w-5 h-5" />
                      ) : (
                        <Eye className="w-5 h-5" />
                      )}
                    </button>
                  )}
                </div>
              </div>

              <div>
                <label
                  className="block text-muted-foreground mb-2"
                  style={{
                    fontSize: `${DESIGN_TOKENS.typography.fontSize.caption}px`,
                    fontWeight: DESIGN_TOKENS.typography.fontWeight.medium,
                  }}
                >
                  Position (Read Only)
                </label>
                <input
                  type="text"
                  value={profile.position}
                  disabled
                  className="w-full border-2 bg-white/50 dark:bg-white/5 backdrop-blur-sm opacity-60"
                  style={{
                    ...inputStyle,
                    borderColor: isDark
                      ? "rgba(255, 255, 255, 0.1)"
                      : "rgba(0, 0, 0, 0.1)",
                  }}
                />
              </div>

              <div>
                <label
                  className="block text-muted-foreground mb-2"
                  style={{
                    fontSize: `${DESIGN_TOKENS.typography.fontSize.caption}px`,
                    fontWeight: DESIGN_TOKENS.typography.fontWeight.medium,
                  }}
                >
                  Role (Read Only)
                </label>
                <input
                  type="text"
                  value={profile.role}
                  disabled
                  className="w-full border-2 bg-white/50 dark:bg-white/5 backdrop-blur-sm opacity-60"
                  style={{
                    ...inputStyle,
                    borderColor: isDark
                      ? "rgba(255, 255, 255, 0.1)"
                      : "rgba(0, 0, 0, 0.1)",
                  }}
                />
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          {isEditing && (
            <div className="flex gap-4">
              <Button variant="secondary" onClick={handleCancel} fullWidth disabled={isSaving}>
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={handleSave}
                fullWidth
                icon={<Save className="w-5 h-5" />}
                disabled={isSaving}
              >
                {isSaving ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          )}
        </>
      )}

      {/* Social Link Modal */}
      {showSocialModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowSocialModal(false)}></div>
          <div className="bg-white dark:bg-gray-900 rounded-lg p-6 z-10 w-full max-w-md">
            <h4 className="text-lg font-semibold mb-3">Add Social Link</h4>
            <label className="block text-sm mb-1">Platform</label>
            <select
              value={socialPlatform}
              onChange={(e) => setSocialPlatform(e.target.value)}
              className="w-full border p-2 mb-3 bg-white dark:bg-gray-800"
            >
              <option value="">-- Select popular platform --</option>
              {popularPlatforms.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
              <option value="">-- Custom --</option>
            </select>
            {socialPlatform === '' && (
              <input
                placeholder="Enter custom platform name"
                value={socialPlatform}
                onChange={(e) => setSocialPlatform(e.target.value)}
                className="w-full border p-2 mb-3 bg-white dark:bg-gray-800"
              />
            )}

            <label className="block text-sm mb-1">URL / Handle</label>
            <input
              placeholder="https://... or @handle"
              value={socialValue}
              onChange={(e) => setSocialValue(e.target.value)}
              className="w-full border p-2 mb-4 bg-white dark:bg-gray-800"
            />

            <div className="flex justify-end gap-2">
              <Button variant="secondary" onClick={() => setShowSocialModal(false)}>Cancel</Button>
              <Button variant="primary" onClick={submitSocialModal}>Add</Button>
            </div>
          </div>
        </div>
      )}
    </PageLayout>
  );
}