import { useEffect, useState } from 'react';
import { ClipboardCheck } from 'lucide-react';
import { listInspections } from '../../services/api';
import { PageHeader } from '../../components/shared/PageHeader';
import { FeatureCard } from '../../components/shared/FeatureCard';
import { GroupedFeatureList } from '../../components/shared/GroupedFeatureList';
import type { Inspection } from '../../types/common';

export default function InspectionListPage() {
  const [items, setItems] = useState<Inspection[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void listInspections().then((d) => { setItems(d); setLoading(false); });
  }, []);

  return (
    <div>
      <PageHeader icon={<ClipboardCheck size={22} />} title="Inspections" count={items.length} />
      {loading ? (
        <p style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-body)' }}>Loading...</p>
      ) : (
        <GroupedFeatureList
          records={items}
          emptyMessage="No inspections yet."
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
