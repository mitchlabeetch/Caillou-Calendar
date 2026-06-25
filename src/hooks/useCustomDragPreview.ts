import { useDragControls } from 'motion/react';
import { useEffect, useRef, useState } from 'react';

/**
 * Renders a custom drag preview image for native HTML5 drag events.
 * Native drag-and-drop (desktop) shows a translucent ghost of the
 * dragged element by default; this hook swaps that ghost for a
 * small floating clone of the source so the user sees what they are
 * moving.
 *
 * Returns `onDragStart` to spread onto the dragged element.
 */
export function useCustomDragPreview<T extends HTMLElement>(
  previewRenderer: () => HTMLElement,
) {
  const [ghost, setGhost] = useState<HTMLCanvasElement | null>(null);

  // Keep the latest renderer in a ref so the effect below only runs
  // once. Including `previewRenderer` in the effect deps would loop
  // forever because callers usually pass an inline arrow function,
  // which is a new identity on every render → new effect → setState
  // → new render → repeat.
  const rendererRef = useRef(previewRenderer);
  useEffect(() => {
    rendererRef.current = previewRenderer;
  });

  useEffect(() => {
    // Build a small canvas-based ghost once per drag.
    const el = rendererRef.current();
    const rect = el.getBoundingClientRect();
    const canvas = document.createElement('canvas');
    canvas.width = Math.ceil(rect.width) || 120;
    canvas.height = Math.ceil(rect.height) || 40;
    setGhost(canvas);
  }, []);

  return {
    onDragStart: (e: React.DragEvent<T>) => {
      if (ghost) {
        e.dataTransfer.setDragImage(ghost, ghost.width / 2, ghost.height / 2);
      }
    },
  };
}

// Suppress unused import warning when only the type is referenced.
void useDragControls;