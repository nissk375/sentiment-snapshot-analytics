
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  ChartContainer, 
  ChartLegend, 
  ChartLegendContent 
} from "@/components/ui/chart";
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ZAxis, ReferenceLine } from 'recharts';

interface Stock {
  symbol: string;
  name: string;
  price: number;
  percentChange: number;
  marketCap: number;
  correlationIndex: number;
}

interface PriceCorrelationProps {
  stocks: Stock[];
  loading: boolean;
}

const PriceCorrelation: React.FC<PriceCorrelationProps> = ({ stocks, loading }) => {
  const chartConfig = {
    high: { color: "#22c55e" },
    medium: { color: "#3b82f6" },
    low: { color: "#f97316" },
    negative: { color: "#ef4444" },
  };
  
  const getCorrelationColor = (correlation: number) => {
    if (correlation > 0.7) return chartConfig.high.color;
    if (correlation > 0.3) return chartConfig.medium.color;
    if (correlation >= 0) return chartConfig.low.color;
    return chartConfig.negative.color;
  };

  // Transform data for scatter plot
  const transformedData = stocks.map(stock => ({
    x: stock.percentChange,
    y: stock.correlationIndex,
    z: stock.marketCap / 1000000, // Scale market cap for z-axis
    name: stock.name,
    symbol: stock.symbol,
    correlation: stock.correlationIndex,
    color: getCorrelationColor(stock.correlationIndex)
  }));
  
  const customTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background border border-border shadow-md p-3 rounded-md">
          <p className="font-medium">{payload[0].payload.name} ({payload[0].payload.symbol})</p>
          <p className="text-sm text-muted-foreground">Change: {payload[0].payload.x.toFixed(2)}%</p>
          <p className="text-sm text-muted-foreground">Correlation: {payload[0].payload.y.toFixed(2)}</p>
          <p className="text-sm text-muted-foreground">Market Cap: ${(payload[0].payload.z * 1000000).toLocaleString()}</p>
        </div>
      );
    }
    return null;
  };

  // Add quadrant analysis
  const getQuadrantAnalysis = () => {
    const quadrants = [0, 0, 0, 0]; // Q1, Q2, Q3, Q4
    
    transformedData.forEach(stock => {
      if (stock.x >= 0 && stock.y >= 0) quadrants[0]++; // Q1: +Change, +Correlation
      if (stock.x < 0 && stock.y >= 0) quadrants[1]++; // Q2: -Change, +Correlation
      if (stock.x < 0 && stock.y < 0) quadrants[2]++; // Q3: -Change, -Correlation
      if (stock.x >= 0 && stock.y < 0) quadrants[3]++; // Q4: +Change, -Correlation
    });
    
    return quadrants;
  };
  
  const quadrants = getQuadrantAnalysis();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Price Correlation Analysis</CardTitle>
        <CardDescription>
          Market correlation between stock performance and overall sentiment
        </CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="w-full aspect-[4/3]">
            <Skeleton className="w-full h-full" />
          </div>
        ) : (
          <>
            <div className="w-full aspect-[4/3]">
              <ChartContainer 
                config={chartConfig} 
                className="w-full h-full"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      type="number" 
                      dataKey="x"
                      name="Price Change" 
                      label={{ value: 'Price Change (%)', position: 'insideBottom', offset: -10 }}
                      domain={['dataMin - 1', 'dataMax + 1']}
                    />
                    <YAxis 
                      type="number" 
                      dataKey="y" 
                      name="Correlation" 
                      label={{ value: 'Correlation', angle: -90, position: 'insideLeft' }}
                      domain={[-1, 1]}
                    />
                    <ZAxis 
                      type="number" 
                      dataKey="z" 
                      range={[30, 300]} 
                      name="Market Cap" 
                    />
                    <Tooltip content={customTooltip} />
                    <ReferenceLine x={0} stroke="#666" strokeDasharray="3 3" />
                    <ReferenceLine y={0} stroke="#666" strokeDasharray="3 3" />
                    <Scatter 
                      name="Stocks" 
                      data={transformedData} 
                      fill="#8884d8"
                      shape={(props: any) => {
                        const { cx, cy, fill } = props;
                        return (
                          <circle 
                            cx={cx} 
                            cy={cy} 
                            r={8} 
                            fill={props.payload.color} 
                            stroke="white"
                            strokeWidth={1}
                          />
                        );
                      }}
                    />
                  </ScatterChart>
                </ResponsiveContainer>
                <ChartLegend>
                  <ChartLegendContent
                    payload={[
                      { value: "High Correlation", color: chartConfig.high.color },
                      { value: "Medium Correlation", color: chartConfig.medium.color },
                      { value: "Low Correlation", color: chartConfig.low.color },
                      { value: "Negative Correlation", color: chartConfig.negative.color },
                    ]}
                  />
                </ChartLegend>
              </ChartContainer>
            </div>
            
            {/* Add quadrant analysis stats */}
            <div className="grid grid-cols-2 gap-4 mt-4">
              <div className="border rounded-lg p-3 bg-green-50 dark:bg-green-900/20">
                <p className="text-sm font-medium">Q1: Positive Change & Correlation</p>
                <p className="text-xl font-bold text-green-600">{quadrants[0]} stocks</p>
                <p className="text-xs text-muted-foreground">Stocks with positive performance aligned with market sentiment</p>
              </div>
              <div className="border rounded-lg p-3 bg-yellow-50 dark:bg-yellow-900/20">
                <p className="text-sm font-medium">Q2: Negative Change, Positive Correlation</p>
                <p className="text-xl font-bold text-yellow-600">{quadrants[1]} stocks</p>
                <p className="text-xs text-muted-foreground">Potential recovery candidates</p>
              </div>
              <div className="border rounded-lg p-3 bg-red-50 dark:bg-red-900/20">
                <p className="text-sm font-medium">Q3: Negative Change & Correlation</p>
                <p className="text-xl font-bold text-red-600">{quadrants[2]} stocks</p>
                <p className="text-xs text-muted-foreground">Stocks to monitor closely</p>
              </div>
              <div className="border rounded-lg p-3 bg-blue-50 dark:bg-blue-900/20">
                <p className="text-sm font-medium">Q4: Positive Change, Negative Correlation</p>
                <p className="text-xl font-bold text-blue-600">{quadrants[3]} stocks</p>
                <p className="text-xs text-muted-foreground">Outperformers against market sentiment</p>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default PriceCorrelation;
