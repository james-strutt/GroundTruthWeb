/**
 * DirectoryList — grid of directory cards with summary stats.
 * Entry point for the directory-first property organisation.
 */

import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Building, Calendar, Activity, FolderOpen } from 'lucide-react';
import { useDirectoriesQuery, useCreateDirectory } from '../../hooks/queries/useDirectories';
import { SkeletonCard } from '../../components/shared/SkeletonCard';
import { ErrorMessage } from '../../components/shared/ErrorMessage';
import { EmptyState } from '../../components/shared/EmptyState';
import styles from './DirectoryList.module.css';

const COLOUR_OPTIONS = [
  '#D4653B', '#B45309', '#3F6212', '#1D4ED8',
  '#7C3AED', '#BE185D', '#0D9488', '#78716C',
];

function formatDate(iso: string | null): string {
  if (!iso) return 'No activity';
  const d = new Date(iso);
  return `${d.getDate()} ${d.toLocaleDateString('en-AU', { month: 'short' })} ${String(d.getFullYear()).slice(2)}`;
}

export default function DirectoryListPage() {
  const navigate = useNavigate();
  const { data: directories = [], isLoading, error, refetch } = useDirectoriesQuery();
  const [showModal, setShowModal] = useState(false);

  function handleCreated() {
    setShowModal(false);
  }

  return (
    <div>
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <h1 className={styles.title}>Directories</h1>
          {directories.length > 0 && (
            <span className={styles.count}>{directories.length}</span>
          )}
        </div>
        <button className={styles.addButton} onClick={() => setShowModal(true)}>
          <Plus size={16} /> New Directory
        </button>
      </div>

      {isLoading ? (
        <SkeletonCard count={4} />
      ) : error ? (
        <ErrorMessage message={error instanceof Error ? error.message : 'Failed to load directories'} onRetry={() => void refetch()} />
      ) : directories.length === 0 ? (
        <EmptyState
          icon={<FolderOpen size={48} />}
          title="No directories yet"
          subtitle="Create your first directory to organise properties"
        />
      ) : (
        <div className={styles.grid}>
          {directories.map((dir) => (
            <button
              key={dir.id}
              className={styles.card}
              onClick={() => navigate(`/app/directories/${dir.id}`)}
            >
              <div className={styles.cardHeader}>
                <span
                  className={styles.colourDot}
                  style={{ background: dir.colour ?? '#78716C' }}
                />
                <span className={styles.cardName}>{dir.name}</span>
              </div>

              {dir.description && (
                <p className={styles.cardDescription}>{dir.description}</p>
              )}

              <div className={styles.cardStats}>
                <span className={styles.stat}>
                  <Building size={12} />
                  <span className={styles.statValue}>{dir.propertyCount}</span>
                  {dir.propertyCount === 1 ? 'property' : 'properties'}
                </span>
                <span className={styles.stat}>
                  <Activity size={12} />
                  <span className={styles.statValue}>{dir.totalActivityCount}</span>
                  {dir.totalActivityCount === 1 ? 'record' : 'records'}
                </span>
              </div>

              <div className={styles.cardFooter}>
                <span className={styles.lastActivity}>
                  <Calendar size={11} /> {formatDate(dir.lastActivityAt)}
                </span>
              </div>
            </button>
          ))}
        </div>
      )}

      {showModal && (
        <CreateDirectoryModal
          onClose={() => setShowModal(false)}
          onCreated={handleCreated}
        />
      )}
    </div>
  );
}

/* ---------- Create directory modal ---------- */

interface CreateDirectoryModalProps {
  onClose: () => void;
  onCreated: () => void;
}

function CreateDirectoryModal({ onClose, onCreated }: CreateDirectoryModalProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [colour, setColour] = useState(COLOUR_OPTIONS[0]!);
  const nameRef = useRef<HTMLInputElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const createMutation = useCreateDirectory();

  useEffect(() => {
    nameRef.current?.focus();

    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'Tab' && modalRef.current) {
        const focusable = modalRef.current.querySelectorAll<HTMLElement>(
          'button, input, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (focusable.length === 0) return;
        const first = focusable[0]!;
        const last = focusable[focusable.length - 1]!;
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    document.addEventListener('keydown', handleKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleKey);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    createMutation.mutate(
      {
        name: name.trim(),
        description: description.trim() || undefined,
        colour,
      },
      { onSuccess: () => onCreated() },
    );
  }

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div
        ref={modalRef}
        className={styles.modal}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Create directory"
      >
        <h3 className={styles.modalTitle}>New Directory</h3>
        <form onSubmit={handleSubmit}>
          <div className={styles.formGroup}>
            <label className={styles.formLabel} htmlFor="dir-name">Name</label>
            <input
              ref={nameRef}
              id="dir-name"
              className={styles.formInput}
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Investment Shortlist"
              maxLength={80}
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.formLabel} htmlFor="dir-desc">Description (optional)</label>
            <textarea
              id="dir-desc"
              className={styles.formTextarea}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description of this directory"
              maxLength={300}
              rows={2}
            />
          </div>

          <div className={styles.formGroup}>
            <span className={styles.formLabel}>Colour</span>
            <div className={styles.colourPicker}>
              {COLOUR_OPTIONS.map((c) => (
                <button
                  key={c}
                  type="button"
                  className={`${styles.colourSwatch} ${colour === c ? styles.colourSwatchSelected : ''}`}
                  style={{ background: c }}
                  onClick={() => setColour(c)}
                  aria-label={`Select colour ${c}`}
                />
              ))}
            </div>
          </div>

          <div className={styles.modalActions}>
            <button type="button" className={styles.cancelButton} onClick={onClose}>
              Cancel
            </button>
            <button
              type="submit"
              className={styles.submitButton}
              disabled={!name.trim() || createMutation.isPending}
            >
              {createMutation.isPending ? 'Creating...' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
