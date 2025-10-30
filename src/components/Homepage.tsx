import { useState, useEffect, useRef } from 'react';
import { Mail, Facebook, X, Loader2, Plus, Upload, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { homepageAPI, type HomepageContent, type HomepageProject } from '../services/api';

/**
 * Helper function to get a displayable Google Drive image URL
 * Converts various Google Drive URL formats to the thumbnail format which works better
 */
function getDisplayableGoogleDriveUrl(url: string, width: number = 1200): string {
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
    // Cap width to a reasonable max to avoid huge downloads
    const w = Math.max(200, Math.min(width, 2400));
    return `https://drive.google.com/thumbnail?id=${fileId}&sz=w${w}`;
  }
  
  // If it's not a Google Drive URL or we couldn't parse it, return as-is
  return url;
}

/**
 * Returns an original Google Drive viewer URL for opening in a new tab.
 */
function getOriginalGoogleDriveUrl(url: string): string {
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
  return fileId ? `https://drive.google.com/file/d/${fileId}/view?usp=sharing` : url;
}

interface HomepageProps {
  darkMode: boolean;
  currentUser?: any;
}

export default function Homepage({ darkMode, currentUser }: HomepageProps) {
  const [content, setContent] = useState<HomepageContent | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedProject, setSelectedProject] = useState<HomepageProject | null>(null);
  const [showAddProjectForm, setShowAddProjectForm] = useState(false);
  const [projectTitle, setProjectTitle] = useState('');
  const [projectDescription, setProjectDescription] = useState('');
  const [projectImage, setProjectImage] = useState<string | null>(null);
  const [projectImageFile, setProjectImageFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const orgFileInputRef = useRef<HTMLInputElement>(null);
  const [orgUploading, setOrgUploading] = useState(false);
  const [orgModalOpen, setOrgModalOpen] = useState(false);
  const gridRef = useRef<HTMLDivElement>(null);
  const modalContentRef = useRef<HTMLDivElement>(null);
  const [cardImgWidth, setCardImgWidth] = useState<number>(800);
  const [modalImgWidth, setModalImgWidth] = useState<number>(1200);

  const isAdminOrAuditor = currentUser && (currentUser.role === 'Admin' || currentUser.role === 'Auditor');

  useEffect(() => {
    fetchHomepageContent();
  }, []);

  // Compute adaptive widths for project card images based on container width and device pixel ratio
  useEffect(() => {
    const calcCardWidth = () => {
      const container = gridRef.current;
      if (!container) return;
      const containerWidth = container.clientWidth || 800;
      const isMd = window.matchMedia('(min-width: 768px)').matches;
      const columns = isMd ? 2 : 1;
      const gap = 16; // gap-4 ~ 1rem
      const widthPerCard = (containerWidth - gap * (columns - 1)) / columns;
      const dpr = Math.min(3, Math.max(1, window.devicePixelRatio || 1));
      const target = Math.round(widthPerCard * dpr);
      const clamped = Math.max(500, Math.min(1600, target));
      setCardImgWidth(clamped);
    };

    calcCardWidth();
    const onResize = () => calcCardWidth();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  // Compute adaptive width for modal image when opened and on resize
  useEffect(() => {
    const calcModalWidth = () => {
      const container = modalContentRef.current;
      if (!container) return;
      const contentWidth = container.clientWidth || 800;
      const dpr = Math.min(3, Math.max(1, window.devicePixelRatio || 1));
      const target = Math.round(contentWidth * dpr);
      const clamped = Math.max(800, Math.min(2000, target));
      setModalImgWidth(clamped);
    };
    if (selectedProject) {
      calcModalWidth();
      const onResize = () => calcModalWidth();
      window.addEventListener('resize', onResize);
      return () => window.removeEventListener('resize', onResize);
    }
  }, [selectedProject]);

  const fetchHomepageContent = async () => {
    try {
      setLoading(true);
      const response = await homepageAPI.getContent();
      
      if (response.success && response.content) {
        setContent(response.content);
      } else {
        console.error('Failed to fetch homepage content:', response.message);
        toast.error('Failed to load homepage content');
      }
    } catch (error) {
      console.error('Error fetching homepage content:', error);
      toast.error('Failed to load homepage content');
    } finally {
      setLoading(false);
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size should be less than 5MB');
      return;
    }

    setProjectImageFile(file);
    const reader = new FileReader();
    reader.onload = (e) => {
      setProjectImage(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleAddProject = async () => {
    if (!projectTitle.trim()) {
      toast.error('Please enter a project title');
      return;
    }
    if (!projectDescription.trim()) {
      toast.error('Please enter a project description');
      return;
    }
    if (!projectImage || !projectImageFile) {
      toast.error('Please select a project image');
      return;
    }
    if (!currentUser || !currentUser.id) {
      toast.error('User session invalid');
      return;
    }

    try {
      setUploading(true);

      // Upload image first
      const uploadResponse = await homepageAPI.uploadProjectImage(
        projectImage,
        projectImageFile.name,
        projectImageFile.type,
        projectTitle,
        currentUser.id
      );

      if (!uploadResponse.success || !uploadResponse.imageUrl) {
        toast.error(uploadResponse.message || 'Failed to upload image');
        return;
      }

      // Add project to sheet
      const addResponse = await homepageAPI.addProject(
        projectTitle,
        uploadResponse.imageUrl,
        projectDescription,
        currentUser.id
      );

      if (addResponse.success) {
        toast.success('Project added successfully!');
        setShowAddProjectForm(false);
        setProjectTitle('');
        setProjectDescription('');
        setProjectImage(null);
        setProjectImageFile(null);
        // Refetch content to show new project
        await fetchHomepageContent();
      } else {
        toast.error(addResponse.message || 'Failed to add project');
      }
    } catch (error: any) {
      console.error('Error adding project:', error);
      toast.error(error?.message || 'Failed to add project');
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteProject = async (projectNumber: number) => {
    if (!currentUser || !currentUser.id) {
      toast.error('User session invalid');
      return;
    }

    if (!confirm('Are you sure you want to delete this project?')) {
      return;
    }

    try {
      setUploading(true);
      const response = await homepageAPI.deleteProject(projectNumber, currentUser.id);

      if (response.success) {
        toast.success('Project deleted successfully!');
        await fetchHomepageContent();
      } else {
        toast.error(response.message || 'Failed to delete project');
      }
    } catch (error: any) {
      console.error('Error deleting project:', error);
      toast.error(error?.message || 'Failed to delete project');
    } finally {
      setUploading(false);
    }
  };

  const handleCancelAdd = () => {
    setShowAddProjectForm(false);
    setProjectTitle('');
    setProjectDescription('');
    setProjectImage(null);
    setProjectImageFile(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-[#f6421f]" />
      </div>
    );
  }

  if (!content) {
    return (
      <div className="ysp-card text-center">
        <p className="text-gray-500">No homepage content available</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-8">
      <div className="ysp-card">
        <h2 className="text-[#f6421f] dark:text-[#ee8724] mb-4">About Youth Service Philippines</h2>
        <p className="text-justify mb-4">{content.about}</p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="ysp-card">
          <h3 className="text-[#f6421f] dark:text-[#ee8724] mb-3">Mission</h3>
          <p className="text-justify">{content.mission}</p>
        </div>

        <div className="ysp-card">
          <h3 className="text-[#f6421f] dark:text-[#ee8724] mb-3">Vision</h3>
          <p className="text-justify">{content.vision}</p>
        </div>
      </div>

      <div className="ysp-card">
        <h3 className="text-[#f6421f] dark:text-[#ee8724] mb-3">Section 3. YSP shall be guided by the following advocacy pillars:</h3>
        <div className="text-justify whitespace-pre-wrap leading-relaxed">
          {content.objectives.map((objective, index) => (
            <p key={index}>{objective}</p>
          ))}
        </div>
      </div>

      <div className="ysp-card">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-[#f6421f] dark:text-[#ee8724]">Organizational Chart</h3>
          {isAdminOrAuditor && (
            <div className="flex gap-2">
              <input
                ref={orgFileInputRef}
                type="file"
                accept="image/*"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  if (!file.type.startsWith('image/')) {
                    toast.error('Please select an image file');
                    return;
                  }
                  if (file.size > 10 * 1024 * 1024) {
                    toast.error('Image size should be less than 10MB');
                    return;
                  }
                  try {
                    if (!currentUser?.id) {
                      toast.error('User session invalid');
                      return;
                    }
                    setOrgUploading(true);
                    // Read base64
                    const base64 = await new Promise<string>((resolve, reject) => {
                      const reader = new FileReader();
                      reader.onload = () => resolve(reader.result as string);
                      reader.onerror = (err) => reject(err);
                      reader.readAsDataURL(file);
                    });
                    // Upload to Drive
                    const up = await homepageAPI.uploadOrgChartImage(base64, file.name, file.type, currentUser.id);
                    if (!up.success || !up.imageUrl) {
                      toast.error(up.message || 'Failed to upload org chart');
                      return;
                    }
                    // Update sheet link
                    const upd = await homepageAPI.updateOrgChartUrl(up.imageUrl, currentUser.id);
                    if (!upd.success) {
                      toast.error(upd.message || 'Failed to update org chart link');
                      return;
                    }
                    toast.success('Organizational chart updated');
                    await fetchHomepageContent();
                  } catch (err: any) {
                    console.error('Org chart upload error:', err);
                    toast.error(err?.message || 'Failed to update org chart');
                  } finally {
                    setOrgUploading(false);
                    if (orgFileInputRef.current) orgFileInputRef.current.value = '';
                  }
                }}
                style={{ display: 'none' }}
              />
              <button
                onClick={() => orgFileInputRef.current?.click()}
                disabled={orgUploading}
                style={{
                  backgroundColor: '#2563eb',
                  color: '#ffffff',
                  fontWeight: 'bold',
                  padding: '0.5rem 1rem',
                  borderRadius: '0.5rem',
                  boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
                  transition: 'all 0.2s',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  border: 'none',
                  cursor: orgUploading ? 'not-allowed' : 'pointer',
                  opacity: orgUploading ? 0.5 : 1
                }}
                onMouseEnter={(e) => {
                  if (!orgUploading) (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#1d4ed8';
                }}
                onMouseLeave={(e) => {
                  if (!orgUploading) (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#2563eb';
                }}
              >
                {content.orgChartUrl ? 'Change Org Chart' : 'Upload Org Chart'}
              </button>
              {content.orgChartUrl && (
                <button
                  onClick={async () => {
                    if (!currentUser?.id) {
                      toast.error('User session invalid');
                      return;
                    }
                    if (!confirm('Delete the organizational chart?')) return;
                    try {
                      setOrgUploading(true);
                      const res = await homepageAPI.deleteOrgChart(currentUser.id);
                      if (!res.success) {
                        toast.error(res.message || 'Failed to delete org chart');
                        return;
                      }
                      toast.success('Organizational chart removed');
                      await fetchHomepageContent();
                    } catch (err: any) {
                      console.error('Delete org chart error:', err);
                      toast.error(err?.message || 'Failed to delete org chart');
                    } finally {
                      setOrgUploading(false);
                    }
                  }}
                  disabled={orgUploading}
                  style={{
                    backgroundColor: '#dc2626',
                    color: '#ffffff',
                    fontWeight: 'bold',
                    padding: '0.5rem 1rem',
                    borderRadius: '0.5rem',
                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
                    transition: 'all 0.2s',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem',
                    border: 'none',
                    cursor: orgUploading ? 'not-allowed' : 'pointer',
                    opacity: orgUploading ? 0.5 : 1
                  }}
                  onMouseEnter={(e) => {
                    if (!orgUploading) (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#b91c1c';
                  }}
                  onMouseLeave={(e) => {
                    if (!orgUploading) (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#dc2626';
                  }}
                >
                  Delete
                </button>
              )}
            </div>
          )}
        </div>
        <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
          {content.orgChartUrl ? (
            <img
              src={getDisplayableGoogleDriveUrl(content.orgChartUrl, 1200)}
              srcSet={`
                ${getDisplayableGoogleDriveUrl(content.orgChartUrl, 800)} 800w,
                ${getDisplayableGoogleDriveUrl(content.orgChartUrl, 1200)} 1200w,
                ${getDisplayableGoogleDriveUrl(content.orgChartUrl, 1600)} 1600w
              `}
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 80vw, 80vw"
              alt="Organizational Chart"
              className="w-full rounded-lg cursor-pointer"
              style={{ maxHeight: '70vh', objectFit: 'contain' }}
              onClick={() => setOrgModalOpen(true)}
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).style.display = 'none';
                e.currentTarget.parentElement!.innerHTML = '<p class="text-gray-500 text-center">Organizational chart not available</p>';
              }}
            />
          ) : (
            <p className="text-gray-500 text-center">No organizational chart uploaded yet.</p>
          )}
        </div>
      </div>

      <div className="ysp-card">
        <h3 className="text-[#f6421f] dark:text-[#ee8724] mb-3">Founder</h3>
        <p className="mb-3">{content.founderName}</p>
        <div className="flex gap-3">
          {content.email && (
            <a
              href={`https://mail.google.com/mail/?view=cm&fs=1&to=${content.email}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#f6421f] to-[#ee8724] text-white rounded-lg hover:from-[#ee8724] hover:to-[#fbcb29] transition-all shadow-lg shadow-orange-300/50"
            >
              <Mail size={18} />
              Email
            </a>
          )}
          {content.facebookUrl && (
            <a
              href={content.facebookUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-lg"
            >
              <Facebook size={18} />
              Facebook
            </a>
          )}
        </div>
      </div>

      <div className="ysp-card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-[#f6421f] dark:text-[#ee8724]">Projects Implemented</h3>
          {isAdminOrAuditor && !showAddProjectForm && (
            <button
              onClick={() => setShowAddProjectForm(true)}
              style={{
                background: 'linear-gradient(to right, #f97316, #fb923c)',
                color: '#ffffff',
                fontWeight: 'bold',
                padding: '0.5rem 1rem',
                borderRadius: '0.5rem',
                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
                transition: 'all 0.2s',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                border: 'none',
                cursor: 'pointer'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'linear-gradient(to right, #ea580c, #f97316)';
                e.currentTarget.style.boxShadow = '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'linear-gradient(to right, #f97316, #fb923c)';
                e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)';
              }}
            >
              <Plus size={18} />
              Add Project
            </button>
          )}
        </div>

        {showAddProjectForm && isAdminOrAuditor && (
          <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border-2 border-[#f6421f]">
            <h4 className="text-lg font-semibold mb-3 text-[#f6421f] dark:text-[#ee8724]">Add New Project</h4>
            
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium mb-1">Project Title</label>
                <input
                  type="text"
                  value={projectTitle}
                  onChange={(e) => setProjectTitle(e.target.value)}
                  placeholder="Enter project title"
                  maxLength={100}
                  className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Project Image</label>
                <div className="flex gap-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageSelect}
                    style={{ display: 'none' }}
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    style={{
                      backgroundColor: '#2563eb',
                      color: '#ffffff',
                      fontWeight: 'bold',
                      padding: '0.5rem 1rem',
                      borderRadius: '0.5rem',
                      boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
                      transition: 'all 0.2s',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.5rem',
                      border: 'none',
                      cursor: 'pointer'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = '#1d4ed8';
                      e.currentTarget.style.boxShadow = '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = '#2563eb';
                      e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)';
                    }}
                  >
                    <Upload size={18} />
                    {projectImageFile ? 'Change Image' : 'Upload Image'}
                  </button>
                  {projectImageFile && (
                    <span className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                      {projectImageFile.name}
                    </span>
                  )}
                </div>
                {projectImage && (
                  <img src={projectImage} alt="Preview" className="mt-2 w-32 h-32 object-cover rounded-lg" />
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <textarea
                  value={projectDescription}
                  onChange={(e) => setProjectDescription(e.target.value)}
                  placeholder="Enter project description"
                  rows={4}
                  className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleAddProject}
                  disabled={uploading}
                  style={{
                    backgroundColor: '#16a34a',
                    color: '#ffffff',
                    fontWeight: 'bold',
                    padding: '0.5rem 1rem',
                    borderRadius: '0.5rem',
                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
                    transition: 'all 0.2s',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem',
                    border: 'none',
                    cursor: uploading ? 'not-allowed' : 'pointer',
                    opacity: uploading ? 0.5 : 1
                  }}
                  onMouseEnter={(e) => {
                    if (!uploading) {
                      e.currentTarget.style.backgroundColor = '#15803d';
                      e.currentTarget.style.boxShadow = '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!uploading) {
                      e.currentTarget.style.backgroundColor = '#16a34a';
                      e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)';
                    }
                  }}
                >
                  {uploading ? <Loader2 size={18} className="animate-spin" /> : <Plus size={18} />}
                  {uploading ? 'Adding...' : 'Add Project'}
                </button>
                <button
                  onClick={handleCancelAdd}
                  disabled={uploading}
                  style={{
                    backgroundColor: '#4b5563',
                    color: '#ffffff',
                    fontWeight: 'bold',
                    padding: '0.5rem 1rem',
                    borderRadius: '0.5rem',
                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
                    transition: 'all 0.2s',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem',
                    border: 'none',
                    cursor: uploading ? 'not-allowed' : 'pointer',
                    opacity: uploading ? 0.5 : 1
                  }}
                  onMouseEnter={(e) => {
                    if (!uploading) {
                      e.currentTarget.style.backgroundColor = '#374151';
                      e.currentTarget.style.boxShadow = '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!uploading) {
                      e.currentTarget.style.backgroundColor = '#4b5563';
                      e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)';
                    }
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {content.projects.length > 0 ? (
          <div ref={gridRef} className="grid md:grid-cols-2 gap-4">
            {content.projects.map((project, index) => (
              <div
                key={index}
                className="rounded-lg overflow-hidden shadow-md hover:shadow-xl transition-all duration-300"
              >
                <div
                  onClick={() => setSelectedProject(project)}
                  className="cursor-pointer"
                >
                  <img
                    src={getDisplayableGoogleDriveUrl(project.image, cardImgWidth)}
                    srcSet={`
                      ${getDisplayableGoogleDriveUrl(project.image, 800)} 800w,
                      ${getDisplayableGoogleDriveUrl(project.image, 1200)} 1200w,
                      ${getDisplayableGoogleDriveUrl(project.image, 1600)} 1600w
                    `}
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 50vw"
                    alt={project.title}
                    className="w-full h-48 object-cover"
                    onError={(e) => {
                      e.currentTarget.src = 'https://via.placeholder.com/400x300?text=Project+Image';
                    }}
                  />
                  <div className="p-4 bg-white dark:bg-gray-800">
                    <h4 className="text-[#f6421f] dark:text-[#ee8724] mb-2">{project.title}</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 whitespace-pre-wrap">{project.description}</p>
                  </div>
                </div>
                {isAdminOrAuditor && (
                  <div className="p-3 bg-gray-50 dark:bg-gray-700 border-t border-gray-200 dark:border-gray-600">
                    <button
                      onClick={() => handleDeleteProject(project.number)}
                      disabled={uploading}
                      style={{
                        backgroundColor: '#dc2626',
                        color: '#ffffff',
                        fontWeight: 'bold',
                        padding: '0.25rem 0.75rem',
                        borderRadius: '0.375rem',
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                        transition: 'all 0.2s',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.5rem',
                        border: 'none',
                        cursor: uploading ? 'not-allowed' : 'pointer',
                        opacity: uploading ? 0.5 : 1,
                        fontSize: '0.875rem'
                      }}
                      onMouseEnter={(e) => {
                        if (!uploading) {
                          e.currentTarget.style.backgroundColor = '#b91c1c';
                          e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!uploading) {
                          e.currentTarget.style.backgroundColor = '#dc2626';
                          e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)';
                        }
                      }}
                    >
                      <Trash2 size={14} />
                      Delete
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-center text-gray-500">No projects added yet.</p>
        )}
      </div>

      {/* Developer Info Card */}
      <div className="ysp-card bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-800 dark:to-gray-700 border-2 border-blue-200 dark:border-blue-800">
        <h3 className="text-[#f6421f] dark:text-[#ee8724] mb-4">Developer Info</h3>
        <div className="space-y-2">
          <p className="font-semibold text-lg">Ezequiel John B. Crisostomo</p>
          <p className="text-gray-700 dark:text-gray-300">Membership and Internal Affairs Officer</p>
          <p className="text-gray-700 dark:text-gray-300">Youth Service Philippines - Tagum Chapter</p>
          <div className="mt-4 pt-4 border-t border-gray-300 dark:border-gray-600">
            <p className="text-sm text-gray-600 dark:text-gray-400 text-justify leading-relaxed">
              Should you encounter any issues, errors, or technical difficulties while using this Web App, please do not hesitate to reach out to us. You may contact our support team through our official{' '}
              <a 
                href={content.facebookUrl || 'https://www.facebook.com/YSPTagumChapter'}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 dark:text-blue-400 hover:underline font-medium"
              >
                Facebook Page
              </a>
              {' '}or send us an Email:{' '}
              <a 
                href="https://mail.google.com/mail/?view=cm&fs=1&to=YSPTagumChapter@gmail.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#f6421f] dark:text-[#ee8724] hover:underline font-medium"
              >
                YSPTagumChapter@gmail.com
              </a>
              {' '}for further assistance. We value your feedback and will address your concerns as promptly as possible to ensure a smooth user experience.
            </p>
          </div>
        </div>
      </div>

      {/* Project Modal */}
      {selectedProject && (
        <div className="modal-overlay" onClick={() => setSelectedProject(null)}>
          <div ref={modalContentRef} className="modal-content max-w-2xl" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setSelectedProject(null)}
              style={{
                position: 'absolute',
                top: '1rem',
                right: '1rem',
                padding: '0.5rem',
                borderRadius: '9999px',
                backgroundColor: 'transparent',
                transition: 'all 0.2s',
                border: 'none',
                cursor: 'pointer'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = darkMode ? '#374151' : '#e5e7eb';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              <X size={20} />
            </button>
            
            <img
              src={getDisplayableGoogleDriveUrl(selectedProject.image, modalImgWidth)}
              srcSet={`
                ${getDisplayableGoogleDriveUrl(selectedProject.image, 800)} 800w,
                ${getDisplayableGoogleDriveUrl(selectedProject.image, 1200)} 1200w,
                ${getDisplayableGoogleDriveUrl(selectedProject.image, 1600)} 1600w,
                ${getDisplayableGoogleDriveUrl(selectedProject.image, 2000)} 2000w
              `}
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 80vw, 70vw"
              alt={selectedProject.title}
              className="w-full rounded-lg mb-4"
              style={{ maxHeight: '70vh', objectFit: 'contain' }}
            />
            <div className="mb-3">
              <a
                href={getOriginalGoogleDriveUrl(selectedProject.image)}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  backgroundColor: '#2563eb',
                  color: '#ffffff',
                  fontWeight: 'bold',
                  padding: '0.5rem 1rem',
                  borderRadius: '0.5rem',
                  boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
                  transition: 'all 0.2s',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  textDecoration: 'none'
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLAnchorElement).style.backgroundColor = '#1d4ed8';
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLAnchorElement).style.backgroundColor = '#2563eb';
                }}
              >
                View Full Size
              </a>
            </div>
            <h3 className="text-[#f6421f] dark:text-[#ee8724] mb-3">{selectedProject.title}</h3>
            <p className="text-justify whitespace-pre-wrap">{selectedProject.description}</p>
          </div>
        </div>
      )}

      {/* Org Chart Modal */}
      {orgModalOpen && content.orgChartUrl && (
        <div className="modal-overlay" onClick={() => setOrgModalOpen(false)}>
          <div ref={modalContentRef} className="modal-content max-w-4xl" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setOrgModalOpen(false)}
              style={{
                position: 'absolute',
                top: '1rem',
                right: '1rem',
                padding: '0.5rem',
                borderRadius: '9999px',
                backgroundColor: 'transparent',
                transition: 'all 0.2s',
                border: 'none',
                cursor: 'pointer'
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.backgroundColor = darkMode ? '#374151' : '#e5e7eb';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'transparent';
              }}
            >
              <X size={20} />
            </button>

            <img
              src={getDisplayableGoogleDriveUrl(content.orgChartUrl, modalImgWidth)}
              srcSet={`
                ${getDisplayableGoogleDriveUrl(content.orgChartUrl, 800)} 800w,
                ${getDisplayableGoogleDriveUrl(content.orgChartUrl, 1200)} 1200w,
                ${getDisplayableGoogleDriveUrl(content.orgChartUrl, 1600)} 1600w,
                ${getDisplayableGoogleDriveUrl(content.orgChartUrl, 2000)} 2000w
              `}
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 90vw, 80vw"
              alt="Organizational Chart"
              className="w-full rounded-lg mb-4"
              style={{ maxHeight: '80vh', objectFit: 'contain' }}
            />
            <div className="mb-3">
              <a
                href={getOriginalGoogleDriveUrl(content.orgChartUrl)}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  backgroundColor: '#2563eb',
                  color: '#ffffff',
                  fontWeight: 'bold',
                  padding: '0.5rem 1rem',
                  borderRadius: '0.5rem',
                  boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
                  transition: 'all 0.2s',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  textDecoration: 'none'
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLAnchorElement).style.backgroundColor = '#1d4ed8';
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLAnchorElement).style.backgroundColor = '#2563eb';
                }}
              >
                View Full Size
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
