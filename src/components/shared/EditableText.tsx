/**
 * Inline-editable text block. Displays as plain text, click to
 * edit, saves on blur or Enter. Shows a subtle pencil icon on hover.
 */

import { useState, useRef, useEffect } from 'react';
import { Pencil, Check, X } from 'lucide-react';
import styles from './EditableText.module.css';

interface EditableTextProps {
  value: string;
  onSave: (newValue: string) => Promise<void>;
  multiline?: boolean;
  placeholder?: string;
  className?: string;
}

export function EditableText({ value, onSave, multiline = false, placeholder, className }: EditableTextProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const [saving, setSaving] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement | HTMLInputElement>(null);

  useEffect(() => {
    setDraft(value);
  }, [value]);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      if ('setSelectionRange' in inputRef.current) {
        const len = inputRef.current.value.length;
        inputRef.current.setSelectionRange(len, len);
      }
    }
  }, [isEditing]);

  async function handleSave() {
    const trimmed = draft.trim();
    if (trimmed === value.trim()) {
      setIsEditing(false);
      return;
    }
    setSaving(true);
    try {
      await onSave(trimmed);
      setIsEditing(false);
    } catch {
      // Revert on failure
      setDraft(value);
      setIsEditing(false);
    } finally {
      setSaving(false);
    }
  }

  function handleCancel() {
    setDraft(value);
    setIsEditing(false);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Escape') {
      handleCancel();
    }
    if (e.key === 'Enter' && !multiline) {
      e.preventDefault();
      void handleSave();
    }
    if (e.key === 'Enter' && e.metaKey && multiline) {
      e.preventDefault();
      void handleSave();
    }
  }

  if (isEditing) {
    return (
      <div className={styles.editContainer}>
        {multiline ? (
          <textarea
            ref={inputRef as React.RefObject<HTMLTextAreaElement>}
            className={`${styles.textarea} ${className ?? ''}`}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={saving}
            rows={4}
          />
        ) : (
          <input
            ref={inputRef as React.RefObject<HTMLInputElement>}
            className={`${styles.input} ${className ?? ''}`}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={saving}
          />
        )}
        <div className={styles.editActions}>
          <button className={styles.saveBtn} onClick={() => void handleSave()} disabled={saving}>
            <Check size={14} /> {saving ? 'Saving...' : 'Save'}
          </button>
          <button className={styles.cancelBtn} onClick={handleCancel} disabled={saving}>
            <X size={14} />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.display} onClick={() => setIsEditing(true)} title="Click to edit">
      <span className={className}>{value || placeholder || 'Click to add text...'}</span>
      <Pencil size={12} className={styles.pencilIcon} />
    </div>
  );
}
