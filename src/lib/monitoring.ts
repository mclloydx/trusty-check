// Performance Monitoring and Error Tracking System
import React from 'react';

interface PerformanceMetric {
  name: string;
  value: number;
  timestamp: number;
  tags?: Record<string, string>;
}

interface ErrorEvent {
  message: string;
  stack?: string;
  timestamp: number;
  userId?: string;
  url: string;
  userAgent: string;
  tags?: Record<string, string>;
  context?: Record<string, any>;
}

class MonitoringService {
  private metrics: PerformanceMetric[] = [];
  private errors: ErrorEvent[] = [];
  private maxMetrics = 1000;
  private maxErrors = 100;
  private flushInterval: NodeJS.Timeout | null = null;

  constructor() {
    // Start periodic flush to backend
    this.startPeriodicFlush();
    
    // Setup global error handlers
    this.setupGlobalErrorHandlers();
    
    // Setup performance monitoring
    this.setupPerformanceMonitoring();
  }

  private startPeriodicFlush() {
    this.flushInterval = setInterval(() => {
      this.flushMetrics();
      this.flushErrors();
    }, 30000); // Flush every 30 seconds
  }

  private setupGlobalErrorHandlers() {
    // Catch unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.captureError(
        new Error(event.reason?.message || 'Unhandled Promise Rejection'),
        {
          type: 'unhandled_promise_rejection',
          reason: event.reason
        }
      );
    });

    // Catch uncaught errors
    window.addEventListener('error', (event) => {
      this.captureError(event.error || new Error(event.message), {
        type: 'uncaught_error',
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno
      });
    });
  }

  private setupPerformanceMonitoring() {
    // Monitor page load performance
    if ('performance' in window) {
      window.addEventListener('load', () => {
        setTimeout(() => {
          const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
          if (navigation) {
            this.recordMetric('page_load_time', navigation.loadEventEnd - navigation.loadEventStart, {
              page: window.location.pathname
            });
            
            this.recordMetric('dom_content_loaded', navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart);
            this.recordMetric('first_paint', this.getFirstPaint());
            this.recordMetric('first_contentful_paint', this.getFirstContentfulPaint());
          }
        }, 0);
      });
    }

    // Monitor API calls
    this.interceptFetch();
  }

  private getFirstPaint(): number {
    const paintEntries = performance.getEntriesByType('paint');
    const firstPaint = paintEntries.find(entry => entry.name === 'first-paint');
    return firstPaint ? firstPaint.startTime : 0;
  }

  private getFirstContentfulPaint(): number {
    const paintEntries = performance.getEntriesByType('paint');
    const fcp = paintEntries.find(entry => entry.name === 'first-contentful-paint');
    return fcp ? fcp.startTime : 0;
  }

  private interceptFetch() {
    const originalFetch = window.fetch;
    
    window.fetch = async (...args) => {
      const startTime = performance.now();
      const url = args[0] as string;
      
      try {
        const response = await originalFetch(...args);
        const endTime = performance.now();
        const duration = endTime - startTime;
        
        this.recordMetric('api_request_duration', duration, {
          url: url,
          method: args[1]?.method || 'GET',
          status: response.status.toString(),
          success: (response.status < 400).toString()
        });
        
        return response;
      } catch (error) {
        const endTime = performance.now();
        const duration = endTime - startTime;
        
        this.recordMetric('api_request_duration', duration, {
          url: url,
          method: args[1]?.method || 'GET',
          status: 'error',
          success: 'false'
        });
        
        this.captureError(error as Error, {
          type: 'api_error',
          url: url,
          method: args[1]?.method || 'GET'
        });
        
        throw error;
      }
    };
  }

  recordMetric(name: string, value: number, tags?: Record<string, string>) {
    const metric: PerformanceMetric = {
      name,
      value,
      timestamp: Date.now(),
      tags
    };
    
    this.metrics.push(metric);
    
    // Keep only the most recent metrics
    if (this.metrics.length > this.maxMetrics) {
      this.metrics = this.metrics.slice(-this.maxMetrics);
    }
  }

  captureError(error: Error | string, context?: Record<string, any>) {
    const errorEvent: ErrorEvent = {
      message: typeof error === 'string' ? error : error.message,
      stack: typeof error === 'string' ? undefined : error.stack,
      timestamp: Date.now(),
      userId: this.getCurrentUserId(),
      url: window.location.href,
      userAgent: navigator.userAgent,
      tags: context,
      context
    };
    
    this.errors.push(errorEvent);
    
    // Keep only the most recent errors
    if (this.errors.length > this.maxErrors) {
      this.errors = this.errors.slice(-this.maxErrors);
    }
    
    // Also log to console in development
    if (import.meta.env.DEV) {
      console.error('Captured error:', errorEvent);
    }
  }

  private getCurrentUserId(): string | undefined {
    // Try to get user ID from auth context or localStorage
    try {
      const authData = localStorage.getItem('supabase.auth.token');
      if (authData) {
        const parsed = JSON.parse(authData);
        return parsed.user?.id;
      }
    } catch (e) {
      // Ignore errors getting user ID
    }
    return undefined;
  }

  async flushMetrics() {
    if (this.metrics.length === 0) return;
    
    const metricsToSend = [...this.metrics];
    this.metrics = [];
    
    try {
      await this.sendToBackend('/api/metrics', { metrics: metricsToSend });
    } catch (error) {
      // Re-add metrics if send failed
      this.metrics.unshift(...metricsToSend);
      console.error('Failed to flush metrics:', error);
    }
  }

  async flushErrors() {
    if (this.errors.length === 0) return;
    
    const errorsToSend = [...this.errors];
    this.errors = [];
    
    try {
      await this.sendToBackend('/api/errors', { errors: errorsToSend });
    } catch (error) {
      // Re-add errors if send failed
      this.errors.unshift(...errorsToSend);
      console.error('Failed to flush errors:', error);
    }
  }

  private async sendToBackend(endpoint: string, data: any) {
    // In a real implementation, this would send to your monitoring service
    // For now, we'll just log it
    console.log(`Sending to ${endpoint}:`, data);
    
    // Example implementation:
    // const response = await fetch(endpoint, {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify(data)
    // });
    // if (!response.ok) throw new Error('Failed to send data');
  }

  // Manual error capture for React components
  captureReactError(error: Error, errorInfo: any) {
    this.captureError(error, {
      type: 'react_error',
      componentStack: errorInfo.componentStack
    });
  }

  // Performance timing for specific operations
  time<T>(name: string, operation: () => T | Promise<T>, tags?: Record<string, string>): Promise<T> {
    const startTime = performance.now();
    
    const result = operation();
    
    if (result instanceof Promise) {
      return result.then(value => {
        const endTime = performance.now();
        this.recordMetric(name, endTime - startTime, tags);
        return value;
      }).catch(error => {
        const endTime = performance.now();
        this.recordMetric(name, endTime - startTime, { ...tags, success: 'false' });
        this.captureError(error, { operation: name, ...tags });
        throw error;
      });
    } else {
      const endTime = performance.now();
      this.recordMetric(name, endTime - startTime, tags);
      return Promise.resolve(result);
    }
  }

  // Get current metrics for debugging
  getMetrics(): PerformanceMetric[] {
    return [...this.metrics];
  }

  // Get current errors for debugging
  getErrors(): ErrorEvent[] {
    return [...this.errors];
  }

  destroy() {
    if (this.flushInterval) {
      clearInterval(this.flushInterval);
    }
    
    // Flush remaining data
    this.flushMetrics();
    this.flushErrors();
  }
}

