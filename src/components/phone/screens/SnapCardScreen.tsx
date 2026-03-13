import { TabBar } from '../TabBar';
import styles from './SnapCardScreen.module.css';

export function SnapCardScreen() {
  return (
    <div className={styles.root}>
      <div className={styles.scroll}>
        {/* Nav */}
        <div className={styles.nav}>
          <span className={styles.navBack}>← Back</span>
          <div className={styles.navAddress}>
            <div className={styles.gpsDot} />
            <span className={styles.navAddrText}>42 Smith St</span>
          </div>
          <span className={styles.navAction}>Share</span>
        </div>

        {/* Photo */}
        <div className={styles.photo}>
          <div className={styles.photoOverlay}>
            <span className={styles.aiBadge}>AI ANALYSED</span>
            <span className={styles.photoTime}>5 seconds ago</span>
          </div>
        </div>

        {/* Address */}
        <h2 className={styles.address}>42 Smith Street, Marrickville 2204</h2>
        <div className={styles.lotInfo}>Lot 12 DP 654321 · 620 sqm</div>

        {/* Planning row */}
        <div className={styles.planRow}>
          <PlanItem label="Zone" value="R2" />
          <PlanItem label="FSR" value="0.5:1" />
          <PlanItem label="HOB" value="8.5m" />
          <PlanItem label="Storeys" value="2" />
        </div>

        {/* AI Assessment */}
        <div className={styles.aiSection}>
          <div className={styles.aiHeader}>
            <div className={styles.scoreRing}>
              <svg viewBox="0 0 48 48">
                <circle className={styles.ringBg} cx="24" cy="24" r="20" />
                <circle className={styles.ringVal} cx="24" cy="24" r="20" strokeDasharray="125.6" strokeDashoffset="50.2" />
              </svg>
              <span className={styles.scoreText}>6/10</span>
            </div>
            <div>
              <div className={styles.aiLabel}>AI Assessment</div>
              <div className={styles.aiSub}>Condition: Fair</div>
            </div>
          </div>
          <p className={styles.narrative}>
            "1970s brick veneer, single storey with rear extension. Fair condition. Mature garden with established eucalyptus. Solar panels on north-facing roof."
          </p>
        </div>

        {/* Hazards */}
        <div className={styles.hazards}>
          <span className={`${styles.hazBadge} ${styles.hazSafe}`}><span className={`${styles.hazDot} ${styles.dotSafe}`} />Flood: None</span>
          <span className={`${styles.hazBadge} ${styles.hazModerate}`}><span className={`${styles.hazDot} ${styles.dotModerate}`} />Fire: BAL-12.5</span>
          <span className={`${styles.hazBadge} ${styles.hazSafe}`}><span className={`${styles.hazDot} ${styles.dotSafe}`} />Heritage: No</span>
        </div>

        {/* Comparable sales */}
        <div className={styles.salesSection}>
          <div className={styles.salesHeader}>
            <span className={styles.salesLabel}>Comparable Sales</span>
            <span className={styles.salesMeta}>5 sales, 12mo</span>
          </div>
          <div className={styles.salesRange}>$1.1M – $1.35M</div>
          <div className={styles.salesDetail}>Median: $1.2M · Within 800m</div>
        </div>

        {/* Smart suggestion */}
        <div className={styles.suggestion}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--amber)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: 1 }}>
            <path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5" />
            <path d="M9 18h6" /><path d="M10 22h4" />
          </svg>
          <p>Granny flat potential — R2 zone, 620sqm lot exceeds 450sqm minimum.</p>
        </div>
      </div>

      <TabBar active="snap" />
    </div>
  );
}

function PlanItem({ label, value }: { label: string; value: string }) {
  return (
    <div className={styles.planItem}>
      <div className={styles.planLabel}>{label}</div>
      <div className={styles.planValue}>{value}</div>
    </div>
  );
}
