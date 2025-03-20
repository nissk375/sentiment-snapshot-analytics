
import React, { useEffect, useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  TooltipProps
} from 'recharts';
import { sentimentService } from '@/services/sentimentService';
import { formatDate } from '@/utils/formatters';
import SentimentPrediction from '@/components/dashboard/SentimentPrediction';
import { CalendarDays, TrendingUp } from 'lucide-react';

// Type for tooltip props to fix the ValueType issues
interface CustomTooltipProps extends TooltipProps<number, string> {
  active?: boolean;
  payload?: Array<{
    value: number;
    payload: {
      date: string;
      value: number;
      predicted?: number;
    };
  }>;
  label?: string;
}

const PredictionsPage = () => {
  const [data, setData] = useState<any>(null);
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

  // Custom tooltip component with proper typing
  const CustomTooltip = ({ active, payload, label }: CustomTooltipProps) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background border border-border p-3 rounded-md shadow-md">
          <p className="font-medium">{label}</p>
          {payload.map((entry, index) => (
            <p key={index} className="text-sm">
              {entry.payload.predicted !== undefined ? 'Predicted: ' : 'Value: '}
              {typeof entry.value === 'number' ? entry.value.toFixed(2) : entry.value}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  // Generate some sample prediction data
  const generatePredictionData = () => {
    const today = new Date();
    const result = [];
    
    // Historical data (last 10 days)
    for (let i = 0; i < 10; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() - (10 - i));
      result.push({
        date: formatDate(date.toISOString(), 'short'),
        value: Math.random() * 100 + 100,
      });
    }
    
    // Prediction data (next 5 days)
    const lastValue = result[result.length - 1].value;
    for (let i = 1; i <= 5; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() + i);
      const predictedValue = lastValue * (1 + (Math.random() * 0.1 - 0.05));
      result.push({
        date: formatDate(date.toISOString(), 'short'),
        predicted: predictedValue,
      });
    }
    
    return result;
  };
  
  const predictionData = generatePredictionData();

  return (
    <DashboardLayout>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-semibold tracking-tight">Predictions</h1>
      </div>

      <Tabs defaultValue="sentiment">
        <TabsList>
          <TabsTrigger value="sentiment">Sentiment Forecast</TabsTrigger>
          <TabsTrigger value="price">Price Forecast</TabsTrigger>
          <TabsTrigger value="volatility">Volatility Forecast</TabsTrigger>
        </TabsList>
        
        <TabsContent value="sentiment" className="mt-4">
          {data && (
            <SentimentPrediction 
              historicalData={data.sentimentPrediction.historicalData}
              predictions={data.sentimentPrediction.predictions}
              confidenceLevel={data.sentimentPrediction.confidenceLevel}
              loading={loading}
            />
          )}
        </TabsContent>
        
        <TabsContent value="price" className="mt-4">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle>Price Prediction</CardTitle>
                  <CardDescription className="flex items-center gap-1">
                    <CalendarDays className="h-4 w-4" /> 5-Day Market Index Forecast
                  </CardDescription>
                </div>
                <div className="flex items-center space-x-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 py-1 px-2 rounded-md text-sm">
                  <TrendingUp className="h-4 w-4" />
                  <span>+2.8%</span>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="w-full h-[350px]" />
              ) : (
                <div className="w-full h-[350px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={predictionData}
                      margin={{
                        top: 10,
                        right: 30,
                        left: 0,
                        bottom: 5,
                      }}
                    >
                      <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.4} />
                      <XAxis dataKey="date" />
                      <YAxis domain={['dataMin - 10', 'dataMax + 10']} />
                      <Tooltip content={<CustomTooltip />} />
                      <Line
                        type="monotone"
                        dataKey="value"
                        stroke="var(--color-primary)"
                        strokeWidth={2}
                        dot={{ r: 4 }}
                        activeDot={{ r: 6 }}
                      />
                      <Line
                        type="monotone"
                        dataKey="predicted"
                        stroke="#22c55e"
                        strokeWidth={2}
                        strokeDasharray="5 5"
                        dot={{ fill: "#22c55e", r: 4 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="volatility" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Volatility Forecast</CardTitle>
              <CardDescription>Predicted market volatility over the next 5 days</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="w-full h-[350px]" />
              ) : (
                <div className="text-center p-8">
                  <p className="text-muted-foreground">Volatility forecast data will be available soon.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </DashboardLayout>
  );
};

export default PredictionsPage;
