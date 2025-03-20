
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { SectorSentiment } from '@/services/sentimentService';
import { formatPercent, getSentimentClass, getSentimentColor } from '@/utils/formatters';
import { Progress } from '@/components/ui/progress';

interface SectorAnalysisProps {
  sectors: SectorSentiment[];
  loading?: boolean;
}

const SectorAnalysis: React.FC<SectorAnalysisProps> = ({ sectors, loading = false }) => {
  if (loading) {
    return (
      <Card className="mt-6 glassmorphism">
        <CardHeader>
          <CardTitle className="text-xl font-medium">Sector Analysis</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 animate-pulse">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="w-1/4 h-4 bg-gray-200 dark:bg-gray-700 rounded" />
                <div className="w-1/2 h-4 bg-gray-200 dark:bg-gray-700 rounded" />
                <div className="w-1/6 h-4 bg-gray-200 dark:bg-gray-700 rounded" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }
  
  // Sort sectors by sentiment (most positive to most negative)
  const sortedSectors = [...sectors].sort((a, b) => b.sentiment - a.sentiment);
  
  return (
    <Card className="mt-6 shadow-sm hover:shadow-md transition-shadow duration-300 glassmorphism">
      <CardHeader>
        <CardTitle className="text-xl font-medium">Sector Analysis</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-5">
          {sortedSectors.map((sector, index) => {
            // Calculate the sentiment progress value (from -1 to 1, converted to 0-100 scale)
            const sentimentProgress = ((sector.sentiment + 1) / 2) * 100;
            const sentimentColor = getSentimentColor(sector.sentiment);
            
            return (
              <div key={index} className="group">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center">
                    <span className="font-medium">{sector.name}</span>
                  </div>
                  <span className={`${getSentimentClass(sector.sentiment)} text-sm font-medium`}>
                    {formatPercent(sector.percentChange)}
                  </span>
                </div>
                <Progress 
                  value={sentimentProgress} 
                  className="h-2 transition-all duration-300 group-hover:h-3"
                  indicatorClassName={`transition-all duration-300 ease-in-out`}
                  style={{ 
                    "--progress-background": `linear-gradient(90deg, ${sentimentColor}88, ${sentimentColor})` 
                  } as React.CSSProperties}
                />
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

export default SectorAnalysis;
