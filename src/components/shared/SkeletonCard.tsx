import styles from './SkeletonCard.module.css';

interface SkeletonCardProps {
  count?: number;
}

function SingleSkeleton() {
  return (
    <div className={styles.card}>
      <div className={styles.thumbnail} />
      <div className={styles.lines}>
        <div className={`${styles.line} ${styles.lineWide}`} />
        <div className={`${styles.line} ${styles.lineNarrow}`} />
      </div>
    </div>
  );
}

export function SkeletonCard({ count = 3 }: SkeletonCardProps) {
  return (
    <>
      {Array.from({ length: count }, (_, i) => (
        <SingleSkeleton key={i} />
      ))}
    </>
  );
}
