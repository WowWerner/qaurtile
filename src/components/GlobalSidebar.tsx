import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Target, DollarSign, UserCheck, Clock, Home, ChevronUp, ChevronDown, FileText } from 'lucide-react';
import { UserInteractionsService } from '../utils/userInteractions';

export function GlobalSidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [isVisible, setIsVisible] = useState(true);

  // Don't show on login page
  if (location.pathname === '/login') {
    return null;
  }

  const handleNavigation = (path: string, name: string, icon: string) => {
    // Track interaction
    UserInteractionsService.trackInteraction({
      id: path,
      title: `${name} Dashboard`,
      path,
      icon,
      type: 'page',
      category: 'Dashboard'
    });
    
    navigate(path);
  };
  const menuItems = [
    {
      name: 'Home',
      icon: Home,
      path: '/',
      iconName: 'Home'
    },
    {
      name: 'Campaigns',
      icon: Target,
      path: '/dashboard/campaigns',
      iconName: 'Target'
    },
    {
      name: 'Finance',
      icon: DollarSign,
      path: '/dashboard/finance',
      iconName: 'DollarSign'
    },
    {
      name: 'HR',
      icon: UserCheck,
      path: '/dashboard/hr',
      iconName: 'UserCheck'
    },
    {
      name: 'Productivity',
      icon: Clock,
      path: '/dashboard/productivity',
      iconName: 'Clock'
    },
    {
      name: 'Reports',
      icon: FileText,
      path: '/dashboard/reports',
      iconName: 'FileText'
    }
  ];

  return (
    <>
      {/* Horizontal Top Menu Bar */}
      <div className={`fixed top-6 left-1/2 transform -translate-x-1/2 z-50 transition-all duration-300 ease-out ${
        isVisible ? 'translate-y-0' : '-translate-y-full'
      }`}>
        <div className="backdrop-blur-xl bg-white/90 border border-gray-200/60 rounded-2xl px-8 py-4 shadow-2xl shadow-gray-900/10">
          <div className="flex items-center space-x-8">
            {menuItems.map((item) => {
              const IconComponent = item.icon;
              const isActive = location.pathname === item.path;
              
              return (
                <div 
                  key={item.name}
                  onClick={() => handleNavigation(item.path, item.name, item.iconName)}
                  className="group relative flex flex-col items-center justify-center cursor-pointer transition-all duration-300 ease-out hover:scale-110 hover:-translate-y-1"
                >
                  <div className="flex flex-col items-center">
                    <IconComponent 
                      size={20} 
                      strokeWidth={1.5} 
                      className={`transition-colors duration-300 mb-1 ${
                        isActive 
                          ? 'text-[rgb(0,171,174)]' 
                          : 'text-gray-600 group-hover:text-[rgb(0,171,174)]'
                      }`} 
                    />
                    <span className={`text-xs font-light transition-colors duration-300 ${
                      isActive 
                        ? 'text-[rgb(0,171,174)]' 
                        : 'text-gray-600 group-hover:text-[rgb(0,171,174)]'
                    }`}>
                      {item.name}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Toggle Button - Show when hidden */}
      <div className={`fixed top-2 left-1/2 transform -translate-x-1/2 z-50 transition-all duration-300 ease-out ${
        isVisible ? 'translate-y-0 opacity-0 pointer-events-none' : 'translate-y-0 opacity-100'
      }`}>
        <button
          onClick={() => setIsVisible(true)}
          className="backdrop-blur-xl bg-white/90 border border-gray-200/60 rounded-full p-2 shadow-lg shadow-gray-900/10 hover:shadow-xl transition-all duration-300 hover:scale-110"
        >
          <ChevronDown size={14} strokeWidth={1.5} className="text-gray-600" />
        </button>
      </div>

      {/* Hide Button - Show when visible */}
      {isVisible && (
        <div className="fixed top-2 left-1/2 transform -translate-x-1/2 z-50">
          <button
            onClick={() => setIsVisible(false)}
            className="backdrop-blur-xl bg-white/90 border border-gray-200/60 rounded-full p-2 shadow-lg shadow-gray-900/10 hover:shadow-xl transition-all duration-300 hover:scale-110 opacity-0 hover:opacity-100"
          >
            <ChevronUp size={12} strokeWidth={1.5} className="text-gray-600" />
          </button>
        </div>
      )}
    </>
  );
}