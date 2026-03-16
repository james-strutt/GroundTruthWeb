import { useEffect, useState } from 'react';
import { Camera } from 'lucide-react';
import { listSnaps } from '../../services/api';
import { PageHeader } from '../../components/shared/PageHeader';
import { FeatureCard } from '../../components/shared/FeatureCard';
import { GroupedFeatureList } from '../../components/shared/GroupedFeatureList';
import { LoadingSpinner } from '../../components/shared/LoadingSpinner';
import type { Snap } from '../../types/common';

export default function SnapListPage() {
  const [snaps, setSnaps] = useState<Snap[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void listSnaps().then((data) => { setSnaps(data); setLoading(false); });
  }, []);

  return (
    <div>
      <PageHeader icon={<Camera size={22} />} title="Snaps" count={snaps.length} />
      {loading ? (
        <LoadingSpinner message="Loading snaps..." />
      ) : (
        <GroupedFeatureList
          records={snaps}
          emptyMessage="No snaps yet. Capture one on the iOS app."
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
