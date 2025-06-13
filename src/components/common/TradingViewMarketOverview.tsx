import { useEffect, useRef } from 'react';

declare global {
  interface Window {
    TradingView: any;
  }
}

interface TradingViewMarketOverviewProps {
  width?: number;
  height?: number;
  colorTheme?: 'light' | 'dark';
  backgroundColor?: string;
}

const TradingViewMarketOverview = ({ 
  width = 800, 
  height = 500, 
  colorTheme = 'dark',
  backgroundColor = '#131722'
}: TradingViewMarketOverviewProps) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const loadTradingViewWidget = () => {
      if (!containerRef.current) return;

      // Clear any existing content
      containerRef.current.innerHTML = '';

      // Create unique container ID
      const containerId = `tradingview_market_${Math.random().toString(36).substr(2, 9)}`;

      // Create the widget container with unique ID
      const widgetContainer = document.createElement('div');
      widgetContainer.id = containerId;
      widgetContainer.className = 'tradingview-widget-container__widget';
      
      // Create the script element
      const script = document.createElement('script');
      script.type = 'text/javascript';
      script.async = true;
      
      // Configuration object
      const config = {
        "width": width,
        "height": height,
        "symbolsGroups": [
          {
            "name": "Crypto",
            "originalName": "Crypto",
            "symbols": [
              {
                "name": "BINANCE:BTCUSDT",
                "displayName": "Bitcoin"
              },
              {
                "name": "BINANCE:ETHUSDT", 
                "displayName": "Ethereum"
              },
              {
                "name": "BINANCE:ADAUSDT",
                "displayName": "Cardano"
              }
            ]
          },
          {
            "name": "Forex",
            "originalName": "Forex",
            "symbols": [
              {
                "name": "FX:EURUSD",
                "displayName": "EUR/USD"
              },
              {
                "name": "FX:GBPUSD",
                "displayName": "GBP/USD"
              },
              {
                "name": "FX:USDJPY",
                "displayName": "USD/JPY"
              },
              {
                "name": "FX:AUDUSD",
                "displayName": "AUD/USD"
              }
            ]
          },
          {
            "name": "Commodities",
            "originalName": "Commodities", 
            "symbols": [
              {
                "name": "TVC:GOLD",
                "displayName": "Gold"
              },
              {
                "name": "TVC:SILVER",
                "displayName": "Silver"
              },
              {
                "name": "NYMEX:CL1!",
                "displayName": "Crude Oil"
              }
            ]
          },
          {
            "name": "Indices",
            "originalName": "Indices",
            "symbols": [
              {
                "name": "FOREXCOM:SPXUSD",
                "displayName": "S&P 500"
              },
              {
                "name": "FOREXCOM:NSXUSD",
                "displayName": "NASDAQ"
              },
              {
                "name": "FOREXCOM:DJI",
                "displayName": "Dow Jones"
              }
            ]
          }
        ],
        "showSymbolLogo": true,
        "isTransparent": false,
        "colorTheme": colorTheme,
        "locale": "en",
        "backgroundColor": backgroundColor,
        "container_id": containerId
      };

      // Create script content that calls TradingView widget constructor
      script.textContent = `new TradingView.MarketQuotesWidget(${JSON.stringify(config)});`;

      // Create copyright div
      const copyrightDiv = document.createElement('div');
      copyrightDiv.className = 'tradingview-widget-copyright';
      copyrightDiv.innerHTML = '<a href="https://www.tradingview.com/" rel="noopener nofollow" target="_blank"><span class="blue-text">Track all markets on TradingView</span></a>';

      // Append elements to container
      containerRef.current.appendChild(widgetContainer);
      containerRef.current.appendChild(copyrightDiv);
      containerRef.current.appendChild(script);
    };

    // Load TradingView library first, then initialize widget
    const loadScript = () => {
      if (window.TradingView) {
        loadTradingViewWidget();
        return;
      }

      const tvScript = document.createElement('script');
      tvScript.src = 'https://s3.tradingview.com/tv.js';
      tvScript.async = true;
      tvScript.onload = () => {
        setTimeout(loadTradingViewWidget, 100);
      };
      document.head.appendChild(tvScript);
    };

    const timer = setTimeout(loadScript, 500);

    return () => {
      clearTimeout(timer);
    };
  }, [width, height, colorTheme, backgroundColor]);

  return (
    <div className="w-full">
      <div 
        ref={containerRef}
        className="tradingview-widget-container"
        style={{ 
          width: '100%',
          height: `${height}px`,
          minHeight: `${height}px`,
          backgroundColor: backgroundColor,
          borderRadius: '8px',
          overflow: 'hidden'
        }}
      />
    </div>
  );
};

export default TradingViewMarketOverview;