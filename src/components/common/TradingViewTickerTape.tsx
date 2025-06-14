import { useEffect, useRef } from 'react';

interface TradingViewTickerTapeProps {
  symbols?: Array<{
    proName: string;
    title?: string;
    description?: string;
  }>;
  showSymbolLogo?: boolean;
  isTransparent?: boolean;
  displayMode?: 'adaptive' | 'regular' | 'compact';
  colorTheme?: 'light' | 'dark';
  locale?: string;
}

const TradingViewTickerTape = ({
  symbols = [
    {
      "proName": "FX_IDC:EURUSD",
      "title": "EUR to USD"
    },
    {
      "proName": "BITSTAMP:BTCUSD",
      "title": "Bitcoin"
    },
    {
      "proName": "BITSTAMP:ETHUSD",
      "title": "Ethereum"
    },
    {
      "description": "XAUUSD",
      "proName": "FOREXCOM:XAUUSD"
    },
    {
      "description": "EURUSD",
      "proName": "FX:EURUSD"
    },
    {
      "description": "GBPUSD",
      "proName": "OANDA:GBPUSD"
    }
  ],
  showSymbolLogo = true,
  isTransparent = false,
  displayMode = 'adaptive',
  colorTheme = 'dark',
  locale = 'en'
}: TradingViewTickerTapeProps) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Clear any existing content
    containerRef.current.innerHTML = '';

    // Create the widget container
    const widgetContainer = document.createElement('div');
    widgetContainer.className = 'tradingview-widget-container';

    // Create the main widget div
    const widgetDiv = document.createElement('div');
    widgetDiv.className = 'tradingview-widget-container__widget';

    // Create the script element
    const script = document.createElement('script');
    script.type = 'text/javascript';
    script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-ticker-tape.js';
    script.async = true;

    // Widget configuration
    const config = {
      symbols,
      showSymbolLogo,
      isTransparent,
      displayMode,
      colorTheme,
      locale
    };

    // Set the script content
    script.text = JSON.stringify(config);

    // Assemble the widget (without copyright div)
    widgetContainer.appendChild(widgetDiv);
    widgetContainer.appendChild(script);

    // Add to the container
    containerRef.current.appendChild(widgetContainer);

    // Hide copyright text with CSS after widget loads
    setTimeout(() => {
      const copyrightElements = document.querySelectorAll('.tradingview-widget-copyright');
      copyrightElements.forEach(el => {
        (el as HTMLElement).style.display = 'none';
      });
    }, 2000);

    // Cleanup function
    return () => {
      if (containerRef.current) {
        containerRef.current.innerHTML = '';
      }
    };
  }, [symbols, showSymbolLogo, isTransparent, displayMode, colorTheme, locale]);

  return (
    <div 
      ref={containerRef}
      className="w-full"
      style={{ minHeight: '60px' }}
    />
  );
};

export default TradingViewTickerTape;