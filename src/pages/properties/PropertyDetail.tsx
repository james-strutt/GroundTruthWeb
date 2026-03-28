/**
 * PropertyDetail — tabbed view of a single property with all its
 * activities (snaps, inspections, appraisals, monitor) organised
 * under a unified header with status and notes.
 */

import { useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  MapPin, Camera, ClipboardCheck, BarChart3, Eye, Layout,
} from 'lucide-react';
import { updateProperty } from '../../services/propertyService';
import { usePropertyQuery, usePropertyActivitiesQuery } from '../../hooks/queries/useProperties';
import { useDirectoryQuery } from '../../hooks/queries/useDirectories';
import { Breadcrumb } from '../../components/shared/Breadcrumb';
import { FeatureCard } from '../../components/shared/FeatureCard';
import { SkeletonCard } from '../../components/shared/SkeletonCard';
import { ErrorMessage } from '../../components/shared/ErrorMessage';
import { NearbyDAs } from '../../components/shared/NearbyDAs';
import { SpatialRiskBadges } from '../../components/shared/SpatialRiskBadges';
import { colours } from '../../theme';
import type {
  Property, PropertyStatus,
  Snap, Inspection, Appraisal, WatchedProperty,
} from '../../types/common';
import styles from './PropertyDetail.module.css';

type TabId = 'overview' | 'snaps' | 'inspections' | 'appraisals' | 'monitor';

function formatCompact(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${Math.round(n / 1_000)}K`;
  return `$${n}`;
}

function formatDate(iso: string): string {
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

export default function PropertyDetailPage() {
  const { propId, id } = useParams<{
    propId?: string;
    dirId?: string;
    id?: string;
  }>();

  const propertyId = propId ?? id;

  const { data: property, isLoading: propertyLoading, error: propertyError, refetch: refetchProperty } = usePropertyQuery(propertyId);
  const { data: activities, isLoading: activitiesLoading } = usePropertyActivitiesQuery(propertyId);
  const { data: directory } = useDirectoryQuery(property?.directoryId);
  const [activeTab, setActiveTab] = useState<TabId>('overview');

  const isLoading = propertyLoading || activitiesLoading;

  if (isLoading) return <SkeletonCard count={3} />;
  if (propertyError) return <ErrorMessage message={propertyError.message ?? 'Failed to load property'} onRetry={() => void refetchProperty()} />;
  if (!property || !activities) return <ErrorMessage message="Property not found" type="notFound" />;

  const tabs: { id: TabId; label: string; icon: React.ReactNode; count: number }[] = [
    { id: 'overview', label: 'Overview', icon: <Layout size={14} />, count: 0 },
    { id: 'snaps', label: 'Snaps', icon: <Camera size={14} />, count: activities.snaps.length },
    { id: 'inspections', label: 'Inspections', icon: <ClipboardCheck size={14} />, count: activities.inspections.length },
    { id: 'appraisals', label: 'Appraisals', icon: <BarChart3 size={14} />, count: activities.appraisals.length },
    { id: 'monitor', label: 'Monitor', icon: <Eye size={14} />, count: activities.watched.length },
  ];

  const breadcrumbs = directory
    ? [
        { label: 'Dashboard', path: '/app' },
        { label: directory.name, path: `/app/directories/${directory.id}` },
        { label: property.address },
      ]
    : [
        { label: 'Dashboard', path: '/app' },
        { label: property.address },
      ];

  return (
    <div className={styles.page}>
      <Breadcrumb segments={breadcrumbs} />

      <div className={styles.propertyHeader}>
        <div className={styles.headerLeft}>
          <h1 className={styles.address}>{property.address}</h1>
          <div className={styles.meta}>
            <MapPin size={14} />
            {property.suburb ?? 'Unknown suburb'}
            <span className={styles.dot} />
            Created {formatDate(property.createdAt)}
          </div>
        </div>
        <span className={`${styles.statusBadge} ${statusClassName(property.status)}`}>
          {statusLabel(property.status)}
        </span>
      </div>

      <div className={styles.tabs}>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            className={`${styles.tab} ${activeTab === tab.id ? styles.tabActive : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.icon}
            {tab.label}
            {tab.count > 0 && <span className={styles.tabCount}>{tab.count}</span>}
          </button>
        ))}
      </div>

      {activeTab === 'overview' && (
        <OverviewTab
          property={property}
          activities={activities}
          onPropertyUpdated={() => void refetchProperty()}
        />
      )}
      {activeTab === 'snaps' && (
        <SnapsTab snaps={activities.snaps} />
      )}
      {activeTab === 'inspections' && (
        <InspectionsTab inspections={activities.inspections} />
      )}
      {activeTab === 'appraisals' && (
        <AppraisalsTab appraisals={activities.appraisals} />
      )}
      {activeTab === 'monitor' && (
        <MonitorTab watched={activities.watched} />
      )}
    </div>
  );
}

