import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { useRef } from 'react';
import { ModalShell } from './ModalShell';

function Harness({ open }: { open: boolean }) {
  const btnRef = useRef<HTMLButtonElement>(null);
  return (
    <div>
      <button type="button" data-testid="trigger" ref={btnRef}>
        open
      </button>
      <ModalShell isOpen={open} onClose={() => {}} title="Test">
        <input data-testid="first" />
        <button data-testid="last">Done</button>
      </ModalShell>
    </div>
  );
}

describe('ModalShell', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  it('renders nothing when closed', () => {
    render(<Harness open={false} />);
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('renders with role=dialog and aria-modal=true when open', () => {
    render(<Harness open={true} />);
    const dlg = screen.getByRole('dialog');
    expect(dlg.getAttribute('aria-modal')).toBe('true');
    expect(dlg.getAttribute('aria-label')).toBe('Test');
  });

  it('closes on Escape', () => {
    const onClose = vi.fn();
    render(
      <ModalShell isOpen onClose={onClose} title="x">
        <span>content</span>
      </ModalShell>,
    );
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('renders an explicit close button with aria-label', () => {
    const onClose = vi.fn();
    render(
      <ModalShell isOpen onClose={onClose} title="x">
        <span>content</span>
      </ModalShell>,
    );
    fireEvent.click(screen.getByRole('button', { name: /close dialog/i }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});