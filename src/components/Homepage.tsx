import { useState, useEffect, useRef } from 'react';
import { Mail, Facebook, X, Loader2, Plus, Upload, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { homepageAPI, type HomepageContent, type HomepageProject } from '../services/api';

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

  const isAdminOrAuditor = currentUser && (currentUser.role === 'Admin' || currentUser.role === 'Auditor');

  useEffect(() => {
    fetchHomepageContent();
  }, []);

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

      {content.orgChartUrl && (
        <div className="ysp-card">
          <h3 className="text-[#f6421f] dark:text-[#ee8724] mb-3">Organizational Chart</h3>
          <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
            <img
              src={content.orgChartUrl}
              alt="Organizational Chart"
              className="w-full h-auto rounded-lg"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
                e.currentTarget.parentElement!.innerHTML = '<p class="text-gray-500 text-center">Organizational chart not available</p>';
              }}
            />
          </div>
        </div>
      )}

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
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#f6421f] to-[#ee8724] text-white rounded-lg hover:shadow-lg transition-all"
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
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
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
                  maxLength={500}
                  rows={4}
                  className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                />
                <p className="text-xs text-gray-500 mt-1">{projectDescription.length}/500 characters</p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleAddProject}
                  disabled={uploading}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {uploading ? <Loader2 size={18} className="animate-spin" /> : <Plus size={18} />}
                  {uploading ? 'Adding...' : 'Add Project'}
                </button>
                <button
                  onClick={handleCancelAdd}
                  disabled={uploading}
                  className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 disabled:opacity-50 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {content.projects.length > 0 ? (
          <div className="grid md:grid-cols-2 gap-4">
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
                    src={project.image}
                    alt={project.title}
                    className="w-full h-48 object-cover"
                    onError={(e) => {
                      e.currentTarget.src = 'https://via.placeholder.com/400x300?text=Project+Image';
                    }}
                  />
                  <div className="p-4 bg-white dark:bg-gray-800">
                    <h4 className="text-[#f6421f] dark:text-[#ee8724] mb-2">{project.title}</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">{project.description}</p>
                  </div>
                </div>
                {isAdminOrAuditor && (
                  <div className="p-3 bg-gray-50 dark:bg-gray-700 border-t border-gray-200 dark:border-gray-600">
                    <button
                      onClick={() => handleDeleteProject(project.number)}
                      disabled={uploading}
                      className="flex items-center gap-2 px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50 transition-colors"
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
          <div className="modal-content max-w-2xl" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setSelectedProject(null)}
              className="absolute top-4 right-4 p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition-colors"
            >
              <X size={20} />
            </button>
            
            <img
              src={selectedProject.image}
              alt={selectedProject.title}
              className="w-full h-64 object-cover rounded-lg mb-4"
            />
            <h3 className="text-[#f6421f] dark:text-[#ee8724] mb-3">{selectedProject.title}</h3>
            <p className="text-justify">{selectedProject.description}</p>
          </div>
        </div>
      )}
    </div>
  );
}
