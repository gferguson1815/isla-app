"use client";

import React, { Component, ErrorInfo, ReactNode } from "react";
import { toast } from "sonner";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error?: Error;
  retryCount: number;
}

const MAX_RETRIES = 3;

export class CommandErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, retryCount: 0 };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, retryCount: 0 };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Command execution error:", error, errorInfo);

    // Show user-friendly toast notification
    toast.error("Command execution failed", {
      description: "There was an error executing the command. Please try again.",
      action: {
        label: "Retry",
        onClick: () => this.handleRetry(),
      },
    });

    // Call optional error handler
    this.props.onError?.(error, errorInfo);

    // Log to error reporting service (if configured)
    if (typeof window !== "undefined" && (window as any).gtag) {
      (window as any).gtag("event", "exception", {
        description: `Command Error: ${error.message}`,
        fatal: false,
      });
    }
  }

  handleRetry = () => {
    if (this.state.retryCount < MAX_RETRIES) {
      this.setState(prevState => ({
        hasError: false,
        error: undefined,
        retryCount: prevState.retryCount + 1,
      }));
    } else {
      toast.error("Maximum retries exceeded", {
        description: "Please refresh the page or contact support if the issue persists.",
      });
    }
  };

  handleReset = () => {
    this.setState({ hasError: false, error: undefined, retryCount: 0 });
  };

  render() {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      return (
        <Alert variant="destructive" className="m-4">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Command Execution Error</AlertTitle>
          <AlertDescription className="mt-2">
            <p className="mb-3">
              Something went wrong while executing the command.
              {this.state.error?.message && (
                <span className="block text-xs text-muted-foreground mt-1">
                  Error: {this.state.error.message}
                </span>
              )}
            </p>
            <div className="flex gap-2">
              {this.state.retryCount < MAX_RETRIES ? (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={this.handleRetry}
                  className="h-8"
                >
                  <RefreshCw className="h-3 w-3 mr-1" />
                  Retry ({MAX_RETRIES - this.state.retryCount} left)
                </Button>
              ) : (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={this.handleReset}
                  className="h-8"
                >
                  <RefreshCw className="h-3 w-3 mr-1" />
                  Reset
                </Button>
              )}
            </div>
          </AlertDescription>
        </Alert>
      );
    }

    return this.props.children;
  }
}

// Hook for easier usage in functional components
export const useCommandErrorHandler = () => {
  const handleCommandError = (error: Error, context?: string) => {
    console.error(`Command error${context ? ` in ${context}` : ""}:`, error);

    toast.error("Command failed", {
      description: error.message || "An unexpected error occurred.",
    });

    // Report to analytics
    if (typeof window !== "undefined" && (window as any).gtag) {
      (window as any).gtag("event", "command_error", {
        error_message: error.message,
        context: context || "unknown",
      });
    }
  };

  return { handleCommandError };
};