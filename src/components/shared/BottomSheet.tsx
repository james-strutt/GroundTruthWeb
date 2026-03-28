/**
 * BottomSheet — mobile-only draggable bottom sheet with three snap positions.
 * On desktop (>768px) it renders children directly as a normal scrollable panel.
 */

import { useState, useRef, useCallback, useEffect, type ReactNode, type PointerEvent as ReactPointerEvent } from 'react';
import styles from './BottomSheet.module.css';

type SnapPosition = 'collapsed' | 'half' | 'full';

const SNAP_OFFSETS: Record<SnapPosition, number> = {
  collapsed: 0.9,
  half: 0.5,
  full: 0.1,
};

const DRAG_THRESHOLD = 30;

interface BottomSheetProps {
  readonly children: ReactNode;
  readonly title?: string;
}

function resolveSnap(ratioFromTop: number): SnapPosition {
  if (ratioFromTop > 0.7) return 'collapsed';
  if (ratioFromTop > 0.35) return 'half';
  return 'full';
}

export function BottomSheet({ children, title }: BottomSheetProps) {
  const [snap, setSnap] = useState<SnapPosition>('collapsed');
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState<number | null>(null);
  const startYRef = useRef(0);
  const startOffsetRef = useRef(0);
  const sheetRef = useRef<HTMLDivElement>(null);

  const currentOffset = dragOffset ?? SNAP_OFFSETS[snap];

  const handlePointerDown = useCallback((e: ReactPointerEvent) => {
    startYRef.current = e.clientY;
    startOffsetRef.current = SNAP_OFFSETS[snap];
    setIsDragging(true);
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }, [snap]);

  const handlePointerMove = useCallback((e: ReactPointerEvent) => {
    if (!isDragging) return;
    const deltaY = e.clientY - startYRef.current;
    const vh = window.innerHeight;
    const ratioFromTop = startOffsetRef.current + (deltaY / vh);
    const clamped = Math.min(0.92, Math.max(0.1, ratioFromTop));
    setDragOffset(clamped);
  }, [isDragging]);

  const cycleSnap = useCallback(() => {
    setSnap((prev) => {
      if (prev === 'collapsed') return 'half';
      if (prev === 'half') return 'full';
      return 'collapsed';
    });
  }, []);

  const handlePointerUp = useCallback(() => {
    if (!isDragging) return;
    setIsDragging(false);

    if (dragOffset !== null) {
      const deltaPixels = (dragOffset - startOffsetRef.current) * window.innerHeight;

      if (Math.abs(deltaPixels) < DRAG_THRESHOLD) {
        cycleSnap();
      } else {
        setSnap(resolveSnap(dragOffset));
      }
    } else {
      cycleSnap();
    }

    setDragOffset(null);
  }, [isDragging, dragOffset, cycleSnap]);

  useEffect(() => {
    function handleResize(): void {
      setDragOffset(null);
    }
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const translateY = `${currentOffset * 100}dvh`;

  return (
    <>
      {/* Desktop: render children directly */}
      <div className={styles.desktopPassthrough}>
        {children}
      </div>

      {/* Mobile: bottom sheet */}
      <div
        ref={sheetRef}
        className={`${styles.sheet} ${isDragging ? styles.sheetDragging : ''}`}
        style={{ transform: `translateY(${translateY})` }}
      >
        <div
          className={styles.handle}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
        >
          <div className={styles.handleBar} />
          {title && (
            <div className={styles.titleRow}>
              <h2 className={styles.title}>{title}</h2>
            </div>
          )}
        </div>
        <div className={styles.content}>
          {children}
        </div>
      </div>
    </>
  );
}
