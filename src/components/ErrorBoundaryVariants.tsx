import React from 'react';
import { ErrorBoundary } from '@/components/ErrorBoundary';

/**
 * Async Error Boundary
 * Catches errors from async operations and promises
 */
export class AsyncErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback?: React.ReactNode },
  { error: Error | null }
> {
  constructor(props: any) {
    super(props);
    this.state = { error: null };
  }

  componentDidMount() {
    // Catch unhandled promise rejections
    window.addEventListener('unhandledrejection', this.handlePromiseRejection);
  }

  componentWillUnmount() {
    window.removeEventListener('unhandledrejection', this.handlePromiseRejection);
  }

  handlePromiseRejection = (event: PromiseRejectionEvent) => {
    event.preventDefault();
    this.setState({ error: new Error(event.reason) });
  };

  render() {
    if (this.state.error) {
      return (
        <ErrorBoundary level="component">
          {this.props.children}
        </ErrorBoundary>
      );
    }

    return this.props.children;
  }
}

/**
 * Query Error Boundary
 * Specialized error boundary for React Query errors
 */
export const QueryErrorBoundary: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <ErrorBoundary
      level="component"
      onError={(error) => {
        console.error('Query error:', error);
      }}
    >
      {children}
    </ErrorBoundary>
  );
};

/**
 * Route Error Boundary
 * Wraps route components with error boundary
 */
export const RouteErrorBoundary: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <ErrorBoundary level="route">
      {children}
    </ErrorBoundary>
  );
};
