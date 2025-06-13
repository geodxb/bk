import { useEffect, useRef } from 'react';

interface TradingViewMarketOverviewProps {
  width?: number;
  height?: number;
  colorTheme?: 'light' | 'dark';
  backgroundColor?: string;
}

declare global {
  interface Window {
    TradingView: any;
  }
}

const TradingViewMarketOverview = ({ 
  width = 550, 
  height = 550, 
  colorTheme = 'dark',
  backgroundColor = '#131722'
}: TradingViewMarketOverviewProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const scriptLoadedRef = useRef(false);

  useEffect(() => {
    if (!containerRef.current) return;

    const loadTradingViewWidget = () => {
      if (!containerRef.current) return;

      // Clear any existing content
      containerRef.current.innerHTML = '';

      // Create the widget container structure
      const widgetDiv = document.createElement('div');
      widgetDiv.className = 'tradingview-widget-container__widget';
      containerRef.current.appendChild(widgetDiv);

      // Create copyright div
      const copyrightDiv = document.createElement('div');
      copyrightDiv.className = 'tradingview-widget-copyright';
      copyrightDiv.innerHTML = '<a href="https://www.tradingview.com/" rel="noopener nofollow" target="_blank"><span style="color: #3b82f6;">Track all markets on TradingView</span></a>';
      containerRef.current.appendChild(copyrightDiv);

      // Widget configuration exactly as provided
      const config = {
        "width": width,
        "height": height,
        "symbolsGroups": [
          {
            "name": "Indices",
            "originalName": "Indices",
            "symbols": [
              {
                "name": "BITSTAMP:BTCUSD",
                "displayName": "BTC/USD"
              },
              {
                "name": "FOREXCOM:XAUUSD",
                "displayName": "XAU/USD"
              },
              {
                "name": "BINANCE:BTCUSDT",
                "displayName": "BTC/USDT"
              }
            ]
          },
          {
            "name": "Forex",
            "originalName": "Forex",
            "symbols": [
              {
                "name": "FX:EURUSD",
                "displayName": "EUR to USD"
              },
              {
                "name": "FX:GBPUSD",
                "displayName": "GBP to USD"
              },
              {
                "name": "FX:USDJPY",
                "displayName": "USD to JPY"
              },
              {
                "name": "FX:USDCHF",
                "displayName": "USD to CHF"
              },
              {
                "name": "FX:AUDUSD",
                "displayName": "AUD to USD"
              },
              {
                "name": "FX:USDCAD",
                "displayName": "USD to CAD"
              }
            ]
          },
          {
            "name": "Futures",
            "originalName": "Futures",
            "symbols": [
              {
                "name": "BMFBOVESPA:ISP1!",
                "displayName": "S&P 500 Index Futures"
              },
              {
                "name": "BMFBOVESPA:EUR1!",
                "displayName": "Euro Futures"
              },
              {
                "name": "PYTH:WTI3!",
                "displayName": "WTI CRUDE OIL"
              },
              {
                "name": "BMFBOVESPA:ETH1!",
                "displayName": "Hydrous ethanol"
              },
              {
                "name": "BMFBOVESPA:CCM1!",
                "displayName": "Corn"
              }
            ]
          },
          {
            "name": "Bonds",
            "originalName": "Bonds",
            "symbols": [
              {
                "name": "EUREX:FGBL1!",
                "displayName": "Euro Bund"
              },
              {
                "name": "EUREX:FBTP1!",
                "displayName": "Euro BTP"
              },
              {
                "name": "EUREX:FGBM1!",
                "displayName": "Euro BOBL"
              }
            ]
          }
        ],
        "showSymbolLogo": true,
        "isTransparent": false,
        "colorTheme": colorTheme,
        "locale": "en",
        "backgroundColor": backgroundColor
      };

      // Create and load the script
      const script = document.createElement('script');
      script.type = 'text/javascript';
      script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-market-quotes.js';
      script.async = true;
      script.text = JSON.stringify(config);

      // Append script to the widget container
      containerRef.current.appendChild(script);
    };

    // Load the widget immediately
    loadTradingViewWidget();

    // Cleanup function
    return () => {
      if (containerRef.current) {
        containerRef.current.innerHTML = '';
      }
    };
  }, [width, height, colorTheme, backgroundColor]);

  return (
    <div className="w-full flex justify-center">
      <div 
        ref={containerRef} 
        className="tradingview-widget-container"
        style={{ 
          width: `${width}px`, 
          height: `${height}px`,
          minHeight: `${height}px`
        }}
      />
    </div>
  );
};

export default TradingViewMarketOverview;