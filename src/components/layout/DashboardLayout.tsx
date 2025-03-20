
import React, { useEffect, useState } from 'react';
import { sentimentService, SentimentData } from '@/services/sentimentService';
import { AlertCircle, Bell, Menu, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  const [data, setData] = useState<SentimentData | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const isMobile = useIsMobile();
  
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
            <h1 className="text-xl font-medium">Market Sentiment Analyzer</h1>
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
              <a 
                href="#" 
                className="flex items-center space-x-2 px-3 py-2 rounded-md bg-primary/10 text-primary"
              >
                <span>Market Overview</span>
              </a>
              <a 
                href="#" 
                className="flex items-center space-x-2 px-3 py-2 rounded-md hover:bg-secondary transition-colors"
              >
                <span>Sector Analysis</span>
              </a>
              <a 
                href="#" 
                className="flex items-center space-x-2 px-3 py-2 rounded-md hover:bg-secondary transition-colors"
              >
                <span>Stock Sentiment</span>
              </a>
              <a 
                href="#" 
                className="flex items-center space-x-2 px-3 py-2 rounded-md hover:bg-secondary transition-colors"
              >
                <span>News Impact</span>
              </a>
              <a 
                href="#" 
                className="flex items-center space-x-2 px-3 py-2 rounded-md hover:bg-secondary transition-colors"
              >
                <span>Predictions</span>
              </a>
            </nav>
            
            <div className="mt-4 p-3 rounded-lg bg-orange-50 border border-orange-200 flex items-start space-x-2">
              <AlertCircle className="text-orange-500 shrink-0 mt-0.5" size={18} />
              <div>
                <h4 className="font-medium text-orange-800">Demo Data</h4>
                <p className="text-sm text-orange-700">
                  This demo uses simulated market data for illustration.
                </p>
              </div>
            </div>
          </div>
        </aside>
        
        {/* Main dashboard content */}
        <div className="flex-1 overflow-auto p-4 md:p-6 bg-gradient-to-br from-gray-50 to-white dark:from-gray-900 dark:to-gray-950">
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
