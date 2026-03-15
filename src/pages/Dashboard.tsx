/**
 * Dashboard — full-screen Mapbox map with property pins,
 * 3D buildings toggle, and an activity feed sidebar.
 */

import { useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Map, { Source, Layer, NavigationControl } from 'react-map-gl/mapbox';
import type { MapRef } from 'react-map-gl/mapbox';
import type { MapLayerMouseEvent } from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Building2, Camera, ClipboardCheck, BarChart3, Eye, Footprints, MapPin as MapPinIcon, ChevronDown, ChevronRight } from 'lucide-react';
import { getAllPins, getRecentActivity } from '../services/api';
import { colours } from '../theme';
import { LayerControl } from '../components/map/LayerControl';
import { DEFAULT_LAYERS, type SpatialLayer } from '../components/map/layerConstants';
import { MapLegend } from '../components/map/MapLegend';
import { fetchDAsInBounds, type DA } from '../services/daService';
import type { MapPin, ActivityItem, FeatureType } from '../types/common';
import styles from './Dashboard.module.css';

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN ?? '';

const PIN_COLOURS: Record<FeatureType, string> = {
  snap: colours.terracotta,
  inspect: '#3B82F6',
  appraise: colours.amber,
  monitor: colours.copper,
  explore: colours.sageBright,
};

const FEATURE_ROUTES: Record<FeatureType, string> = {
  snap: '/app/snaps',
  inspect: '/app/inspections',
  appraise: '/app/appraisals',
  monitor: '/app/monitor',
  explore: '/app/walks',
};

const FEATURE_LABELS: Record<FeatureType, string> = {
  snap: 'Snap',
  inspect: 'Inspection',
  appraise: 'Appraisal',
  monitor: 'Monitor',
  explore: 'Walk',
};

const BUILDINGS_LAYER_ID = 'gt-3d-buildings';

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: '2-digit' });
}

interface PropertyGroup {
  key: string;
  address: string;
  suburb: string;
  lastDate: string;
  counts: Record<FeatureType, number>;
  items: ActivityItem[];
  latitude: number | null;
  longitude: number | null;
}

function groupByProperty(items: ActivityItem[], pins: MapPin[]): PropertyGroup[] {
  const groups: Record<string, PropertyGroup> = {};

  for (const item of items) {
    const key = item.address.toLowerCase().trim();
    const existing = groups[key];

    if (existing) {
      existing.counts[item.type] = (existing.counts[item.type] ?? 0) + 1;
      existing.items.push(item);
      if (item.createdAt > existing.lastDate) existing.lastDate = item.createdAt;
    } else {
      const counts: Record<FeatureType, number> = { snap: 0, inspect: 0, appraise: 0, monitor: 0, explore: 0 };
      counts[item.type] = 1;
      // Find coordinates from pins
      const pin = pins.find((p) => p.address.toLowerCase().trim() === key);
      groups[key] = {
        key,
        address: item.address,
        suburb: item.suburb,
        lastDate: item.createdAt,
        counts,
        items: [item],
        latitude: pin?.latitude ?? null,
        longitude: pin?.longitude ?? null,
      };
    }
  }

  return Object.values(groups).sort((a, b) => new Date(b.lastDate).getTime() - new Date(a.lastDate).getTime());
}

