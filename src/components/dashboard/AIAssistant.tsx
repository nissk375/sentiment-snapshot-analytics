
import React, { useState, useRef, useEffect } from 'react';
import { Bot, X, Send, Maximize2, Minimize2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Drawer, DrawerClose, DrawerContent, DrawerTrigger } from '@/components/ui/drawer';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import { sentimentService } from '@/services/sentimentService';

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
      content: 'Hello! I\'m your Market Sentiment AI assistant. How can I help you with understanding your dashboard data today?',
      sender: 'bot',
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isMinimized, setIsMinimized] = useState(false);
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
    
    // Simulate thinking
    setTimeout(() => {
      generateResponse(input);
    }, 600);
  };
  
  const generateResponse = (userQuery: string) => {
    // Get current dashboard data
    const dashboardData = sentimentService.getCurrentData();
    
    // Simple response logic based on keywords in the query
    let response = '';
    const lowerQuery = userQuery.toLowerCase();
    
    if (lowerQuery.includes('market') || lowerQuery.includes('sentiment')) {
      if (dashboardData) {
        response = `The current market sentiment is ${dashboardData.overallSentiment > 0.2 ? 'positive' : 
          dashboardData.overallSentiment < -0.2 ? 'negative' : 'neutral'} with an index value of ${dashboardData.currentValue.toFixed(2)}, 
          showing a ${dashboardData.percentChange > 0 ? 'gain' : 'loss'} of ${Math.abs(dashboardData.percentChange).toFixed(2)}%.`;
      } else {
        response = "I don't have the current market sentiment data available.";
      }
    } else if (lowerQuery.includes('sector') || lowerQuery.includes('industry')) {
      if (dashboardData && dashboardData.sectors) {
        const topSector = [...dashboardData.sectors].sort((a, b) => b.sentiment - a.sentiment)[0];
        const worstSector = [...dashboardData.sectors].sort((a, b) => a.sentiment - b.sentiment)[0];
        response = `The best performing sector is ${topSector.name} with a ${topSector.percentChange.toFixed(2)}% change. 
        The worst performing sector is ${worstSector.name} with a ${worstSector.percentChange.toFixed(2)}% change.`;
      } else {
        response = "I don't have sector analysis data available right now.";
      }
    } else if (lowerQuery.includes('stock') || lowerQuery.includes('equity')) {
      if (dashboardData && dashboardData.topStocks) {
        const topStock = [...dashboardData.topStocks].sort((a, b) => b.percentChange - a.percentChange)[0];
        response = `The top performing stock is ${topStock.name} (${topStock.symbol}) with a ${topStock.percentChange.toFixed(2)}% change.`;
      } else {
        response = "I don't have stock performance data available right now.";
      }
    } else if (lowerQuery.includes('news') || lowerQuery.includes('headline')) {
      if (dashboardData && dashboardData.recentNews && dashboardData.recentNews.length > 0) {
        const latestNews = dashboardData.recentNews[0];
        response = `The latest market news: "${latestNews.title}" from ${latestNews.source}.`;
      } else {
        response = "I don't have recent news data available.";
      }
    } else if (lowerQuery.includes('volatility') || lowerQuery.includes('vix')) {
      if (dashboardData) {
        response = `The current volatility index is at ${dashboardData.volatilityIndex.toFixed(2)}.`;
      } else {
        response = "I don't have volatility data available right now.";
      }
    } else if (lowerQuery.includes('help') || lowerQuery.includes('can you')) {
      response = `I can help you with understanding your dashboard data. You can ask about:
      - Current market sentiment
      - Sector performance
      - Top stocks
      - Recent news impact
      - Market volatility
      - Technical indicators`;
    } else {
      response = "I'm not sure I understand your question. Try asking about market sentiment, sectors, stocks, or recent news.";
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
              <span className="font-medium">Market AI Assistant</span>
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
                  {message.content}
                </div>
              </div>
            ))}
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
                />
                <Button 
                  size="icon" 
                  onClick={handleSend}
                  disabled={!input.trim()}
                >
                  <Send size={18} />
                </Button>
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
              <span className="font-medium">Market AI Assistant</span>
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
                  {message.content}
                </div>
              </div>
            ))}
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
              />
              <Button 
                size="icon" 
                onClick={handleSend}
                disabled={!input.trim()}
              >
                <Send size={18} />
              </Button>
            </div>
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
  
  return isMobile ? renderMobileChat() : renderDesktopChat();
};

export default AIAssistant;
