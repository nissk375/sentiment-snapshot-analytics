
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  ChartContainer, 
  ChartLegend, 
  ChartLegendContent 
} from "@/components/ui/chart";
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

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
        </div>
      );
    }
    return null;
  };

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
          <div className="w-full aspect-[4/3]">
            <ChartContainer 
              config={chartConfig} 
              className="w-full h-full"
            >
              {/* Wrap the ScatterChart in a fragment to make it a single element */}
              <>
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
                  <Tooltip content={customTooltip} />
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
              </>
            </ChartContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PriceCorrelation;
