import styles from './SkeletonMap.module.css';

export function SkeletonMap() {
  return (
    <div className={styles.skeleton}>
      <span className={styles.label}>Loading map...</span>
    </div>
  );
}
