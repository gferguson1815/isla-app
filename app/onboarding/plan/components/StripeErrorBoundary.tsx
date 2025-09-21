"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { AlertCircle, RefreshCw } from "lucide-react";

interface StripeErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

interface StripeErrorBoundaryProps {
  children: React.ReactNode;
  onRetry?: () => void;
}

export class StripeErrorBoundary extends React.Component<
  StripeErrorBoundaryProps,
  StripeErrorBoundaryState
> {
  constructor(props: StripeErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): StripeErrorBoundaryState {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Stripe checkout error:", error, errorInfo);

    // Report error to monitoring service if available
    if (typeof window !== "undefined" && (window as unknown as { analytics?: unknown }).analytics) {
      ((window as unknown as { analytics: { track: (event: string, data: Record<string, unknown>) => void } }).analytics).track("Stripe Checkout Error", {
        error: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack,
      });
    }
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined });
    this.props.onRetry?.();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center p-8 text-center bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 bg-red-100 rounded-full">
            <AlertCircle className="w-6 h-6 text-red-600" />
          </div>

          <h3 className="mb-2 text-lg font-semibold text-red-900">
            Payment Setup Error
          </h3>

          <p className="mb-4 text-sm text-red-700 max-w-md">
            We encountered an issue setting up your payment. This might be a temporary problem with our payment provider.
          </p>

          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              onClick={this.handleRetry}
              variant="default"
              className="flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Try Again
            </Button>

            <Button
              onClick={() => window.location.reload()}
              variant="outline"
              className="text-red-700 border-red-300 hover:bg-red-50"
            >
              Refresh Page
            </Button>
          </div>

          <details className="mt-6 text-xs text-red-600">
            <summary className="cursor-pointer hover:text-red-800">
              Technical Details
            </summary>
            <pre className="mt-2 text-left bg-red-100 p-2 rounded text-xs overflow-auto max-w-md">
              {this.state.error?.message}
            </pre>
          </details>
        </div>
      );
    }

    return this.props.children;
  }
}