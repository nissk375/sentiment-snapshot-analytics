
import React from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import TopStocks from '@/components/dashboard/TopStocks';
import { sentimentService } from '@/services/sentimentService';
import { useEffect, useState } from 'react';

const StockSentimentPage = () => {
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
        <h1 className="text-3xl font-semibold tracking-tight">Stock Sentiment</h1>
      </div>

      {data && (
        <TopStocks stocks={data.topStocks} loading={loading} />
      )}
    </DashboardLayout>
  );
};

export default StockSentimentPage;
