import type React from 'react';
import { useNavigate } from 'react-router-dom';
import { Camera, ClipboardCheck, BarChart3, Eye, Footprints, MapPin as MapPinIcon, ChevronDown, ChevronRight } from 'lucide-react';
import { colours } from '../../theme';
import { LoadingSpinner } from '../shared/LoadingSpinner';
import type { MapPin, ActivityItem, FeatureType } from '../../types/common';
import styles from '../../pages/Dashboard.module.css';

export const PIN_COLOURS: Record<FeatureType, string> = {
  snap: colours.terracotta,
  inspect: '#3B82F6',
  appraise: colours.amber,
  monitor: colours.copper,
  explore: colours.sageBright,
};

export const FEATURE_ROUTES: Record<FeatureType, string> = {
  snap: '/app/snaps',
  inspect: '/app/inspections',
  appraise: '/app/appraisals',
  monitor: '/app/monitor',
  explore: '/app/walks',
};

/** Single-letter pin icons for colour-blind differentiation on the map. */
export const PIN_ICONS: Record<FeatureType, string> = {
  snap: 'S',
  inspect: 'I',
  appraise: 'A',
  monitor: 'M',
  explore: 'W',
};

export const FEATURE_LABELS: Record<FeatureType, string> = {
  snap: 'Snap',
  inspect: 'Inspection',
  appraise: 'Appraisal',
  monitor: 'Monitor',
  explore: 'Walk',
};

interface PropertyGroup {
  key: string;
  address: string;
  suburb: string;
  lastDate: string;
  counts: Record<FeatureType, number>;
  items: ActivityItem[];
  latitude: number | null;
  longitude: number | null;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: '2-digit' });
}

function groupByProperty(items: ActivityItem[], pins: MapPin[]): PropertyGroup[] {
  const groups: Record<string, PropertyGroup> = {};

  for (const item of items) {
    const key = item.address.toLowerCase().trim();
    const existing = groups[key];

    if (existing) {
      existing.counts[item.type] = (existing.counts[item.type] ?? 0) + 1;
      existing.items.push(item);
      if (item.createdAt > existing.lastDate) existing.lastDate = item.createdAt;
    } else {
      const counts: Record<FeatureType, number> = { snap: 0, inspect: 0, appraise: 0, monitor: 0, explore: 0 };
      counts[item.type] = 1;
      const pin = pins.find((p) => p.address.toLowerCase().trim() === key);
      groups[key] = {
        key,
        address: item.address,
        suburb: item.suburb,
        lastDate: item.createdAt,
        counts,
        items: [item],
        latitude: pin?.latitude ?? null,
        longitude: pin?.longitude ?? null,
      };
    }
  }

  return Object.values(groups).sort((a, b) => new Date(b.lastDate).getTime() - new Date(a.lastDate).getTime());
}

interface PropertyGroupCardProps {
  readonly group: PropertyGroup;
  readonly isExpanded: boolean;
  readonly onExpandProperty: (key: string | null) => void;
  readonly onFlyTo: (lng: number, lat: number) => void;
  readonly onNavigate: (path: string) => void;
}

function PropertyGroupCard({
  group,
  isExpanded,
  onExpandProperty,
  onFlyTo,
  onNavigate,
}: Readonly<PropertyGroupCardProps>) {
  function handlePropertyClick(): void {
    onExpandProperty(isExpanded ? null : group.key);
    if (group.latitude && group.longitude) {
      onFlyTo(group.longitude, group.latitude);
    }
  }

  return (
    <div className={`${styles.propertyGroup} ${isExpanded ? styles.propertyGroupExpanded : ''}`}>
      <button className={styles.activityCard} onClick={handlePropertyClick}>
        <span className={styles.expandChevron}>
          {isExpanded ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
        </span>
        <div className={styles.propertyInfo}>
          <div className={styles.propertyAddressRow}>
            <MapPinIcon size={13} className={styles.propertyIcon} />
            <span className={styles.activityAddress}>{group.address}</span>
          </div>
          <span className={styles.propertySub}>{group.suburb}</span>
          <div className={styles.featureBadges}>
            {group.counts.snap > 0 && (
              <span className={styles.featureBadge} style={{ color: PIN_COLOURS.snap }}>
                <Camera size={11} /> {group.counts.snap}
              </span>
            )}
            {group.counts.inspect > 0 && (
              <span className={styles.featureBadge} style={{ color: PIN_COLOURS.inspect }}>
                <ClipboardCheck size={11} /> {group.counts.inspect}
              </span>
            )}
            {group.counts.appraise > 0 && (
              <span className={styles.featureBadge} style={{ color: PIN_COLOURS.appraise }}>
                <BarChart3 size={11} /> {group.counts.appraise}
              </span>
            )}
            {group.counts.monitor > 0 && (
              <span className={styles.featureBadge} style={{ color: PIN_COLOURS.monitor }}>
                <Eye size={11} /> {group.counts.monitor}
              </span>
            )}
            {group.counts.explore > 0 && (
              <span className={styles.featureBadge} style={{ color: PIN_COLOURS.explore }}>
                <Footprints size={11} /> {group.counts.explore}
              </span>
            )}
          </div>
        </div>
        <span className={styles.activityDate}>{formatDate(group.lastDate)}</span>
      </button>

      {isExpanded && (
        <div className={styles.propertyItems}>
          {group.items.map((item) => (
            <button
              key={`${item.type}-${item.id}`}
              className={styles.propertyItem}
              onClick={() => onNavigate(`${FEATURE_ROUTES[item.type]}/${item.id}`)}
            >
              <span className={styles.propertyItemDot} style={{ backgroundColor: PIN_COLOURS[item.type] }} />
              <span className={styles.propertyItemType}>{FEATURE_LABELS[item.type]}</span>
              <span className={styles.propertyItemSummary}>{item.summary}</span>
              <span className={styles.propertyItemDate}>{formatDate(item.createdAt)}</span>
            </button>
          ))}
          <button
            className={styles.viewAllButton}
            onClick={() => onNavigate(`/app/properties/${encodeURIComponent(group.key)}`)}
          >
            View all records
          </button>
        </div>
      )}
    </div>
  );
}

interface ActivityPanelProps {
  readonly activity: ActivityItem[];
  readonly pins: MapPin[];
  readonly isLoading: boolean;
  readonly expandedProperty: string | null;
  readonly onExpandProperty: (key: string | null) => void;
  readonly onFlyTo: (lng: number, lat: number) => void;
}

export function ActivityPanel({
  activity,
  pins,
  isLoading,
  expandedProperty,
  onExpandProperty,
  onFlyTo,
}: Readonly<ActivityPanelProps>) {
  const navigate = useNavigate();

  function renderContent(): React.ReactNode {
    if (isLoading) return <LoadingSpinner message="Loading activity..." />;
    if (activity.length === 0) {
      return (
        <div className={styles.emptyState}>
          <p className={styles.emptyText}>No activity yet</p>
          <p className={styles.emptyHint}>Complete a snap or inspection on the iOS app to see it here.</p>
        </div>
      );
    }
    return (
      <div className={styles.activityList}>
        {groupByProperty(activity, pins).map((group) => (
          <PropertyGroupCard
            key={group.key}
            group={group}
            isExpanded={expandedProperty === group.key}
            onExpandProperty={onExpandProperty}
            onFlyTo={onFlyTo}
            onNavigate={navigate}
          />
        ))}
      </div>
    );
  }

  return (
    <aside className={styles.activityPanel}>
      <h2 className={styles.activityTitle}>Properties</h2>
      {renderContent()}
    </aside>
  );
}
