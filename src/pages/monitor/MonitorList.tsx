import { useEffect, useState } from 'react';
import { Eye } from 'lucide-react';
import { listWatched } from '../../services/api';
import { PageHeader } from '../../components/shared/PageHeader';
import { FeatureCard } from '../../components/shared/FeatureCard';
import { GroupedFeatureList } from '../../components/shared/GroupedFeatureList';
import { LoadingSpinner } from '../../components/shared/LoadingSpinner';
import type { WatchedProperty } from '../../types/common';

export default function MonitorListPage() {
  const [items, setItems] = useState<WatchedProperty[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void listWatched().then((d) => { setItems(d); setLoading(false); });
  }, []);

  return (
    <div>
      <PageHeader icon={<Eye size={22} />} title="Monitored Properties" count={items.length} />
      {loading ? (
        <LoadingSpinner message="Loading properties..." />
      ) : (
        <GroupedFeatureList
          records={items}
          emptyMessage="No monitored properties yet."
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
