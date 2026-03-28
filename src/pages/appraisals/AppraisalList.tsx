import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { BarChart3 } from 'lucide-react';
import { useAppraisalsQuery } from '../../hooks/queries/useAppraisals';
import { PageHeader } from '../../components/shared/PageHeader';
import { FeatureCard } from '../../components/shared/FeatureCard';
import { GroupedFeatureList } from '../../components/shared/GroupedFeatureList';
import { DataTable, type Column } from '../../components/shared/DataTable';
import { ViewToggle } from '../../components/shared/ViewToggle';
import { SkeletonCard } from '../../components/shared/SkeletonCard';
import { exportToCsv } from '../../utils/csvExport';
import { formatDate } from '../../utils/formatDate';
import type { Appraisal } from '../../types/common';

function formatCompact(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${Math.round(n / 1_000)}K`;
  return `$${n}`;
}

const TABLE_COLUMNS: Column<Appraisal>[] = [
  { key: 'address', label: 'Address', sortable: true },
  { key: 'suburb', label: 'Suburb', sortable: true },
  { key: 'estimate', label: 'Estimate', sortable: true, render: (row) => row.priceEstimate ? formatCompact(row.priceEstimate.estimatedValue) : '' },
  { key: 'createdAt', label: 'Date', sortable: true, render: (row) => formatDate(row.createdAt) },
];

const CSV_COLUMNS = [
  { key: 'address', label: 'Address' },
  { key: 'suburb', label: 'Suburb' },
  { key: 'estimate', label: 'Estimate' },
  { key: 'createdAt', label: 'Date' },
];

export default function AppraisalListPage() {
  const { data: items = [], isLoading } = useAppraisalsQuery();
  const [view, setView] = useState<'card' | 'table'>('card');
  const navigate = useNavigate();

  const handleExport = useCallback(() => {
    const rows = items.map((a) => ({
      address: a.address,
      suburb: a.suburb,
      estimate: a.priceEstimate ? formatCompact(a.priceEstimate.estimatedValue) : '',
      createdAt: formatDate(a.createdAt),
    }));
    exportToCsv('appraisals', CSV_COLUMNS, rows);
  }, [items]);

  return (
    <div>
      <PageHeader
        icon={<BarChart3 size={22} />}
        title="Appraisals"
        count={items.length}
        actions={<ViewToggle view={view} onViewChange={setView} onExport={handleExport} />}
      />
      {isLoading ? (
        <SkeletonCard count={4} />
      ) : view === 'table' ? (
        <DataTable<Appraisal>
          columns={TABLE_COLUMNS}
          data={items}
          keyField="id"
          onRowClick={(row) => navigate(`/app/appraisals/${row.id}`)}
        />
      ) : (
        <GroupedFeatureList
          records={items}
          emptyMessage="No appraisals yet"
          emptyIcon={<BarChart3 size={48} />}
          emptySubtitle="Appraise a property from the iOS app"
          renderCard={(a) => (
            <FeatureCard
              key={a.id}
              to={`/app/appraisals/${a.id}`}
              address={a.address}
              suburb={a.suburb}
              date={a.createdAt}
              metric={a.priceEstimate ? formatCompact(a.priceEstimate.estimatedValue) : undefined}
              metricLabel="Estimate"
              metricColour="#D4653B"
              isFavourite={a.isFavourite}
            />
          )}
        />
      )}
    </div>
  );
}
