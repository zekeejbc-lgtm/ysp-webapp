import { useState } from 'react';
import { X, Upload } from 'lucide-react';
import { toast } from 'sonner';
import uploadImageFile from '../services/uploadImage';

interface UploadChartModalProps {
  isOpen: boolean;
  onClose: () => void;
  isDark: boolean;
  onChartUploaded: () => void;
  userIdCode?: string;
}

export default function UploadChartModal({ 
  isOpen, 
  onClose, 
  isDark,
  onChartUploaded,
  userIdCode 
}: UploadChartModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
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
      
      setImageFile(file);
      
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
    
    if (!imageFile) {
      toast.error('Please upload a chart image');
      return;
    }
    if (!userIdCode) {
      toast.error('User session expired. Please login again.');
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await uploadImageFile(imageFile, { uploadType: 'orgchart', userIdCode });
      if (!res || !res.success) {
        toast.error(res?.message || 'Failed to upload chart image');
        setIsSubmitting(false);
        return;
      }

      const GAS_URL = import.meta.env.VITE_GAS_URL;
      const updatePayload = new URLSearchParams();
      updatePayload.append('action', 'updateOrgChartUrl');
      updatePayload.append('idCode', userIdCode);
      updatePayload.append('imageUrl', res.imageUrl || res.publicUrl || res.fileUrl || '');

      const updateResponse = await fetch(GAS_URL, {
        method: 'POST',
        body: updatePayload,
      });

      const updateResult = await updateResponse.json();

      if (updateResult.success) {
        toast.success('Organizational chart uploaded successfully!');
        onChartUploaded();
        handleClose();
      } else {
        toast.error(updateResult.message || 'Failed to update chart reference');
        setIsSubmitting(false);
      }
    } catch (error) {
      console.error('Error uploading chart:', error);
      toast.error('Failed to upload chart. Please try again.');
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setImageFile(null);
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
            Upload Organizational Chart
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
            {/* Image Upload */}
            <div>
              <label className={`block text-sm font-semibold mb-2 ${
                isDark ? 'text-gray-300' : 'text-gray-700'
              }`}>
                Chart Image *
              </label>
              
              {imagePreview ? (
                <div className="relative w-full">
                  <img 
                    src={imagePreview} 
                    alt="Preview" 
                    className={`w-full h-auto object-contain rounded-lg border-2 ${
                      isDark ? 'border-gray-600' : 'border-gray-300'
                    }`}
                    style={{ maxHeight: '500px' }}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setImageFile(null);
                      setImagePreview('');
                    }}
                    className="absolute top-2 right-2 p-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors shadow-lg"
                    disabled={isSubmitting}
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <label className={`flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${
                  isDark 
                    ? 'border-gray-600 hover:bg-gray-800' 
                    : 'border-gray-300 hover:bg-gray-50'
                }`}>
                  <div className="flex flex-col items-center justify-center pt-5 pb-6 px-4">
                    <Upload className="w-16 h-16 text-gray-400 mb-4" />
                    <p className={`mb-2 text-base text-center ${
                      isDark ? 'text-gray-400' : 'text-gray-600'
                    }`}>
                      <span className="font-semibold">Click to upload</span> or drag and drop
                    </p>
                    <p className={`text-sm ${
                      isDark ? 'text-gray-400' : 'text-gray-500'
                    }`}>
                      PNG, JPG or JPEG (MAX. 10MB)
                    </p>
                    <p className={`text-xs mt-2 ${
                      isDark ? 'text-gray-500' : 'text-gray-400'
                    }`}>
                      Recommended: High-resolution organizational chart image
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

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-gray-200 dark:border-gray-700 mt-6 pt-6">
              <button
                type="submit"
                disabled={isSubmitting || !imageFile}
                className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-white transition-all duration-300 hover:-translate-y-1 hover:shadow-xl flex-1 text-base group disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
                style={{
                  background: "linear-gradient(135deg, #f6421f 0%, #ee8724 100%)",
                  fontWeight: "600",
                  boxShadow: "0 4px 12px rgba(246, 66, 31, 0.3)",
                }}
              >
                <Upload className="w-5 h-5" />
                {isSubmitting ? 'Uploading...' : 'Upload Chart'}
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
