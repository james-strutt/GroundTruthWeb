import { LayoutGrid, List, Download } from 'lucide-react';
import styles from './ViewToggle.module.css';

interface ViewToggleProps {
  view: 'card' | 'table';
  onViewChange: (view: 'card' | 'table') => void;
  onExport?: () => void;
}

export function ViewToggle({ view, onViewChange, onExport }: ViewToggleProps) {
  return (
    <div className={styles.wrapper}>
      <div className={styles.group} role="group" aria-label="View mode">
        <button
          className={`${styles.button} ${view === 'card' ? styles.buttonActive : ''}`}
          onClick={() => onViewChange('card')}
          aria-label="Card view"
          aria-pressed={view === 'card'}
        >
          <LayoutGrid size={15} />
        </button>
        <button
          className={`${styles.button} ${view === 'table' ? styles.buttonActive : ''}`}
          onClick={() => onViewChange('table')}
          aria-label="Table view"
          aria-pressed={view === 'table'}
        >
          <List size={15} />
        </button>
      </div>
      {onExport && (
        <button className={styles.exportButton} onClick={onExport} aria-label="Export CSV">
          <Download size={13} />
          CSV
        </button>
      )}
    </div>
  );
}
