/**
 * Upgrade prompt — shown to free-tier users when accessing gated features.
 * Directs them to the pricing page.
 */

import { Link } from 'react-router-dom';
import { Lock, ArrowRight } from 'lucide-react';
import styles from './UpgradePrompt.module.css';

interface UpgradePromptProps {
  feature: string;
}

export function UpgradePrompt({ feature }: UpgradePromptProps) {
  return (
    <div className={styles.card}>
      <div className={styles.icon}>
        <Lock size={22} />
      </div>
      <h2 className={styles.heading}>Upgrade to Pro to unlock {feature}</h2>
      <p className={styles.description}>
        This feature is available on the Pro plan and above.
        Upgrade to get full access to {feature} and more.
      </p>
      <Link to="/pricing" className={styles.link}>
        View plans <ArrowRight size={16} />
      </Link>
    </div>
  );
}
