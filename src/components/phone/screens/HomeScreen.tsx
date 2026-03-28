import { TabBar } from '../TabBar';
import styles from './HomeScreen.module.css';

export function HomeScreen() {
  return (
    <div className={styles.root}>
      {/* Map background */}
      <div className={styles.map}>
        <div className={styles.mapContent}>
          {/* Roads */}
          <div className={`${styles.road} ${styles.roadH} ${styles.roadMain}`} style={{ top: '35%' }} />
          <div className={`${styles.road} ${styles.roadH}`} style={{ top: '55%' }} />
          <div className={`${styles.road} ${styles.roadH}`} style={{ top: '78%' }} />
          <div className={`${styles.road} ${styles.roadV} ${styles.roadMain}`} style={{ left: '36%' }} />
          <div className={`${styles.road} ${styles.roadV}`} style={{ left: '67%' }} />

          {/* Walking route — animated draw-on */}
          <svg className={styles.route} viewBox="0 0 280 500" preserveAspectRatio="none">
            <path
              className={styles.routeGlow}
              d="M 101,250 L 101,175 L 188,175"
            />
            <path
              className={styles.routeLine}
              d="M 101,250 L 101,175 L 188,175"
            />
          </svg>

          {/* Current location indicator */}
          <div className={styles.locationDot} style={{ top: '35%', left: '67%' }}>
            <div className={styles.locationRing} />
            <div className={styles.locationRing2} />
            <div className={styles.locationCenter} />
          </div>

          {/* Pins — staggered drop entrance */}
          <div className={`${styles.pin} ${styles.pinTerracotta}`} style={{ top: '28%', left: '24%', animationDelay: '0.5s' }}>
            <div className={styles.pinIcon}>
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z" />
                <circle cx="12" cy="13" r="3" />
              </svg>
            </div>
          </div>
          <div className={`${styles.pin} ${styles.pinTerracotta}`} style={{ top: '46%', left: '52%', animationDelay: '0.65s' }}>
            <div className={styles.pinIcon}>
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z" />
                <circle cx="12" cy="13" r="3" />
              </svg>
            </div>
          </div>
          <div className={`${styles.pin} ${styles.pinDark}`} style={{ top: '62%', left: '44%', animationDelay: '0.8s' }}>
            <div className={styles.pinIcon}>
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.3-4.3" />
              </svg>
            </div>
          </div>
          <div className={`${styles.pin} ${styles.pinGold}`} style={{ top: '70%', left: '78%', animationDelay: '0.95s' }}>
            <div className={styles.pinIcon}>
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
            </div>
          </div>
          <div className={`${styles.pin} ${styles.pinGreen}`} style={{ top: '50%', left: '36%', animationDelay: '1.1s' }}>
            <div className={styles.pinIcon}>
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" />
              </svg>
            </div>
          </div>
          <div className={`${styles.pin} ${styles.pinTerracotta}`} style={{ top: '32%', left: '72%', animationDelay: '1.25s' }}>
            <div className={styles.pinIcon}>
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z" />
                <circle cx="12" cy="13" r="3" />
              </svg>
            </div>
          </div>
        </div>

        {/* AI scan sweep */}
        <div className={styles.scanLine} />
      </div>

      {/* Header overlay */}
      <div className={styles.header}>
        <div>
          <div className={styles.greeting}>Hello, James</div>
          <div className={styles.title}>GroundTruth</div>
        </div>
        <div className={styles.profileBtn}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--charcoal)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="8" r="5" />
            <path d="M20 21a8 8 0 0 0-16 0" />
          </svg>
        </div>
      </div>

      {/* Bottom sheet */}
      <div className={styles.sheet}>
        <div className={styles.handle} />
        <div className={styles.sheetTitle}>Recent Activity</div>
        <ActivityItem icon="camera" colour="terracotta" address="42 Smith St, Marrickville" detail="Snap · AI Score: 6/10" time="2h ago" />
        <ActivityItem icon="dollar" colour="amber" address="15 Oak Ave, Dulwich Hill" detail="Appraisal · $1.15M ±5%" time="Yesterday" />
        <ActivityItem icon="search" colour="stone" address="8 Park Rd, Stanmore" detail="Inspection · 12 photos" time="3d ago" />
      </div>

      <TabBar active="home" />
    </div>
  );
}

function ActivityItem({ icon, colour, address, detail, time }: {
  icon: 'camera' | 'dollar' | 'search' | 'eye' | 'compass';
  colour: 'terracotta' | 'amber' | 'stone' | 'sage';
  address: string;
  detail: string;
  time: string;
}) {
  const bgMap = {
    terracotta: 'var(--terracotta-light)',
    amber: 'var(--amber-light)',
    stone: 'var(--stone-100)',
    sage: 'var(--sage-light)',
  };
  const fgMap = {
    terracotta: 'var(--terracotta)',
    amber: 'var(--amber)',
    stone: 'var(--stone-600)',
    sage: 'var(--sage)',
  };

  return (
    <div className={styles.activityItem}>
      <div className={styles.activityIcon} style={{ background: bgMap[colour], color: fgMap[colour] }}>
        {icon === 'camera' && (
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z" /><circle cx="12" cy="13" r="3" />
          </svg>
        )}
        {icon === 'dollar' && (
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" x2="12" y1="2" y2="22" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
          </svg>
        )}
        {icon === 'search' && (
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" />
          </svg>
        )}
      </div>
      <div className={styles.activityText}>
        <strong>{address}</strong>
        <small>{detail}</small>
      </div>
      <span className={styles.activityTime}>{time}</span>
    </div>
  );
}
