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

    // Generate a unique widget ID to prevent conflicts
    const widgetId = `tradingview_widget_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Generate a unique widget ID to prevent conflicts
    const widgetId = `tradingview_widget_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Clear any existing content
    containerRef.current.innerHTML = '';

    // Create the widget container
    const widgetContainer = document.createElement('div');
    widgetContainer.className = 'tradingview-widget-container';
    widgetContainer.style.height = '100%';
    widgetContainer.style.width = '100%';
    widgetContainer.style.height = '100%';
    widgetContainer.style.width = '100%';

    // Create the main widget div
    const widgetDiv = document.createElement('div');
    widgetDiv.className = 'tradingview-widget-container__widget';
    widgetDiv.id = widgetId;
    // Widget configuration
    const config = {
      container_id: widgetId,
      container_id: widgetId,
      symbols,
      showSymbolLogo,
      isTransparent,
      displayMode,
      colorTheme,
      locale,
      width: '100%',
      height: '100%'
      width: '100%',
      height: '100%'
    };

    // Create the script element with error handling
    const script = document.createElement('script');
    script.type = 'text/javascript';
    script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-ticker-tape.js';
    script.async = true;
    
    // Add error handling for script loading
    script.onerror = () => {
      console.warn('TradingView ticker tape widget failed to load');
      if (containerRef.current) {
        containerRef.current.innerHTML = `
          <div class="flex items-center justify-center h-full text-gray-400">
            <div class="text-center">
              <p class="text-sm">Market data temporarily unavailable</p>
            </div>
          </div>
        `;
      }
    };

    // Create the script element with error handling
    const script = document.createElement('script');
    script.type = 'text/javascript';
    script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-ticker-tape.js';
    script.async = true;
    
    // Add error handling for script loading
    script.onerror = () => {
      console.warn('TradingView ticker tape widget failed to load');
      if (containerRef.current) {
        containerRef.current.innerHTML = `
          <div class="flex items-center justify-center h-full text-gray-400">
            <div class="text-center">
              <p class="text-sm">Market data temporarily unavailable</p>
            </div>
          </div>
        `;
      }
    };

    // Set the script content
    script.text = JSON.stringify(config);

    // Assemble the widget (without copyright div)
    widgetContainer.appendChild(widgetDiv);
    widgetContainer.appendChild(script);

    // Add to the container
    containerRef.current.appendChild(widgetContainer);

    // Hide copyright text with CSS after widget loads
    const hideTimeout = setTimeout(() => {
      try {
        const copyrightElements = document.querySelectorAll('.tradingview-widget-copyright');
        copyrightElements.forEach(el => {
          (el as HTMLElement).style.display = 'none';
        });
      } catch (error) {
        console.warn('Could not hide TradingView copyright:', error);
      } catch (error) {
        console.warn('Could not hide TradingView copyright:', error);
      }
    }, 1000);

    // Cleanup function
    return () => {
      clearTimeout(hideTimeout);
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