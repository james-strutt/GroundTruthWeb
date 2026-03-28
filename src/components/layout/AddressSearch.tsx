/**
 * Address search component — queries NSW Planning API
 * for address suggestions, same as the iOS app.
 */

import { useState, useRef } from 'react';
import { Search, MapPin, X } from 'lucide-react';
import { sanitiseSearchQuery } from '../../utils/sanitise';
import styles from './AddressSearch.module.css';

interface AddressResult {
  address: string;
  propId: number | null;
}

const PROXY_BASE = 'https://proxy-server.jameswilliamstrutt.workers.dev';
const NSW_PLANNING_BASE = 'https://api.apps1.nsw.gov.au/planning/viewersf/V1/ePlanningApi';

async function searchAddresses(query: string): Promise<AddressResult[]> {
  if (query.trim().length < 3) return [];

  const targetUrl = `${NSW_PLANNING_BASE}/address?a=${encodeURIComponent(query)}&noOfRecords=8`;

  try {
    const response = await fetch(PROXY_BASE, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: targetUrl, method: 'GET', headers: { Accept: 'application/json' } }),
    });

    if (!response.ok) return [];

    let data: unknown = await response.json();
    if (typeof data === 'string') data = JSON.parse(data);
    if (!Array.isArray(data)) return [];

    return (data as { address?: string; propId?: number }[]).map((item) => ({
      address: item.address ?? '',
      propId: item.propId ?? null,
    }));
  } catch {
    return [];
  }
}

interface AddressSearchProps {
  onSelect?: (address: string, propId: number | null) => void;
}

export function AddressSearch({ onSelect }: AddressSearchProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<AddressResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  function handleChange(value: string) {
    setQuery(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);

    const sanitised = sanitiseSearchQuery(value);
    if (sanitised.length < 3) {
      setResults([]);
      return;
    }

    debounceRef.current = setTimeout(() => {
      setIsSearching(true);
      void searchAddresses(sanitised).then((r) => {
        setResults(r);
        setIsSearching(false);
      });
    }, 400);
  }

  function handleSelect(result: AddressResult) {
    setQuery(result.address);
    setResults([]);
    onSelect?.(result.address, result.propId);
  }

  function handleClear() {
    setQuery('');
    setResults([]);
  }

  return (
    <div className={styles.container}>
      <div className={styles.inputRow}>
        <Search size={14} className={styles.searchIcon} />
        <input
          type="text"
          className={styles.input}
          placeholder="Search address..."
          value={query}
          onChange={(e) => handleChange(e.target.value)}
        />
        {query && (
          <button className={styles.clearBtn} onClick={handleClear}>
            <X size={12} />
          </button>
        )}
      </div>

      {(results.length > 0 || isSearching) && (
        <div className={styles.dropdown}>
          {isSearching && <div className={styles.searchingText}>Searching...</div>}
          {results.map((r, i) => (
            <button key={i} className={styles.resultItem} onClick={() => handleSelect(r)}>
              <MapPin size={12} className={styles.resultIcon} />
              <span className={styles.resultText}>{r.address}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
