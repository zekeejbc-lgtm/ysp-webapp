import React, { useState } from 'react';
import { Mail, Facebook, X } from 'lucide-react';

interface HomepageProps {
  darkMode: boolean;
}

// Mock homepage data - In production, this would be loaded from Homepage Content sheet
const homepageData = {
  about: "Youth Service Philippines (YSP) is a dynamic organization committed to empowering Filipino youth through meaningful service, leadership development, and community engagement. Founded on the principles of volunteerism and social responsibility, YSP serves as a platform for young individuals to create positive change in their communities.",
  mission: "To empower Filipino youth to become active agents of positive social change through volunteerism, leadership development, and community service.",
  vision: "A nation where Filipino youth are recognized as catalysts for sustainable community development and social transformation.",
  objectives: [
    "Foster a culture of volunteerism among Filipino youth across all sectors of society",
    "Provide leadership training and character development programs for young people",
    "Facilitate community-based projects that address local needs and challenges",
    "Create partnerships with government agencies, private organizations, and educational institutions",
    "Promote youth participation in nation-building and civic engagement activities",
    "Develop innovative solutions to social problems through youth-led initiatives"
  ],
  founder: "Engr. Ricardo M. Dela Cruz",
  founderEmail: "founder@ysp.org.ph",
  founderFacebook: "https://facebook.com/ysp.philippines",
  projects: [
    {
      title: "Community Clean-Up Drive",
      description: "Monthly environmental campaigns engaging youth volunteers in neighborhood beautification, waste segregation education, and coastal clean-up activities across Tagum City. This initiative has mobilized over 500 volunteers and collected 2 tons of waste materials.",
      image: "https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?w=400&h=300&fit=crop"
    },
    {
      title: "Youth Leadership Summit",
      description: "Annual conference bringing together young leaders from various sectors to develop skills in public speaking, project management, and community organizing. The summit includes workshops, panel discussions, and networking opportunities with established leaders.",
      image: "https://images.unsplash.com/photo-1475721027785-f74eccf877e2?w=400&h=300&fit=crop"
    },
    {
      title: "Education Outreach Program",
      description: "Tutorial and mentorship program for underprivileged students in remote barangays. Volunteers provide academic support, career guidance, and distribute school supplies. The program currently serves 150 students across 5 communities.",
      image: "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=400&h=300&fit=crop"
    },
    {
      title: "Disaster Relief Operations",
      description: "Rapid response team providing immediate assistance during natural calamities including distribution of relief goods, medical aid, and psychological support. YSP has responded to 8 major disasters in the past year, helping over 1,000 families.",
      image: "https://images.unsplash.com/photo-1469571486292-0ba58a3f068b?w=400&h=300&fit=crop"
    }
  ]
};

export default function Homepage({ darkMode }: HomepageProps) {
  const [selectedProject, setSelectedProject] = useState<typeof homepageData.projects[0] | null>(null);

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-8">
      <div className="ysp-card">
        <h2 className="text-[#f6421f] dark:text-[#ee8724] mb-4">About Youth Service Philippines</h2>
        <p className="text-justify mb-4">{homepageData.about}</p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="ysp-card">
          <h3 className="text-[#f6421f] dark:text-[#ee8724] mb-3">Mission</h3>
          <p className="text-justify">{homepageData.mission}</p>
        </div>

        <div className="ysp-card">
          <h3 className="text-[#f6421f] dark:text-[#ee8724] mb-3">Vision</h3>
          <p className="text-justify">{homepageData.vision}</p>
        </div>
      </div>

      <div className="ysp-card">
        <h3 className="text-[#f6421f] dark:text-[#ee8724] mb-3">Objectives</h3>
        <ol className="list-decimal list-inside space-y-2">
          {homepageData.objectives.map((objective, index) => (
            <li key={index} className="text-justify">{objective}</li>
          ))}
        </ol>
      </div>

      <div className="ysp-card">
        <h3 className="text-[#f6421f] dark:text-[#ee8724] mb-3">Organizational Chart</h3>
        <div className="bg-gray-50 dark:bg-gray-800 p-6 rounded-lg">
          <div className="text-center space-y-4">
            <div className="inline-block bg-gradient-to-r from-[#f6421f] to-[#ee8724] text-white px-6 py-3 rounded-lg">
              President
            </div>
            <div className="grid grid-cols-3 gap-4 mt-4">
              <div className="bg-white dark:bg-gray-700 px-4 py-2 rounded-lg shadow">Vice President</div>
              <div className="bg-white dark:bg-gray-700 px-4 py-2 rounded-lg shadow">Secretary</div>
              <div className="bg-white dark:bg-gray-700 px-4 py-2 rounded-lg shadow">Treasurer</div>
            </div>
            <div className="grid grid-cols-4 gap-3 mt-4">
              <div className="bg-gray-200 dark:bg-gray-600 px-3 py-2 rounded text-sm">Programs</div>
              <div className="bg-gray-200 dark:bg-gray-600 px-3 py-2 rounded text-sm">Logistics</div>
              <div className="bg-gray-200 dark:bg-gray-600 px-3 py-2 rounded text-sm">Media</div>
              <div className="bg-gray-200 dark:bg-gray-600 px-3 py-2 rounded text-sm">Finance</div>
            </div>
          </div>
        </div>
      </div>

      <div className="ysp-card">
        <h3 className="text-[#f6421f] dark:text-[#ee8724] mb-3">Founder</h3>
        <p className="mb-3">{homepageData.founder}</p>
        <div className="flex gap-3">
          <a
            href={`mailto:${homepageData.founderEmail}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            <Mail size={18} />
            Email
          </a>
          <a
            href={homepageData.founderFacebook}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Facebook size={18} />
            Facebook
          </a>
        </div>
      </div>

      <div className="ysp-card">
        <h3 className="text-[#f6421f] dark:text-[#ee8724] mb-4">Projects Implemented</h3>
        <div className="grid md:grid-cols-2 gap-4">
          {homepageData.projects.map((project, index) => (
            <div
              key={index}
              onClick={() => setSelectedProject(project)}
              className="cursor-pointer rounded-lg overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 hover:scale-[1.03]"
            >
              <img
                src={project.image}
                alt={project.title}
                className="w-full h-48 object-cover"
              />
              <div className="p-4 bg-white dark:bg-gray-800">
                <h4 className="text-[#f6421f] dark:text-[#ee8724] mb-2">{project.title}</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">{project.description}</p>
              </div>
            </div>
          ))}
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
