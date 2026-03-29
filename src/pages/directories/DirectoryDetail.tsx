/**
 * DirectoryDetail — lists all properties belonging to a directory,
 * with activity count badges and status indicators.
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  MapPin, Calendar, Camera, ClipboardCheck, BarChart3, Eye,
  Plus, Building, Share2, X, Trash2,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useDirectoryQuery } from '../../hooks/queries/useDirectories';
import { usePropertiesByDirectoryQuery, useCreateProperty } from '../../hooks/queries/useProperties';
import { Breadcrumb } from '../../components/shared/Breadcrumb';
import { SkeletonCard } from '../../components/shared/SkeletonCard';
import { ErrorMessage } from '../../components/shared/ErrorMessage';
import {
  searchUsers,
  listDirectoryShares,
  shareDirectory,
  removeDirectoryShare,
  type DirectoryShare,
  type UserSearchResult,
} from '../../services/sharingService';
import type { PropertyStatus } from '../../types/common';
import styles from './DirectoryDetail.module.css';

function formatDate(iso: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  return `${d.getDate()} ${d.toLocaleDateString('en-AU', { month: 'short' })} ${String(d.getFullYear()).slice(2)}`;
}

function statusClassName(status: PropertyStatus): string {
  switch (status) {
    case 'active': return styles.statusActive;
    case 'under_offer': return styles.statusUnderOffer;
    case 'settled': return styles.statusSettled;
    case 'archived': return styles.statusArchived;
  }
}

function statusLabel(status: PropertyStatus): string {
  switch (status) {
    case 'active': return 'Active';
    case 'under_offer': return 'Under Offer';
    case 'settled': return 'Settled';
    case 'archived': return 'Archived';
  }
}

export default function DirectoryDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: directory, isLoading: dirLoading, error: dirError, refetch: refetchDir } = useDirectoryQuery(id);
  const { data: properties = [], isLoading: propsLoading, error: propsError, refetch: refetchProps } = usePropertiesByDirectoryQuery(id);
  const [showModal, setShowModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const isOwner = directory?.userId === user?.id;

  const isLoading = dirLoading || propsLoading;
  const error = dirError || propsError;

  function handlePropertyCreated() {
    setShowModal(false);
  }

  if (isLoading) return <SkeletonCard count={4} />;
  if (error) return <ErrorMessage message={error instanceof Error ? error.message : 'Failed to load directory'} onRetry={() => { void refetchDir(); void refetchProps(); }} />;
  if (!directory) return <ErrorMessage message="Directory not found" type="notFound" />;

  return (
    <div className={styles.page}>
      <Breadcrumb segments={[
        { label: 'Dashboard', path: '/app' },
        { label: 'Directories', path: '/app/directories' },
        { label: directory.name },
      ]} />

      <div className={styles.header}>
        <div className={styles.titleRow}>
          <span
            className={styles.colourDot}
            style={{ background: directory.colour ?? '#78716C' }}
          />
          <h1 className={styles.title}>{directory.name}</h1>
          <span className={styles.count}>{properties.length}</span>
        </div>
        <div className={styles.headerActions}>
          {isOwner && (
            <button className={styles.shareButton} onClick={() => setShowShareModal(true)}>
              <Share2 size={16} /> Share
            </button>
          )}
          <button className={styles.addButton} onClick={() => setShowModal(true)}>
            <Plus size={16} /> Add Property
          </button>
        </div>
      </div>

      {directory.description && (
        <p className={styles.description}>{directory.description}</p>
      )}

      {properties.length === 0 ? (
        <p className={styles.empty}>
          No properties in this directory yet. Add one to get started.
        </p>
      ) : (
        <div className={styles.grid}>
          {properties.map((p) => (
            <button
              key={p.id}
              className={styles.card}
              onClick={() => navigate(`/app/directories/${id}/properties/${p.id}`)}
            >
              {p.thumbnailUrl ? (
                <div className={styles.thumbnail}>
                  <img src={p.thumbnailUrl} alt="" className={styles.thumbnailImg} loading="lazy" width={64} height={64} />
                </div>
              ) : (
                <div className={styles.thumbnailPlaceholder}>
                  <Building size={20} />
                </div>
              )}

              <div className={styles.cardContent}>
                <div className={styles.addressRow}>
                  <MapPin size={14} className={styles.icon} />
                  <span className={styles.address}>{p.address}</span>
                </div>
                <div className={styles.metaRow}>
                  {p.suburb && (
                    <>
                      <span className={styles.suburb}>{p.suburb}</span>
                      <span className={styles.sep}>-</span>
                    </>
                  )}
                  {p.lastActivityAt && (
                    <>
                      <Calendar size={11} className={styles.icon} />
                      <span className={styles.date}>{formatDate(p.lastActivityAt)}</span>
                    </>
                  )}
                </div>
                <div className={styles.badges}>
                  {p.snapCount > 0 && (
                    <span className={styles.badge} style={{ color: '#D4653B' }}>
                      <Camera size={12} /> {p.snapCount}
                    </span>
                  )}
                  {p.inspectionCount > 0 && (
                    <span className={styles.badge} style={{ color: '#3B82F6' }}>
                      <ClipboardCheck size={12} /> {p.inspectionCount}
                    </span>
                  )}
                  {p.appraisalCount > 0 && (
                    <span className={styles.badge} style={{ color: '#B0A08A' }}>
                      <BarChart3 size={12} /> {p.appraisalCount}
                    </span>
                  )}
                  {p.monitorCount > 0 && (
                    <span className={styles.badge} style={{ color: '#B45309' }}>
                      <Eye size={12} /> {p.monitorCount}
                    </span>
                  )}
                </div>
              </div>

              <span className={`${styles.statusBadge} ${statusClassName(p.status)}`}>
                {statusLabel(p.status)}
              </span>

              <span className={styles.totalBadge}>{p.totalRecords}</span>
            </button>
          ))}
        </div>
      )}

      {showModal && id && (
        <AddPropertyModal
          directoryId={id}
          onClose={() => setShowModal(false)}
          onCreated={handlePropertyCreated}
        />
      )}

      {showShareModal && id && (
        <ShareDirectoryModal
          directoryId={id}
          onClose={() => setShowShareModal(false)}
        />
      )}
    </div>
  );
}

/* ---------- Add property modal ---------- */

