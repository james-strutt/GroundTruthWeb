/**
 * Groups a list of feature records by property address,
 * rendering each group as a collapsible section with the
 * address as the header and individual records underneath.
 * Uses virtual scrolling for large lists (50+ groups).
 */

import { useState, useRef, type ReactNode } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { MapPin, ChevronDown, ChevronRight } from 'lucide-react';
import { EmptyState } from './EmptyState';
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
  emptyIcon?: ReactNode;
  emptySubtitle?: string;
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

const VIRTUAL_THRESHOLD = 30;

export function GroupedFeatureList<T extends GroupableRecord>({
  records,
  renderCard,
  emptyMessage = 'No records yet.',
  emptyIcon,
  emptySubtitle,
}: GroupedFeatureListProps<T>) {
  const groups = groupRecords(records);
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  const parentRef = useRef<HTMLDivElement>(null);

  if (records.length === 0) {
    if (emptyIcon) {
      return <EmptyState icon={emptyIcon} title={emptyMessage} subtitle={emptySubtitle ?? ''} />;
    }
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

  if (groups.length < VIRTUAL_THRESHOLD) {
    return (
      <div className={styles.list}>
        {groups.map((group) => (
          <GroupItem
            key={group.address.toLowerCase().trim()}
            group={group}
            collapsed={collapsed}
            toggleGroup={toggleGroup}
            renderCard={renderCard}
          />
        ))}
      </div>
    );
  }

  return (
    <VirtualGroupList
      groups={groups}
      collapsed={collapsed}
      toggleGroup={toggleGroup}
      renderCard={renderCard}
      parentRef={parentRef}
    />
  );
}

function GroupItem<T extends { id: string }>({
  group,
  collapsed,
  toggleGroup,
  renderCard,
}: {
  group: PropertyGroup<T>;
  collapsed: Set<string>;
  toggleGroup: (key: string) => void;
  renderCard: (record: T) => ReactNode;
}) {
  const key = group.address.toLowerCase().trim();
  const isCollapsed = collapsed.has(key);

  return (
    <div className={styles.group}>
      <button className={styles.groupHeader} onClick={() => toggleGroup(key)} aria-expanded={!isCollapsed}>
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
}

function VirtualGroupList<T extends { id: string }>({
  groups,
  collapsed,
  toggleGroup,
  renderCard,
  parentRef,
}: {
  groups: PropertyGroup<T>[];
  collapsed: Set<string>;
  toggleGroup: (key: string) => void;
  renderCard: (record: T) => ReactNode;
  parentRef: React.RefObject<HTMLDivElement | null>;
}) {
  const virtualizer = useVirtualizer({
    count: groups.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 120,
    overscan: 5,
  });

  return (
    <div ref={parentRef} className={styles.list} style={{ height: '100%', overflow: 'auto' }}>
      <div style={{ height: `${virtualizer.getTotalSize()}px`, width: '100%', position: 'relative' }}>
        {virtualizer.getVirtualItems().map((virtualRow) => {
          const group = groups[virtualRow.index]!;
          return (
            <div
              key={virtualRow.key}
              ref={virtualizer.measureElement}
              data-index={virtualRow.index}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                transform: `translateY(${virtualRow.start}px)`,
              }}
            >
              <GroupItem
                group={group}
                collapsed={collapsed}
                toggleGroup={toggleGroup}
                renderCard={renderCard}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
