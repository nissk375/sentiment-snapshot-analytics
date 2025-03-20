import React from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { sentimentService } from '@/services/sentimentService';
import { useEffect, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { getSentimentColor } from '@/utils/formatters';

const PredictionsPage = () => {
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

  // Generate some predictive data based on sentiment trends
  const generatePredictiveData = () => {
    if (!data?.sentimentTrend) return [];
    
    const trend = [...data.sentimentTrend];
    const lastPoint = trend[trend.length - 1];
    const direction = trend[trend.length - 1].sentiment > trend[trend.length - 2].sentiment ? 1 : -1;
    
    // Generate future predictions with some randomness
    const predictions = [];
    let lastTimestamp = new Date(lastPoint.timestamp);
    let lastSentiment = lastPoint.sentiment;
    let lastIndexValue = lastPoint.indexValue;
    
    for (let i = 1; i <= 5; i++) {
      lastTimestamp = new Date(lastTimestamp);
      lastTimestamp.setHours(lastTimestamp.getHours() + 1);
      
      // Add some randomness but keep the general trend
      const sentimentChange = (Math.random() * 0.2 - 0.1) + (direction * 0.05);
      lastSentiment = Math.max(-1, Math.min(1, lastSentiment + sentimentChange));
      
      // Index value follows sentiment with some randomness
      const indexChange = lastSentiment > 0 ? 
        Math.random() * 100 + 20 : 
        Math.random() * -100 - 20;
      lastIndexValue = lastIndexValue + indexChange;
      
      predictions.push({
        timestamp: lastTimestamp.toISOString(),
        sentiment: lastSentiment,
        indexValue: lastIndexValue,
        isPrediction: true
      });
    }
    
    return [...trend, ...predictions];
  };

  const predictiveData = data ? generatePredictiveData() : [];

  return (
    <DashboardLayout>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-semibold tracking-tight">Market Predictions</h1>
      </div>

      {loading ? (
        <Card className="mt-6 glassmorphism">
          <CardHeader>
            <CardTitle className="text-xl font-medium">Loading predictions...</CardTitle>
          </CardHeader>
          <CardContent className="h-[400px] flex items-center justify-center">
            <div className="w-full h-full bg-gray-100 dark:bg-gray-800 animate-pulse rounded-md" />
          </CardContent>
        </Card>
      ) : (
        <Card className="mt-6 glassmorphism">
          <CardHeader>
            <CardTitle className="text-xl font-medium">Market Prediction (Next 5 Hours)</CardTitle>
          </CardHeader>
          <CardContent className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={predictiveData}
                margin={{ top: 10, right: 30, left: 0, bottom: 20 }}
              >
                <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                <XAxis 
                  dataKey="timestamp" 
                  tickFormatter={(value) => {
                    const date = new Date(value);
                    return `${date.getHours()}:${date.getMinutes().toString().padStart(2, '0')}`;
                  }}
                  tick={{ fontSize: 12 }}
                  tickMargin={10}
                />
                <YAxis 
                  yAxisId="left"
                  orientation="left"
                  domain={[-1, 1]}
                  tickCount={5}
                  tickFormatter={(value) => value.toFixed(1)}
                  tick={{ fontSize: 12 }}
                />
                <YAxis 
                  yAxisId="right"
                  orientation="right"
                  domain={['dataMin - 100', 'dataMax + 100']}
                  tickCount={5}
                  tickFormatter={(value) => value.toFixed(0)}
                  tick={{ fontSize: 12 }}
                />
                <Tooltip 
                  labelFormatter={(value) => {
                    const date = new Date(value);
                    return `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`;
                  }}
                  formatter={(value, name) => {
                    if (name === 'sentiment') {
                      return [value.toFixed(2), 'Sentiment'];
                    }
                    return [value.toFixed(0), 'Index Value'];
                  }}
                />
                <Legend />
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="sentiment"
                  stroke="#4ade80"
                  strokeWidth={2}
                  dot={{ r: 4 }}
                  activeDot={{ r: 6 }}
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="indexValue"
                  stroke="#60a5fa"
                  strokeWidth={2}
                  dot={{ r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
        <Card className="glassmorphism">
          <CardHeader>
            <CardTitle className="text-lg">Sentiment Prediction</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center">
              <p className="text-3xl font-bold" style={{ color: data ? getSentimentColor(data.overallSentiment) : 'inherit' }}>
                {data ? (data.overallSentiment > 0.2 ? 'Bullish' : data.overallSentiment < -0.2 ? 'Bearish' : 'Neutral') : 'Loading...'}
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                Predicted market sentiment for the next 24 hours
              </p>
            </div>
          </CardContent>
        </Card>
        
        <Card className="glassmorphism">
          <CardHeader>
            <CardTitle className="text-lg">Price Target</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center">
              <p className="text-3xl font-bold">
                {data ? (data.currentValue + (data.currentValue * data.overallSentiment * 0.05)).toFixed(2) : 'Loading...'}
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                Predicted price target in 24 hours
              </p>
            </div>
          </CardContent>
        </Card>
        
        <Card className="glassmorphism">
          <CardHeader>
            <CardTitle className="text-lg">Volatility Forecast</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center">
              <p className="text-3xl font-bold">
                {data ? (data.volatilityIndex + (Math.random() * 5 - 2.5)).toFixed(2) : 'Loading...'}
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                Predicted market volatility for tomorrow
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default PredictionsPage;
