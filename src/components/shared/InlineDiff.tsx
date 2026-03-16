/**
 * Inline diff review — shows old vs new values for each field
 * with accept/reject buttons. Fields are shown only when changed.
 */

import { Check, X } from 'lucide-react';
import styles from './InlineDiff.module.css';

interface DiffField {
  key: string;
  label: string;
  oldValue: string;
  newValue: string;
}

interface InlineDiffProps {
  title: string;
  fields: DiffField[];
  onAccept: (key: string, newValue: string) => void;
  onReject: (key: string) => void;
  onAcceptAll: () => void;
  onRejectAll: () => void;
}

export function InlineDiff({ title, fields, onAccept, onReject, onAcceptAll, onRejectAll }: InlineDiffProps) {
  const changedFields = fields.filter((f) => f.oldValue !== f.newValue);

  if (changedFields.length === 0) {
    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <span className={styles.title}>{title}</span>
          <span className={styles.noChanges}>No changes detected</span>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <span className={styles.title}>{title}</span>
        <span className={styles.changeCount}>{changedFields.length} change{changedFields.length !== 1 ? 's' : ''}</span>
        <div className={styles.headerActions}>
          <button className={styles.acceptAllBtn} onClick={onAcceptAll}>
            <Check size={12} /> Accept all
          </button>
          <button className={styles.rejectAllBtn} onClick={onRejectAll}>
            <X size={12} /> Reject all
          </button>
        </div>
      </div>

      <div className={styles.fields}>
        {changedFields.map((field) => (
          <div key={field.key} className={styles.field}>
            <div className={styles.fieldLabel}>{field.label}</div>
            <div className={styles.diffRow}>
              <div className={styles.oldValue}>
                <span className={styles.diffTag}>current</span>
                <span>{field.oldValue || '\u2014'}</span>
              </div>
              <div className={styles.newValue}>
                <span className={styles.diffTag}>suggested</span>
                <span>{field.newValue || '\u2014'}</span>
              </div>
            </div>
            <div className={styles.fieldActions}>
              <button className={styles.acceptBtn} onClick={() => onAccept(field.key, field.newValue)}>
                <Check size={12} /> Accept
              </button>
              <button className={styles.rejectBtn} onClick={() => onReject(field.key)}>
                <X size={12} /> Reject
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
