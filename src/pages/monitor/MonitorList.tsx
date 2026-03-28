import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye } from 'lucide-react';
import { useWatchedQuery } from '../../hooks/queries/useMonitor';
import { PageHeader } from '../../components/shared/PageHeader';
import { FeatureCard } from '../../components/shared/FeatureCard';
import { GroupedFeatureList } from '../../components/shared/GroupedFeatureList';
import { DataTable, type Column } from '../../components/shared/DataTable';
import { ViewToggle } from '../../components/shared/ViewToggle';
import { SkeletonCard } from '../../components/shared/SkeletonCard';
import { exportToCsv } from '../../utils/csvExport';
import { formatDate } from '../../utils/formatDate';
import type { WatchedProperty } from '../../types/common';

const TABLE_COLUMNS: Column<WatchedProperty>[] = [
  { key: 'address', label: 'Address', sortable: true },
  { key: 'suburb', label: 'Suburb', sortable: true },
  { key: 'visitCount', label: 'Visits', sortable: true },
  { key: 'lastVisitedAt', label: 'Last Visited', sortable: true, render: (row) => formatDate(row.lastVisitedAt) },
];

const CSV_COLUMNS = [
  { key: 'address', label: 'Address' },
  { key: 'suburb', label: 'Suburb' },
  { key: 'visitCount', label: 'Visits' },
  { key: 'lastVisitedAt', label: 'Last Visited' },
];

export default function MonitorListPage() {
  const { data: items = [], isLoading } = useWatchedQuery();
  const [view, setView] = useState<'card' | 'table'>('card');
  const navigate = useNavigate();

  const handleExport = useCallback(() => {
    const rows = items.map((w) => ({
      address: w.address,
      suburb: w.suburb,
      visitCount: String(w.visitCount),
      lastVisitedAt: formatDate(w.lastVisitedAt),
    }));
    exportToCsv('monitored-properties', CSV_COLUMNS, rows);
  }, [items]);

  return (
    <div>
      <PageHeader
        icon={<Eye size={22} />}
        title="Monitored Properties"
        count={items.length}
        actions={<ViewToggle view={view} onViewChange={setView} onExport={handleExport} />}
      />
      {isLoading ? (
        <SkeletonCard count={4} />
      ) : view === 'table' ? (
        <DataTable<WatchedProperty>
          columns={TABLE_COLUMNS}
          data={items}
          keyField="id"
          onRowClick={(row) => navigate(`/app/monitor/${row.id}`)}
        />
      ) : (
        <GroupedFeatureList
          records={items}
          emptyMessage="No properties being monitored"
          emptyIcon={<Eye size={48} />}
          emptySubtitle="Add a property to watch from the iOS app"
          renderCard={(w) => (
            <FeatureCard
              key={w.id}
              to={`/app/monitor/${w.id}`}
              address={w.address}
              suburb={w.suburb}
              date={w.lastVisitedAt}
              photoUrl={w.latestPhotoUrl}
              metric={`${w.changes.length} change${w.changes.length !== 1 ? 's' : ''}`}
              metricLabel={`${w.visitCount} visit${w.visitCount !== 1 ? 's' : ''}`}
              isFavourite={w.isFavourite}
            />
          )}
        />
      )}
    </div>
  );
}
