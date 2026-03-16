/**
 * Map layer control panel — collapsible panel for
 * toggling ArcGIS spatial layers on/off with opacity sliders.
 * On mobile (<768px) the expanded panel renders as a modal overlay.
 */

import { useState, useEffect, useCallback } from 'react';
import { Eye, EyeOff, ChevronDown, ChevronRight, Layers, X } from 'lucide-react';
import type { SpatialLayer } from './layerConstants';
import styles from './LayerControl.module.css';

const MOBILE_BREAKPOINT = 768;

function useIsMobile(): boolean {
  const [isMobile, setIsMobile] = useState(
    typeof window !== 'undefined' ? window.innerWidth < MOBILE_BREAKPOINT : false,
  );

  useEffect(() => {
    const mq = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  return isMobile;
}

interface LayerControlProps {
  layers: SpatialLayer[];
  onToggle: (layerId: string) => void;
  onOpacityChange: (layerId: string, opacity: number) => void;
}

export function LayerControl({ layers, onToggle, onOpacityChange }: LayerControlProps) {
  const [isOpen, setIsOpen] = useState(false);
  const isMobile = useIsMobile();
  const groups = [...new Set(layers.map((l) => l.group))];
  const activeCount = layers.filter((l) => l.visible).length;

  const close = useCallback(() => setIsOpen(false), []);

  function hasActiveLayer(group: string): boolean {
    return layers.some((l) => l.group === group && l.visible);
  }

  const layerBody = (
    <div className={styles.body}>
      {groups.map((group) => (
        <div key={group} className={styles.group}>
          <div className={`${styles.groupLabel} ${hasActiveLayer(group) ? styles.groupLabelActive : ''}`}>
            {group}
          </div>
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

  if (isMobile && isOpen) {
    return (
      <>
        <div className={styles.panel}>
          <button className={styles.header} onClick={() => setIsOpen(!isOpen)}>
            <Layers size={13} className={styles.headerIcon} />
            <span className={styles.title}>Layers</span>
            {activeCount > 0 && <span className={styles.badge}>{activeCount}</span>}
            <ChevronDown size={13} />
          </button>
        </div>
        <div className={styles.mobileBackdrop} onClick={close} />
        <div className={styles.mobileModal}>
          <div className={styles.mobileModalHeader}>
            <Layers size={16} className={styles.headerIcon} />
            <span className={styles.mobileModalTitle}>Layers</span>
            {activeCount > 0 && <span className={styles.badge}>{activeCount}</span>}
            <button className={styles.mobileCloseBtn} onClick={close}>
              <X size={18} />
            </button>
          </div>
          {layerBody}
        </div>
      </>
    );
  }

  return (
    <div className={styles.panel}>
      <button className={styles.header} onClick={() => setIsOpen(!isOpen)}>
        <Layers size={13} className={styles.headerIcon} />
        <span className={styles.title}>Layers</span>
        {activeCount > 0 && <span className={styles.badge}>{activeCount}</span>}
        {isOpen ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
      </button>

      {isOpen && layerBody}
    </div>
  );
}
