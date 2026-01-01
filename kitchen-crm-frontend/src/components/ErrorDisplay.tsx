// Error Display Component
// This will show any stored errors on the login page or display error messages with retry functionality

import React, { useState, useEffect } from 'react';
import { Button } from './ui/Button';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface ErrorInfo {
  type: string;
  message: string;
  error: string;
  timestamp: string;
  data?: any;
  details?: any;
}

interface ErrorDisplayProps {
  error?: string;
  onRetry?: () => void;
}

export const ErrorDisplay: React.FC<ErrorDisplayProps> = ({ error, onRetry }) => {
  const [storedError, setStoredError] = useState<ErrorInfo | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Check for stored errors
    const storedErrorData = localStorage.getItem('auth-error');
    if (storedErrorData) {
      try {
        const errorInfo = JSON.parse(storedErrorData);
        setStoredError(errorInfo);
        setIsVisible(true);
        console.error('🚨 Displaying stored error:', errorInfo);
      } catch (parseError) {
        console.error('❌ Failed to parse stored error:', parseError);
      }
    }
  }, []);

  const clearError = () => {
    localStorage.removeItem('auth-error');
    setStoredError(null);
    setIsVisible(false);
  };

  // If props are provided, show the error message with retry functionality
  if (error) {
    return (
      <div className="p-6 bg-red-500/10 border border-red-500/20 rounded-lg">
        <div className="flex items-center gap-3 mb-3">
          <AlertTriangle className="h-5 w-5 text-red-500" />
          <h3 className="text-lg font-semibold text-red-500">Error</h3>
        </div>
        <p className="text-white-700 mb-4">{error}</p>
        {onRetry && (
          <Button
            onClick={onRetry}
            variant="outline"
            className="flex items-center gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Try Again
          </Button>
        )}
      </div>
    );
  }

  // Show stored error (existing functionality)
  if (!isVisible || !storedError) return null;

  return (
    <div style={{
      position: 'fixed',
      top: '20px',
      right: '20px',
      background: '#dc2626',
      color: 'white',
      padding: '16px',
      borderRadius: '8px',
      maxWidth: '400px',
      zIndex: 9999,
      boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
        <h4 style={{ margin: 0, fontSize: '16px', fontWeight: 'bold' }}>Authentication Error</h4>
        <button 
          onClick={clearError}
          style={{
            background: 'none',
            border: 'none',
            color: 'white',
            fontSize: '18px',
            cursor: 'pointer',
            padding: '0',
            marginLeft: '8px'
          }}
        >
          ×
        </button>
      </div>
      
      <div style={{ fontSize: '14px', marginBottom: '8px' }}>
        <strong>Type:</strong> {storedError.type}
      </div>
      
      <div style={{ fontSize: '14px', marginBottom: '8px' }}>
        <strong>Message:</strong> {storedError.message}
      </div>
      
      <div style={{ fontSize: '14px', marginBottom: '8px' }}>
        <strong>Error:</strong> {storedError.error}
      </div>
      
      <div style={{ fontSize: '12px', opacity: 0.8, marginBottom: '8px' }}>
        <strong>Time:</strong> {new Date(storedError.timestamp).toLocaleString()}
      </div>
      
      {storedError.data && (
        <details style={{ fontSize: '12px', marginTop: '8px' }}>
          <summary style={{ cursor: 'pointer', marginBottom: '4px' }}>Additional Data</summary>
          <pre style={{ 
            background: 'rgba(0,0,0,0.2)', 
            padding: '8px', 
            borderRadius: '4px', 
            overflow: 'auto',
            maxHeight: '200px',
            fontSize: '11px'
          }}>
            {JSON.stringify(storedError.data, null, 2)}
          </pre>
        </details>
      )}
      
      <button 
        onClick={clearError}
        style={{
          background: 'rgba(255,255,255,0.2)',
          border: '1px solid rgba(255,255,255,0.3)',
          color: 'white',
          padding: '6px 12px',
          borderRadius: '4px',
          cursor: 'pointer',
          fontSize: '12px',
          marginTop: '8px'
        }}
      >
        Dismiss
      </button>
    </div>
  );
};
