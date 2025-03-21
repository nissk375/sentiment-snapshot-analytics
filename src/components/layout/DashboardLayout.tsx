
import React, { useEffect, useState } from 'react';
import { sentimentService, SentimentData } from '@/services/sentimentService';
import { AlertCircle, Bell, Menu, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import { useNavigate, useLocation } from 'react-router-dom';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  const [data, setData] = useState<SentimentData | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const location = useLocation();
  
  useEffect(() => {
    // Subscribe to sentiment data updates
    const unsubscribe = sentimentService.subscribe(newData => {
      setData(newData);
    });
    
    // Start real-time updates
    const stopUpdates = sentimentService.startRealTimeUpdates();
    
    // Clean up on component unmount
    return () => {
      unsubscribe();
      stopUpdates();
    };
  }, []);

  // Get sentiment color class for header
  const getSentimentHeaderClass = () => {
    if (!data) return 'bg-gradient-to-r from-blue-600/90 to-blue-500/90';
    
    if (data.overallSentiment > 0.2) {
      return 'bg-gradient-to-r from-green-600/90 to-green-500/90';
    }
    
    if (data.overallSentiment < -0.2) {
      return 'bg-gradient-to-r from-red-600/90 to-red-500/90';
    }
    
    return 'bg-gradient-to-r from-blue-600/90 to-blue-500/90';
  };

  // Navigation items with their routes
  const navItems = [
    { name: 'Market Overview', path: '/' },
    { name: 'Sector Analysis', path: '/sector-analysis' },
    { name: 'Stock Sentiment', path: '/stock-sentiment' },
    { name: 'News Impact', path: '/news-impact' },
    { name: 'Predictions', path: '/predictions' },
  ];

  // Handle navigation item click
  const handleNavClick = (path: string) => {
    navigate(path);
    if (isMobile) {
      setMenuOpen(false);
    }
  };
  
  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <header className={cn(
        "w-full py-4 px-4 md:px-6 text-white backdrop-blur-md z-10 transition-all duration-500",
        getSentimentHeaderClass()
      )}>
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-4">
            {isMobile && (
              <button 
                onClick={() => setMenuOpen(!menuOpen)}
                className="p-1 rounded-full hover:bg-white/10 transition-colors"
              >
                {menuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            )}
            <h1 className="text-xl font-medium">Equora.AI</h1>
          </div>
          
          <div className="flex items-center space-x-3">
            {data && (
              <div className="hidden md:flex items-center space-x-2 mr-4">
                <span>Market:</span>
                <span className="font-medium">{data.marketIndex}</span>
                <span className={cn(
                  "font-medium",
                  data.percentChange > 0 ? "text-green-300" : "text-red-300"
                )}>
                  {data.percentChange > 0 ? '↑' : '↓'} {Math.abs(data.percentChange).toFixed(2)}%
                </span>
              </div>
            )}
            
            <button className="p-2 rounded-full hover:bg-white/10 transition-colors relative">
              <Bell size={20} />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
            </button>
          </div>
        </div>
      </header>
      
      {/* Main content */}
      <main className="flex-1 flex overflow-hidden">
        {/* Sidebar for navigation on larger screens */}
        <aside className={cn(
          "w-64 bg-white/50 dark:bg-black/50 backdrop-blur-md border-r border-border z-10 transition-all duration-300 ease-in-out",
          isMobile ? "fixed inset-y-0 left-0 transform" : "relative",
          isMobile && !menuOpen ? "-translate-x-full" : "translate-x-0"
        )}>
          <div className="h-full flex flex-col p-4">
            <div className="py-6">
              <h2 className="text-lg font-medium text-primary">Dashboard</h2>
            </div>
            
            <nav className="space-y-1 flex-1">
              {navItems.map((item) => (
                <button 
                  key={item.name}
                  onClick={() => handleNavClick(item.path)}
                  className={cn(
                    "w-full text-left flex items-center space-x-2 px-3 py-2 rounded-md transition-colors",
                    location.pathname === item.path 
                      ? "bg-primary/10 text-primary" 
                      : "hover:bg-secondary"
                  )}
                >
                  <span>{item.name}</span>
                </button>
              ))}
            </nav>
          </div>
        </aside>
        
        {/* Main dashboard content with improved background */}
        <div className="flex-1 overflow-auto p-4 md:p-6 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-900 dark:to-blue-950">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </div>
      </main>
      
      {/* Backdrop for mobile menu */}
      {isMobile && menuOpen && (
        <div 
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-0"
          onClick={() => setMenuOpen(false)}
        />
      )}
    </div>
  );
};

export default DashboardLayout;
