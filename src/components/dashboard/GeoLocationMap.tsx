
import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

// Temporary token input for non-Supabase projects
const MapboxTokenInput = ({ onTokenSubmit }: { onTokenSubmit: (token: string) => void }) => {
  const [token, setToken] = useState('');
  
  return (
    <div className="p-4 flex flex-col space-y-2">
      <label className="text-sm font-medium">
        Enter your Mapbox public token to activate the map
      </label>
      <div className="flex space-x-2">
        <input 
          type="text" 
          value={token}
          onChange={(e) => setToken(e.target.value)}
          placeholder="pk.eyJ1Ijo..."
          className="flex-1 px-3 py-2 border rounded-md text-sm"
        />
        <button 
          onClick={() => onTokenSubmit(token)}
          className="px-3 py-2 bg-primary text-white rounded-md text-sm"
        >
          Apply
        </button>
      </div>
      <p className="text-xs text-muted-foreground">
        Get your token at <a href="https://mapbox.com/" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">mapbox.com</a>
      </p>
    </div>
  );
};

interface MarketRegion {
  coordinates: [number, number];
  name: string;
  marketIndex: string;
  value: number;
  percentChange: number;
  sentiment: number;
  recentActivity: string;
  pulseRate: number; // Controls the pulse animation speed
}

interface GeoLocationMapProps {
  loading?: boolean;
  regions?: MarketRegion[];
}

const generateDefaultRegions = (): MarketRegion[] => {
  return [
    {
      coordinates: [-74.0060, 40.7128], // New York
      name: "New York",
      marketIndex: "NYSE",
      value: 36789.5,
      percentChange: 1.24,
      sentiment: 0.72,
      recentActivity: "High trading volume in tech sector",
      pulseRate: 2,
    },
    {
      coordinates: [-0.1278, 51.5074], // London
      name: "London",
      marketIndex: "FTSE",
      value: 7654.3,
      percentChange: -0.58,
      sentiment: -0.32,
      recentActivity: "Currency fluctuations affecting market",
      pulseRate: 3,
    },
    {
      coordinates: [139.6917, 35.6895], // Tokyo
      name: "Tokyo",
      marketIndex: "Nikkei",
      value: 28459.7,
      percentChange: 2.15,
      sentiment: 0.85,
      recentActivity: "Export stocks performing well",
      pulseRate: 1.5,
    },
    {
      coordinates: [121.4737, 31.2304], // Shanghai
      name: "Shanghai",
      marketIndex: "SSE",
      value: 3421.8,
      percentChange: -1.02,
      sentiment: -0.45,
      recentActivity: "New regulations impacting financials",
      pulseRate: 2.5,
    },
    {
      coordinates: [77.2090, 28.6139], // New Delhi
      name: "New Delhi",
      marketIndex: "SENSEX",
      value: 59345.2,
      percentChange: 0.87,
      sentiment: 0.56,
      recentActivity: "IT services showing strong growth",
      pulseRate: 1.8,
    },
    {
      coordinates: [151.2093, -33.8688], // Sydney
      name: "Sydney",
      marketIndex: "ASX",
      value: 7312.6,
      percentChange: 0.34,
      sentiment: 0.21,
      recentActivity: "Mining sector stabilizing after volatility",
      pulseRate: 2.2,
    },
    {
      coordinates: [18.4241, -33.9249], // Cape Town
      name: "Cape Town",
      marketIndex: "JSE",
      value: 68754.3,
      percentChange: -0.42,
      sentiment: -0.24,
      recentActivity: "Resource stocks under pressure",
      pulseRate: 3.5,
    },
    {
      coordinates: [-46.6333, -23.5505], // São Paulo
      name: "São Paulo",
      marketIndex: "BOVESPA",
      value: 115784.2,
      percentChange: 1.56,
      sentiment: 0.68,
      recentActivity: "Agricultural commodities driving gains",
      pulseRate: 1.3,
    },
  ];
};

