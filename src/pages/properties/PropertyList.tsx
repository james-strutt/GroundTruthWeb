/**
 * Properties page — shows all properties with activity counts per feature type.
 */

import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building, Camera, ClipboardCheck, BarChart3, Eye, MapPin, Calendar } from 'lucide-react';
import { useAllPropertiesQuery } from '../../hooks/queries/useProperties';
import { PageHeader } from '../../components/shared/PageHeader';
import { ErrorMessage } from '../../components/shared/ErrorMessage';
import { DataTable, type Column } from '../../components/shared/DataTable';
import { ViewToggle } from '../../components/shared/ViewToggle';
import { SkeletonCard } from '../../components/shared/SkeletonCard';
import { exportToCsv } from '../../utils/csvExport';
import { formatDate } from '../../utils/formatDate';
import type { PropertySummary } from '../../types/common';
import styles from './PropertyList.module.css';

const TABLE_COLUMNS: Column<PropertySummary>[] = [
  { key: 'address', label: 'Address', sortable: true },
  { key: 'suburb', label: 'Suburb', sortable: true },
  { key: 'totalRecords', label: 'Records', sortable: true },
  { key: 'lastActivityAt', label: 'Last Activity', sortable: true, render: (row) => formatDate(row.lastActivityAt) },
];

const CSV_COLUMNS = [
  { key: 'address', label: 'Address' },
  { key: 'suburb', label: 'Suburb' },
  { key: 'totalRecords', label: 'Records' },
  { key: 'lastActivityAt', label: 'Last Activity' },
];

export default function PropertyListPage() {
  const navigate = useNavigate();
  const { data: properties = [], isLoading, error, refetch } = useAllPropertiesQuery();
  const [view, setView] = useState<'card' | 'table'>('card');

  const handleExport = useCallback(() => {
    const rows = properties.map((p) => ({
      address: p.address,
      suburb: p.suburb ?? '',
      totalRecords: String(p.totalRecords),
      lastActivityAt: formatDate(p.lastActivityAt),
    }));
    exportToCsv('properties', CSV_COLUMNS, rows);
  }, [properties]);

  return (
    <div>
      <PageHeader
        icon={<Building size={22} />}
        title="Properties"
        count={properties.length}
        actions={<ViewToggle view={view} onViewChange={setView} onExport={handleExport} />}
      />
      {isLoading ? (
        <SkeletonCard count={4} />
      ) : error ? (
        <ErrorMessage message={error instanceof Error ? error.message : 'Failed to load properties'} onRetry={() => void refetch()} />
      ) : properties.length === 0 ? (
        <p className={styles.empty}>No properties yet. Capture data on the iOS app and sync to cloud.</p>
      ) : view === 'table' ? (
        <DataTable<PropertySummary>
          columns={TABLE_COLUMNS}
          data={properties}
          keyField="id"
          onRowClick={(row) => navigate(`/app/properties/${row.id}`)}
        />
      ) : (
        <div className={styles.grid}>
          {properties.map((p) => (
            <button
              key={p.id}
              className={styles.card}
              onClick={() => navigate(`/app/properties/${p.id}`)}
            >
              {p.thumbnailUrl && (
                <div className={styles.thumbnail}>
                  <img src={p.thumbnailUrl} alt="" className={styles.thumbnailImg} loading="lazy" width={64} height={64} />
                </div>
              )}
              <div className={styles.content}>
                <div className={styles.addressRow}>
                  <MapPin size={14} className={styles.icon} />
                  <span className={styles.address}>{p.address}</span>
                </div>
                <div className={styles.metaRow}>
                  <span className={styles.suburb}>{p.suburb ?? ''}</span>
                  <span className={styles.sep}>-</span>
                  <Calendar size={11} className={styles.icon} />
                  <span className={styles.date}>{formatDate(p.lastActivityAt)}</span>
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
              <span className={styles.totalBadge}>{p.totalRecords}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
