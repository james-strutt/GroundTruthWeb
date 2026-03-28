/**
 * Displays NSW lot/DP parcel information for a given coordinate.
 * Fetches from the NSW cadastre service on mount.
 */

import { useEffect, useState } from 'react';
import { MapPin } from 'lucide-react';
import { fetchParcelAtPoint } from '../../services/cadastreService';
import styles from './ParcelInfo.module.css';

interface ParcelInfoProps {
  latitude: number;
  longitude: number;
}

interface ParcelData {
  lotNumber: string;
  dpNumber: string;
  areaSqm: number | null;
}

export function ParcelInfo({ latitude, longitude }: ParcelInfoProps) {
  const [parcel, setParcel] = useState<ParcelData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetchParcelAtPoint(latitude, longitude).then((data) => {
      if (!cancelled) {
        setParcel(data);
        setLoading(false);
      }
    });
    return () => { cancelled = true; };
  }, [latitude, longitude]);

  if (loading || !parcel || (!parcel.lotNumber && !parcel.dpNumber)) return null;

  return (
    <div className={styles.container}>
      <MapPin size={12} className={styles.icon} />
      <span className={styles.label}>
        {parcel.lotNumber && `Lot ${parcel.lotNumber}`}
        {parcel.lotNumber && parcel.dpNumber && ' '}
        {parcel.dpNumber && `DP ${parcel.dpNumber}`}
      </span>
      {parcel.areaSqm != null && (
        <span className={styles.area}>
          {parcel.areaSqm >= 10000
            ? `${(parcel.areaSqm / 10000).toFixed(2)} ha`
            : `${Math.round(parcel.areaSqm)} m²`}
        </span>
      )}
    </div>
  );
}
