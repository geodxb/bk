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

    // Generate a unique ID for this widget instance
    const widgetId = `tradingview_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Clear any existing content
    containerRef.current.innerHTML = '';

    // Create the widget container
    const widgetContainer = document.createElement('div');
    widgetContainer.className = 'tradingview-widget-container';
    widgetContainer.style.height = height;
    widgetContainer.style.width = width;

    // Create the main widget div
    const widgetDiv = document.createElement('div');
    widgetDiv.id = widgetId;
    widgetDiv.className = 'tradingview-widget-container__widget';
    widgetDiv.style.height = '100%';
    widgetDiv.style.width = '100%';

    // Create the script element
    const script = document.createElement('script');
    script.type = 'text/javascript';
    script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js';
    script.async = true;

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
      "container_id": widgetId,
      "hide_top_toolbar": false,
      "hide_legend": false,
      "save_image": false
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