export default function DashboardPage() {
  const navigate = useNavigate();
  const mapRef = useRef<MapRef>(null);
  const [pins, setPins] = useState<MapPin[]>([]);
  const [activity, setActivity] = useState<ActivityItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [buildings3d, setBuildings3d] = useState(false);
  const [spatialLayers, setSpatialLayers] = useState<SpatialLayer[]>(DEFAULT_LAYERS);
  const [mapBounds, setMapBounds] = useState<{ west: number; south: number; east: number; north: number } | null>(null);
  const [expandedProperty, setExpandedProperty] = useState<string | null>(null);
  const [daPoints, setDaPoints] = useState<DA[]>([]);
  const daDebounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const isDaLayerActive = spatialLayers.some((l) => l.id === 'das' && l.visible);

  // Fetch DAs when layer active, bounds change, and zoom >= 14
  const [mapZoom, setMapZoom] = useState(11);
  const DA_MIN_ZOOM = 14;
  const isDaZoomedIn = mapZoom >= DA_MIN_ZOOM;

  // Clear DA points when zoomed out
  useEffect(() => {
    if (!isDaZoomedIn) {
      setDaPoints([]);
    }
  }, [isDaZoomedIn]);

  // Fetch DAs when layer active, bounds change, and zoom >= 14
  useEffect(() => {
    if (!isDaLayerActive || !mapBounds || !isDaZoomedIn) {
      return;
    }
    if (daDebounceRef.current) clearTimeout(daDebounceRef.current);
    daDebounceRef.current = setTimeout(() => {
      void fetchDAsInBounds(mapBounds.west, mapBounds.south, mapBounds.east, mapBounds.north).then((das) => {
        setDaPoints(das);
      });
    }, 500);
    return () => { if (daDebounceRef.current) clearTimeout(daDebounceRef.current); };
  }, [isDaLayerActive, mapBounds, isDaZoomedIn]);

  const daGeoJson: GeoJSON.FeatureCollection = {
    type: 'FeatureCollection',
    features: daPoints.map((da) => ({
      type: 'Feature' as const,
      geometry: { type: 'Point' as const, coordinates: [da.longitude, da.latitude] },
      properties: {
        id: da.id,
        address: da.address,
        status: da.status,
        type: da.type,
        description: da.description,
        cost: da.cost,
        label: `${da.address}${da.type ? ' \u00B7 ' + da.type : ''}`,
      },
    })),
  };

  const handleLayerToggle = useCallback((layerId: string) => {
    setSpatialLayers((prev) => prev.map((l) =>
      l.id === layerId ? { ...l, visible: !l.visible, opacity: l.visible ? l.opacity : 0.7 } : l,
    ));
  }, []);

  const handleLayerOpacity = useCallback((layerId: string, opacity: number) => {
    setSpatialLayers((prev) => prev.map((l) =>
      l.id === layerId ? { ...l, opacity } : l,
    ));
  }, []);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const [p, a] = await Promise.all([getAllPins(), getRecentActivity()]);
      if (!cancelled) {
        setPins(p);
        setActivity(a);
        setIsLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const toggle3dBuildings = useCallback(() => {
    const map = mapRef.current?.getMap();
    if (!map) return;

    if (buildings3d) {
      if (map.getLayer(BUILDINGS_LAYER_ID)) map.removeLayer(BUILDINGS_LAYER_ID);
      setBuildings3d(false);
    } else {
      if (!map.getLayer(BUILDINGS_LAYER_ID)) {
        map.addLayer({
          id: BUILDINGS_LAYER_ID,
          source: 'composite',
          'source-layer': 'building',
          filter: ['==', 'extrude', 'true'],
          type: 'fill-extrusion',
          minzoom: 15,
          paint: {
            'fill-extrusion-color': '#aaa',
            'fill-extrusion-height': [
              'interpolate', ['linear'], ['zoom'],
              15, 0,
              15.05, ['get', 'height'],
            ],
            'fill-extrusion-base': [
              'interpolate', ['linear'], ['zoom'],
              15, 0,
              15.05, ['get', 'min_height'],
            ],
            'fill-extrusion-opacity': 0.5,
          },
        });
      }
      setBuildings3d(true);
    }
  }, [buildings3d]);


  // Build GeoJSON from pins for native Mapbox layers
  const pinsGeoJson: GeoJSON.FeatureCollection = {
    type: 'FeatureCollection',
    features: pins.map((pin) => ({
      type: 'Feature' as const,
      geometry: { type: 'Point' as const, coordinates: [pin.longitude, pin.latitude] },
      properties: {
        id: pin.id,
        featureType: pin.type,
        address: pin.address,
        colour: PIN_COLOURS[pin.type],
      },
    })),
  };

  /* eslint-disable @typescript-eslint/no-explicit-any */
  const colourExpr: any = ['get', 'colour'];

  const circleLayer: any = {
    id: 'gt-pins-circle',
    type: 'circle',
    source: 'gt-pins',
    paint: {
      'circle-radius': 5,
      'circle-color': colourExpr,
      'circle-stroke-width': 1.5,
      'circle-stroke-color': 'rgba(250, 248, 245, 0.7)',
    },
  };

  const labelLayer: any = {
    id: 'gt-pins-label',
    type: 'symbol',
    source: 'gt-pins',
    layout: {
      'text-field': ['get', 'address'],
      'text-font': ['DIN Pro Medium', 'Arial Unicode MS Regular'],
      'text-size': 11,
      'text-offset': [0, 1.2],
      'text-anchor': 'top',
      'text-max-width': 12,
      'text-allow-overlap': false,
      'text-ignore-placement': false,
      'icon-allow-overlap': true,
    },
    paint: {
      'text-color': '#FFFFFF',
    },
  };
  /* eslint-enable @typescript-eslint/no-explicit-any */

  function handleMapClick(e: MapLayerMouseEvent) {
    const feature = e.features?.[0];
    if (!feature?.properties) return;
    const fType = feature.properties['featureType'] as FeatureType;
    const fId = feature.properties['id'] as string;
    if (fType && fId) navigate(`${FEATURE_ROUTES[fType]}/${fId}`);
  }

  return (
    <div className={styles.dashboard}>
      {/* Map */}
      <div className={styles.mapContainer}>
        <Map
          ref={mapRef}
          mapboxAccessToken={MAPBOX_TOKEN}
          initialViewState={{
            longitude: 151.2093,
            latitude: -33.8688,
            zoom: 11,
          }}
          style={{ width: '100%', height: '100%' }}
          mapStyle="mapbox://styles/mapbox/dark-v11"
          interactiveLayerIds={['gt-pins-circle']}
          onClick={handleMapClick}
          cursor="pointer"
          onMoveEnd={(e) => {
            const b = e.target.getBounds();
            if (b) setMapBounds({ west: b.getWest(), south: b.getSouth(), east: b.getEast(), north: b.getNorth() });
            setMapZoom(e.target.getZoom());
          }}
        >
          <NavigationControl position="top-right" />

          {/* ArcGIS spatial layers as raster tiles */}
          {spatialLayers.filter((l) => l.visible).map((layer) => (
            <Source
              key={layer.id}
              id={`arcgis-${layer.id}`}
              type="raster"
              tiles={[layer.tileUrl]}
              tileSize={layer.tileUrl.includes('/export?') ? 512 : 256}
            >
              <Layer
                id={`arcgis-layer-${layer.id}`}
                type="raster"
                paint={{ 'raster-opacity': layer.opacity }}
                beforeId="gt-pins-circle"
              />
            </Source>
          ))}

          {/* DA points layer */}
          {isDaLayerActive && (
            <Source id="gt-das" type="geojson" data={daGeoJson}>
              <Layer
                id="gt-das-circle"
                type="circle"
                paint={{
                  'circle-radius': 4,
                  'circle-color': [
                    'match', ['get', 'status'],
                    'Approved', '#65A30D',
                    'Determined', '#65A30D',
                    'Refused', '#DC2626',
                    'Under Assessment', '#D97706',
                    'Pending', '#D97706',
                    'On Exhibition', '#3B82F6',
                    '#78716C',
                  ],
                  'circle-stroke-width': 1,
                  'circle-stroke-color': 'rgba(250, 248, 245, 0.5)',
                  'circle-opacity': spatialLayers.find((l) => l.id === 'das')?.opacity ?? 0.7,
                }}
              />
              <Layer
                id="gt-das-label"
                type="symbol"
                layout={{
                  'text-field': ['get', 'label'],
                  'text-font': ['DIN Pro Medium', 'Arial Unicode MS Regular'],
                  'text-size': 9,
                  'text-offset': [0, 1.2],
                  'text-anchor': 'top',
                  'text-max-width': 16,
                  'text-allow-overlap': false,
                }}
                paint={{
                  'text-color': '#FFFFFF',
                  'text-halo-color': 'rgba(0,0,0,0.6)',
                  'text-halo-width': 0.8,
                  'text-opacity': spatialLayers.find((l) => l.id === 'das')?.opacity ?? 0.7,
                }}
              />
            </Source>
          )}

          <Source id="gt-pins" type="geojson" data={pinsGeoJson}>
            <Layer {...circleLayer} />
            <Layer {...labelLayer} />
          </Source>
        </Map>

        {/* Layer control — top left */}
        <LayerControl
          layers={spatialLayers}
          onToggle={handleLayerToggle}
          onOpacityChange={handleLayerOpacity}
        />

        {/* Legends for active layers */}
        <MapLegend
          activeLayers={spatialLayers.filter((l) => l.visible && l.tileUrl)}
          bounds={mapBounds}
          daActive={isDaLayerActive}
          daZoomedIn={isDaZoomedIn}
          daCount={daPoints.length}
        />

        {/* 3D buildings toggle — below nav controls */}
        <button
          className={`${styles.buildingsToggle} ${buildings3d ? styles.buildingsToggleActive : ''}`}
          onClick={toggle3dBuildings}
          title={buildings3d ? 'Hide 3D buildings' : 'Show 3D buildings'}
        >
          <Building2 size={16} />
        </button>

        {/* Legend */}
        <div className={styles.legend}>
          {Object.entries(PIN_COLOURS).map(([type, colour]) => (
            <div key={type} className={styles.legendItem}>
              <div className={styles.legendDot} style={{ backgroundColor: colour }} />
              <span>{FEATURE_LABELS[type as FeatureType]}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Activity feed sidebar — grouped by property */}
      <aside className={styles.activityPanel}>
        <h2 className={styles.activityTitle}>Properties</h2>

        {isLoading ? (
          <p className={styles.emptyText}>Loading...</p>
        ) : activity.length === 0 ? (
          <div className={styles.emptyState}>
            <p className={styles.emptyText}>No activity yet</p>
            <p className={styles.emptyHint}>Complete a snap or inspection on the iOS app to see it here.</p>
          </div>
        ) : (
          <div className={styles.activityList}>
            {groupByProperty(activity, pins).map((group) => {
              const isExpanded = expandedProperty === group.key;

              function handlePropertyClick() {
                // Toggle expand
                setExpandedProperty(isExpanded ? null : group.key);
                // Zoom to property
                if (group.latitude && group.longitude && mapRef.current) {
                  mapRef.current.flyTo({
                    center: [group.longitude, group.latitude],
                    zoom: 17,
                    duration: 1200,
                  });
                }
              }

              return (
                <div key={group.key} className={`${styles.propertyGroup} ${isExpanded ? styles.propertyGroupExpanded : ''}`}>
                  <button className={styles.activityCard} onClick={handlePropertyClick}>
                    <span className={styles.expandChevron}>
                      {isExpanded ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
                    </span>
                    <div className={styles.propertyInfo}>
                      <div className={styles.propertyAddressRow}>
                        <MapPinIcon size={13} className={styles.propertyIcon} />
                        <span className={styles.activityAddress}>{group.address}</span>
                      </div>
                      <span className={styles.propertySub}>{group.suburb}</span>
                      <div className={styles.featureBadges}>
                        {group.counts.snap > 0 && (
                          <span className={styles.featureBadge} style={{ color: PIN_COLOURS.snap }}>
                            <Camera size={11} /> {group.counts.snap}
                          </span>
                        )}
                        {group.counts.inspect > 0 && (
                          <span className={styles.featureBadge} style={{ color: PIN_COLOURS.inspect }}>
                            <ClipboardCheck size={11} /> {group.counts.inspect}
                          </span>
                        )}
                        {group.counts.appraise > 0 && (
                          <span className={styles.featureBadge} style={{ color: PIN_COLOURS.appraise }}>
                            <BarChart3 size={11} /> {group.counts.appraise}
                          </span>
                        )}
                        {group.counts.monitor > 0 && (
                          <span className={styles.featureBadge} style={{ color: PIN_COLOURS.monitor }}>
                            <Eye size={11} /> {group.counts.monitor}
                          </span>
                        )}
                        {group.counts.explore > 0 && (
                          <span className={styles.featureBadge} style={{ color: PIN_COLOURS.explore }}>
                            <Footprints size={11} /> {group.counts.explore}
                          </span>
                        )}
                      </div>
                    </div>
                    <span className={styles.activityDate}>{formatDate(group.lastDate)}</span>
                  </button>

                  {isExpanded && (
                    <div className={styles.propertyItems}>
                      {group.items.map((item) => (
                        <button
                          key={`${item.type}-${item.id}`}
                          className={styles.propertyItem}
                          onClick={() => navigate(`${FEATURE_ROUTES[item.type]}/${item.id}`)}
                        >
                          <span className={styles.propertyItemDot} style={{ backgroundColor: PIN_COLOURS[item.type] }} />
                          <span className={styles.propertyItemType}>{FEATURE_LABELS[item.type]}</span>
                          <span className={styles.propertyItemSummary}>{item.summary}</span>
                          <span className={styles.propertyItemDate}>{formatDate(item.createdAt)}</span>
                        </button>
                      ))}
                      <button
                        className={styles.viewAllButton}
                        onClick={() => navigate(`/app/properties/${encodeURIComponent(group.key)}`)}
                      >
                        View all records
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </aside>
    </div>
  );
}
