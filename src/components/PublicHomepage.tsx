import { useState, useEffect, useRef } from 'react';
import type React from 'react';
import { Mail, Facebook, X, LogIn, UserPlus } from 'lucide-react';
import { motion } from 'framer-motion';
import { homepageAPI, type HomepageContent, type HomepageProject } from '../services/api';
import { CardSkeleton, TextSkeleton } from './ui/skeletons';
import { OptimizedImage } from './OptimizedImage';
import { Button } from './ui/button';

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

/**
 * Convert plain text into React nodes with clickable links.
 * Detects: http/https URLs, www.* URLs, and email addresses.
 * Preserves line breaks and spacing when rendered inside a pre-wrap container.
 */
function renderLinkifiedText(text: string): React.ReactNode[] {
  if (!text) return [''];
  const elements: React.ReactNode[] = [];
  const regex = /(https?:\/\/[^\s]+)|((?:www\.)[^\s]+)|([A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,})/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    const start = match.index;
    const full = match[0];
    const httpUrl = match[1];
    const wwwUrl = match[2];
    const email = match[3];
    const end = start + full.length;
    if (lastIndex < start) {
      elements.push(text.slice(lastIndex, start));
    }

    let href = '';
    if (httpUrl) href = httpUrl;
    else if (wwwUrl) href = `http://${wwwUrl}`;
    else if (email) href = `mailto:${email}`;
    else href = full;

    elements.push(
      <a
        key={`lnk-${start}`}
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="text-[#f6421f] dark:text-[#ee8724] underline hover:opacity-90"
      >
        {full}
      </a>
    );

    lastIndex = end;
  }

  if (lastIndex < text.length) {
    elements.push(text.slice(lastIndex));
  }

  return elements;
}

interface PublicHomepageProps {
  darkMode: boolean;
  onLoginClick: () => void;
}

