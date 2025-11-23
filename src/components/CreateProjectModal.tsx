import { useState } from 'react';
import { X, Upload, Link as LinkIcon, Save } from 'lucide-react';
import { toast } from 'sonner';

interface CreateProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  isDark: boolean;
  onProjectCreated: () => void;
  userIdCode?: string;
}

export default function CreateProjectModal({ 
  isOpen, 
  onClose, 
  isDark,
  onProjectCreated,
  userIdCode 
}: CreateProjectModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    link: '',
    linkText: 'Learn More',
    imageFile: null as File | null,
  });
  const [imagePreview, setImagePreview] = useState<string>('');

  if (!isOpen) return null;

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        toast.error('Image must be less than 10MB');
        return;
      }
      if (!file.type.startsWith('image/')) {
        toast.error('Please upload an image file');
        return;
      }
      
      setFormData({ ...formData, imageFile: file });
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
      
      toast.success('Image selected');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim()) {
      toast.error('Please enter a project title');
      return;
    }
    if (!formData.description.trim()) {
      toast.error('Please enter a project description');
      return;
    }
    if (!formData.imageFile) {
      toast.error('Please upload a project image');
      return;
    }
    if (!userIdCode) {
      toast.error('User session expired. Please login again.');
      return;
    }

    setIsSubmitting(true);

    try {
      // Convert image to base64
      const reader = new FileReader();
      reader.readAsDataURL(formData.imageFile);
      
      reader.onload = async () => {
        const base64Image = reader.result as string;
        
        // Call GAS API using URL-encoded form data
        const formPayload = new URLSearchParams();
        formPayload.append('action', 'createProject');
        formPayload.append('idCode', userIdCode);
        formPayload.append('title', formData.title);
        formPayload.append('description', formData.description);
        formPayload.append('link', formData.link);
        formPayload.append('linkText', formData.linkText);
        formPayload.append('imageBase64', base64Image);
        formPayload.append('imageFileName', formData.imageFile!.name);

        const GAS_URL = import.meta.env.VITE_GAS_URL;
        
        const response = await fetch(GAS_URL, {
          method: 'POST',
          body: formPayload,
        });

        const result = await response.json();

        if (result.success) {
          toast.success('Project created successfully!');
          onProjectCreated();
          handleClose();
        } else {
          toast.error(result.message || 'Failed to create project');
          setIsSubmitting(false);
        }
      };

      reader.onerror = () => {
        toast.error('Failed to read image file');
        setIsSubmitting(false);
      };
    } catch (error) {
      console.error('Error creating project:', error);
      toast.error('Failed to create project. Please try again.');
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setFormData({
      title: '',
      description: '',
      link: '',
      linkText: 'Learn More',
      imageFile: null,
    });
    setImagePreview('');
    setIsSubmitting(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-sm"
        onClick={handleClose}
        style={{ zIndex: -1 }}
      />

      {/* Modal */}
      <div 
        className={`relative w-full max-w-2xl max-h-[90vh] flex flex-col rounded-2xl shadow-2xl ${
          isDark 
            ? 'bg-gray-900 border border-gray-700' 
            : 'bg-white border border-gray-200'
        }`}
      >
        {/* Header */}
        <div className={`flex items-center justify-between p-6 border-b ${
          isDark 
            ? 'border-gray-700 bg-gray-900/80 backdrop-blur-md' 
            : 'border-gray-200 bg-white/80 backdrop-blur-md'
        } rounded-t-2xl`}>
          <h2
            className="text-2xl font-bold"
            style={{
              fontFamily: 'var(--font-headings)',
              color: '#f6421f',
              letterSpacing: '-0.01em',
            }}
          >
            Create New Project
          </h2>
          <button
            onClick={handleClose}
            className={`p-2 rounded-lg transition-colors ${
              isDark 
                ? 'hover:bg-gray-800 text-gray-400' 
                : 'hover:bg-gray-100 text-gray-600'
            }`}
            aria-label="Close modal"
            disabled={isSubmitting}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Content */}
        <div className="overflow-y-auto flex-1" style={{ 
          scrollbarWidth: 'thin',
          scrollbarColor: isDark ? '#4B5563 #1F2937' : '#D1D5DB #F3F4F6'
        }}>
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Project Title */}
            <div>
              <label className={`block text-sm font-semibold mb-2 ${
                isDark ? 'text-gray-300' : 'text-gray-700'
              }`}>
                Project Title *
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className={`w-full px-4 py-3 rounded-lg border transition-all ${
                  isDark 
                    ? 'border-gray-600 bg-gray-800 text-white focus:ring-2 focus:ring-orange-500 focus:border-transparent' 
                    : 'border-gray-300 bg-white text-gray-900 focus:ring-2 focus:ring-orange-500 focus:border-transparent'
                }`}
                placeholder="Enter project title"
                disabled={isSubmitting}
                required
              />
            </div>

            {/* Project Description */}
            <div>
              <label className={`block text-sm font-semibold mb-2 ${
                isDark ? 'text-gray-300' : 'text-gray-700'
              }`}>
                Project Description *
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className={`w-full px-4 py-3 rounded-lg border transition-all min-h-[120px] resize-y ${
                  isDark 
                    ? 'border-gray-600 bg-gray-800 text-white focus:ring-2 focus:ring-orange-500 focus:border-transparent' 
                    : 'border-gray-300 bg-white text-gray-900 focus:ring-2 focus:ring-orange-500 focus:border-transparent'
                }`}
                placeholder="Describe the project..."
                disabled={isSubmitting}
                required
              />
              <p className={`mt-1 text-xs ${
                isDark ? 'text-gray-400' : 'text-gray-500'
              }`}>
                Tip: URLs and hashtags will be automatically styled in orange
              </p>
            </div>

            {/* Image Upload */}
            <div>
              <label className={`block text-sm font-semibold mb-2 ${
                isDark ? 'text-gray-300' : 'text-gray-700'
              }`}>
                Project Image *
              </label>
              
              {imagePreview ? (
                <div className="relative w-full">
                  <img 
                    src={imagePreview} 
                    alt="Preview" 
                    className={`w-full h-48 object-cover rounded-lg border-2 ${
                      isDark ? 'border-gray-600' : 'border-gray-300'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setFormData({ ...formData, imageFile: null });
                      setImagePreview('');
                    }}
                    className="absolute top-2 right-2 p-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors shadow-lg"
                    disabled={isSubmitting}
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <label className={`flex flex-col items-center justify-center w-full h-48 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${
                  isDark 
                    ? 'border-gray-600 hover:bg-gray-800' 
                    : 'border-gray-300 hover:bg-gray-50'
                }`}>
                  <div className="flex flex-col items-center justify-center pt-5 pb-6 px-4">
                    <Upload className="w-12 h-12 text-gray-400 mb-3" />
                    <p className={`mb-2 text-sm text-center ${
                      isDark ? 'text-gray-400' : 'text-gray-600'
                    }`}>
                      <span className="font-semibold">Click to upload</span> or drag and drop
                    </p>
                    <p className={`text-xs ${
                      isDark ? 'text-gray-400' : 'text-gray-500'
                    }`}>
                      PNG, JPG or JPEG (MAX. 10MB)
                    </p>
                  </div>
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/jpg"
                    onChange={handleImageChange}
                    className="hidden"
                    disabled={isSubmitting}
                    required
                  />
                </label>
              )}
            </div>

            {/* External Link (Optional) */}
            <div>
              <label className={`block text-sm font-semibold mb-2 ${
                isDark ? 'text-gray-300' : 'text-gray-700'
              }`}>
                External Link (Optional)
              </label>
              <div className="flex gap-2">
                <div className={`flex-shrink-0 flex items-center justify-center w-10 h-11 rounded-lg ${
                  isDark ? 'bg-gray-800' : 'bg-gray-100'
                }`}>
                  <LinkIcon className={`w-5 h-5 ${
                    isDark ? 'text-gray-400' : 'text-gray-500'
                  }`} />
                </div>
                <input
                  type="url"
                  value={formData.link}
                  onChange={(e) => setFormData({ ...formData, link: e.target.value })}
                  className={`flex-1 px-4 py-3 rounded-lg border transition-all ${
                    isDark 
                      ? 'border-gray-600 bg-gray-800 text-white focus:ring-2 focus:ring-orange-500 focus:border-transparent' 
                      : 'border-gray-300 bg-white text-gray-900 focus:ring-2 focus:ring-orange-500 focus:border-transparent'
                  }`}
                  placeholder="https://example.com"
                  disabled={isSubmitting}
                />
              </div>
            </div>

            {/* Link Text */}
            {formData.link && (
              <div>
                <label className={`block text-sm font-semibold mb-2 ${
                  isDark ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  Link Button Text
                </label>
                <input
                  type="text"
                  value={formData.linkText}
                  onChange={(e) => setFormData({ ...formData, linkText: e.target.value })}
                  className={`w-full px-4 py-3 rounded-lg border transition-all ${
                    isDark 
                      ? 'border-gray-600 bg-gray-800 text-white focus:ring-2 focus:ring-orange-500 focus:border-transparent' 
                      : 'border-gray-300 bg-white text-gray-900 focus:ring-2 focus:ring-orange-500 focus:border-transparent'
                  }`}
                  placeholder="Learn More"
                  disabled={isSubmitting}
                />
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-gray-200 dark:border-gray-700 mt-6 pt-6">
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-white transition-all duration-300 hover:-translate-y-1 hover:shadow-xl flex-1 text-base group disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
                style={{
                  background: "linear-gradient(135deg, #f6421f 0%, #ee8724 100%)",
                  fontWeight: "600",
                  boxShadow: "0 4px 12px rgba(246, 66, 31, 0.3)",
                }}
              >
                <Save className="w-5 h-5" />
                {isSubmitting ? 'Creating...' : 'Create Project'}
              </button>
              <button
                type="button"
                onClick={handleClose}
                disabled={isSubmitting}
                className={`flex items-center justify-center gap-2 px-6 py-3 rounded-xl border-2 transition-all duration-300 flex-1 text-base disabled:opacity-50 disabled:cursor-not-allowed ${
                  isDark 
                    ? 'hover:bg-gray-800' 
                    : 'hover:bg-gray-100'
                }`}
                style={{
                  borderColor: "#f6421f",
                  color: "#f6421f",
                  fontWeight: "600",
                }}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
