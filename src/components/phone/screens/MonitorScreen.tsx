import { TabBar } from '../TabBar';
import styles from './MonitorScreen.module.css';

export function MonitorScreen() {
  return (
    <div className={styles.root}>
      {/* Hero */}
      <div className={styles.hero}>
        <div className={styles.address}>42 Smith St, Marrickville 2204</div>
      </div>

      {/* Comparison area */}
      <div className={styles.comparison}>
        <div className={`${styles.compImg} ${styles.after}`}>
          <div className={styles.dateLabel} style={{ right: 6 }}>Today</div>
        </div>
        <div className={`${styles.compImg} ${styles.before}`}>
          <div className={styles.dateLabel} style={{ left: 6 }}>Nov 2019</div>
        </div>
        <div className={styles.sliderHandle}>
          <div className={styles.sliderKnob}>⟩</div>
        </div>
      </div>

      {/* Changes */}
      <div className={styles.body}>
        <div className={styles.changesTitle}>AI-Detected Changes</div>

        <ChangeCard severity="high" desc="New extension (~40sqm)" detail="High confidence · Rear of property" badge="DA Approved" badgeType="approved" />
        <ChangeCard severity="high" desc="Tree removed (rear)" detail="High confidence · Significant tree" badge="No DA Found" badgeType="none" />
        <ChangeCard severity="medium" desc="Facade rendered" detail="Medium confidence · Front elevation" badge="Exempt" badgeType="exempt" />
      </div>

      <TabBar active="monitor" />
    </div>
  );
}

function ChangeCard({ severity, desc, detail, badge, badgeType }: {
  severity: 'high' | 'medium';
  desc: string;
  detail: string;
  badge: string;
  badgeType: 'approved' | 'none' | 'exempt';
}) {
  const badgeStyles: Record<string, { bg: string; color: string }> = {
    approved: { bg: 'var(--sage-light)', color: 'var(--sage)' },
    none: { bg: 'var(--brick-light)', color: 'var(--brick)' },
    exempt: { bg: 'var(--stone-100)', color: 'var(--stone-600)' },
  };
  const b = badgeStyles[badgeType];

  return (
    <div className={styles.changeCard}>
      <div className={`${styles.confBar} ${severity === 'high' ? styles.confHigh : styles.confMedium}`} />
      <div className={styles.changeInfo}>
        <div className={styles.changeDesc}>{desc}</div>
        <div className={styles.changeConf}>{detail}</div>
      </div>
      <span className={styles.daBadge} style={{ background: b.bg, color: b.color }}>{badge}</span>
    </div>
  );
}
