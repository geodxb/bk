import { useEffect, useRef } from 'react';

declare global {
  interface Window {
    TradingView: any;
  }
}

interface TradingViewWidgetProps {
  symbol?: string;
  width?: number;
  height?: number;
  colorTheme?: 'light' | 'dark';
}

const TradingViewWidget = ({ 
  symbol = 'BINANCE:BTCUSDT',
  width = 800, 
  height = 400,
  colorTheme = 'light'
}: TradingViewWidgetProps) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const loadTradingViewChart = () => {
      if (!containerRef.current) return;

      // Clear any existing content
      containerRef.current.innerHTML = '';

      // Create unique container ID
      const containerId = `tradingview_${Math.random().toString(36).substr(2, 9)}`;

      // Create the widget container with unique ID
      const widgetContainer = document.createElement('div');
      widgetContainer.id = containerId;
      widgetContainer.className = 'tradingview-widget-container__widget';
      
      // Create the script element
      const script = document.createElement('script');
      script.type = 'text/javascript';
      script.async = true;
      
      // Configuration for advanced chart
      const config = {
        "autosize": false,
        "symbol": symbol,
        "interval": "D",
        "timezone": "Etc/UTC",
        "theme": colorTheme,
        "style": "1",
        "locale": "en",
        "enable_publishing": false,
        "allow_symbol_change": true,
        "calendar": false,
        "support_host": "https://www.tradingview.com",
        "width": width,
        "height": height,
        "container_id": containerId
      };

      // Create script content that calls TradingView widget constructor
      script.textContent = `new TradingView.widget(${JSON.stringify(config)});`;

      // Create copyright div
      const copyrightDiv = document.createElement('div');
      copyrightDiv.className = 'tradingview-widget-copyright';
      copyrightDiv.innerHTML = '<a href="https://www.tradingview.com/" rel="noopener nofollow" target="_blank"><span class="blue-text">Track all markets on TradingView</span></a>';

      // Append elements to container
      containerRef.current.appendChild(widgetContainer);
      containerRef.current.appendChild(copyrightDiv);
      containerRef.current.appendChild(script);
    };

    // Poll for TradingView.widget constructor availability
    const checkTradingViewWidget = () => {
      if (window.TradingView && typeof window.TradingView.widget === 'function') {
        loadTradingViewChart();
        return;
      }
      
      // Continue polling every 100ms until constructor is available
      setTimeout(checkTradingViewWidget, 100);
    };

    // Start polling after a short delay
    const timer = setTimeout(checkTradingViewWidget, 500);

    return () => {
      clearTimeout(timer);
    };
  }, [symbol, width, height, colorTheme]);

  return (
    <div className="w-full">
      <div 
        ref={containerRef}
        className="tradingview-widget-container"
        style={{ 
          width: '100%',
          height: `${height}px`,
          minHeight: `${height}px`,
          borderRadius: '8px',
          overflow: 'hidden'
        }}
      />
    </div>
  );
};

export default TradingViewWidget;