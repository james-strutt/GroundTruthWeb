import styles from './TabBar.module.css';

interface TabBarProps {
  active?: 'home' | 'snap' | 'inspect' | 'explore' | 'monitor' | 'appraise';
}

export function TabBar({ active = 'home' }: TabBarProps) {
  return (
    <div className={styles.tabs}>
      <Tab id="home" label="Home" active={active === 'home'}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6" />
          <line x1="8" x2="8" y1="2" y2="18" />
          <line x1="16" x2="16" y1="6" y2="22" />
        </svg>
      </Tab>
      <Tab id="snap" label="Snap" active={active === 'snap'} hero>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z" />
          <circle cx="12" cy="13" r="3" />
        </svg>
      </Tab>
      <Tab id="inspect" label="Inspect" active={active === 'inspect'}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="8" />
          <path d="m21 21-4.3-4.3" />
        </svg>
      </Tab>
      <Tab id="explore" label="Explore" active={active === 'explore'}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" />
        </svg>
      </Tab>
      <Tab id="monitor" label="Monitor" active={active === 'monitor'}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
          <circle cx="12" cy="12" r="3" />
        </svg>
      </Tab>
      <Tab id="appraise" label="Appraise" active={active === 'appraise'}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="12" x2="12" y1="2" y2="22" />
          <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
        </svg>
      </Tab>
    </div>
  );
}

function Tab({ label, active, hero, children }: {
  id: string;
  label: string;
  active: boolean;
  hero?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className={`${styles.tab} ${active ? styles.active : ''} ${hero ? styles.hero : ''}`}>
      <div className={styles.icon}>{children}</div>
      <span className={styles.label}>{label}</span>
    </div>
  );
}
