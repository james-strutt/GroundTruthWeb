/**
 * Map layer control panel — always-visible sidebar panel for
 * toggling ArcGIS spatial layers on/off with opacity sliders.
 */

import { Eye, EyeOff } from 'lucide-react';
import type { SpatialLayer } from './layerConstants';
import styles from './LayerControl.module.css';

interface LayerControlProps {
  layers: SpatialLayer[];
  onToggle: (layerId: string) => void;
  onOpacityChange: (layerId: string, opacity: number) => void;
}

export function LayerControl({ layers, onToggle, onOpacityChange }: LayerControlProps) {
  const groups = [...new Set(layers.map((l) => l.group))];

  return (
    <div className={styles.panel}>
      <div className={styles.title}>Layers</div>

      {groups.map((group) => (
        <div key={group} className={styles.group}>
          <div className={styles.groupLabel}>{group}</div>
          {layers.filter((l) => l.group === group).map((layer) => (
            <div key={layer.id} className={`${styles.row} ${layer.visible ? styles.rowActive : ''}`}>
              <button
                className={styles.toggle}
                onClick={() => onToggle(layer.id)}
                title={layer.visible ? 'Hide layer' : 'Show layer'}
              >
                {layer.visible
                  ? <Eye size={13} className={styles.eyeOn} />
                  : <EyeOff size={13} className={styles.eyeOff} />
                }
              </button>
              <span
                className={`${styles.label} ${layer.visible ? styles.labelActive : ''}`}
                onClick={() => onToggle(layer.id)}
              >
                {layer.label}
              </span>
              {layer.visible && (
                <input
                  type="range"
                  min={10}
                  max={100}
                  value={Math.round(layer.opacity * 100)}
                  onChange={(e) => onOpacityChange(layer.id, Number(e.target.value) / 100)}
                  className={styles.slider}
                  title={`Opacity: ${Math.round(layer.opacity * 100)}%`}
                />
              )}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
