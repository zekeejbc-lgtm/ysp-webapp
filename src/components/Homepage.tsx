import { useState, useEffect } from 'react';
import { Mail, Facebook, X, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { homepageAPI, type HomepageContent, type HomepageProject } from '../services/api';

interface HomepageProps {
  darkMode: boolean;
}

export default function Homepage({ darkMode }: HomepageProps) {
  const [content, setContent] = useState<HomepageContent | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedProject, setSelectedProject] = useState<HomepageProject | null>(null);

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
        <h3 className="text-[#f6421f] dark:text-[#ee8724] mb-3">Objectives</h3>
        <ol className="list-decimal list-inside space-y-2">
          {content.objectives.map((objective, index) => (
            <li key={index} className="text-justify">{objective}</li>
          ))}
        </ol>
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

      {content.projects.length > 0 && (
        <div className="ysp-card">
          <h3 className="text-[#f6421f] dark:text-[#ee8724] mb-4">Projects Implemented</h3>
          <div className="grid md:grid-cols-2 gap-4">
            {content.projects.map((project, index) => (
              <div
                key={index}
                onClick={() => setSelectedProject(project)}
                className="cursor-pointer rounded-lg overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 hover:scale-[1.03]"
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
            ))}
          </div>
        </div>
      )}

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
