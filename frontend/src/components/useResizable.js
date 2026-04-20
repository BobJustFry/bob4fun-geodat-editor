import { useState, useCallback, useRef, useEffect } from 'react';

export default function useResizable({ minPercent = 20, maxPercent = 50, defaultPx = 200, storageKey }) {
  const [width, setWidth] = useState(() => {
    if (storageKey) {
      const saved = localStorage.getItem(storageKey);
      if (saved) return parseInt(saved, 10);
    }
    return defaultPx;
  });
  const containerRef = useRef(null);
  const dragging = useRef(false);

  const onMouseDown = useCallback((e) => {
    e.preventDefault();
    dragging.current = true;
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  }, []);

  useEffect(() => {
    const onMouseMove = (e) => {
      if (!dragging.current || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const containerWidth = rect.width;
      const newWidth = e.clientX - rect.left;
      const minPx = containerWidth * (minPercent / 100);
      const maxPx = containerWidth * (maxPercent / 100);
      const clamped = Math.round(Math.max(minPx, Math.min(maxPx, newWidth)));
      setWidth(clamped);
    };

    const onMouseUp = () => {
      if (dragging.current) {
        dragging.current = false;
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
        if (storageKey) {
          localStorage.setItem(storageKey, width.toString());
        }
      }
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
  }, [minPercent, maxPercent, storageKey, width]);

  return { width, containerRef, onMouseDown };
}