const GeoLocationMap: React.FC<GeoLocationMapProps> = ({ 
  loading = false,
  regions = generateDefaultRegions()
}) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<{ marker: mapboxgl.Marker, popup: mapboxgl.Popup, element: HTMLElement }[]>([]);
  const [mapboxToken, setMapboxToken] = useState<string | null>(localStorage.getItem('mapbox_token'));
  const [mapInitialized, setMapInitialized] = useState(false);

  const initializeMap = (token: string) => {
    if (!mapContainer.current || map.current) return;
    
    try {
      mapboxgl.accessToken = token;
      
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/dark-v11',
        projection: 'globe',
        zoom: 1.5,
        center: [10, 15],
        pitch: 30,
        attributionControl: false,
      });

      // Add navigation controls
      map.current.addControl(
        new mapboxgl.NavigationControl({
          visualizePitch: true,
        }),
        'top-right'
      );

      // Disable scroll zoom for smoother experience
      map.current.scrollZoom.disable();

      // Add atmosphere and fog effects
      map.current.on('style.load', () => {
        map.current?.setFog({
          color: 'rgb(255, 255, 255)',
          'high-color': 'rgb(200, 200, 225)',
          'horizon-blend': 0.2,
        });
        
        // Add markers after the map style has loaded
        addMarkers();
        setMapInitialized(true);
      });

      // Rotation animation settings
      const secondsPerRevolution = 240;
      const maxSpinZoom = 3;
      const slowSpinZoom = 2;
      let userInteracting = false;
      let spinEnabled = true;

      // Spin globe function
      function spinGlobe() {
        if (!map.current) return;
        
        const zoom = map.current.getZoom();
        if (spinEnabled && !userInteracting && zoom < maxSpinZoom) {
          let distancePerSecond = 360 / secondsPerRevolution;
          if (zoom > slowSpinZoom) {
            const zoomDif = (maxSpinZoom - zoom) / (maxSpinZoom - slowSpinZoom);
            distancePerSecond *= zoomDif;
          }
          const center = map.current.getCenter();
          center.lng -= distancePerSecond;
          map.current.easeTo({ center, duration: 1000, easing: (n) => n });
        }
      }

      // Event listeners for interaction
      map.current.on('mousedown', () => {
        userInteracting = true;
      });
      
      map.current.on('dragstart', () => {
        userInteracting = true;
      });
      
      map.current.on('mouseup', () => {
        userInteracting = false;
        spinGlobe();
      });
      
      map.current.on('touchend', () => {
        userInteracting = false;
        spinGlobe();
      });

      map.current.on('moveend', () => {
        spinGlobe();
      });

      // Start the globe spinning
      spinGlobe();
    } catch (error) {
      console.error("Error initializing map:", error);
    }
  };

  const addMarkers = () => {
    if (!map.current) return;
    
    // Clear existing markers
    markersRef.current.forEach(({ marker }) => marker.remove());
    markersRef.current = [];
    
    regions.forEach((region) => {
      // Create a DOM element for the marker
      const markerElement = document.createElement('div');
      markerElement.className = 'market-marker';
      
      // Apply styling
      Object.assign(markerElement.style, {
        width: '20px',
        height: '20px',
        borderRadius: '50%',
        background: getSentimentColor(region.sentiment, 0.6),
        border: '2px solid white',
        boxShadow: '0 0 10px rgba(0, 0, 0, 0.5)',
        cursor: 'pointer',
      });
      
      // Add pulse animation
      const pulse = document.createElement('div');
      pulse.className = 'marker-pulse';
      Object.assign(pulse.style, {
        position: 'absolute',
        top: '-8px',
        left: '-8px',
        width: '32px',
        height: '32px',
        borderRadius: '50%',
        background: getSentimentColor(region.sentiment, 0.3),
        animation: `pulse ${region.pulseRate}s infinite`,
        zIndex: '-1',
      });
      markerElement.appendChild(pulse);
      
      // Create popup
      const popup = new mapboxgl.Popup({
        closeButton: false,
        closeOnClick: false,
        offset: 25,
        maxWidth: '300px',
        className: 'market-popup'
      });
      
      // Set popup content
      popup.setHTML(`
        <div class="p-3">
          <div class="font-bold text-lg">${region.name}</div>
          <div class="text-sm">${region.marketIndex}</div>
          <div class="flex justify-between items-center mt-2">
            <div class="text-sm">Value: ${region.value.toLocaleString()}</div>
            <div class="text-sm font-semibold ${region.percentChange >= 0 ? 'text-green-500' : 'text-red-500'}">
              ${region.percentChange >= 0 ? '+' : ''}${region.percentChange}%
            </div>
          </div>
          <div class="mt-2 text-xs opacity-80">${region.recentActivity}</div>
        </div>
      `);
      
      // Create marker
      const marker = new mapboxgl.Marker(markerElement)
        .setLngLat(region.coordinates)
        .setPopup(popup)
        .addTo(map.current);
      
      // Show popup on hover
      markerElement.addEventListener('mouseenter', () => {
        marker.getElement().style.zIndex = '10';
        popup.addTo(map.current!);
      });
      
      markerElement.addEventListener('mouseleave', () => {
        marker.getElement().style.zIndex = '1';
        popup.remove();
      });
      
      // Save reference
      markersRef.current.push({ marker, popup, element: markerElement });
    });
    
    // Add keyframe animation for pulse
    const styleSheet = document.createElement('style');
    styleSheet.textContent = `
      @keyframes pulse {
        0% {
          transform: scale(1);
          opacity: 0.8;
        }
        70% {
          transform: scale(2);
          opacity: 0;
        }
        100% {
          transform: scale(1);
          opacity: 0;
        }
      }
    `;
    document.head.appendChild(styleSheet);
  };
  
  const handleTokenSubmit = (token: string) => {
    localStorage.setItem('mapbox_token', token);
    setMapboxToken(token);
  };
  
  const getSentimentColor = (sentiment: number, alpha: number = 1) => {
    if (sentiment > 0.5) return `rgba(34, 197, 94, ${alpha})`;  // green
    if (sentiment > 0) return `rgba(74, 222, 128, ${alpha})`;   // light green
    if (sentiment > -0.5) return `rgba(248, 113, 113, ${alpha})`; // light red
    return `rgba(239, 68, 68, ${alpha})`;  // red
  };
  
  useEffect(() => {
    if (mapboxToken) {
      initializeMap(mapboxToken);
    }
    
    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, [mapboxToken]);
  
  useEffect(() => {
    if (map.current && mapInitialized) {
      addMarkers();
    }
  }, [regions, mapInitialized]);
  
  if (loading) {
    return (
      <Card className="w-full h-[400px] shadow-md overflow-hidden">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Skeleton className="h-6 w-40" />
          </CardTitle>
          <CardDescription>
            <Skeleton className="h-4 w-60" />
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Skeleton className="h-[300px] w-full" />
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card className="w-full h-[400px] shadow-md overflow-hidden">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2">
          <span>Global Market Pulse</span>
          <div className={cn(
            "w-2 h-2 rounded-full animate-pulse",
            regions.reduce((acc, region) => acc + region.sentiment, 0) / regions.length > 0
              ? "bg-green-500"
              : "bg-red-500"
          )} />
        </CardTitle>
        <CardDescription>
          Real-time market sentiment across major global trading centers
        </CardDescription>
      </CardHeader>
      <CardContent className="p-0 relative">
        {!mapboxToken ? (
          <MapboxTokenInput onTokenSubmit={handleTokenSubmit} />
        ) : (
          <>
            <div ref={mapContainer} className="w-full h-[336px]" />
            <div className="absolute bottom-4 left-4 right-4 bg-background/80 backdrop-blur-sm p-2 rounded-md text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <AlertCircle size={12} />
                <span>Color intensity represents market sentiment strength. Hover over markers for details.</span>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default GeoLocationMap;
