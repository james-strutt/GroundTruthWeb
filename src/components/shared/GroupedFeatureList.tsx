/**
 * Groups a list of feature records by property address,
 * rendering each group as a collapsible section with the
 * address as the header and individual records underneath.
 */

import { useState } from 'react';
import { MapPin, ChevronDown, ChevronRight } from 'lucide-react';
import type { ReactNode } from 'react';
import styles from './GroupedFeatureList.module.css';

interface GroupableRecord {
  id: string;
  address: string;
  suburb: string;
  createdAt: string;
}

interface GroupedFeatureListProps<T extends GroupableRecord> {
  records: T[];
  renderCard: (record: T) => ReactNode;
  emptyMessage?: string;
}

interface PropertyGroup<T> {
  address: string;
  suburb: string;
  lastDate: string;
  records: T[];
}

function groupRecords<T extends GroupableRecord>(records: T[]): PropertyGroup<T>[] {
  const groups: Record<string, PropertyGroup<T>> = {};

  for (const record of records) {
    const key = record.address.toLowerCase().trim();
    const existing = groups[key];

    if (existing) {
      existing.records.push(record);
      if (record.createdAt > existing.lastDate) existing.lastDate = record.createdAt;
    } else {
      groups[key] = {
        address: record.address,
        suburb: record.suburb,
        lastDate: record.createdAt,
        records: [record],
      };
    }
  }

  return Object.values(groups).sort(
    (a, b) => new Date(b.lastDate).getTime() - new Date(a.lastDate).getTime(),
  );
}

export function GroupedFeatureList<T extends GroupableRecord>({
  records,
  renderCard,
  emptyMessage = 'No records yet.',
}: GroupedFeatureListProps<T>) {
  const groups = groupRecords(records);
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());

  if (records.length === 0) {
    return <p className={styles.empty}>{emptyMessage}</p>;
  }

  function toggleGroup(key: string) {
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  }

  return (
    <div className={styles.list}>
      {groups.map((group) => {
        const key = group.address.toLowerCase().trim();
        const isCollapsed = collapsed.has(key);

        return (
          <div key={key} className={styles.group}>
            <button className={styles.groupHeader} onClick={() => toggleGroup(key)}>
              <span className={styles.chevron}>
                {isCollapsed ? <ChevronRight size={14} /> : <ChevronDown size={14} />}
              </span>
              <MapPin size={13} className={styles.pinIcon} />
              <span className={styles.groupAddress}>{group.address}</span>
              <span className={styles.groupCount}>{group.records.length}</span>
            </button>

            {!isCollapsed && (
              <div className={styles.groupCards}>
                {group.records.map((record) => (
                  <div key={record.id}>{renderCard(record)}</div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
