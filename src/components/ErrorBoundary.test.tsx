import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ErrorBoundary } from './ErrorBoundary';

function Bomb({ throwOn }: { throwOn?: boolean }) {
  if (throwOn) throw new Error('💥 kaboom');
  return <div>safe</div>;
}

describe('ErrorBoundary', () => {
  it('renders children when there is no error', () => {
    render(
      <ErrorBoundary>
        <Bomb />
      </ErrorBoundary>,
    );
    expect(screen.getByText('safe')).toBeTruthy();
  });

  it('renders a fallback when a child throws', () => {
    // suppress the console error from React so the test output is clean
    const consoleError = console.error;
    console.error = () => {};
    render(
      <ErrorBoundary label="test">
        <Bomb throwOn />
      </ErrorBoundary>,
    );
    expect(screen.getByRole('alert')).toBeTruthy();
    expect(screen.getByText(/test crashed/i)).toBeTruthy();
    expect(screen.getByText('💥 kaboom')).toBeTruthy();
    console.error = consoleError;
  });

  it('recovers when "Try again" is clicked', () => {
    const consoleError = console.error;
    console.error = () => {};
    let shouldThrow = true;
    function Toggleable() {
      if (shouldThrow) throw new Error('boom');
      return <div>recovered</div>;
    }
    const { rerender } = render(
      <ErrorBoundary>
        <Toggleable />
      </ErrorBoundary>,
    );
    expect(screen.getByRole('alert')).toBeTruthy();
    shouldThrow = false;
    const button = screen.getByRole('button', { name: /try again/i });
    button.click();
    rerender(
      <ErrorBoundary>
        <Toggleable />
      </ErrorBoundary>,
    );
    expect(screen.getByText('recovered')).toBeTruthy();
    console.error = consoleError;
  });

  it('isolates errors: a sibling child keeps rendering when one crashes', () => {
    // Two siblings inside the same boundary: one throws, one is fine.
    // The boundary catches the first and falls back, but the safe
    // sibling is not shown — that is, the boundary protects the OUTER
    // tree (its parent), not its own siblings. This guards against
    // regressions if someone refactors the boundary to render
    // children directly while in error state.
    const consoleError = console.error;
    console.error = () => {};
    render(
      <>
        <ErrorBoundary label="modal-A">
          <Bomb throwOn />
        </ErrorBoundary>
        <div data-testid="outside">outside the boundary</div>
      </>,
    );
    // The throwing child is replaced by the boundary's fallback.
    expect(screen.getByText(/modal-A crashed/i)).toBeTruthy();
    // The sibling OUTSIDE the boundary is unaffected.
    expect(screen.getByTestId('outside')).toBeTruthy();
    console.error = consoleError;
  });
});