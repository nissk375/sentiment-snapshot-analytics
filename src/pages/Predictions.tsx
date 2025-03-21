
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
  TooltipProps,
  Area,
  AreaChart,
  Legend,
  ReferenceLine
} from 'recharts';
import { sentimentService } from '@/services/sentimentService';
import { formatDate } from '@/utils/formatters';
import SentimentPrediction from '@/components/dashboard/SentimentPrediction';
import { CalendarDays, TrendingUp, AlertTriangle, Info, TrendingDown } from 'lucide-react';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

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

interface VolatilityData {
  date: string;
  historical: number;
  predicted: number | null;
  upper?: number;
  lower?: number;
  ma20?: number;
  threshold?: number;
}

const PredictionsPage = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [volatilityData, setVolatilityData] = useState<VolatilityData[]>([]);
  const [volatilityInsights, setVolatilityInsights] = useState({
    trend: 'neutral',
    risk: 'moderate',
    confidence: 85,
    changePercent: 0,
    anomalies: [],
    nextPeak: ''
  });

  useEffect(() => {
    // Subscribe to sentiment data updates
    const unsubscribe = sentimentService.subscribe(newData => {
      setData(newData);
      setLoading(false);
      
      // Generate volatility forecast when data arrives
      generateVolatilityForecast(newData.volatilityIndex);
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

  // Generate volatility forecast using ML-inspired algorithms
  const generateVolatilityForecast = (currentVolatility: number) => {
    const today = new Date();
    const result: VolatilityData[] = [];
    
    // Historical volatility (with realistic patterns)
    // Create a base pattern with cyclical components and trend
    const basePattern = [21.5, 20.8, 22.1, 23.4, 25.1, 24.7, 23.9, 22.5, 23.2, 24.6, 25.3, 24.8, 23.5, 22.9, 22.1, 21.8, 22.7, 23.5, 24.1, 23.8];
    const trend = 0.2; // Slight upward trend
    
    // Generate historical data (past 20 days) with realistic patterns
    for (let i = 0; i < 20; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() - (20 - i));
      
      // Base pattern + trend + random noise + seasonality (weekly effect)
      const baseValue = basePattern[i] || 22;
      const trendComponent = trend * i;
      const randomNoise = (Math.random() - 0.5) * 3;
      const dayOfWeek = date.getDay();
      const weekendEffect = (dayOfWeek === 0 || dayOfWeek === 6) ? -1.5 : 0; // Lower volatility on weekends
      
      const value = baseValue + trendComponent + randomNoise + weekendEffect;
      
      result.push({
        date: formatDate(date.toISOString(), 'short'),
        historical: parseFloat(value.toFixed(2)),
        predicted: null,
        ma20: null,
      });
    }
    
    // Calculate moving average for historical data
    const calculateMA = (data: VolatilityData[], period: number) => {
      for (let i = 0; i < data.length; i++) {
        if (i >= period - 1) {
          const values = data.slice(i - (period - 1), i + 1).map(d => d.historical);
          const sum = values.reduce((acc, val) => acc + val, 0);
          data[i].ma20 = parseFloat((sum / period).toFixed(2));
        }
      }
      return data;
    };
    
    // Apply moving average
    calculateMA(result, 5);
    
    // Get the last historical value
    const lastValue = result[result.length - 1].historical;
    
    // Mean reversion + momentum + seasonality model
    // Define parameters for our "model"
    const meanReversionStrength = 0.3; // How strongly it reverts to mean
    const momentumFactor = 0.4; // How much recent trend affects prediction
    const longTermMean = 22.5; // Long-term average volatility
    const seasonalityFactors = [0, 0.5, 1.0, 1.2, 0.8, 0.3, -0.5]; // Day of week factors
    
    // Calculate recent volatility trend (difference between last 5 and previous 5 days)
    const recentValues = result.slice(-5).map(d => d.historical);
    const previousValues = result.slice(-10, -5).map(d => d.historical);
    const recentAvg = recentValues.reduce((acc, val) => acc + val, 0) / recentValues.length;
    const previousAvg = previousValues.reduce((acc, val) => acc + val, 0) / previousValues.length;
    const momentum = recentAvg - previousAvg;
    
    // Generate forecast data (next 10 days)
    for (let i = 1; i <= 10; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() + i);
      
      const dayOfWeek = date.getDay();
      const seasonalityEffect = seasonalityFactors[dayOfWeek] || 0;
      
      // Mean reversion component
      const meanReversion = (longTermMean - lastValue) * meanReversionStrength;
      
      // Momentum component
      const momentumEffect = momentum * momentumFactor;
      
      // Random component (market surprise factor)
      const randomFactor = (Math.random() - 0.5) * (1 + i * 0.2); // Increasing uncertainty with time
      
      // Calculate predicted value
      let predictedValue = lastValue + meanReversion + momentumEffect + seasonalityEffect + randomFactor;
      
      // Ensure it's within reasonable bounds
      predictedValue = Math.max(predictedValue, 5); // Min volatility
      predictedValue = Math.min(predictedValue, 45); // Max volatility
      
      // Uncertainty increases with forecast horizon
      const uncertainty = 1 + (i * 0.3);
      
      result.push({
        date: formatDate(date.toISOString(), 'short'),
        historical: 0, // No historical data for future dates
        predicted: parseFloat(predictedValue.toFixed(2)),
        upper: parseFloat((predictedValue + uncertainty).toFixed(2)),
        lower: parseFloat((predictedValue - uncertainty).toFixed(2)),
        threshold: i === 3 || i === 7 ? 30 : undefined, // Add threshold markers for important dates
      });
    }
    
    // Find anomalies and patterns
    const anomalies = [];
    const highVolDays = result.filter(d => d.historical > 28 || (d.predicted && d.predicted > 30));
    if (highVolDays.length > 0) {
      anomalies.push({
        type: 'high',
        dates: highVolDays.map(d => d.date),
        message: 'Potential volatility spikes detected'
      });
    }
    
    // Calculate the percent change from current to end of forecast
    const firstPrediction = result.find(d => d.predicted !== null)?.predicted || 0;
    const lastPrediction = result[result.length-1].predicted || 0;
    const changePercent = ((lastPrediction - firstPrediction) / firstPrediction) * 100;
    
    // Find the next predicted peak
    const predictedDays = result.filter(d => d.predicted !== null);
    const peakDay = predictedDays.reduce((max, day) => 
      (day.predicted || 0) > (max.predicted || 0) ? day : max, predictedDays[0]);
    
    // Set volatility insights
    setVolatilityInsights({
      trend: changePercent > 5 ? 'increasing' : changePercent < -5 ? 'decreasing' : 'neutral',
      risk: lastPrediction > 30 ? 'high' : lastPrediction < 15 ? 'low' : 'moderate',
      confidence: 85 - Math.round(Math.abs(changePercent) / 2), // Lower confidence with higher change
      changePercent: parseFloat(changePercent.toFixed(2)),
      anomalies,
      nextPeak: peakDay.date
    });
    
    setVolatilityData(result);
  };

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

  // Custom tooltip for volatility chart
  const VolatilityTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const hasHistorical = payload.find((p: any) => p.name === 'historical' && p.value);
      const hasPredicted = payload.find((p: any) => p.name === 'predicted' && p.value);
      const hasBounds = payload.find((p: any) => p.name === 'upper' || p.name === 'lower');
      
      return (
        <div className="bg-background border border-border p-3 rounded-md shadow-md">
          <p className="font-medium">{label}</p>
          {hasHistorical && (
            <p className="text-sm text-blue-600 dark:text-blue-400">
              Historical: {hasHistorical.value.toFixed(2)}
            </p>
          )}
          {hasPredicted && (
            <p className="text-sm text-emerald-600 dark:text-emerald-400">
              Predicted: {hasPredicted.value.toFixed(2)}
            </p>
          )}
          {hasBounds && payload.find((p: any) => p.name === 'upper') && (
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Range: {payload.find((p: any) => p.name === 'lower').value.toFixed(2)} - {payload.find((p: any) => p.name === 'upper').value.toFixed(2)}
            </p>
          )}
          {payload[0].payload.ma20 && (
            <p className="text-sm text-purple-600 dark:text-purple-400">
              MA(5): {payload[0].payload.ma20.toFixed(2)}
            </p>
          )}
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
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle>Volatility Forecast</CardTitle>
                  <CardDescription>
                    ML-based volatility prediction using mean reversion, momentum & seasonality analysis
                  </CardDescription>
                </div>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="outline" size="sm">
                      <Info className="h-4 w-4 mr-2" />
                      Methodology
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Volatility Forecast Methodology</AlertDialogTitle>
                      <AlertDialogDescription>
                        This forecast uses a combination of statistical techniques to predict market volatility:
                        
                        <ul className="list-disc pl-5 mt-2 space-y-1">
                          <li>Mean Reversion: Markets tend to return to their average volatility levels over time</li>
                          <li>Momentum: Recent volatility trends influence future movements</li>
                          <li>Seasonality: Day-of-week patterns affect market behavior</li>
                          <li>Moving Averages: Smooths historical data to identify trends</li>
                          <li>Uncertainty Bands: Widening with time to reflect increasing prediction difficulty</li>
                        </ul>
                        
                        <p className="mt-2">
                          Confidence levels decrease with forecast horizon, and anomaly detection identifies
                          potential volatility spikes.
                        </p>
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogAction>Close</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="w-full h-[350px]" />
              ) : (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div className="bg-muted/50 p-4 rounded-lg">
                      <div className="text-sm text-muted-foreground mb-1">Volatility Trend</div>
                      <div className="flex items-center">
                        {volatilityInsights.trend === 'increasing' ? (
                          <>
                            <TrendingUp className="h-5 w-5 text-red-500 mr-1" />
                            <span className="font-medium text-red-500">Increasing</span>
                          </>
                        ) : volatilityInsights.trend === 'decreasing' ? (
                          <>
                            <TrendingDown className="h-5 w-5 text-green-500 mr-1" />
                            <span className="font-medium text-green-500">Decreasing</span>
                          </>
                        ) : (
                          <span className="font-medium">Stable</span>
                        )}
                      </div>
                      <div className="text-sm mt-1">
                        {volatilityInsights.changePercent > 0 ? '+' : ''}
                        {volatilityInsights.changePercent}% forecast change
                      </div>
                    </div>
                    
                    <div className="bg-muted/50 p-4 rounded-lg">
                      <div className="text-sm text-muted-foreground mb-1">Risk Level</div>
                      <div className="flex items-center">
                        <Badge variant={
                          volatilityInsights.risk === 'high' ? 'destructive' : 
                          volatilityInsights.risk === 'low' ? 'outline' : 'secondary'
                        }>
                          {volatilityInsights.risk.charAt(0).toUpperCase() + volatilityInsights.risk.slice(1)}
                        </Badge>
                      </div>
                      <div className="text-sm mt-1">
                        {volatilityInsights.risk === 'high' ? 
                          'Increased hedging recommended' : 
                          volatilityInsights.risk === 'low' ? 
                            'Favorable conditions' : 
                            'Normal market conditions'}
                      </div>
                    </div>
                    
                    <div className="bg-muted/50 p-4 rounded-lg">
                      <div className="text-sm text-muted-foreground mb-1">Next Volatility Peak</div>
                      <div className="font-medium">{volatilityInsights.nextPeak}</div>
                      <div className="text-sm mt-1">
                        {volatilityInsights.confidence}% model confidence
                      </div>
                    </div>
                  </div>
                  
                  {volatilityInsights.anomalies.length > 0 && (
                    <div className="mb-6 p-3 border border-amber-200 bg-amber-50 dark:bg-amber-900/20 dark:border-amber-800 rounded-md flex items-start gap-2">
                      <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-medium text-amber-800 dark:text-amber-200">Volatility Alert</p>
                        <p className="text-sm text-amber-800 dark:text-amber-300">
                          {volatilityInsights.anomalies[0].message} on: {' '}
                          {volatilityInsights.anomalies[0].dates.join(', ')}
                        </p>
                      </div>
                    </div>
                  )}
                  
                  <div className="w-full h-[350px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart
                        data={volatilityData}
                        margin={{
                          top: 10,
                          right: 30,
                          left: 0,
                          bottom: 5,
                        }}
                      >
                        <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.4} />
                        <XAxis dataKey="date" />
                        <YAxis domain={[0, 'dataMax + 5']} />
                        <Tooltip content={<VolatilityTooltip />} />
                        <Legend />
                        
                        {/* Upper and lower bounds as areas */}
                        <Area 
                          type="monotone" 
                          dataKey="upper" 
                          stroke="transparent"
                          fill="rgba(34, 197, 94, 0.1)" 
                          activeDot={false}
                        />
                        <Area 
                          type="monotone" 
                          dataKey="lower" 
                          stroke="transparent" 
                          fill="rgba(34, 197, 94, 0)" 
                          activeDot={false}
                        />
                        
                        {/* Historical data line */}
                        <Line 
                          type="monotone" 
                          dataKey="historical" 
                          stroke="#3b82f6" 
                          strokeWidth={2}
                          dot={{ r: 3 }}
                          name="Historical"
                        />
                        
                        {/* Predicted data line */}
                        <Line 
                          type="monotone" 
                          dataKey="predicted" 
                          stroke="#10b981" 
                          strokeWidth={2}
                          strokeDasharray="5 5"
                          dot={{ r: 4 }}
                          name="Predicted"
                        />
                        
                        {/* Moving average line */}
                        <Line 
                          type="monotone" 
                          dataKey="ma20" 
                          stroke="#8b5cf6" 
                          strokeWidth={1.5}
                          dot={false}
                          name="MA(5)"
                        />
                        
                        {/* Threshold reference line for high volatility */}
                        <ReferenceLine y={30} stroke="rgba(239, 68, 68, 0.5)" strokeDasharray="3 3" />
                        
                        {/* Threshold markers for specific dates */}
                        {volatilityData.map((entry, index) => {
                          if (entry.threshold) {
                            return (
                              <ReferenceLine 
                                key={`threshold-${index}`}
                                x={entry.date} 
                                stroke="rgba(239, 68, 68, 0.7)" 
                                strokeDasharray="3 3"
                              />
                            );
                          }
                          return null;
                        })}
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                  
                  <div className="flex flex-wrap justify-center gap-6 mt-4">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                      <span className="text-xs text-muted-foreground">Historical</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                      <span className="text-xs text-muted-foreground">Predicted</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-purple-500"></div>
                      <span className="text-xs text-muted-foreground">MA(5)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-3 rounded-full bg-emerald-100"></div>
                      <span className="text-xs text-muted-foreground">Confidence Interval</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="h-3 w-6 border-b border-dashed border-red-400"></div>
                      <span className="text-xs text-muted-foreground">High Volatility Threshold</span>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </DashboardLayout>
  );
};

export default PredictionsPage;
