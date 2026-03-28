import { useRef, useState, useCallback, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import styles from './ImageCompareSlider.module.css';

interface ImageCompareSliderProps {
  beforeSrc: string;
  afterSrc: string;
  beforeLabel?: string;
  afterLabel?: string;
}

export function ImageCompareSlider({
  beforeSrc,
  afterSrc,
  beforeLabel = 'Before',
  afterLabel = 'After',
}: ImageCompareSliderProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const [containerWidth, setContainerWidth] = useState(0);

  const updatePosition = useCallback((clientX: number) => {
    const container = containerRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    const x = clientX - rect.left;
    const pct = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setPosition(pct);
  }, []);

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    setIsDragging(true);
    updatePosition(e.clientX);
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
  }, [updatePosition]);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!isDragging) return;
    updatePosition(e.clientX);
  }, [isDragging, updatePosition]);

  const handlePointerUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setContainerWidth(entry.contentRect.width);
      }
    });
    observer.observe(container);
    setContainerWidth(container.getBoundingClientRect().width);

    return () => observer.disconnect();
  }, []);

  const dividerPx = containerWidth * (position / 100);

  return (
    <div
      ref={containerRef}
      className={styles.container}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
    >
      <div className={styles.imageWrap}>
        {/* After image (full width, behind) */}
        <img src={afterSrc} alt={afterLabel} className={styles.afterImage} draggable={false} />

        {/* Before image (clipped to left portion) */}
        <div className={styles.beforeClip} style={{ width: `${position}%` }}>
          <img
            src={beforeSrc}
            alt={beforeLabel}
            className={styles.beforeImage}
            style={{ width: containerWidth > 0 ? `${containerWidth}px` : '100%' }}
            draggable={false}
          />
        </div>

        {/* Vertical divider */}
        <div className={styles.divider} style={{ left: `${dividerPx}px` }} />

        {/* Drag handle */}
        <div
          className={styles.handle}
          style={{ left: `${dividerPx}px`, transform: 'translate(-50%, -50%)' }}
        >
          <span className={styles.handleArrows}>
            <ChevronLeft size={10} strokeWidth={3} />
            <ChevronRight size={10} strokeWidth={3} />
          </span>
        </div>

        {/* Labels */}
        <span className={styles.labelBefore}>{beforeLabel}</span>
        <span className={styles.labelAfter}>{afterLabel}</span>
      </div>
    </div>
  );
}
