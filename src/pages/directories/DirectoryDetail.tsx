/**
 * DirectoryDetail — lists all properties belonging to a directory,
 * with activity count badges and status indicators.
 */

import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  MapPin, Calendar, Camera, ClipboardCheck, BarChart3, Eye,
  Plus, Building,
} from 'lucide-react';
import { getDirectory, listPropertiesByDirectory, createProperty } from '../../services/api';
import { Breadcrumb } from '../../components/shared/Breadcrumb';
import { LoadingSpinner } from '../../components/shared/LoadingSpinner';
import { ErrorMessage } from '../../components/shared/ErrorMessage';
import type { Directory, PropertySummary, PropertyStatus } from '../../types/common';
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
  const [directory, setDirectory] = useState<Directory | null>(null);
  const [properties, setProperties] = useState<PropertySummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);

  const fetchData = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const [dir, props] = await Promise.all([
        getDirectory(id),
        listPropertiesByDirectory(id),
      ]);
      setDirectory(dir);
      setProperties(props);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load directory');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  function handlePropertyCreated() {
    setShowModal(false);
    void fetchData();
  }

  if (loading) return <LoadingSpinner message="Loading directory..." />;
  if (error) return <ErrorMessage message={error} onRetry={() => void fetchData()} />;
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
        <button className={styles.addButton} onClick={() => setShowModal(true)}>
          <Plus size={16} /> Add Property
        </button>
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
                  <img src={p.thumbnailUrl} alt="" className={styles.thumbnailImg} />
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
  const [submitting, setSubmitting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);

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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!address.trim()) return;
    setSubmitting(true);
    try {
      const result = await createProperty({
        directoryId,
        address: address.trim(),
        suburb: suburb.trim() || undefined,
      });
      if (result) onCreated();
    } finally {
      setSubmitting(false);
    }
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
        <form onSubmit={(e) => void handleSubmit(e)}>
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
              disabled={!address.trim() || submitting}
            >
              {submitting ? 'Adding...' : 'Add'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
