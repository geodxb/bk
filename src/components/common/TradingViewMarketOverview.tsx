import { useEffect, useRef } from 'react';

interface TradingViewMarketOverviewProps {
  width?: number;
  height?: number;
  colorTheme?: 'light' | 'dark';
  backgroundColor?: string;
}

const TradingViewMarketOverview = ({ 
  width = 550, 
  height = 550, 
  colorTheme = 'dark',
  backgroundColor = '#131722'
}: TradingViewMarketOverviewProps) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Clear any existing content
    containerRef.current.innerHTML = '';

    // Create the widget container
    const widgetContainer = document.createElement('div');
    widgetContainer.className = 'tradingview-widget-container__widget';
    containerRef.current.appendChild(widgetContainer);

    // Create the copyright div
    const copyrightDiv = document.createElement('div');
    copyrightDiv.className = 'tradingview-widget-copyright';
    copyrightDiv.innerHTML = '<a href="https://www.tradingview.com/" rel="noopener nofollow" target="_blank"><span class="blue-text">Track all markets on TradingView</span></a>';
    containerRef.current.appendChild(copyrightDiv);

    // Create and configure the script
    const script = document.createElement('script');
    script.type = 'text/javascript';
    script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-market-quotes.js';
    script.async = true;
    
    // Widget configuration from your embed code
    script.innerHTML = JSON.stringify({
      "width": width,
      "height": height,
      "symbolsGroups": [
        {
          "name": "Indices",
          "originalName": "Indices",
          "symbols": [
            {
              "name": "BINANCE:BTCUSDT",
              "displayName": "BTC/USDT"
            },
            {
              "name": "FOREXCOM:XAUUSD",
              "displayName": "XAU/USD"
            },
            {
              "name": "BITSTAMP:BTCUSD",
              "displayName": "BTC/USD"
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
    });

    containerRef.current.appendChild(script);

    // Cleanup function
    return () => {
      if (containerRef.current) {
        containerRef.current.innerHTML = '';
      }
    };
  }, [width, height, colorTheme, backgroundColor]);

  return (
    <div 
      ref={containerRef} 
      className="tradingview-widget-container w-full h-full"
      style={{ minHeight: `${height}px` }}
    />
  );
};

export default TradingViewMarketOverview;