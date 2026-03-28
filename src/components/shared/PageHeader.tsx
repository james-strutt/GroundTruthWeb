import type { ReactNode } from 'react';
import styles from './PageHeader.module.css';

interface PageHeaderProps {
  icon: ReactNode;
  title: string;
  count?: number;
  actions?: ReactNode;
}

export function PageHeader({ icon, title, count, actions }: PageHeaderProps) {
  return (
    <div className={styles.header}>
      <span className={styles.icon}>{icon}</span>
      <h1 className={styles.title}>{title}</h1>
      {count !== undefined && <span className={styles.count}>{count}</span>}
      {actions && <div className={styles.actions}>{actions}</div>}
    </div>
  );
}
