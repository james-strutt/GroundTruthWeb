import { useEffect, useState } from 'react';
import { Footprints } from 'lucide-react';
import { listWalks } from '../../services/api';
import { PageHeader } from '../../components/shared/PageHeader';
import { FeatureCard } from '../../components/shared/FeatureCard';
import { GroupedFeatureList } from '../../components/shared/GroupedFeatureList';
import { LoadingSpinner } from '../../components/shared/LoadingSpinner';
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

export default function WalkListPage() {
  const [items, setItems] = useState<WalkSession[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void listWalks().then((d) => { setItems(d); setLoading(false); });
  }, []);

  // Walks use title+suburb as address and startedAt as createdAt for grouping
  const withAddress = items.map((w) => ({
    ...w,
    address: w.title || w.suburb,
    createdAt: w.startedAt,
  }));

  return (
    <div>
      <PageHeader icon={<Footprints size={22} />} title="Walk Sessions" count={items.length} />
      {loading ? (
        <LoadingSpinner message="Loading walks..." />
      ) : (
        <GroupedFeatureList
          records={withAddress}
          emptyMessage="No walk sessions yet."
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
