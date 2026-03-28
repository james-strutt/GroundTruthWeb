import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Footprints } from 'lucide-react';
import { useWalksQuery } from '../../hooks/queries/useWalks';
import { PageHeader } from '../../components/shared/PageHeader';
import { FeatureCard } from '../../components/shared/FeatureCard';
import { GroupedFeatureList } from '../../components/shared/GroupedFeatureList';
import { DataTable, type Column } from '../../components/shared/DataTable';
import { ViewToggle } from '../../components/shared/ViewToggle';
import { SkeletonCard } from '../../components/shared/SkeletonCard';
import { exportToCsv } from '../../utils/csvExport';
import { formatDate } from '../../utils/formatDate';
import type { WalkSession } from '../../types/common';

function formatDuration(seconds: number): string {
  const mins = Math.round(seconds / 60);
  if (mins < 60) return `${mins} min`;
  return `${Math.floor(mins / 60)}h ${mins % 60}m`;
}

function formatDistance(metres: number): string {
  if (metres < 1000) return `${Math.round(metres)} m`;
  return `${(metres / 1000).toFixed(1)} km`;
}

const TABLE_COLUMNS: Column<WalkSession>[] = [
  { key: 'title', label: 'Title', sortable: true, render: (row) => row.title || row.suburb },
  { key: 'suburb', label: 'Suburb', sortable: true },
  { key: 'totalDistanceMetres', label: 'Distance', sortable: true, render: (row) => formatDistance(row.totalDistanceMetres) },
  { key: 'durationSeconds', label: 'Duration', sortable: true, render: (row) => formatDuration(row.durationSeconds) },
  { key: 'startedAt', label: 'Date', sortable: true, render: (row) => formatDate(row.startedAt) },
];

const CSV_COLUMNS = [
  { key: 'title', label: 'Title' },
  { key: 'suburb', label: 'Suburb' },
  { key: 'distance', label: 'Distance' },
  { key: 'duration', label: 'Duration' },
  { key: 'date', label: 'Date' },
];

export default function WalkListPage() {
  const { data: items = [], isLoading } = useWalksQuery();
  const [view, setView] = useState<'card' | 'table'>('card');
  const navigate = useNavigate();

  const withAddress = items.map((w) => ({
    ...w,
    address: w.title || w.suburb,
    createdAt: w.startedAt,
  }));

  const handleExport = useCallback(() => {
    const rows = items.map((w) => ({
      title: w.title || w.suburb,
      suburb: w.suburb,
      distance: formatDistance(w.totalDistanceMetres),
      duration: formatDuration(w.durationSeconds),
      date: formatDate(w.startedAt),
    }));
    exportToCsv('walks', CSV_COLUMNS, rows);
  }, [items]);

  return (
    <div>
      <PageHeader
        icon={<Footprints size={22} />}
        title="Walk Sessions"
        count={items.length}
        actions={<ViewToggle view={view} onViewChange={setView} onExport={handleExport} />}
      />
      {isLoading ? (
        <SkeletonCard count={4} />
      ) : view === 'table' ? (
        <DataTable<WalkSession>
          columns={TABLE_COLUMNS}
          data={items}
          keyField="id"
          onRowClick={(row) => navigate(`/app/walks/${row.id}`)}
        />
      ) : (
        <GroupedFeatureList
          records={withAddress}
          emptyMessage="No walks recorded"
          emptyIcon={<Footprints size={48} />}
          emptySubtitle="Start exploring a neighbourhood from the iOS app"
          renderCard={(w) => {
            const walk = w as WalkSession & { createdAt: string };
            return (
              <FeatureCard
                key={walk.id}
                to={`/app/walks/${walk.id}`}
                address={walk.title || walk.suburb}
                suburb={walk.suburb}
                date={walk.startedAt}
                metric={walk.streetScore ? `${walk.streetScore.overall}/100` : formatDistance(walk.totalDistanceMetres)}
                metricLabel={walk.streetScore ? 'Score' : formatDuration(walk.durationSeconds)}
                metricColour={walk.streetScore ? '#8B9080' : undefined}
                isFavourite={walk.isFavourite}
              />
            );
          }}
        />
      )}
    </div>
  );
}
