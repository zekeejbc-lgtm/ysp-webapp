import { Menu, X, Sun, Moon } from 'lucide-react';

interface TopBarProps {
  darkMode: boolean;
  setDarkMode: (value: boolean) => void;
  setSidebarOpen: (value: boolean) => void;
  sidebarOpen: boolean;
}

export default function TopBar({ darkMode, setDarkMode, setSidebarOpen, sidebarOpen }: TopBarProps) {
  return (
    <div className="fixed top-0 left-0 right-0 h-16 bg-white dark:bg-gray-900 shadow-md z-50 flex items-center justify-between px-4 transition-colors duration-300">
      <div className="flex items-center gap-4">
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
        >
          {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
        
        <div className="flex items-center gap-3">
          <img 
            src="https://i.imgur.com/J4wddTW.png" 
            alt="YSP Logo" 
            className="w-10 h-10 object-contain"
            onError={(e) => {
              e.currentTarget.src = "https://ui-avatars.com/api/?name=YSP&size=80&background=f6421f&color=fff";
            }}
          />
          <div>
            <h1 className="text-[#f6421f] dark:text-[#ee8724] font-['Lexend'] m-0">Youth Service Philippines</h1>
            <p className="text-xs text-gray-600 dark:text-gray-400 m-0">Tagum Chapter</p>
          </div>
        </div>
      </div>
      
      <button
        onClick={() => setDarkMode(!darkMode)}
        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
      >
        {darkMode ? <Sun size={24} className="text-yellow-400" /> : <Moon size={24} className="text-gray-700" />}
      </button>
    </div>
  );
}
