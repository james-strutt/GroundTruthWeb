import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Camera } from 'lucide-react';
import { useSnapsQuery } from '../../hooks/queries/useSnaps';
import { PageHeader } from '../../components/shared/PageHeader';
import { FeatureCard } from '../../components/shared/FeatureCard';
import { GroupedFeatureList } from '../../components/shared/GroupedFeatureList';
import { DataTable, type Column } from '../../components/shared/DataTable';
import { ViewToggle } from '../../components/shared/ViewToggle';
import { SkeletonCard } from '../../components/shared/SkeletonCard';
import { exportToCsv } from '../../utils/csvExport';
import { formatDate } from '../../utils/formatDate';
import type { Snap } from '../../types/common';

const TABLE_COLUMNS: Column<Snap>[] = [
  { key: 'address', label: 'Address', sortable: true },
  { key: 'suburb', label: 'Suburb', sortable: true },
  { key: 'condition', label: 'Condition', sortable: true, render: (row) => row.aiAnalysis?.condition ?? '' },
  { key: 'createdAt', label: 'Date', sortable: true, render: (row) => formatDate(row.createdAt) },
];

const CSV_COLUMNS = [
  { key: 'address', label: 'Address' },
  { key: 'suburb', label: 'Suburb' },
  { key: 'condition', label: 'Condition' },
  { key: 'createdAt', label: 'Date' },
];

export default function SnapListPage() {
  const { data: snaps = [], isLoading } = useSnapsQuery();
  const [view, setView] = useState<'card' | 'table'>('card');
  const navigate = useNavigate();

  const handleExport = useCallback(() => {
    const rows = snaps.map((s) => ({
      address: s.address,
      suburb: s.suburb,
      condition: s.aiAnalysis?.condition ?? '',
      createdAt: formatDate(s.createdAt),
    }));
    exportToCsv('snaps', CSV_COLUMNS, rows);
  }, [snaps]);

  return (
    <div>
      <PageHeader
        icon={<Camera size={22} />}
        title="Snaps"
        count={snaps.length}
        actions={<ViewToggle view={view} onViewChange={setView} onExport={handleExport} />}
      />
      {isLoading ? (
        <SkeletonCard count={4} />
      ) : view === 'table' ? (
        <DataTable<Snap>
          columns={TABLE_COLUMNS}
          data={snaps}
          keyField="id"
          onRowClick={(row) => navigate(`/app/snaps/${row.id}`)}
        />
      ) : (
        <GroupedFeatureList
          records={snaps}
          emptyMessage="No snaps yet"
          emptyIcon={<Camera size={48} />}
          emptySubtitle="Capture your first property from the iOS app"
          renderCard={(s) => (
            <FeatureCard
              key={s.id}
              to={`/app/snaps/${s.id}`}
              address={s.address}
              suburb={s.suburb}
              date={s.createdAt}
              photoUrl={s.photoUrl}
              metric={s.aiAnalysis?.condition ?? undefined}
              metricLabel="Condition"
              isFavourite={s.isFavourite}
            />
          )}
        />
      )}
    </div>
  );
}
