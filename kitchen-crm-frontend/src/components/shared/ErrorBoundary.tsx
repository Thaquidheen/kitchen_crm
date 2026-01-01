/**
 * ErrorBoundary Component
 * Catches and displays React errors gracefully
 */

import { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import Button from '../ui/Button';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.setState({
      error,
      errorInfo,
    });
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen bg-background-900 flex items-center justify-center p-8">
          <div className="max-w-2xl w-full gradient-card p-8 rounded-lg border-2 border-error">
            <div className="flex flex-col items-center text-center gap-4">
              <AlertTriangle size={64} className="text-error" />
              <h1 className="text-3xl font-heading font-bold text-text-900">
                Something went wrong
              </h1>
              <p className="text-text-700">
                We're sorry, but something unexpected happened. Please try refreshing
                the page or contact support if the problem persists.
              </p>

              {import.meta.env.MODE === 'development' && this.state.error && (
                <details className="w-full mt-4 text-left">
                  <summary className="cursor-pointer text-text-800 font-medium mb-2">
                    Error Details (Development Only)
                  </summary>
                  <pre className="bg-background-800 p-4 rounded text-sm text-error overflow-auto max-h-64">
                    {this.state.error.toString()}
                    {'\n\n'}
                    {this.state.errorInfo?.componentStack}
                  </pre>
                </details>
              )}

              <div className="flex gap-2 mt-4">
                <Button variant="ghost" onClick={() => window.location.reload()}>
                  <RefreshCw size={18} />
                  Reload Page
                </Button>
                <Button onClick={this.handleReset}>Try Again</Button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
