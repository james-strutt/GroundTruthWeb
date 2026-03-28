import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ClipboardCheck } from 'lucide-react';
import { useInspectionsQuery } from '../../hooks/queries/useInspections';
import { PageHeader } from '../../components/shared/PageHeader';
import { FeatureCard } from '../../components/shared/FeatureCard';
import { GroupedFeatureList } from '../../components/shared/GroupedFeatureList';
import { DataTable, type Column } from '../../components/shared/DataTable';
import { ViewToggle } from '../../components/shared/ViewToggle';
import { SkeletonCard } from '../../components/shared/SkeletonCard';
import { exportToCsv } from '../../utils/csvExport';
import { formatDate } from '../../utils/formatDate';
import type { Inspection } from '../../types/common';

const TABLE_COLUMNS: Column<Inspection>[] = [
  { key: 'address', label: 'Address', sortable: true },
  { key: 'suburb', label: 'Suburb', sortable: true },
  { key: 'overallScore', label: 'Score', sortable: true, render: (row) => row.overallScore ? `${row.overallScore}/10` : '' },
  { key: 'createdAt', label: 'Date', sortable: true, render: (row) => formatDate(row.createdAt) },
];

const CSV_COLUMNS = [
  { key: 'address', label: 'Address' },
  { key: 'suburb', label: 'Suburb' },
  { key: 'score', label: 'Score' },
  { key: 'createdAt', label: 'Date' },
];

export default function InspectionListPage() {
  const { data: items = [], isLoading } = useInspectionsQuery();
  const [view, setView] = useState<'card' | 'table'>('card');
  const navigate = useNavigate();

  const handleExport = useCallback(() => {
    const rows = items.map((i) => ({
      address: i.address,
      suburb: i.suburb,
      score: i.overallScore ? `${i.overallScore}/10` : '',
      createdAt: formatDate(i.createdAt),
    }));
    exportToCsv('inspections', CSV_COLUMNS, rows);
  }, [items]);

  return (
    <div>
      <PageHeader
        icon={<ClipboardCheck size={22} />}
        title="Inspections"
        count={items.length}
        actions={<ViewToggle view={view} onViewChange={setView} onExport={handleExport} />}
      />
      {isLoading ? (
        <SkeletonCard count={4} />
      ) : view === 'table' ? (
        <DataTable<Inspection>
          columns={TABLE_COLUMNS}
          data={items}
          keyField="id"
          onRowClick={(row) => navigate(`/app/inspections/${row.id}`)}
        />
      ) : (
        <GroupedFeatureList
          records={items}
          emptyMessage="No inspections yet"
          emptyIcon={<ClipboardCheck size={48} />}
          emptySubtitle="Start an inspection from the iOS app"
          renderCard={(i) => (
            <FeatureCard
              key={i.id}
              to={`/app/inspections/${i.id}`}
              address={i.address}
              suburb={i.suburb}
              date={i.createdAt}
              metric={i.overallScore ? `${i.overallScore}/10` : undefined}
              metricLabel="Score"
              isFavourite={i.isFavourite}
            />
          )}
        />
      )}
    </div>
  );
}