interface AddPropertyModalProps {
  directoryId: string;
  onClose: () => void;
  onCreated: () => void;
}

function AddPropertyModal({ directoryId, onClose, onCreated }: AddPropertyModalProps) {
  const [address, setAddress] = useState('');
  const [suburb, setSuburb] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const createMutation = useCreateProperty();

  useEffect(() => {
    inputRef.current?.focus();

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
    if (!address.trim()) return;
    createMutation.mutate(
      {
        directoryId,
        address: address.trim(),
        suburb: suburb.trim() || undefined,
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
        aria-label="Add property"
      >
        <h3 className={styles.modalTitle}>Add Property</h3>
        <form onSubmit={handleSubmit}>
          <div className={styles.formGroup}>
            <label className={styles.formLabel} htmlFor="prop-address">Address</label>
            <input
              ref={inputRef}
              id="prop-address"
              className={styles.formInput}
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="e.g. 42 Smith Street, Surry Hills"
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.formLabel} htmlFor="prop-suburb">Suburb (optional)</label>
            <input
              id="prop-suburb"
              className={styles.formInput}
              type="text"
              value={suburb}
              onChange={(e) => setSuburb(e.target.value)}
              placeholder="e.g. Surry Hills"
            />
          </div>

          <div className={styles.modalActions}>
            <button type="button" className={styles.cancelButton} onClick={onClose}>
              Cancel
            </button>
            <button
              type="submit"
              className={styles.submitButton}
              disabled={!address.trim() || createMutation.isPending}
            >
              {createMutation.isPending ? 'Adding...' : 'Add'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ---------- Share directory modal ---------- */

interface ShareDirectoryModalProps {
  directoryId: string;
  onClose: () => void;
}

function ShareDirectoryModal({ directoryId, onClose }: ShareDirectoryModalProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<UserSearchResult[]>([]);
  const [shares, setShares] = useState<DirectoryShare[]>([]);
  const [isSharing, setIsSharing] = useState(false);
  const [error, setError] = useState('');
  const modalRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const loadShares = useCallback(async () => {
    const s = await listDirectoryShares(directoryId);
    setShares(s);
  }, [directoryId]);

  useEffect(() => {
    loadShares();
    inputRef.current?.focus();

    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleKey);
      document.body.style.overflow = '';
    };
  }, [onClose, loadShares]);

  async function handleSearch(value: string) {
    setQuery(value);
    if (value.length < 2) { setResults([]); return; }
    const r = await searchUsers(value);
    const sharedIds = new Set(shares.map((s) => s.sharedWithId));
    setResults(r.filter((u) => !sharedIds.has(u.id)));
  }

  async function handleShare(user: UserSearchResult) {
    setIsSharing(true);
    setError('');
    const ok = await shareDirectory(directoryId, user.id);
    if (ok) {
      setQuery('');
      setResults([]);
      await loadShares();
    } else {
      setError('Failed to share directory');
    }
    setIsSharing(false);
  }

  async function handleRemove(shareId: string) {
    const ok = await removeDirectoryShare(shareId);
    if (ok) await loadShares();
  }

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div
        ref={modalRef}
        className={styles.modal}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Share directory"
      >
        <div className={styles.shareHeader}>
          <h3 className={styles.modalTitle}>Share Directory</h3>
          <button className={styles.closeButton} onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </div>

        <div className={styles.formGroup}>
          <label className={styles.formLabel} htmlFor="share-search">Search by name or email</label>
          <input
            ref={inputRef}
            id="share-search"
            className={styles.formInput}
            type="text"
            value={query}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="Type a name or email..."
          />
        </div>

        {results.length > 0 && (
          <div className={styles.searchResults}>
            {results.map((u) => (
              <button
                key={u.id}
                className={styles.searchResultItem}
                onClick={() => handleShare(u)}
                disabled={isSharing}
              >
                <div className={styles.userInfo}>
                  <span className={styles.userName}>{u.displayName}</span>
                  <span className={styles.userEmail}>{u.email}</span>
                </div>
                <span className={styles.shareAction}>Share</span>
              </button>
            ))}
          </div>
        )}

        {query.length >= 2 && results.length === 0 && (
          <p className={styles.noResults}>No users found</p>
        )}

        {error && <p className={styles.shareError}>{error}</p>}

        {shares.length > 0 && (
          <div className={styles.sharesSection}>
            <h4 className={styles.sharesTitle}>Shared with</h4>
            {shares.map((s) => (
              <div key={s.id} className={styles.shareRow}>
                <div className={styles.userInfo}>
                  <span className={styles.userName}>{s.sharedWithName}</span>
                  <span className={styles.userEmail}>{s.sharedWithEmail}</span>
                </div>
                <button
                  className={styles.removeShareButton}
                  onClick={() => handleRemove(s.id)}
                  aria-label={`Remove ${s.sharedWithName}`}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
