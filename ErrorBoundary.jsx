import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

// ==========================================
// Error Boundary Component - Catches rendering errors
// ==========================================
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null, 
      errorInfo: null,
      errorCount: 0
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    this.setState(prevState => ({
      error,
      errorInfo,
      errorCount: prevState.errorCount + 1
    }));
    
    // Log error details to console for debugging
    console.error('React Error Boundary caught an error:', error);
    console.error('Error Info:', errorInfo);
  }

  handleReset = () => {
    this.setState({ 
      hasError: false, 
      error: null, 
      errorInfo: null 
    });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8">
            <div className="flex justify-center mb-4">
              <div className="bg-red-100 rounded-full p-4">
                <AlertCircle className="w-8 h-8 text-red-600" />
              </div>
            </div>
            
            <h1 className="text-2xl font-bold text-center text-neutral-900 mb-2">
              Oops! Something went wrong
            </h1>
            
            <p className="text-center text-neutral-600 mb-6">
              We encountered an unexpected error. Please try refreshing the page or contact support.
            </p>

            {process.env.NODE_ENV === 'development' && this.state.error && (
              <div className="mb-6 p-4 bg-red-50 rounded-lg border border-red-200">
                <p className="text-sm font-mono text-red-700 break-all">
                  {this.state.error.toString()}
                </p>
                {this.state.errorInfo && (
                  <details className="mt-2 text-xs">
                    <summary className="cursor-pointer text-red-600 font-semibold">
                      Error Details (Dev Only)
                    </summary>
                    <pre className="mt-2 text-red-600 overflow-auto max-h-40 bg-white p-2 rounded">
                      {this.state.errorInfo.componentStack}
                    </pre>
                  </details>
                )}
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={this.handleReset}
                className="flex-1 bg-primary-500 hover:bg-primary-600 text-white font-semibold py-3 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Try Again
              </button>
              
              <button
                onClick={() => window.location.href = '/'}
                className="flex-1 border-2 border-primary-500 text-primary-600 hover:bg-primary-50 font-semibold py-3 rounded-lg transition-colors duration-200"
              >
                Go Home
              </button>
            </div>

            <p className="text-center text-xs text-neutral-500 mt-6">
              Error Count: {this.state.errorCount}
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