// Create singleton instance
export const monitoring = new MonitoringService();

// React Error Boundary component
export class ErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback?: React.ComponentType<{ error: Error; reset: () => void }> },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    monitoring.captureReactError(error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      const FallbackComponent = this.props.fallback;
      
      if (FallbackComponent) {
        return React.createElement(FallbackComponent, { 
          error: this.state.error!, 
          reset: () => this.setState({ hasError: false, error: null }) 
        });
      }
      
      return React.createElement('div', {
        className: "min-h-screen flex items-center justify-center bg-gray-50"
      }, 
        React.createElement('div', {
          className: "max-w-md w-full bg-white shadow-lg rounded-lg p-6"
        }, [
          React.createElement('h2', {
            key: 'title',
            className: "text-2xl font-bold text-red-600 mb-4"
          }, "Something went wrong"),
          React.createElement('p', {
            key: 'description',
            className: "text-gray-600 mb-4"
          }, "An unexpected error occurred. The error has been logged and our team will investigate."),
          React.createElement('button', {
            key: 'button',
            onClick: () => this.setState({ hasError: false, error: null }),
            className: "w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 transition-colors"
          }, "Try Again")
        ])
      );
    }

    return this.props.children;
  }
}

// Performance monitoring hook for React
export function usePerformanceMonitor(componentName: string) {
  const renderStart = React.useRef<number>();
  
  React.useEffect(() => {
    renderStart.current = performance.now();
    
    return () => {
      if (renderStart.current) {
        const renderTime = performance.now() - renderStart.current;
        monitoring.recordMetric('react_render_time', renderTime, {
          component: componentName
        });
      }
    };
  });
  
  const measureOperation = React.useCallback(<T>(name: string, operation: () => T | Promise<T>, tags?: Record<string, string>) => {
    return monitoring.time(`${componentName}.${name}`, operation, tags);
  }, [componentName]);
  
  return { measureOperation };
}
