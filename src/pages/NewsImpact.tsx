
import React from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import NewsImpact from '@/components/dashboard/NewsImpact';
import AIAssistant from '@/components/dashboard/AIAssistant';
import { sentimentService } from '@/services/sentimentService';
import { useEffect, useState } from 'react';

const NewsImpactPage = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Subscribe to sentiment data updates
    const unsubscribe = sentimentService.subscribe(newData => {
      setData(newData);
      setLoading(false);
    });
    
    // Initial data fetch
    const fetchInitialData = async () => {
      await sentimentService.fetchLatestData();
    };
    
    fetchInitialData();
    
    // Clean up on component unmount
    return () => {
      unsubscribe();
    };
  }, []);

  return (
    <DashboardLayout>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-semibold tracking-tight">News Impact</h1>
      </div>

      {data && (
        <NewsImpact news={data.recentNews} loading={loading} />
      )}
      
      <AIAssistant />
    </DashboardLayout>
  );
};

export default NewsImpactPage;
