/**
 * Measure tools — draw lines or polygons on the map to
 * measure distances and areas. Electric blue styling.
 */

import { Ruler, Pentagon, X } from 'lucide-react';
import styles from './MeasureTools.module.css';

export type MeasureMode = 'none' | 'line' | 'polygon';

interface MeasureToolsProps {
  mode: MeasureMode;
  onModeChange: (mode: MeasureMode) => void;
  distance: number | null;
  area: number | null;
  onClear: () => void;
}

function formatDistance(m: number): string {
  if (m < 1000) return `${Math.round(m)} m`;
  return `${(m / 1000).toFixed(2)} km`;
}

function formatArea(sqm: number): string {
  if (sqm < 10_000) return `${Math.round(sqm).toLocaleString()} m\u00B2`;
  return `${(sqm / 10_000).toFixed(2)} ha`;
}

export function MeasureTools({ mode, onModeChange, distance, area, onClear }: MeasureToolsProps) {
  return (
    <div className={styles.container}>
      {/* Tool buttons */}
      <div className={styles.buttons}>
        <button
          className={`${styles.btn} ${mode === 'line' ? styles.btnActive : ''}`}
          onClick={() => onModeChange(mode === 'line' ? 'none' : 'line')}
          title="Measure distance"
        >
          <Ruler size={15} />
        </button>
        <button
          className={`${styles.btn} ${mode === 'polygon' ? styles.btnActive : ''}`}
          onClick={() => onModeChange(mode === 'polygon' ? 'none' : 'polygon')}
          title="Measure area"
        >
          <Pentagon size={15} />
        </button>
        {mode !== 'none' && (
          <button className={styles.clearBtn} onClick={onClear} title="Clear measurement">
            <X size={13} />
          </button>
        )}
      </div>

      {/* Measurement results */}
      {mode !== 'none' && (
        <div className={styles.results}>
          {mode === 'line' && distance !== null && (
            <span className={styles.result}>{formatDistance(distance)}</span>
          )}
          {mode === 'polygon' && (
            <>
              {distance !== null && <span className={styles.result}>{formatDistance(distance)} perimeter</span>}
              {area !== null && <span className={styles.result}>{formatArea(area)}</span>}
            </>
          )}
          {distance === null && <span className={styles.hint}>Click on map to start measuring</span>}
        </div>
      )}
    </div>
  );
}
