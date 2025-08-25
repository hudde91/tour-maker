import React from "react";

type Props = {
  children: React.ReactNode;
  /** Valfri fallback. Om ej satt används en enkel standardvy. */
  fallback?: React.ReactNode;
  /** Anropas när ett fel fångas. */
  onError?: (error: Error, info: React.ErrorInfo) => void;
  /** När denna ändras återställs boundaryn automatiskt. */
  resetKey?: unknown;
};

type State = {
  hasError: boolean;
  error?: Error | null;
};

export default class ErrorBoundary extends React.Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    this.props.onError?.(error, info);
    // Här kan man lägga in valfri logging (Sentry etc) senare
    // console.error("ErrorBoundary caught:", error, info);
  }

  componentDidUpdate(prevProps: Props) {
    // Reset om resetKey ändras (t.ex. vid route-byten)
    if (prevProps.resetKey !== this.props.resetKey && this.state.hasError) {
      this.setState({ hasError: false, error: null });
    }
  }

  private handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    if (this.props.fallback) return this.props.fallback;

    // Standard-fallback (ren, matchar appens stil)
    return (
      <div className="p-4">
        <div className="rounded-xl border bg-white shadow-sm p-4">
          <div className="text-base font-semibold text-slate-900">
            Something went wrong
          </div>
          <p className="text-sm text-slate-600 mt-1">
            An unexpected error occurred. You can try again.
          </p>

          {this.state.error?.message && (
            <pre className="mt-3 text-xs text-red-700 bg-red-50 border border-red-100 rounded-md p-2 overflow-auto">
              {this.state.error.message}
            </pre>
          )}

          <div className="mt-3">
            <button
              onClick={this.handleRetry}
              className="inline-flex items-center rounded-md border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-900 shadow-sm hover:bg-slate-50"
            >
              Try again
            </button>
          </div>
        </div>
      </div>
    );
  }
}
