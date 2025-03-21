import React, { useState, useRef, useEffect } from 'react';
import { Bot, X, Send, Maximize2, Minimize2, HelpCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Drawer, DrawerClose, DrawerContent, DrawerTrigger } from '@/components/ui/drawer';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import { sentimentService } from '@/services/sentimentService';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface Message {
  id: string;
  content: string;
  sender: 'user' | 'bot';
  timestamp: Date;
}

const AIAssistant = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'initial',
      content: 'Hello! I\'m your Equora.AI assistant. I can help you understand market trends, analyze sentiment data, explain technical indicators, and answer any questions about the dashboard data. How can I assist you today?',
      sender: 'bot',
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isMinimized, setIsMinimized] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();
  
  // Auto-scroll to the bottom of chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = () => {
    if (!input.trim()) return;
    
    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      content: input,
      sender: 'user',
      timestamp: new Date(),
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    
    // Show thinking state
    setIsThinking(true);
    
    // Generate response after a short delay
    setTimeout(() => {
      generateResponse(input);
      setIsThinking(false);
    }, 600);
  };
  
  const generateResponse = (userQuery: string) => {
    // Get current dashboard data
    const dashboardData = sentimentService.getCurrentData();
    
    // Enhanced response logic based on keywords in the query
    let response = '';
    const lowerQuery = userQuery.toLowerCase();
    
    // Market sentiment related queries
    if (lowerQuery.includes('market') || lowerQuery.includes('sentiment')) {
      if (dashboardData) {
        response = `The current market sentiment is ${dashboardData.overallSentiment > 0.2 ? 'positive' : 
          dashboardData.overallSentiment < -0.2 ? 'negative' : 'neutral'} with an index value of ${dashboardData.currentValue.toFixed(2)}, 
          showing a ${dashboardData.percentChange > 0 ? 'gain' : 'loss'} of ${Math.abs(dashboardData.percentChange).toFixed(2)}%.
          
          The volatility index is currently at ${dashboardData.volatilityIndex.toFixed(2)}, indicating ${
            dashboardData.volatilityIndex > 25 ? 'high market uncertainty' : 
            dashboardData.volatilityIndex > 15 ? 'moderate market uncertainty' : 'relatively stable market conditions'
          }.`;
      } else {
        response = "I don't have the current market sentiment data available.";
      }
    } 
    
    // Sector analysis related queries
    else if (lowerQuery.includes('sector') || lowerQuery.includes('industry')) {
      if (dashboardData && dashboardData.sectors) {
        const topSector = [...dashboardData.sectors].sort((a, b) => b.sentiment - a.sentiment)[0];
        const worstSector = [...dashboardData.sectors].sort((a, b) => a.sentiment - b.sentiment)[0];
        response = `The best performing sector is ${topSector.name} with a ${topSector.percentChange.toFixed(2)}% change and sentiment score of ${topSector.sentiment.toFixed(2)}. 
        The worst performing sector is ${worstSector.name} with a ${worstSector.percentChange.toFixed(2)}% change and sentiment score of ${worstSector.sentiment.toFixed(2)}.
        
        Most sectors are showing ${
          dashboardData.sectors.filter(s => s.percentChange > 0).length > dashboardData.sectors.length / 2 
          ? 'positive' : 'negative'
        } performance today.`;
      } else {
        response = "I don't have sector analysis data available right now.";
      }
    } 
    
    // Stock related queries
    else if (lowerQuery.includes('stock') || lowerQuery.includes('equity')) {
      if (dashboardData && dashboardData.topStocks) {
        const topStock = [...dashboardData.topStocks].sort((a, b) => b.percentChange - a.percentChange)[0];
        const mostCorrelated = [...dashboardData.priceCorrelation.stocks].sort((a, b) => b.correlationIndex - a.correlationIndex)[0];
        
        response = `The top performing stock is ${topStock.name} (${topStock.symbol}) with a ${topStock.percentChange.toFixed(2)}% change. 
        
        In terms of correlation with market sentiment, ${mostCorrelated.name} (${mostCorrelated.symbol}) shows the highest correlation of ${mostCorrelated.correlationIndex.toFixed(2)}, indicating that it tends to move ${
          mostCorrelated.correlationIndex > 0 ? 'with' : 'against'
        } the overall market sentiment.`;
      } else {
        response = "I don't have stock performance data available right now.";
      }
    } 
    
    // Technical analysis related queries
    else if (lowerQuery.includes('technical') || lowerQuery.includes('indicator')) {
      if (dashboardData && dashboardData.technicalIndicators) {
        const rsi = dashboardData.technicalIndicators.rsi;
        const macd = dashboardData.technicalIndicators.macd;
        
        response = `Current technical indicators:
        
        RSI: ${rsi.toFixed(2)} (${
          rsi > 70 ? 'Overbought - potential reversal or pullback expected' :
          rsi < 30 ? 'Oversold - potential recovery or bounce expected' :
          'Neutral territory'
        })
        
        MACD: ${macd.toFixed(3)} (${
          macd > 0 ? 'Positive - bullish momentum' : 'Negative - bearish momentum'
        })
        
        Moving Averages: The current price is ${
          dashboardData.currentValue > dashboardData.technicalIndicators.movingAverages.ma50 ? 'above' : 'below'
        } the 50-day MA (${dashboardData.technicalIndicators.movingAverages.ma50.toFixed(2)}) and ${
          dashboardData.currentValue > dashboardData.technicalIndicators.movingAverages.ma200 ? 'above' : 'below'
        } the 200-day MA (${dashboardData.technicalIndicators.movingAverages.ma200.toFixed(2)}).`;
      } else {
        response = "I don't have technical indicator data available right now.";
      }
    }
    
    // News related queries
    else if (lowerQuery.includes('news') || lowerQuery.includes('headline')) {
      if (dashboardData && dashboardData.recentNews && dashboardData.recentNews.length > 0) {
        const latestNews = dashboardData.recentNews[0];
        const significantNews = [...dashboardData.recentNews].sort((a, b) => Math.abs(b.sentiment) - Math.abs(a.sentiment))[0];
        
        response = `The latest market news: "${latestNews.title}" from ${latestNews.source}.
        
        The most impactful recent news was "${significantNews.title}" with a sentiment score of ${significantNews.sentiment.toFixed(2)}, indicating a ${
          significantNews.sentiment > 0.2 ? 'positive' : 
          significantNews.sentiment < -0.2 ? 'negative' : 'neutral'
        } market impact.`;
      } else {
        response = "I don't have recent news data available.";
      }
    }
    
    // Prediction related queries
    else if (lowerQuery.includes('predict') || lowerQuery.includes('forecast')) {
      if (dashboardData && dashboardData.sentimentPrediction) {
        const predictions = dashboardData.sentimentPrediction.predictions;
        const lastPrediction = predictions[predictions.length - 1];
        const firstPrediction = predictions[0];
        const trend = lastPrediction.predicted > firstPrediction.predicted;
        
        response = `Based on our ML model (${dashboardData.sentimentPrediction.confidenceLevel}% confidence), 
        the market sentiment is predicted to ${trend ? 'improve' : 'decline'} over the next 5 days.
        
        The model forecasts a change from ${firstPrediction.predicted.toFixed(2)} to ${lastPrediction.predicted.toFixed(2)}, 
        which represents a ${Math.abs(((lastPrediction.predicted - firstPrediction.predicted) / firstPrediction.predicted) * 100).toFixed(2)}% ${trend ? 'increase' : 'decrease'}.
        
        This forecast is based on historical patterns, technical indicators, and sentiment analysis of recent market data.`;
      } else {
        response = "I don't have prediction data available right now.";
      }
    }
    
    // Volatility related queries
    else if (lowerQuery.includes('volatility') || lowerQuery.includes('vix')) {
      if (dashboardData) {
        response = `The current volatility index is at ${dashboardData.volatilityIndex.toFixed(2)}.
        
        Market breadth data shows ${dashboardData.marketBreadth.advancers} advancing stocks vs ${dashboardData.marketBreadth.decliners} declining stocks, 
        with ${dashboardData.marketBreadth.newHighs} new highs and ${dashboardData.marketBreadth.newLows} new lows.
        
        This indicates ${
          dashboardData.marketBreadth.advancers > dashboardData.marketBreadth.decliners ? 'positive breadth' : 'negative breadth'
        } with ${
          dashboardData.volatilityIndex > 25 ? 'high volatility' : 
          dashboardData.volatilityIndex > 15 ? 'moderate volatility' : 'low volatility'
        }.`;
      } else {
        response = "I don't have volatility data available right now.";
      }
    }
    
    // Explanation of charts/components
    else if (lowerQuery.includes('explain') || lowerQuery.includes('what is') || lowerQuery.includes('how to read')) {
      if (lowerQuery.includes('price correlation')) {
        response = `The Price Correlation chart plots stocks based on their price performance (x-axis) versus their correlation with market sentiment (y-axis).
        
        Stocks are color-coded by correlation strength:
        - Green: High positive correlation (>0.7)
        - Blue: Medium positive correlation (0.3-0.7)
        - Orange: Low positive correlation (0-0.3)
        - Red: Negative correlation (<0)
        
        The size of each dot represents the stock's market capitalization. This visualization helps identify which stocks move with or against market sentiment.`;
      }
      else if (lowerQuery.includes('sentiment prediction')) {
        response = `The Sentiment Prediction chart uses machine learning to forecast market sentiment over the next 5 days based on historical patterns.
        
        It shows:
        - Blue line: Historical sentiment values
        - Green/Red line: Predicted future sentiment (color indicates bullish/bearish)
        - Shaded area: Confidence interval for the prediction
        
        The model considers past sentiment values, technical indicators, and news sentiment to generate these forecasts.`;
      }
      else if (lowerQuery.includes('cluster')) {
        response = `The Cluster Analysis chart uses machine learning to group stocks based on volatility and momentum characteristics.
        
        The stocks are clustered into four categories:
        - High Growth: Stocks with high momentum and often higher volatility
        - Value: Typically lower volatility stocks with steady performance
        - Cyclical: Stocks with changing momentum that follows economic cycles
        - Defensive: Stocks that tend to maintain value during market downturns
        
        The size of each bubble represents the stock's market capitalization. This analysis helps identify stocks with similar behavioral patterns.`;
      }
      else if (lowerQuery.includes('technical indicator')) {
        response = `The Technical Indicators component displays key market indicators:
        
        - RSI (Relative Strength Index): Measures overbought/oversold conditions. Values above 70 suggest overbought, below 30 suggest oversold.
        
        - MACD (Moving Average Convergence Divergence): Shows momentum. Positive values indicate bullish momentum, negative values indicate bearish momentum.
        
        - Moving Averages: The 50-day and 200-day moving averages, which help identify long-term trends.
        
        - Bollinger Bands: Shows price volatility with upper and lower bands, helping identify potential reversals.`;
      }
      else {
        response = `I can explain various parts of the dashboard. Try asking about specific components like:
        - Price Correlation chart
        - Sentiment Prediction
        - Cluster Analysis
        - Technical Indicators
        - Market Breadth
        - Global Markets`;
      }
    }
    
    // Help requests
    else if (lowerQuery.includes('help') || lowerQuery.includes('can you')) {
      response = `I can help you with understanding your dashboard data. You can ask about:
      
      - Current market sentiment and trends
      - Sector performance and analysis
      - Top performing or most correlated stocks
      - Technical indicators explanation (RSI, MACD, etc.)
      - Recent news impact on markets
      - Market volatility and breadth analysis
      - Sentiment predictions and forecasts
      - Explanation of any chart or component
      
      Just ask a specific question about any aspect of the market data you see!`;
    } else {
      // General response for unrecognized queries
      response = `I'm not sure I understand your specific question about "${userQuery}". 
      
      You can ask me about market sentiment, sector performance, specific stocks, technical indicators, market predictions, volatility, or recent news impact. 
      
      I can also explain any chart or component you see on the dashboard. What would you like to know?`;
    }
    
    // Add bot response
    const botMessage: Message = {
      id: Date.now().toString(),
      content: response,
      sender: 'bot',
      timestamp: new Date(),
    };
    
    setMessages(prev => [...prev, botMessage]);
  };
  
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSend();
    }
  };
  
  const toggleMinimize = () => {
    setIsMinimized(!isMinimized);
  };
  
  // For desktop: use Popover component
  const renderDesktopChat = () => (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button 
          variant="default" 
          size="icon" 
          className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg bg-primary hover:bg-primary/90 z-50"
        >
          <Bot size={24} />
        </Button>
      </PopoverTrigger>
      <PopoverContent 
        className="w-80 md:w-96 p-0 rounded-xl shadow-xl border-border/50" 
        align="end"
        side="top"
        sideOffset={20}
      >
        <div className="flex flex-col h-[500px] max-h-[80vh]">
          {/* Chat header */}
          <div className="flex items-center justify-between p-3 border-b bg-primary text-primary-foreground rounded-t-xl">
            <div className="flex items-center gap-2">
              <Bot size={18} />
              <span className="font-medium">Equora.AI Assistant</span>
            </div>
            <div className="flex items-center gap-1">
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-7 w-7 text-primary-foreground hover:bg-primary/90 rounded-full"
                onClick={toggleMinimize}
              >
                {isMinimized ? <Maximize2 size={14} /> : <Minimize2 size={14} />}
              </Button>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-7 w-7 text-primary-foreground hover:bg-primary/90 rounded-full"
                onClick={() => setIsOpen(false)}
              >
                <X size={14} />
              </Button>
            </div>
          </div>
          
          {/* Chat messages */}
          <div className={cn(
            "flex-1 overflow-y-auto p-3 bg-background/50 space-y-3",
            isMinimized && "hidden"
          )}>
            {messages.map((message) => (
              <div 
                key={message.id} 
                className={cn(
                  "flex max-w-[85%] mb-2",
                  message.sender === 'user' ? "ml-auto" : "mr-auto"
                )}
              >
                <div className={cn(
                  "p-3 rounded-lg text-sm",
                  message.sender === 'user' 
                    ? "bg-primary text-primary-foreground rounded-br-none" 
                    : "bg-muted rounded-bl-none"
                )}>
                  {message.content.split('\n\n').map((paragraph, idx) => (
                    <p key={idx} className={idx > 0 ? "mt-2" : ""}>
                      {paragraph}
                    </p>
                  ))}
                </div>
              </div>
            ))}
            {isThinking && (
              <div className="flex max-w-[85%] mr-auto">
                <div className="p-3 rounded-lg bg-muted rounded-bl-none">
                  <div className="flex space-x-2 items-center">
                    <div className="w-2 h-2 rounded-full bg-muted-foreground/40 animate-pulse" style={{ animationDelay: '0ms' }}></div>
                    <div className="w-2 h-2 rounded-full bg-muted-foreground/40 animate-pulse" style={{ animationDelay: '300ms' }}></div>
                    <div className="w-2 h-2 rounded-full bg-muted-foreground/40 animate-pulse" style={{ animationDelay: '600ms' }}></div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
          
          {/* Input area */}
          {!isMinimized && (
            <div className="p-3 border-t">
              <div className="flex items-center gap-2">
                <Input
                  placeholder="Ask about your dashboard data..."
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="flex-1"
                  disabled={isThinking}
                />
                <Button 
                  size="icon" 
                  onClick={handleSend}
                  disabled={!input.trim() || isThinking}
                >
                  <Send size={18} />
                </Button>
              </div>
              <div className="mt-2 text-xs text-muted-foreground">
                <p className="flex items-center gap-1">
                  <HelpCircle size={12} />
                  Try asking: "Explain the price correlation chart" or "What's the current market sentiment?"
                </p>
              </div>
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
  
  // For mobile: use Drawer component
  const renderMobileChat = () => (
    <Drawer open={isOpen} onOpenChange={setIsOpen}>
      <DrawerTrigger asChild>
        <Button 
          variant="default" 
          size="icon" 
          className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg bg-primary hover:bg-primary/90 z-50"
        >
          <Bot size={24} />
        </Button>
      </DrawerTrigger>
      <DrawerContent className="h-[85vh] p-0">
        <div className="flex flex-col h-full">
          {/* Chat header */}
          <div className="flex items-center justify-between p-4 border-b bg-primary text-primary-foreground">
            <div className="flex items-center gap-2">
              <Bot size={20} />
              <span className="font-medium">Equora.AI Assistant</span>
            </div>
            <DrawerClose asChild>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8 text-primary-foreground hover:bg-primary/90 rounded-full"
              >
                <X size={16} />
              </Button>
            </DrawerClose>
          </div>
          
          {/* Chat messages */}
          <div className="flex-1 overflow-y-auto p-4 bg-background/50 space-y-3">
            {messages.map((message) => (
              <div 
                key={message.id} 
                className={cn(
                  "flex max-w-[85%] mb-2",
                  message.sender === 'user' ? "ml-auto" : "mr-auto"
                )}
              >
                <div className={cn(
                  "p-3 rounded-lg text-sm",
                  message.sender === 'user' 
                    ? "bg-primary text-primary-foreground rounded-br-none" 
                    : "bg-muted rounded-bl-none"
                )}>
                  {message.content.split('\n\n').map((paragraph, idx) => (
                    <p key={idx} className={idx > 0 ? "mt-2" : ""}>
                      {paragraph}
                    </p>
                  ))}
                </div>
              </div>
            ))}
            {isThinking && (
              <div className="flex max-w-[85%] mr-auto">
                <div className="p-3 rounded-lg bg-muted rounded-bl-none">
                  <div className="flex space-x-2 items-center">
                    <div className="w-2 h-2 rounded-full bg-muted-foreground/40 animate-pulse" style={{ animationDelay: '0ms' }}></div>
                    <div className="w-2 h-2 rounded-full bg-muted-foreground/40 animate-pulse" style={{ animationDelay: '300ms' }}></div>
                    <div className="w-2 h-2 rounded-full bg-muted-foreground/40 animate-pulse" style={{ animationDelay: '600ms' }}></div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
          
          {/* Input area */}
          <div className="p-4 border-t">
            <div className="flex items-center gap-2">
              <Input
                placeholder="Ask about your dashboard data..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                className="flex-1"
                disabled={isThinking}
              />
              <Button 
                size="icon" 
                onClick={handleSend}
                disabled={!input.trim() || isThinking}
              >
                <Send size={18} />
              </Button>
            </div>
            <div className="mt-2 text-xs text-muted-foreground">
              <p className="flex items-center gap-1">
                <HelpCircle size={12} />
                Try asking: "What's the market sentiment today?" or "Explain technical indicators"
              </p>
            </div>
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
  
  return isMobile ? renderMobileChat() : renderDesktopChat();
};

export default AIAssistant;
