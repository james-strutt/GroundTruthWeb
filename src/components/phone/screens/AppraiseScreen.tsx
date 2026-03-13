import { TabBar } from '../TabBar';
import styles from './AppraiseScreen.module.css';

export function AppraiseScreen() {
  return (
    <div className={styles.root}>
      {/* Dark hero */}
      <div className={styles.hero}>
        <div className={styles.subjectMini}>
          <div className={styles.subjectThumb} />
          <div className={styles.subjectInfo}>
            <h4>42 Smith St, Marrickville</h4>
            <p>620 sqm · R2 Low Density</p>
            <div className={styles.conditionTag}>
              <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="#e8a87c" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
              </svg>
              6/10 condition
            </div>
          </div>
        </div>
      </div>

      <div className={styles.body}>
        {/* Price estimate */}
        <div className={styles.sectionCard}>
          <div className={styles.sectionLabel}>Price Estimate</div>
          <div className={styles.rangeViz}>
            <span className={styles.rangeLabel}>Desktop estimate</span>
            <div className={`${styles.rangeBar} ${styles.rangeDesktop}`} />
            <div className={styles.rangeAmounts}>
              <span>$1.05M</span>
              <span>$1.45M</span>
            </div>
            <span className={`${styles.rangeLabel} ${styles.verified}`}>Verified estimate</span>
            <div className={`${styles.rangeBar} ${styles.rangeVerified}`} />
            <div className={styles.bestEstimate}>
              <div className={styles.bestMarker} />
              <div className={styles.bestAmount}>$1.15M</div>
              <div className={styles.bestLabel}>Best estimate</div>
            </div>
          </div>
        </div>

        {/* Confidence */}
        <div className={styles.confidenceCard}>
          <div className={styles.confCircle}>
            <svg viewBox="0 0 80 80">
              <circle className={styles.confBg} cx="40" cy="40" r="34" />
              <circle className={styles.confFill} cx="40" cy="40" r="34" />
            </svg>
            <div className={styles.confText}>
              <span className={styles.confNum}>3</span>
              <span className={styles.confOf}>of 5</span>
            </div>
          </div>
          <div className={styles.confInfo}>
            <h4>Good Confidence</h4>
            <p>3 comps verified with photo evidence. Verify 2 more for high confidence.</p>
          </div>
        </div>

        {/* Comps */}
        <div className={styles.compsLabel}>Comparables</div>
        <CompCard addr="38 Smith St" meta="580 sqm · Jun 2025 · 120m" price="$1.18M" adj="$1.10M adj" direction="down" />
        <CompCard addr="17 Oak Ave" meta="640 sqm · Apr 2025 · 200m" price="$1.05M" adj="$1.12M adj" direction="up" />
        <CompCard addr="9 Park Rd" meta="590 sqm · Mar 2025 · 350m" price="$1.22M" adj="$1.14M adj" direction="down" />
      </div>

      <TabBar active="appraise" />
    </div>
  );
}

function CompCard({ addr, meta, price, adj, direction }: {
  addr: string; meta: string; price: string; adj: string; direction: 'up' | 'down';
}) {
  return (
    <div className={styles.compCard}>
      <div className={styles.compIcon}>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z" />
          <circle cx="12" cy="13" r="3" />
        </svg>
      </div>
      <div className={styles.compDetails}>
        <div className={styles.compAddr}>{addr}</div>
        <div className={styles.compMeta}>{meta}</div>
      </div>
      <div className={styles.compPriceCol}>
        <div className={styles.compPrice}>{price}</div>
        <div className={`${styles.compAdj} ${direction === 'up' ? styles.adjUp : styles.adjDown}`}>
          {direction === 'up' ? '↑' : '↓'} {adj}
        </div>
      </div>
    </div>
  );
}
