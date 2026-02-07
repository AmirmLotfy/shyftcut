import React, { Component, ErrorInfo, ReactNode } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { captureException } from '@/lib/error-tracking';
import Error from '@/pages/Error';
import { LanguageProvider } from '@/contexts/LanguageContext';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    // Chunk load failure (404 on lazy-loaded module) – reload with cache-bust to get fresh assets after deploy
    const msg = String(error?.message ?? '');
    if (msg.includes('Failed to fetch dynamically imported module') || msg.includes('Loading chunk') || msg.includes('ChunkLoadError')) {
      const url = new URL(window.location.href);
      url.searchParams.set('_refresh', String(Date.now()));
      window.location.replace(url.toString());
      return { hasError: false, error: null };
    }
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const msg = String(error?.message ?? '');
    if (msg.includes('Failed to fetch dynamically imported module') || msg.includes('Loading chunk') || msg.includes('ChunkLoadError')) {
      return; // Already triggered reload in getDerivedStateFromError
    }
    console.error('ErrorBoundary caught an error:', error?.message ?? String(error), error?.stack, errorInfo);
    captureException(error);
  }

  private resetError = () => {
    this.setState({ hasError: false, error: null });
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }
      return (
        <BrowserRouter>
          <LanguageProvider>
            <Error error={this.state.error || undefined} resetError={this.resetError} />
          </LanguageProvider>
        </BrowserRouter>
      );
    }

    return this.props.children;
  }
}
