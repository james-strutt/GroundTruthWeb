import styles from './PhoneFrame.module.css';

interface PhoneFrameProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * iPhone-style device frame that wraps screen content.
 * Matches the prototype's frame design.
 */
export function PhoneFrame({ children, className = '' }: PhoneFrameProps) {
  return (
    <div className={`${styles.container} ${className}`}>
      <div className={styles.frame}>
        <div className={styles.screen}>
          {/* Dynamic Island */}
          <div className={styles.island} />
          {children}
          {/* Home indicator */}
          <div className={styles.homeIndicator} />
        </div>
      </div>
    </div>
  );
}
