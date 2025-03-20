
import { toast } from "sonner";

// Types for our sentiment data
export interface SentimentData {
  timestamp: string;
  overallSentiment: number; // -1 to 1 scale
  marketIndex: string;
  currentValue: number;
  previousClose: number;
  percentChange: number;
  volume: number;
  sectors: SectorSentiment[];
  topStocks: StockSentiment[];
  recentNews: NewsItem[];
  sentimentTrend: TrendPoint[];
}

export interface SectorSentiment {
  name: string;
  sentiment: number;
  percentChange: number;
  volume: number;
}

export interface StockSentiment {
  symbol: string;
  name: string;
  sentiment: number;
  price: number;
  percentChange: number;
  volume: number;
}

export interface NewsItem {
  id: string;
  title: string;
  source: string;
  publishedAt: string;
  url: string;
  sentiment: number;
  impactScore: number;
}

export interface TrendPoint {
  timestamp: string;
  sentiment: number;
  indexValue: number;
}

// Mock data generator to simulate real-time data
const generateMockData = (): SentimentData => {
  const now = new Date();
  const overallSentiment = parseFloat((Math.random() * 2 - 1).toFixed(2));
  const currentValue = parseFloat((26000 + Math.random() * 2000).toFixed(2));
  const previousClose = parseFloat((currentValue * (1 - (Math.random() * 0.1 - 0.05))).toFixed(2));
  const percentChange = parseFloat(((currentValue - previousClose) / previousClose * 100).toFixed(2));
  
  // Create time points for the past 24 hours (hourly)
  const trendPoints = Array.from({ length: 24 }, (_, i) => {
    const trendTime = new Date(now);
    trendTime.setHours(now.getHours() - 23 + i);
    return {
      timestamp: trendTime.toISOString(),
      sentiment: parseFloat((Math.random() * 2 - 1).toFixed(2)),
      indexValue: parseFloat((25000 + Math.random() * 3000).toFixed(2))
    };
  });
  
  // Generate sector sentiments
  const sectors = [
    "Technology", "Healthcare", "Financials", 
    "Consumer Discretionary", "Communication Services",
    "Industrials", "Energy", "Utilities", "Materials", "Real Estate"
  ].map(name => ({
    name,
    sentiment: parseFloat((Math.random() * 2 - 1).toFixed(2)),
    percentChange: parseFloat((Math.random() * 10 - 5).toFixed(2)),
    volume: Math.floor(Math.random() * 10000000) + 500000
  }));
  
  // Generate top stocks
  const stockNames = [
    { symbol: "AAPL", name: "Apple Inc." },
    { symbol: "MSFT", name: "Microsoft Corporation" },
    { symbol: "GOOGL", name: "Alphabet Inc." },
    { symbol: "AMZN", name: "Amazon.com Inc." },
    { symbol: "META", name: "Meta Platforms Inc." },
    { symbol: "TSLA", name: "Tesla Inc." },
    { symbol: "NVDA", name: "NVIDIA Corporation" },
    { symbol: "JPM", name: "JPMorgan Chase & Co." },
    { symbol: "V", name: "Visa Inc." },
    { symbol: "JNJ", name: "Johnson & Johnson" }
  ];
  
  const topStocks = stockNames.map(stock => ({
    symbol: stock.symbol,
    name: stock.name,
    sentiment: parseFloat((Math.random() * 2 - 1).toFixed(2)),
    price: parseFloat((100 + Math.random() * 900).toFixed(2)),
    percentChange: parseFloat((Math.random() * 10 - 5).toFixed(2)),
    volume: Math.floor(Math.random() * 5000000) + 100000
  }));
  
  // Generate news
  const newsTitles = [
    "Federal Reserve Signals Interest Rate Decision",
    "Major Tech Companies Report Quarterly Earnings",
    "Oil Prices Surge Amid Global Supply Concerns",
    "Inflation Data Shows Unexpected Trend",
    "New Government Policy Impacts Market Sectors",
    "Retail Sales Data Exceeds Analyst Expectations",
    "Global Markets React to Economic Indicator Release",
    "Trade Negotiations Affect International Markets",
    "Banking Sector Faces Regulatory Changes",
    "Technology Innovation Drives Stock Movements"
  ];
  
  const newsSources = ["Bloomberg", "Reuters", "CNBC", "Financial Times", "Wall Street Journal"];
  
  const recentNews = newsTitles.map((title, idx) => ({
    id: `news-${idx}`,
    title,
    source: newsSources[Math.floor(Math.random() * newsSources.length)],
    publishedAt: new Date(now.getTime() - Math.random() * 86400000).toISOString(),
    url: "#",
    sentiment: parseFloat((Math.random() * 2 - 1).toFixed(2)),
    impactScore: parseFloat((Math.random()).toFixed(2))
  }));
  
  return {
    timestamp: now.toISOString(),
    overallSentiment,
    marketIndex: "S&P 500",
    currentValue,
    previousClose,
    percentChange,
    volume: Math.floor(Math.random() * 1000000000) + 500000000,
    sectors,
    topStocks,
    recentNews,
    sentimentTrend: trendPoints
  };
};

// Interval reference for real-time updates
let updateInterval: NodeJS.Timeout | null = null;

// Service class for fetching and managing sentiment data
class SentimentService {
  private data: SentimentData | null = null;
  private listeners: ((data: SentimentData) => void)[] = [];

  constructor() {
    // Initialize with mock data immediately
    this.data = generateMockData();
  }

  // Start real-time updates (in a real app, this would use WebSockets or polling)
  startRealTimeUpdates(interval = 30000) {
    if (updateInterval) {
      clearInterval(updateInterval);
    }
    
    // Initial data fetch
    this.fetchLatestData();
    
    // Set up interval for updates
    updateInterval = setInterval(() => {
      this.fetchLatestData();
    }, interval);
    
    return () => {
      if (updateInterval) {
        clearInterval(updateInterval);
        updateInterval = null;
      }
    };
  }
  
  // Stop real-time updates
  stopRealTimeUpdates() {
    if (updateInterval) {
      clearInterval(updateInterval);
      updateInterval = null;
    }
  }
  
  // Fetch latest data
  async fetchLatestData() {
    try {
      // In a real application, this would be an API call
      // For this demo, we'll simulate network delay and use mock data
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Generate new mock data
      this.data = generateMockData();
      
      // Notify listeners
      this.notifyListeners();
      
      return this.data;
    } catch (error) {
      console.error("Error fetching sentiment data:", error);
      toast.error("Failed to fetch latest market data", {
        description: "Please check your connection and try again."
      });
      return null;
    }
  }
  
  // Get current data
  getCurrentData(): SentimentData | null {
    return this.data;
  }
  
  // Subscribe to data updates
  subscribe(listener: (data: SentimentData) => void) {
    this.listeners.push(listener);
    
    // If we already have data, notify the new listener immediately
    if (this.data) {
      listener(this.data);
    }
    
    // Return unsubscribe function
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }
  
  // Notify all listeners of data changes
  private notifyListeners() {
    if (!this.data) return;
    
    this.listeners.forEach(listener => {
      listener(this.data!);
    });
  }
}

// Create and export a singleton instance
export const sentimentService = new SentimentService();
