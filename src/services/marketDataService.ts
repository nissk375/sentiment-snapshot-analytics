
import axios from 'axios';

// Alpha Vantage API key from environment variables
const API_KEY = import.meta.env.VITE_ALPHA_VANTAGE_KEY || 'demo';

// Function to fetch intraday data for a given symbol
export async function getIntradayData(symbol: string, interval = '5min') {
  try {
    const url = `https://www.alphavantage.co/query?function=TIME_SERIES_INTRADAY&symbol=${symbol}&interval=${interval}&apikey=${API_KEY}`;
    console.log(`Fetching data for ${symbol} with interval ${interval}`);
    const response = await axios.get(url);
    
    // Check if we got the expected data structure
    if (!response.data || !response.data["Time Series (5min)"]) {
      console.warn("Unexpected API response format:", response.data);
      // If using demo key, we might be hitting rate limits or getting demo responses
      if (API_KEY === 'demo') {
        console.warn("Using demo API key. Consider getting a free API key from Alpha Vantage.");
      }
      throw new Error('Invalid API response format');
    }
    
    return response.data;
  } catch (error) {
    console.error('Error fetching intraday data:', error);
    throw error;
  }
}

// Function to fetch global market data
export async function getGlobalMarketData() {
  try {
    const url = `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=SPY&apikey=${API_KEY}`;
    const response = await axios.get(url);
    return response.data;
  } catch (error) {
    console.error('Error fetching global market data:', error);
    throw error;
  }
}

// Function to fetch sector performance
export async function getSectorPerformance() {
  try {
    const url = `https://www.alphavantage.co/query?function=SECTOR&apikey=${API_KEY}`;
    const response = await axios.get(url);
    return response.data;
  } catch (error) {
    console.error('Error fetching sector performance:', error);
    throw error;
  }
}
