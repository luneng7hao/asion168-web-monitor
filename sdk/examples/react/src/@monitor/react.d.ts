declare module '@monitor/react' {
  import { Component, ErrorInfo, ReactNode } from 'react';
  
  export interface MonitorConfig {
    apiUrl: string;
    projectId: string;
    userId?: string;
    enableError?: boolean;
    enablePerformance?: boolean;
    enableBehavior?: boolean;
    enableApi?: boolean;
    sampleRate?: number;
  }

  export interface ErrorBoundaryProps {
    children: ReactNode;
    fallback?: ReactNode | ((error: Error, errorInfo: ErrorInfo) => ReactNode);
    onError?: (error: Error, errorInfo: ErrorInfo) => void;
  }

  export class ErrorBoundary extends Component<ErrorBoundaryProps, {
    hasError: boolean;
    error: Error | null;
    errorInfo: ErrorInfo | null;
  }> {}

  export interface ReactMonitor {
    init(config: MonitorConfig): void;
    reportError(error: any): void;
    captureError(error: Error, context?: any): void;
    track(event: string, data?: any): void;
    trackRouteChange(from: string, to: string, data?: any): void;
    trackBehavior(type: string, data?: any): void;
    trackPerformance(data: any): void;
  }

  const monitor: ReactMonitor;
  export default monitor;
}