/* ---------- Overview Tab ---------- */

interface OverviewTabProps {
  property: Property;
  activities: {
    snaps: Snap[];
    inspections: Inspection[];
    appraisals: Appraisal[];
    watched: WatchedProperty[];
  };
  onPropertyUpdated: () => void;
}

function OverviewTab({ property, activities, onPropertyUpdated }: OverviewTabProps) {
  const [notes, setNotes] = useState(property.notes ?? '');
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const totalRecords = activities.snaps.length
    + activities.inspections.length
    + activities.appraisals.length
    + activities.watched.length;

  const hasNoActivity = totalRecords === 0;

  async function handleSaveNotes() {
    setSaving(true);
    setSaveError(null);
    try {
      const ok = await updateProperty(property.id, { notes });
      if (!ok) throw new Error('Failed to save notes');
      onPropertyUpdated();
    } catch (err: unknown) {
      setSaveError(err instanceof Error ? err.message : 'Failed to save notes');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <div className={styles.overviewGrid}>
        <div className={styles.overviewCard}>
          <div className={styles.overviewLabel}>Status</div>
          <div className={styles.overviewValue}>
            {statusLabel(property.status)}
          </div>
        </div>
        <div className={styles.overviewCard}>
          <div className={styles.overviewLabel}>Total Records</div>
          <div className={styles.overviewValue}>{totalRecords}</div>
        </div>
      </div>

      {hasNoActivity && (
        <p className={styles.emptyTab} style={{ textAlign: 'center', marginTop: '1.5rem' }}>
          No activity yet for this property. Capture data on the iOS app to see it here.
        </p>
      )}

      <div className={styles.overviewCardFull}>
        <div className={styles.overviewLabel}>Activity Completeness</div>
        <div className={styles.completenessGrid}>
          <div className={styles.completenessItem}>
            <Camera
              size={18}
              className={activities.snaps.length > 0 ? styles.completenessIconActive : styles.completenessIcon}
            />
            <span className={styles.completenessLabel}>Snaps</span>
            <span className={styles.completenessCount}>{activities.snaps.length}</span>
          </div>
          <div className={styles.completenessItem}>
            <ClipboardCheck
              size={18}
              className={activities.inspections.length > 0 ? styles.completenessIconActive : styles.completenessIcon}
            />
            <span className={styles.completenessLabel}>Inspect</span>
            <span className={styles.completenessCount}>{activities.inspections.length}</span>
          </div>
          <div className={styles.completenessItem}>
            <BarChart3
              size={18}
              className={activities.appraisals.length > 0 ? styles.completenessIconActive : styles.completenessIcon}
            />
            <span className={styles.completenessLabel}>Appraise</span>
            <span className={styles.completenessCount}>{activities.appraisals.length}</span>
          </div>
          <div className={styles.completenessItem}>
            <Eye
              size={18}
              className={activities.watched.length > 0 ? styles.completenessIconActive : styles.completenessIcon}
            />
            <span className={styles.completenessLabel}>Monitor</span>
            <span className={styles.completenessCount}>{activities.watched.length}</span>
          </div>
        </div>
      </div>

      <div className={styles.overviewCardFull} style={{ marginTop: '0.75rem' }}>
        <div className={styles.overviewLabel}>Notes</div>
        <textarea
          className={styles.notesArea}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Add notes about this property..."
        />
        {notes !== (property.notes ?? '') && (
          <div className={styles.notesSaveRow}>
            <button
              className={styles.saveButton}
              onClick={() => void handleSaveNotes()}
              disabled={saving}
            >
              {saving ? 'Saving...' : 'Save Notes'}
            </button>
            {saveError && (
              <span style={{ fontFamily: 'var(--font-body)', fontSize: '0.75rem', color: '#ef4444' }}>
                {saveError}
              </span>
            )}
          </div>
        )}
      </div>

      {property.latitude !== null && property.longitude !== null && (
        <>
          <div className={styles.overviewCardFull} style={{ marginTop: '0.75rem' }}>
            <div className={styles.overviewLabel}>Spatial Risks</div>
            <SpatialRiskBadges latitude={property.latitude} longitude={property.longitude} />
          </div>

          <NearbyDAs latitude={property.latitude} longitude={property.longitude} />
        </>
      )}
    </div>
  );
}

/* ---------- Snaps Tab ---------- */

function SnapsTab({ snaps }: { snaps: Snap[] }) {
  if (snaps.length === 0) {
    return <p className={styles.emptyTab}>No snaps recorded for this property yet.</p>;
  }
  return (
    <div className={styles.activityGrid}>
      {snaps.map((s) => (
        <FeatureCard
          key={s.id}
          to={`/app/snaps/${s.id}`}
          address={s.address}
          suburb={s.suburb}
          date={s.createdAt}
          photoUrl={s.photoUrl}
          metric={s.aiAnalysis?.condition ?? undefined}
          metricLabel="Condition"
        />
      ))}
    </div>
  );
}

/* ---------- Inspections Tab ---------- */

function InspectionsTab({ inspections }: { inspections: Inspection[] }) {
  if (inspections.length === 0) {
    return <p className={styles.emptyTab}>No inspections recorded for this property yet.</p>;
  }
  return (
    <div className={styles.activityGrid}>
      {inspections.map((i) => (
        <FeatureCard
          key={i.id}
          to={`/app/inspections/${i.id}`}
          address={i.address}
          suburb={i.suburb}
          date={i.createdAt}
          metric={i.overallScore ? `${i.overallScore}/10` : undefined}
          metricLabel="Score"
        />
      ))}
    </div>
  );
}

/* ---------- Appraisals Tab ---------- */

function AppraisalsTab({ appraisals }: { appraisals: Appraisal[] }) {
  if (appraisals.length === 0) {
    return <p className={styles.emptyTab}>No appraisals recorded for this property yet.</p>;
  }
  return (
    <div className={styles.activityGrid}>
      {appraisals.map((a) => (
        <FeatureCard
          key={a.id}
          to={`/app/appraisals/${a.id}`}
          address={a.address}
          suburb={a.suburb}
          date={a.createdAt}
          metric={a.priceEstimate ? formatCompact(a.priceEstimate.estimatedValue) : undefined}
          metricLabel="Estimate"
          metricColour={colours.terracotta}
        />
      ))}
    </div>
  );
}

/* ---------- Monitor Tab ---------- */

function MonitorTab({ watched }: { watched: WatchedProperty[] }) {
  if (watched.length === 0) {
    return <p className={styles.emptyTab}>No monitor records for this property yet.</p>;
  }
  return (
    <div className={styles.activityGrid}>
      {watched.map((w) => (
        <FeatureCard
          key={w.id}
          to={`/app/monitor/${w.id}`}
          address={w.address}
          suburb={w.suburb}
          date={w.lastVisitedAt}
          metric={`${w.changes.length} change${w.changes.length !== 1 ? 's' : ''}`}
          metricLabel={`${w.visitCount} visit${w.visitCount !== 1 ? 's' : ''}`}
        />
      ))}
    </div>
  );
}

