import { useEffect, useState } from 'react';
import { BarChart3 } from 'lucide-react';
import { listAppraisals } from '../../services/api';
import { PageHeader } from '../../components/shared/PageHeader';
import { FeatureCard } from '../../components/shared/FeatureCard';
import { GroupedFeatureList } from '../../components/shared/GroupedFeatureList';
import type { Appraisal } from '../../types/common';

function formatCompact(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${Math.round(n / 1_000)}K`;
  return `$${n}`;
}

export default function AppraisalListPage() {
  const [items, setItems] = useState<Appraisal[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void listAppraisals().then((d) => { setItems(d); setLoading(false); });
  }, []);

  return (
    <div>
      <PageHeader icon={<BarChart3 size={22} />} title="Appraisals" count={items.length} />
      {loading ? (
        <p style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-body)' }}>Loading...</p>
      ) : (
        <GroupedFeatureList
          records={items}
          emptyMessage="No appraisals yet."
          renderCard={(a) => (
            <FeatureCard
              key={a.id}
              to={`/app/appraisals/${a.id}`}
              address={a.address}
              suburb={a.suburb}
              date={a.createdAt}
              metric={a.priceEstimate ? formatCompact(a.priceEstimate.estimatedValue) : undefined}
              metricLabel="Estimate"
              metricColour="#C2410C"
              isFavourite={a.isFavourite}
            />
          )}
        />
      )}
    </div>
  );
}
