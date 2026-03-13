import styles from './PhoneFrame.module.css';

interface PhoneFrameProps {
  children: React.ReactNode;
  className?: string;
  size?: 'default' | 'large';
}

export function PhoneFrame({ children, className = '', size = 'default' }: PhoneFrameProps) {
  return (
    <div className={`${styles.container} ${size === 'large' ? styles.large : ''} ${className}`}>
      <div className={styles.frame}>
        <div className={styles.screen}>
          <div className={styles.island} />
          {children}
          <div className={styles.homeIndicator} />
        </div>
      </div>
    </div>
  );
}
