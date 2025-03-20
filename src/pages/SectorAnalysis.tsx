
import React from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import SectorAnalysis from '@/components/dashboard/SectorAnalysis';
import { sentimentService } from '@/services/sentimentService';
import { useEffect, useState } from 'react';

const SectorAnalysisPage = () => {
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
        <h1 className="text-3xl font-semibold tracking-tight">Sector Analysis</h1>
      </div>

      {data && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <SectorAnalysis sectors={data.sectors} loading={loading} />
        </div>
      )}
    </DashboardLayout>
  );
};

export default SectorAnalysisPage;
