import { useEffect, useRef } from 'react';

interface TradingViewChartProps {
  symbol?: string;
  interval?: string;
  theme?: 'light' | 'dark';
  height?: string;
  width?: string;
}

const TradingViewChart = ({ 
  symbol = 'NASDAQ:AAPL',
  interval = 'D',
  theme = 'dark',
  height = '100%',
  width = '100%'
}: TradingViewChartProps) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Clear any existing content
    containerRef.current.innerHTML = '';

    // Generate a unique ID for this widget instance
    const widgetId = `tradingview_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Create the widget container with proper structure
    const widgetHTML = `
      <div class="tradingview-widget-container" style="height:${height};width:${width}">
        <div id="${widgetId}" class="tradingview-widget-container__widget" style="height:calc(100% - 32px);width:100%"></div>
        <div class="tradingview-widget-copyright">
          <a href="https://www.tradingview.com/" rel="noopener nofollow" target="_blank">
            <span class="blue-text">Track all markets on TradingView</span>
          </a>
        </div>
      </div>
    `;

    containerRef.current.innerHTML = widgetHTML;

    // Load TradingView script if not already loaded
    const loadTradingViewWidget = () => {
      // Check if TradingView is available
      if (typeof window !== 'undefined') {
        // Create script element for the widget
        const script = document.createElement('script');
        script.type = 'text/javascript';
        script.async = true;
        script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js';
        
        // Widget configuration
        const config = {
          "autosize": true,
          "symbol": symbol,
          "interval": interval,
          "timezone": "Etc/UTC",
          "theme": theme,
          "style": "1",
          "locale": "en",
          "allow_symbol_change": true,
          "support_host": "https://www.tradingview.com",
          "container_id": widgetId
        };

        script.innerHTML = JSON.stringify(config);
        
        // Append script to the widget container
        const widgetContainer = containerRef.current?.querySelector('.tradingview-widget-container');
        if (widgetContainer) {
          widgetContainer.appendChild(script);
        }
      }
    };

    // Add delay to ensure DOM is ready
    const timeoutId = setTimeout(loadTradingViewWidget, 100);

    return () => {
      clearTimeout(timeoutId);
      if (containerRef.current) {
        containerRef.current.innerHTML = '';
      }
    };
  }, [symbol, interval, theme, height, width]);

  return (
    <div 
      ref={containerRef}
      className="w-full h-full bg-gray-900 rounded-lg overflow-hidden"
      style={{ minHeight: '400px' }}
    />
  );
};

export default TradingViewChart;