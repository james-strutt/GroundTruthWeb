import { TabBar } from '../TabBar';
import styles from './InspectScreen.module.css';

export function InspectScreen() {
  const tags = ['Frontage', 'Left Boundary', 'Right Boundary', 'Rear', 'Vegetation', 'Defects'];

  return (
    <div className={styles.root}>
      {/* Viewfinder */}
      <div className={styles.viewfinder}>
        <span className={styles.lotLabel}>LOT BOUNDARY</span>
        <div className={styles.lotBoundary} />

        {/* North arrow */}
        <div className={styles.northArrow}>
          <span className={styles.northN}>N</span>
          <div className={styles.northTri} />
        </div>

        {/* Hazard pills */}
        <div className={styles.hazPills}>
          <span className={`${styles.vfPill} ${styles.safe}`}>
            <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="#a3d977" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg>
            Flood-free
          </span>
          <span className={`${styles.vfPill} ${styles.moderate}`}>
            <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="#fbbf24" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3" />
              <path d="M12 9v4" /><path d="M12 17h.01" />
            </svg>
            BAL-12.5
          </span>
        </div>
      </div>

      {/* Controls */}
      <div className={styles.controls}>
        <div className={styles.tagScroll}>
          {tags.map((tag, i) => (
            <span key={tag} className={`${styles.tagChip} ${i === 0 ? styles.tagActive : ''}`}>{tag}</span>
          ))}
        </div>

        <div className={styles.captureRow}>
          <div className={styles.micBtn}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#e8e2d9" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
              <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
              <line x1="12" x2="12" y1="19" y2="22" />
            </svg>
          </div>
          <div className={styles.shutter}><div className={styles.shutterInner} /></div>
          <div style={{ width: 32 }} />
        </div>

        {/* Last photo preview */}
        <div className={styles.lastPhoto}>
          <div className={styles.lastThumb} />
          <p className={styles.lastText}>
            "Brick veneer, fair condition <span className={styles.aiScore}>(6/10)</span>. Solar panels visible on roof pitch."
          </p>
        </div>

        {/* Progress dots */}
        <div className={styles.progressDots}>
          {[true, true, true, false, false, false, false, false].map((filled, i) => (
            <div key={i} className={`${styles.dot} ${filled ? styles.dotFilled : ''} ${i === 3 ? styles.dotCurrent : ''}`} />
          ))}
        </div>
      </div>

      <TabBar active="inspect" />
    </div>
  );
}
