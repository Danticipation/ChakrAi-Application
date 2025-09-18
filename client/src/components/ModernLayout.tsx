import React, { useState } from 'react';
import { 
  Brain, 
  Heart, 
  BookOpen, 
  BarChart3, 
  User, 
  MessageCircle,
  Target,
  Shield,
  Menu,
  X,
  ChevronRight,
  Bell,
  Search,
  Home,
  Activity,
  Users,
  FileText,
  Moon,
  Sun
} from 'lucide-react';

interface ModernLayoutProps {
  children: React.ReactNode;
  activeSection: string;
  onNavigate: (section: string) => void;
  currentUserId: number | null;
}

const ModernLayout: React.FC<ModernLayoutProps> = ({ 
  children, 
  activeSection, 
  onNavigate,
  currentUserId 
}) => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(true);
  const [notifications, setNotifications] = useState(3);

  // Navigation items with clean, professional structure
  const navigationSections = [
    {
      title: 'Core Features',
      items: [
        { id: 'dashboard', label: 'Dashboard', icon: Home, description: 'Overview & insights' },
        { id: 'chat', label: 'AI Therapy', icon: MessageCircle, description: 'Conversational support' },
        { id: 'journal', label: 'Journal', icon: BookOpen, description: 'Reflection & writing' },
        { id: 'analytics', label: 'Progress', icon: BarChart3, description: 'Data & trends' },
      ]
    },
    {
      title: 'Assessment',
      items: [
        { id: 'mood', label: 'Mood Tracking', icon: Heart, description: 'Daily emotional state' },
        { id: 'assessment', label: 'Assessments', icon: FileText, description: 'Clinical evaluations' },
        { id: 'goals', label: 'Goals', icon: Target, description: 'Treatment objectives' },
      ]
    },
    {
      title: 'Therapeutic Tools',
      items: [
        { id: 'meditation', label: 'Meditation', icon: Brain, description: 'Mindfulness exercises' },
        { id: 'exercises', label: 'CBT Exercises', icon: Activity, description: 'Structured interventions' },
        { id: 'resources', label: 'Resources', icon: FileText, description: 'Educational content' },
      ]
    },
    {
      title: 'Professional',
      items: [
        { id: 'therapist', label: 'Therapist Portal', icon: Users, description: 'Provider dashboard' },
        { id: 'admin', label: 'Administration', icon: Shield, description: 'System management' },
      ]
    }
  ];

  return (
    <div className={`min-h-screen transition-colors duration-300 ${
      darkMode 
        ? 'bg-gray-900 text-white' 
        : 'bg-gray-50 text-gray-900'
    }`}>
      
      {/* Modern Header */}
      <header className={`fixed top-0 left-0 right-0 z-50 transition-colors duration-300 ${
        darkMode 
          ? 'bg-gray-800/95 border-gray-700' 
          : 'bg-white/95 border-gray-200'
      } backdrop-blur-md border-b`}>
        <div className="flex items-center justify-between px-6 py-4">
          
          {/* Left: Logo & Navigation */}
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className={`p-2 rounded-lg transition-colors ${
                darkMode 
                  ? 'hover:bg-gray-700 text-gray-300' 
                  : 'hover:bg-gray-100 text-gray-600'
              }`}
            >
              <Menu className="w-5 h-5" />
            </button>
            
            <div className="flex items-center space-x-3">
              <div className={`w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center`}>
                <Brain className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-semibold">Chakrai</h1>
                <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  Mental Health Platform
                </p>
              </div>
            </div>
          </div>

          {/* Center: Search */}
          <div className="hidden md:flex flex-1 max-w-md mx-8">
            <div className="relative w-full">
              <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 ${
                darkMode ? 'text-gray-400' : 'text-gray-500'
              }`} />
              <input
                type="text"
                placeholder="Search features, exercises, or resources..."
                className={`w-full pl-10 pr-4 py-2 rounded-lg border transition-colors ${
                  darkMode 
                    ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-blue-500' 
                    : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-blue-500'
                } focus:outline-none focus:ring-2 focus:ring-blue-500/20`}
              />
            </div>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setDarkMode(!darkMode)}
              className={`p-2 rounded-lg transition-colors ${
                darkMode 
                  ? 'hover:bg-gray-700 text-gray-300' 
                  : 'hover:bg-gray-100 text-gray-600'
              }`}
            >
              {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
            
            <button className={`relative p-2 rounded-lg transition-colors ${
              darkMode 
                ? 'hover:bg-gray-700 text-gray-300' 
                : 'hover:bg-gray-100 text-gray-600'
            }`}>
              <Bell className="w-5 h-5" />
              {notifications > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                  {notifications}
                </span>
              )}
            </button>

            <div className={`w-8 h-8 rounded-full bg-gradient-to-br from-green-400 to-blue-500 flex items-center justify-center cursor-pointer`}>
              <User className="w-4 h-4 text-white" />
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="fixed inset-0 bg-black/50" onClick={() => setMobileMenuOpen(false)} />
          <div className={`fixed top-0 left-0 h-full w-80 transition-colors ${
            darkMode ? 'bg-gray-800' : 'bg-white'
          } shadow-xl`}>
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold">Navigation</h3>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className={`p-2 rounded-lg ${
                    darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
                  }`}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              {/* Mobile navigation items would go here */}
            </div>
          </div>
        </div>
      )}

      {/* Desktop Sidebar */}
      <aside className={`fixed top-16 left-0 h-[calc(100vh-4rem)] transition-all duration-300 ${
        sidebarOpen ? 'w-72' : 'w-16'
      } ${
        darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
      } border-r hidden lg:block overflow-y-auto`}>
        
        <div className="p-4 space-y-6">
          {navigationSections.map((section) => (
            <div key={section.title}>
              {sidebarOpen && (
                <h3 className={`text-xs font-medium uppercase tracking-wider mb-3 ${
                  darkMode ? 'text-gray-400' : 'text-gray-500'
                }`}>
                  {section.title}
                </h3>
              )}
              
              <div className="space-y-1">
                {section.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeSection === item.id;
                  
                  return (
                    <button
                      key={item.id}
                      onClick={() => onNavigate(item.id)}
                      className={`w-full flex items-center space-x-3 p-3 rounded-lg transition-all duration-200 group ${
                        isActive
                          ? 'bg-blue-500 text-white shadow-lg'
                          : darkMode
                          ? 'hover:bg-gray-700 text-gray-300'
                          : 'hover:bg-gray-100 text-gray-700'
                      }`}
                      title={!sidebarOpen ? item.label : undefined}
                    >
                      <Icon className={`w-5 h-5 transition-colors ${
                        isActive 
                          ? 'text-white' 
                          : darkMode 
                          ? 'text-gray-400 group-hover:text-gray-300' 
                          : 'text-gray-500 group-hover:text-gray-700'
                      }`} />
                      
                      {sidebarOpen && (
                        <div className="flex-1 text-left">
                          <div className="text-sm font-medium">{item.label}</div>
                          <div className={`text-xs ${
                            isActive 
                              ? 'text-blue-100' 
                              : darkMode 
                              ? 'text-gray-400' 
                              : 'text-gray-500'
                          }`}>
                            {item.description}
                          </div>
                        </div>
                      )}
                      
                      {sidebarOpen && (
                        <ChevronRight className={`w-4 h-4 transition-transform ${
                          isActive ? 'rotate-90' : ''
                        }`} />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </aside>

      {/* Main Content */}
      <main className={`transition-all duration-300 pt-16 ${
        sidebarOpen ? 'lg:pl-72' : 'lg:pl-16'
      }`}>
        <div className="p-6">
          {children}
        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className={`fixed bottom-0 left-0 right-0 lg:hidden ${
        darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
      } border-t`}>
        <div className="flex items-center justify-around py-2">
          {[
            { id: 'dashboard', icon: Home, label: 'Dashboard' },
            { id: 'chat', icon: MessageCircle, label: 'Therapy' },
            { id: 'journal', icon: BookOpen, label: 'Journal' },
            { id: 'analytics', icon: BarChart3, label: 'Progress' },
            { id: 'menu', icon: Menu, label: 'More' }
          ].map((item) => {
            const Icon = item.icon;
            const isActive = activeSection === item.id;
            
            return (
              <button
                key={item.id}
                onClick={() => {
                  if (item.id === 'menu') {
                    setMobileMenuOpen(true);
                  } else {
                    onNavigate(item.id);
                  }
                }}
                className={`flex flex-col items-center justify-center p-2 transition-colors ${
                  isActive
                    ? 'text-blue-500'
                    : darkMode
                    ? 'text-gray-400'
                    : 'text-gray-500'
                }`}
              >
                <Icon className="w-5 h-5 mb-1" />
                <span className="text-xs">{item.label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
};

export default ModernLayout;