export default function PublicHomepage({ darkMode, onLoginClick }: PublicHomepageProps) {
  const [content, setContent] = useState<HomepageContent | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedProject, setSelectedProject] = useState<HomepageProject | null>(null);
  const [orgModalOpen, setOrgModalOpen] = useState(false);
  const gridRef = useRef<HTMLDivElement>(null);
  const modalContentRef = useRef<HTMLDivElement>(null);
  const [cardImgWidth, setCardImgWidth] = useState<number>(800);
  const [modalImgWidth, setModalImgWidth] = useState<number>(1200);

  // Google Form URL for "Be a Member" - you can update this
  const MEMBERSHIP_FORM_URL = 'https://forms.gle/NMZZ4knakR8mgSUVA';

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
      }
    } catch (error) {
      console.error('Error fetching homepage content:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-white via-orange-50 to-orange-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-4 md:p-8">
        <div className="max-w-6xl mx-auto space-y-6 pb-8">
          {/* About Section Skeleton */}
          <div className="ysp-card space-y-3">
            <div className="h-6 w-64 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
            <TextSkeleton lines={4} />
          </div>

          {/* Mission & Vision Skeletons */}
          <div className="grid md:grid-cols-2 gap-6">
            <div className="ysp-card space-y-3">
              <div className="h-5 w-32 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
              <TextSkeleton lines={3} />
            </div>
            <div className="ysp-card space-y-3">
              <div className="h-5 w-32 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
              <TextSkeleton lines={3} />
            </div>
          </div>

          {/* Projects Skeleton */}
          <div className="ysp-card">
            <div className="h-6 w-48 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-4" />
            <CardSkeleton count={2} />
          </div>
        </div>
      </div>
    );
  }

  if (!content) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-white via-orange-50 to-orange-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-4 md:p-8">
        <div className="ysp-card text-center">
          <p className="text-gray-500">No homepage content available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-orange-50 to-orange-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6 pb-8">
        
        {/* Hero Section with CTA Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="ysp-card text-center"
        >
          <div className="flex justify-center mb-6">
            <img 
              src="https://i.imgur.com/J4wddTW.png" 
              alt="YSP Logo" 
              className="w-32 h-32 object-contain"
            />
          </div>
          <h1 className="text-[#f6421f] dark:text-[#ee8724] mb-4">
            Youth Service Philippines
          </h1>
          <p className="text-xl text-gray-700 dark:text-gray-300 mb-6">
            Tagum Chapter
          </p>
          <p className="text-gray-600 dark:text-gray-400 mb-8 max-w-2xl mx-auto">
            Empowering youth through service, leadership, and community engagement
          </p>
          
          {/* Call to Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                onClick={onLoginClick}
                className="w-full sm:w-auto px-8 py-6 text-lg bg-gradient-to-r from-[#f6421f] to-[#ee8724] hover:from-[#ee8724] hover:to-[#fbcb29] text-white shadow-lg shadow-orange-300/50"
              >
                <LogIn className="mr-2" size={20} />
                Login
              </Button>
            </motion.div>
            
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                onClick={() => window.open(MEMBERSHIP_FORM_URL, '_blank')}
                variant="outline"
                className="w-full sm:w-auto px-8 py-6 text-lg border-2 border-[#f6421f] text-[#f6421f] hover:bg-orange-50 dark:hover:bg-gray-800"
              >
                <UserPlus className="mr-2" size={20} />
                Be a Member
              </Button>
            </motion.div>
          </div>
        </motion.div>

        {/* About Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="ysp-card"
        >
          <h2 className="text-[#f6421f] dark:text-[#ee8724] mb-4">About Youth Service Philippines</h2>
          <p className="text-justify mb-4">{content.about}</p>
        </motion.div>

        {/* Mission & Vision */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="grid md:grid-cols-2 gap-6"
        >
          <div className="ysp-card">
            <h3 className="text-[#f6421f] dark:text-[#ee8724] mb-3">Mission</h3>
            <p className="text-justify">{content.mission}</p>
          </div>

          <div className="ysp-card">
            <h3 className="text-[#f6421f] dark:text-[#ee8724] mb-3">Vision</h3>
            <p className="text-justify">{content.vision}</p>
          </div>
        </motion.div>

        {/* Advocacy Pillars */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="ysp-card"
        >
          <h3 className="text-[#f6421f] dark:text-[#ee8724] mb-3">Section 3. YSP shall be guided by the following advocacy pillars:</h3>
          <div className="text-justify whitespace-pre-wrap leading-relaxed">
            {content.objectives.map((objective, index) => (
              <p key={index}>{objective}</p>
            ))}
          </div>
        </motion.div>

        {/* Organizational Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="ysp-card"
        >
          <h3 className="text-[#f6421f] dark:text-[#ee8724] mb-3">Organizational Chart</h3>
          <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
            {content.orgChartUrl ? (
              <OptimizedImage
                src={getDisplayableGoogleDriveUrl(content.orgChartUrl, 1200)}
                alt="Organizational Chart"
                className="w-full rounded-lg cursor-pointer"
                style={{ maxHeight: '70vh', objectFit: 'contain' }}
                onClick={() => setOrgModalOpen(true)}
                fallbackSrc="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='300'%3E%3Crect fill='%23f3f4f6' width='400' height='300'/%3E%3Ctext x='50%25' y='50%25' text-anchor='middle' fill='%239ca3af' dy='.3em'%3EOrg Chart%3C/text%3E%3C/svg%3E"
                loading="lazy"
              />
            ) : (
              <p className="text-gray-500 text-center">No organizational chart uploaded yet.</p>
            )}
          </div>
        </motion.div>

        {/* Founder */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="ysp-card"
        >
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
        </motion.div>

        {/* Projects */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="ysp-card"
        >
          <h3 className="text-[#f6421f] dark:text-[#ee8724] mb-4">Projects Implemented</h3>

          {content.projects.length > 0 ? (
            <div ref={gridRef} className="grid md:grid-cols-2 gap-4">
              {content.projects.map((project, index) => (
                <div
                  key={index}
                  className="rounded-lg overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 cursor-pointer"
                  onClick={() => setSelectedProject(project)}
                >
                  <OptimizedImage
                    src={getDisplayableGoogleDriveUrl(project.image, cardImgWidth)}
                    alt={project.title}
                    className="w-full h-48 object-cover"
                    fallbackSrc="https://via.placeholder.com/400x300?text=Project+Image"
                    loading="lazy"
                  />
                  <div className="p-4 bg-white dark:bg-gray-800">
                    <h4 className="text-[#f6421f] dark:text-[#ee8724] mb-2">{project.title}</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 whitespace-pre-wrap">{project.description}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-gray-500">No projects added yet.</p>
          )}
        </motion.div>

        {/* Developer Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.7 }}
          className="ysp-card bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-800 dark:to-gray-700 border-2 border-blue-200 dark:border-blue-800"
        >
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
        </motion.div>
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
            <p className="text-justify whitespace-pre-wrap">{renderLinkifiedText(selectedProject.description)}</p>
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
