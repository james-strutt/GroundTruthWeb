import { useState, useCallback, type ReactNode } from 'react';
import { ArrowUp, ArrowDown } from 'lucide-react';
import styles from './DataTable.module.css';

export interface Column<T> {
  key: string;
  label: string;
  render?: (row: T) => ReactNode;
  sortable?: boolean;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  onRowClick?: (row: T) => void;
  keyField: string;
}

type SortDirection = 'asc' | 'desc';

function getNestedValue(obj: object, path: string): unknown {
  return path.split('.').reduce<unknown>((acc, part) => {
    if (acc != null && typeof acc === 'object') {
      return (acc as Record<string, unknown>)[part];
    }
    return undefined;
  }, obj);
}

function compareValues(a: unknown, b: unknown, direction: SortDirection): number {
  const multiplier = direction === 'asc' ? 1 : -1;

  if (a == null && b == null) return 0;
  if (a == null) return 1;
  if (b == null) return -1;

  if (typeof a === 'number' && typeof b === 'number') {
    return (a - b) * multiplier;
  }

  return String(a).localeCompare(String(b)) * multiplier;
}

export function DataTable<T extends object>({
  columns,
  data,
  onRowClick,
  keyField,
}: DataTableProps<T>) {
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  const handleSort = useCallback((key: string) => {
    setSortKey((prev) => {
      if (prev === key) {
        setSortDirection((d) => (d === 'asc' ? 'desc' : 'asc'));
        return key;
      }
      setSortDirection('asc');
      return key;
    });
  }, []);

  const sortedData = sortKey
    ? [...data].sort((a, b) =>
        compareValues(
          getNestedValue(a, sortKey),
          getNestedValue(b, sortKey),
          sortDirection,
        ),
      )
    : data;

  return (
    <div className={styles.wrapper}>
      <table className={styles.table}>
        <thead>
          <tr>
            {columns.map((col) => (
              <th
                key={col.key}
                className={col.sortable ? styles.sortable : undefined}
                onClick={col.sortable ? () => handleSort(col.key) : undefined}
              >
                <span className={styles.headerContent}>
                  {col.label}
                  {col.sortable && sortKey === col.key && (
                    <span className={`${styles.sortIcon} ${styles.sortIconActive}`}>
                      {sortDirection === 'asc' ? <ArrowUp size={12} /> : <ArrowDown size={12} />}
                    </span>
                  )}
                </span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sortedData.map((row) => (
            <tr
              key={String(getNestedValue(row, keyField))}
              className={onRowClick ? styles.clickableRow : undefined}
              onClick={onRowClick ? () => onRowClick(row) : undefined}
            >
              {columns.map((col) => (
                <td key={col.key}>
                  {col.render ? col.render(row) : String(getNestedValue(row, col.key) ?? '')}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
