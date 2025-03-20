
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { NewsItem } from '@/services/sentimentService';
import { formatTimeAgo, getSentimentClass } from '@/utils/formatters';
import { ExternalLink } from 'lucide-react';

interface NewsImpactProps {
  news: NewsItem[];
  loading?: boolean;
}

const NewsImpact: React.FC<NewsImpactProps> = ({ news, loading = false }) => {
  if (loading) {
    return (
      <Card className="mt-6 glassmorphism">
        <CardHeader>
          <CardTitle className="text-xl font-medium">Market News</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 animate-pulse">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="border-b border-gray-100 dark:border-gray-800 pb-4 last:border-0 last:pb-0">
                <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2" />
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-2" />
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/5" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Sort news by impact score (highest to lowest)
  const sortedNews = [...news].sort((a, b) => b.impactScore - a.impactScore);
  
  return (
    <Card className="mt-6 shadow-sm hover:shadow-md transition-shadow duration-300 glassmorphism">
      <CardHeader>
        <CardTitle className="text-xl font-medium">Market News</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {sortedNews.slice(0, 5).map((item, index) => (
            <div 
              key={item.id} 
              className="border-b border-gray-100 dark:border-gray-800 pb-4 last:border-0 last:pb-0 animate-fade-in"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <a 
                href={item.url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="group block"
              >
                <h3 className="font-medium group-hover:text-primary transition-colors flex items-start">
                  <span>{item.title}</span>
                  <ExternalLink size={14} className="ml-1 mt-1 opacity-0 group-hover:opacity-100 transition-opacity" />
                </h3>
                <div className="flex items-center text-sm text-muted-foreground mt-1">
                  <span className="mr-2">{item.source}</span>
                  <span>•</span>
                  <span className="ml-2">{formatTimeAgo(item.publishedAt)}</span>
                </div>
                <div className="flex items-center mt-2">
                  <div className="text-xs px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800">
                    Impact: <span className="font-medium">{(item.impactScore * 10).toFixed(1)}</span>/10
                  </div>
                  <div className={`text-xs px-2 py-0.5 rounded-full ml-2 ${getSentimentClass(item.sentiment)}`}>
                    {item.sentiment > 0.2 ? 'Positive' : item.sentiment < -0.2 ? 'Negative' : 'Neutral'}
                  </div>
                </div>
              </a>
            </div>
          ))}
        </div>
        
        <div className="mt-4 text-center">
          <button className="text-primary hover:text-primary/80 transition-colors text-sm font-medium">
            View All News
          </button>
        </div>
      </CardContent>
    </Card>
  );
};

export default NewsImpact;
