
import React, { useState } from 'react';
import MultiSymbolChart from '@/components/dashboard/MultiSymbolChart';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

const symbols = [
  "SPY",    // S&P 500 ETF
  "QQQ",    // Nasdaq ETF
  "AAPL",   // Apple
  "MSFT",   // Microsoft
  "AMZN",   // Amazon
  "GOOG",   // Alphabet
  "META",   // Meta
  "TSLA"    // Tesla
];

const MarketOverview1: React.FC = () => {
  const [selectedSymbol, setSelectedSymbol] = useState<string>("SPY");

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Real-Time Market Data</CardTitle>
        <CardDescription>
          Live intraday stock prices from Alpha Vantage API
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-2">
          {symbols.map((sym) => (
            <Button
              key={sym}
              variant={selectedSymbol === sym ? "default" : "outline"}
              onClick={() => setSelectedSymbol(sym)}
              size="sm"
            >
              {sym}
            </Button>
          ))}
        </div>
        <MultiSymbolChart symbol={selectedSymbol} />
      </CardContent>
    </Card>
  );
};

export default MarketOverview1;
