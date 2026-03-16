import { ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import styles from './Breadcrumb.module.css';

interface BreadcrumbSegment {
  label: string;
  path?: string;
}

interface BreadcrumbProps {
  segments: BreadcrumbSegment[];
}

export function Breadcrumb({ segments }: BreadcrumbProps) {
  return (
    <nav className={styles.breadcrumb} aria-label="Breadcrumb">
      {segments.map((seg, i) => (
        <span key={i} className={styles.segment}>
          {i > 0 && <ChevronRight size={12} className={styles.separator} />}
          {seg.path && i < segments.length - 1 ? (
            <Link to={seg.path} className={styles.link}>{seg.label}</Link>
          ) : (
            <span className={styles.current} title={seg.label}>{seg.label}</span>
          )}
        </span>
      ))}
    </nav>
  );
}
