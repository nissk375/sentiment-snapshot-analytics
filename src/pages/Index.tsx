
import React, { useEffect, useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import SentimentOverview from '@/components/dashboard/SentimentOverview';
import SentimentChart from '@/components/dashboard/SentimentChart';
import SectorAnalysis from '@/components/dashboard/SectorAnalysis';
import TopStocks from '@/components/dashboard/TopStocks';
import NewsImpact from '@/components/dashboard/NewsImpact';
import NewsletterForm from '@/components/dashboard/NewsletterForm';
import MarketBreadth from '@/components/dashboard/MarketBreadth';
import TechnicalIndicators from '@/components/dashboard/TechnicalIndicators';
import GlobalMarkets from '@/components/dashboard/GlobalMarkets';
import PriceCorrelation from '@/components/dashboard/PriceCorrelation';
import SentimentPrediction from '@/components/dashboard/SentimentPrediction';
import ClusterAnalysis from '@/components/dashboard/ClusterAnalysis';
import AIAssistant from '@/components/dashboard/AIAssistant';
import { sentimentService, SentimentData } from '@/services/sentimentService';
import { formatDate } from '@/utils/formatters';

const Index = () => {
  const [data, setData] = useState<SentimentData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Subscribe to sentiment data updates
    const unsubscribe = sentimentService.subscribe(newData => {
      setData(newData);
      setLoading(false);
    });
    
    // Start real-time updates
    const stopUpdates = sentimentService.startRealTimeUpdates(60000); // Update every minute
    
    // Initial data fetch
    const fetchInitialData = async () => {
      await sentimentService.fetchLatestData();
    };
    
    fetchInitialData();
    
    // Clean up on component unmount
    return () => {
      unsubscribe();
      stopUpdates();
    };
  }, []);
  
  return (
    <DashboardLayout>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Equora.AI Dashboard</h1>
          <p className="text-muted-foreground">
            {data ? (
              `Last updated: ${formatDate(data.timestamp)}`
            ) : (
              'Loading data...'
            )}
          </p>
        </div>
        {data && (
          <div className="flex items-center space-x-2">
            <div className="text-xl font-medium">{data.marketIndex}</div>
            <div className={`px-2 py-1 rounded-md text-white ${
              data.percentChange >= 0 ? 'bg-green-500' : 'bg-red-500'
            }`}>
              {data.percentChange >= 0 ? '+' : ''}{data.percentChange.toFixed(2)}%
            </div>
          </div>
        )}
      </div>
      
      {/* Overview Cards */}
      <SentimentOverview data={data} loading={loading} />
      
      {/* Charts */}
      <div className="mt-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            {data && (
              <SentimentChart data={data.sentimentTrend} loading={loading} />
            )}
          </div>
          <div>
            {data && (
              <SectorAnalysis sectors={data.sectors} loading={loading} />
            )}
          </div>
        </div>
      </div>
      
      {/* Prediction Analysis */}
      <div className="mt-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {data && (
            <>
              <SentimentPrediction 
                historicalData={data.sentimentPrediction.historicalData.map(point => ({
                  date: point.date,
                  actual: point.actual,
                  predicted: point.predicted || 0,
                  lower: point.lower || 0,
                  upper: point.upper || 0
                }))}
                predictions={data.sentimentPrediction.predictions.map(point => ({
                  date: point.date,
                  actual: 0,
                  predicted: point.predicted,
                  lower: point.lower,
                  upper: point.upper
                }))}
                confidenceLevel={data.sentimentPrediction.confidenceLevel}
                loading={loading}
              />
              <PriceCorrelation 
                stocks={data.priceCorrelation.stocks}
                loading={loading}
              />
            </>
          )}
        </div>
      </div>
      
      {/* Technical Analysis Section */}
      <div className="mt-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {data && (
            <>
              <MarketBreadth data={data.marketBreadth} loading={loading} />
              <TechnicalIndicators 
                data={data.technicalIndicators} 
                currentValue={data.currentValue}
                loading={loading} 
              />
            </>
          )}
        </div>
      </div>
      
      {/* Cluster Analysis */}
      <div className="mt-8">
        {data && (
          <ClusterAnalysis
            stocks={data.clusterAnalysis.stocks}
            loading={loading}
          />
        )}
      </div>
      
      {/* Global Markets Section */}
      <div className="mt-8">
        {data && (
          <GlobalMarkets markets={data.globalMarkets} loading={loading} />
        )}
      </div>
      
      {/* Stock and News */}
      <div className="mt-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {data && (
              <>
                <TopStocks stocks={data.topStocks} loading={loading} />
                <NewsImpact news={data.recentNews} loading={loading} />
              </>
            )}
          </div>
          <div>
            <NewsletterForm />
          </div>
        </div>
      </div>
      
      {/* AI Assistant (floats on all pages) */}
      <AIAssistant />
    </DashboardLayout>
  );
};

export default Index;
