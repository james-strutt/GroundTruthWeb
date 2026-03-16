/**
 * Inline diff review — shows old vs new values for each field
 * with accept/reject/edit buttons. Fields are shown only when changed.
 *
 * "Edit" lets the user cherry-pick parts of the suggestion into a
 * textarea pre-filled with the current value, with the suggestion
 * visible as reference. "Copy" copies the suggested text to clipboard.
 */

import { useState } from 'react';
import { Check, X, Pencil, Copy } from 'lucide-react';
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
  const [editing, setEditing] = useState<Record<string, string>>({});
  const [copied, setCopied] = useState<string | null>(null);

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

  function startEditing(field: DiffField): void {
    setEditing((prev) => ({ ...prev, [field.key]: field.oldValue }));
  }

  function cancelEditing(key: string): void {
    setEditing((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  }

  function saveEdited(key: string): void {
    const value = editing[key];
    if (value !== undefined) {
      onAccept(key, value);
      cancelEditing(key);
    }
  }

  async function copyToClipboard(text: string, key: string): Promise<void> {
    await navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 1500);
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
        {changedFields.map((field) => {
          const isEditing = field.key in editing;

          return (
            <div key={field.key} className={styles.field}>
              <div className={styles.fieldLabel}>{field.label}</div>

              {isEditing ? (
                /* ---- Edit mode: textarea + suggestion reference ---- */
                <div className={styles.editMode}>
                  <div className={styles.editRow}>
                    <div className={styles.editPane}>
                      <span className={styles.diffTag}>editing</span>
                      <textarea
                        className={styles.editTextarea}
                        value={editing[field.key]}
                        onChange={(e) => setEditing((prev) => ({ ...prev, [field.key]: e.target.value }))}
                        rows={Math.max(3, (editing[field.key] ?? '').split('\n').length + 1)}
                      />
                    </div>
                    <div className={styles.referencePane}>
                      <div className={styles.referencePaneHeader}>
                        <span className={styles.diffTag}>suggested (reference)</span>
                        <button
                          className={styles.copyBtn}
                          onClick={() => void copyToClipboard(field.newValue, field.key)}
                          title="Copy suggested text"
                        >
                          <Copy size={10} />
                          {copied === field.key ? 'Copied' : 'Copy'}
                        </button>
                      </div>
                      <span className={styles.referenceText}>{field.newValue || '\u2014'}</span>
                    </div>
                  </div>
                  <div className={styles.fieldActions}>
                    <button className={styles.acceptBtn} onClick={() => saveEdited(field.key)}>
                      <Check size={12} /> Save
                    </button>
                    <button className={styles.rejectBtn} onClick={() => cancelEditing(field.key)}>
                      <X size={12} /> Cancel
                    </button>
                  </div>
                </div>
              ) : (
                /* ---- Normal diff view ---- */
                <>
                  <div className={styles.diffRow}>
                    <div className={styles.oldValue}>
                      <span className={styles.diffTag}>current</span>
                      <span>{field.oldValue || '\u2014'}</span>
                    </div>
                    <div className={styles.newValue}>
                      <div className={styles.newValueHeader}>
                        <span className={styles.diffTag}>suggested</span>
                        <button
                          className={styles.copyBtn}
                          onClick={() => void copyToClipboard(field.newValue, field.key)}
                          title="Copy suggested text"
                        >
                          <Copy size={10} />
                          {copied === field.key ? 'Copied' : 'Copy'}
                        </button>
                      </div>
                      <span>{field.newValue || '\u2014'}</span>
                    </div>
                  </div>
                  <div className={styles.fieldActions}>
                    <button className={styles.acceptBtn} onClick={() => onAccept(field.key, field.newValue)}>
                      <Check size={12} /> Accept
                    </button>
                    <button className={styles.editBtn} onClick={() => startEditing(field)}>
                      <Pencil size={12} /> Edit
                    </button>
                    <button className={styles.rejectBtn} onClick={() => onReject(field.key)}>
                      <X size={12} /> Reject
                    </button>
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
