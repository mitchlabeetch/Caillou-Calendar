import { Component, type ErrorInfo, type ReactNode } from 'react';
import { reportError } from '../lib/errorReporting';

interface ErrorBoundaryProps {
  /** Optional label shown in the error UI; useful when nesting boundaries. */
  label?: string;
  /** Optional fallback UI. Defaults to a neo-brutalist friendly card. */
  fallback?: (error: Error, reset: () => void) => ReactNode;
  children: ReactNode;
}

interface ErrorBoundaryState {
  error: Error | null;
}

/**
 * Catches render-time errors anywhere in the tree below and renders a
 * fallback UI instead of blanking the whole app. Two are mounted by
 * default: one in `main.tsx` for catastrophic failures, and one in
 * `App.tsx` around the calendar so a bug in a modal cannot wipe the
 * shell.
 *
 * Each boundary also forwards the caught error to the host error
 * reporter (Sentry when `VITE_SENTRY_DSN` is configured, console
 * otherwise).
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    // eslint-disable-next-line no-console
    console.error(`[ErrorBoundary${this.props.label ? ` · ${this.props.label}` : ''}]`, error, info);
    void reportError(error, {
      tags: { boundary: this.props.label ?? 'root' },
      extra: { componentStack: info.componentStack ?? '' },
    });
  }

  reset = (): void => {
    this.setState({ error: null });
  };

  render(): ReactNode {
    const { error } = this.state;
    if (!error) return this.props.children;
    if (this.props.fallback) return this.props.fallback(error, this.reset);

    return (
      <div
        role="alert"
        aria-live="assertive"
        className="flex flex-col items-center justify-center gap-4 p-8 m-6 bg-surface border-[4px] border-ink shadow-neo rounded-2xl"
      >
        <h2 className="text-2xl font-bold text-ink">
          {this.props.label ? `${this.props.label} crashed` : 'Something went wrong'}
        </h2>
        <pre className="max-w-xl whitespace-pre-wrap break-words text-sm text-ink/80 bg-bg-light border-[3px] border-ink p-3 rounded-lg">
          {error.message}
        </pre>
        <button
          type="button"
          onClick={this.reset}
          className="px-4 py-2 bg-primary text-white font-bold border-[3px] border-ink shadow-neo hover:-translate-y-0.5 active:translate-y-0.5 transition-transform"
        >
          Try again
        </button>
      </div>
    );
  }
}