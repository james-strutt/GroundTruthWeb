import { TabBar } from '../TabBar';
import styles from './ExploreScreen.module.css';

export function ExploreScreen() {
  return (
    <div className={styles.root}>
      {/* Map */}
      <div className={styles.map}>
        <div className={styles.mapContent}>
          <div className={`${styles.road} ${styles.roadH} ${styles.roadMain}`} style={{ top: '45%' }} />
          <div className={`${styles.road} ${styles.roadH}`} style={{ top: '65%' }} />
          <div className={`${styles.road} ${styles.roadV} ${styles.roadMain}`} style={{ left: '41%' }} />
          <div className={`${styles.road} ${styles.roadV}`} style={{ left: '74%' }} />

          {/* Route */}
          <svg className={styles.routeSvg} viewBox="0 0 280 360" preserveAspectRatio="none">
            <path className={styles.routeGlow}
              d="M115,280 L115,230 Q115,220 125,220 L200,220 Q210,220 210,210 L210,160 Q210,150 200,150 L125,150 Q115,150 115,140 L115,80" />
            <path className={styles.routeLine}
              d="M115,280 L115,230 Q115,220 125,220 L200,220 Q210,220 210,210 L210,160 Q210,150 200,150 L125,150 Q115,150 115,140 L115,80" />
          </svg>

          {/* Current position dot */}
          <div className={styles.locationDot} style={{ top: '22%', left: '40%' }}>
            <div className={styles.locationRing} />
            <div className={styles.locationRing2} />
            <div className={styles.locationCenter} />
          </div>
        </div>
      </div>

      {/* Score ticker */}
      <div className={styles.scoreTicker}>
        <ScoreTick label="Walkability" value={7.2} pct={72} good />
        <ScoreTick label="Streetscape" value={6.8} pct={68} good />
        <ScoreTick label="Amenity" value={5.1} pct={51} />
        <ScoreTick label="Safety" value={8.0} pct={80} good />
      </div>

      {/* Bottom sheet */}
      <div className={styles.sheet}>
        <div className={styles.handle} />
        <div className={styles.observation}>
          <div className={styles.obsHeader}>
            <div className={styles.obsDot} />
            <span className={styles.obsBadge}>AI Observation · Block 4</span>
          </div>
          <p className={styles.obsText}>"Good tree canopy coverage. Footpath well-maintained. Mix of 1960s brick and newer rendered facades. Quiet residential street."</p>
        </div>
        <div className={styles.exploreControls}>
          <button className={styles.momentBtn}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z" />
              <circle cx="12" cy="13" r="3" />
            </svg>
            Save Moment
          </button>
          <button className={`${styles.ctrlBtn} ${styles.pause}`}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="14" y="4" width="4" height="16" rx="1" />
              <rect x="6" y="4" width="4" height="16" rx="1" />
            </svg>
          </button>
          <button className={`${styles.ctrlBtn} ${styles.stop}`}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect width="18" height="18" x="3" y="3" rx="2" />
            </svg>
          </button>
        </div>
      </div>

      <TabBar active="explore" />
    </div>
  );
}

function ScoreTick({ label, value, pct, good }: { label: string; value: number; pct: number; good?: boolean }) {
  return (
    <div className={styles.scoreTick}>
      <span className={styles.scoreTickLabel}>{label}</span>
      <div className={styles.scoreTickBar}>
        <div className={styles.scoreTickFill} style={{ '--fill-width': `${pct}%`, background: good ? 'var(--sage-bright)' : 'var(--amber)' } as React.CSSProperties} />
      </div>
      <span className={styles.scoreTickValue}>{value.toFixed(1)}</span>
    </div>
  );
}
