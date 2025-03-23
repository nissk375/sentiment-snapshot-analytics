
import React, { useEffect, useState } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { getIntradayData } from '@/services/marketDataService';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface DataPoint {
  timestamp: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

interface MultiSymbolChartProps {
  symbol: string;
}

const MultiSymbolChart: React.FC<MultiSymbolChartProps> = ({ symbol }) => {
  const [chartData, setChartData] = useState<DataPoint[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const fetchChartData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const result = await getIntradayData(symbol);
        
        // Process the "Time Series (5min)" portion of the API response
        const timeSeries = result["Time Series (5min)"];
        
        const processedData: DataPoint[] = Object.keys(timeSeries).map((timestamp) => {
          const data = timeSeries[timestamp];
          return {
            timestamp,
            open: parseFloat(data["1. open"]),
            high: parseFloat(data["2. high"]),
            low: parseFloat(data["3. low"]),
            close: parseFloat(data["4. close"]),
            volume: parseInt(data["5. volume"], 10),
          };
        });
        
        // Sort data chronologically
        processedData.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
        
        // Take only the most recent 50 data points to avoid overloading the chart
        const recentData = processedData.slice(-50);
        
        setChartData(recentData);
      } catch (error) {
        console.error("Chart data fetch error:", error);
        setError('Failed to fetch data. Please check your API key or try again later.');
        toast({
          title: "Data Fetch Error",
          description: "Could not fetch market data. Using demo API key might have rate limitations.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchChartData();

    // Refetch every minute for live updates
    const intervalId = setInterval(fetchChartData, 60000);
    return () => clearInterval(intervalId);
  }, [symbol, toast]);

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <span>Market Data for {symbol}</span>
          {error ? <AlertCircle size={18} className="text-red-500" /> : null}
        </CardTitle>
        <CardDescription>
          Intraday price movements with 5-minute intervals
        </CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-4">
            <Skeleton className="h-[400px] w-full" />
          </div>
        ) : error ? (
          <div className="p-4 border border-red-200 bg-red-50 dark:bg-red-900/20 rounded-md text-red-800 dark:text-red-200">
            <div className="flex items-center gap-2">
              <AlertCircle size={16} />
              <p>{error}</p>
            </div>
            <p className="mt-2 text-sm">
              Please make sure you have set the VITE_ALPHA_VANTAGE_KEY environment variable.
              You can get a free API key from <a href="https://www.alphavantage.co/support/#api-key" className="underline" target="_blank" rel="noreferrer">Alpha Vantage</a>.
            </p>
          </div>
        ) : chartData.length === 0 ? (
          <div className="p-4 border border-yellow-200 bg-yellow-50 dark:bg-yellow-900/20 rounded-md text-yellow-800 dark:text-yellow-200">
            <p>No data available for this symbol. Try another symbol or check back later.</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="timestamp" 
                tick={{ fontSize: 10 }} 
                tickFormatter={formatTimestamp} 
                interval="preserveStartEnd"
                minTickGap={50}
              />
              <YAxis 
                domain={['auto', 'auto']}
                tickFormatter={(value) => value.toFixed(2)}
              />
              <Tooltip 
                labelFormatter={(label) => new Date(label).toLocaleString()}
                formatter={(value: number) => [value.toFixed(2), '']}
              />
              <Legend />
              <Line type="monotone" dataKey="open" stroke="#8884d8" name="Open" dot={false} />
              <Line type="monotone" dataKey="high" stroke="#82ca9d" name="High" dot={false} />
              <Line type="monotone" dataKey="low" stroke="#ff7300" name="Low" dot={false} />
              <Line type="monotone" dataKey="close" stroke="#ff0000" name="Close" dot={false} activeDot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
};

export default MultiSymbolChart;
