/**
 * Dashboard — full-screen Mapbox map with property pins,
 * 3D buildings toggle, and an activity feed sidebar.
 */

import { useEffect, useState, useCallback, useRef, type PointerEvent as ReactPointerEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import Map, { Source, Layer, NavigationControl } from 'react-map-gl/mapbox';
import type { MapRef, MapMouseEvent } from 'react-map-gl/mapbox';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Building2 } from 'lucide-react';
import { getAllPins, getRecentActivity, getWalkRoutes } from '../services/api';
import { LayerControl } from '../components/map/LayerControl';
import { DEFAULT_LAYERS, type SpatialLayer } from '../components/map/layerConstants';
import { MapLegend } from '../components/map/MapLegend';
import { ActivityPanel, PIN_COLOURS, FEATURE_ROUTES, FEATURE_LABELS } from '../components/map/ActivityPanel';
import { fetchDAsInBounds, type DA } from '../services/daService';
import { MeasureTools } from '../components/map/MeasureTools';
import { useMapMeasure } from '../hooks/useMapMeasure';
import { fetchTrainStationsInBounds, fetchAllRailwayLines, type TrainStation } from '../services/trainStationService';
import type { MapPin, ActivityItem, FeatureType } from '../types/common';
import styles from './Dashboard.module.css';

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN ?? '';

const BUILDINGS_LAYER_ID = 'gt-3d-buildings';

export default function DashboardPage() {
  const navigate = useNavigate();
  const mapRef = useRef<MapRef>(null);
  const [pins, setPins] = useState<MapPin[]>([]);
  const [walkRoutes, setWalkRoutes] = useState<GeoJSON.FeatureCollection>({ type: 'FeatureCollection', features: [] });
  const [activity, setActivity] = useState<ActivityItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [buildings3d, setBuildings3d] = useState(false);
  const [spatialLayers, setSpatialLayers] = useState<SpatialLayer[]>(DEFAULT_LAYERS);
  const [mapBounds, setMapBounds] = useState<{ west: number; south: number; east: number; north: number } | null>(null);
  const [expandedProperty, setExpandedProperty] = useState<string | null>(null);
  const measure = useMapMeasure();
  const {
    measureMode,
    measureDistance,
    measureArea,
    measureGeoJson,
    measurePointsGeoJson,
    measureLabelsGeoJson,
    setMeasureModeAndReset,
    setCursorPos,
    addMeasurePoint,
    clearMeasure: handleClearMeasure,
    isMeasuring,
  } = measure;
  const [panelRatio, setPanelRatio] = useState(0.35);
  const draggingRef = useRef(false);
  const dashboardRef = useRef<HTMLDivElement>(null);

  const [daPoints, setDaPoints] = useState<DA[]>([]);
  const [trainStations, setTrainStations] = useState<TrainStation[]>([]);
  const [railwayGeoJson, setRailwayGeoJson] = useState<GeoJSON.FeatureCollection>({ type: 'FeatureCollection', features: [] });
  const daDebounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const stationsDebounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

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
      }).catch((err: unknown) => console.error('Failed to fetch DAs:', err));
    }, 500);
    return () => { if (daDebounceRef.current) clearTimeout(daDebounceRef.current); };
  }, [isDaLayerActive, mapBounds, isDaZoomedIn]);

  // Fetch train stations when layer active and bounds change
  const isStationsLayerActive = spatialLayers.some((l) => l.id === 'train-stations' && l.visible);

  useEffect(() => {
    if (!isStationsLayerActive || !mapBounds) {
      setTrainStations([]);
      return;
    }
    if (stationsDebounceRef.current) clearTimeout(stationsDebounceRef.current);
    stationsDebounceRef.current = setTimeout(() => {
      void fetchTrainStationsInBounds(mapBounds.west, mapBounds.south, mapBounds.east, mapBounds.north).then((s) => {
        setTrainStations(s);
      }).catch((err: unknown) => console.error('Failed to fetch train stations:', err));
    }, 400);
    return () => { if (stationsDebounceRef.current) clearTimeout(stationsDebounceRef.current); };
  }, [isStationsLayerActive, mapBounds]);

  // Fetch all railway lines once when layer activated (cached)
  const isRailwayLayerActive = spatialLayers.some((l) => l.id === 'railway' && l.visible);

  useEffect(() => {
    if (!isRailwayLayerActive) return;
    void fetchAllRailwayLines().then(setRailwayGeoJson).catch((err: unknown) => console.error('Failed to fetch railway lines:', err));
  }, [isRailwayLayerActive]);

  const stationsGeoJson: GeoJSON.FeatureCollection = {
    type: 'FeatureCollection',
    features: trainStations.map((s, i) => ({
      type: 'Feature' as const,
      geometry: { type: 'Point' as const, coordinates: [s.longitude, s.latitude] },
      properties: { id: `station-${i}`, name: s.name },
    })),
  };

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
      try {
        const [p, a, w] = await Promise.all([getAllPins(), getRecentActivity(), getWalkRoutes()]);
        if (!cancelled) {
          setPins(p);
          setActivity(a);
          setWalkRoutes({
            type: 'FeatureCollection',
            features: w.map((walk) => ({
              type: 'Feature' as const,
              properties: { id: walk.id, title: walk.title },
              geometry: { type: 'LineString' as const, coordinates: walk.route },
            })),
          });
          setIsLoading(false);
        }
      } catch (err: unknown) {
        console.error('Failed to load dashboard data:', err);
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const handleDragStart = useCallback((e: ReactPointerEvent) => {
    draggingRef.current = true;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }, []);

  const handleDragMove = useCallback((e: ReactPointerEvent) => {
    if (!draggingRef.current || !dashboardRef.current) return;
    const rect = dashboardRef.current.getBoundingClientRect();
    const y = e.clientY - rect.top;
    const ratio = 1 - y / rect.height;
    setPanelRatio(Math.min(0.65, Math.max(0.15, ratio)));
  }, []);

  const handleDragEnd = useCallback(() => {
    draggingRef.current = false;
  }, []);

  const toggle3dBuildings = useCallback(() => {
    const map = mapRef.current?.getMap();
    if (!map) return;

    if (buildings3d) {
      if (map.getLayer(BUILDINGS_LAYER_ID)) map.removeLayer(BUILDINGS_LAYER_ID);
      // Remove terrain
      map.setTerrain(null);
      if (map.getSource('mapbox-terrain-dem')) map.removeSource('mapbox-terrain-dem');
      setBuildings3d(false);
    } else {
      // Add 3D buildings
      if (!map.getLayer(BUILDINGS_LAYER_ID)) {
        map.addLayer({
          id: BUILDINGS_LAYER_ID,
          source: 'composite',
          'source-layer': 'building',
          filter: ['==', 'extrude', 'true'],
          type: 'fill-extrusion',
          minzoom: 15,
          paint: {
            'fill-extrusion-color': '#556',
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
      // Add terrain
      if (!map.getSource('mapbox-terrain-dem')) {
        map.addSource('mapbox-terrain-dem', {
          type: 'raster-dem',
          url: 'mapbox://mapbox.mapbox-terrain-dem-v1',
          tileSize: 512,
          maxzoom: 14,
        });
      }
      map.setTerrain({ source: 'mapbox-terrain-dem', exaggeration: 1.5 });
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
      'text-color': '#FAF8F5',
      'text-halo-color': 'rgba(0,0,0,0.7)',
      'text-halo-width': 1,
    },
  };
  /* eslint-enable @typescript-eslint/no-explicit-any */

  function handlePinClick(e: MapMouseEvent): void {
    type MapClickEvent = MapMouseEvent & { features?: Array<{ properties?: Record<string, unknown> }> };
    const feature = (e as MapClickEvent).features?.[0];
    if (!feature?.properties) return;
    const fType = feature.properties['featureType'];
    const fId = feature.properties['id'];
    if (typeof fType === 'string' && typeof fId === 'string' && fType in FEATURE_ROUTES) {
      const route = FEATURE_ROUTES[fType as FeatureType];
      navigate(`${route}/${fId}`);
    }
  }

  function handleMapClick(e: MapMouseEvent): void {
    if (isMeasuring) {
      const { lng, lat } = e.lngLat;
      addMeasurePoint(lng, lat);
      return;
    }
    handlePinClick(e);
  }

  return (
    <div className={styles.dashboard} ref={dashboardRef}>
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
          projection="mercator"
          interactiveLayerIds={['gt-pins-circle']}
          onClick={handleMapClick}
          cursor={isMeasuring ? 'crosshair' : 'pointer'}
          onMouseMove={(e) => {
            if (measureMode !== 'none') setCursorPos([e.lngLat.lng, e.lngLat.lat]);
          }}
          onMoveEnd={(e) => {
            const b = e.target.getBounds();
            if (b) setMapBounds({ west: b.getWest(), south: b.getSouth(), east: b.getEast(), north: b.getNorth() });
            setMapZoom(e.target.getZoom());
          }}
        >
          <NavigationControl position="top-right" />

          {/* ArcGIS spatial layers — sorted by zIndex so imagery is always on bottom */}
          {[...spatialLayers].filter((l) => l.visible && l.tileUrl).sort((a, b) => a.zIndex - b.zIndex).map((layer) => (
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

          {/* Walk route polylines */}
          {walkRoutes.features.length > 0 && (
            <Source id="gt-walks" type="geojson" data={walkRoutes}>
              <Layer
                id="gt-walks-line"
                type="line"
                paint={{
                  'line-color': '#66ff66',
                  'line-width': 3,
                  'line-dasharray': [2, 1.5],
                  'line-opacity': 0.9,
                }}
              />
            </Source>
          )}

          {/* Railway lines layer */}
          {isRailwayLayerActive && railwayGeoJson.features.length > 0 && (
            <Source id="gt-railway" type="geojson" data={railwayGeoJson}>
              <Layer
                id="gt-railway-line"
                type="line"
                beforeId={isStationsLayerActive ? 'gt-stations-dot' : undefined}
                paint={{
                  'line-color': '#D4653B',
                  'line-width': 1.5,
                  'line-opacity': spatialLayers.find((l) => l.id === 'railway')?.opacity ?? 0.7,
                }}
              />
            </Source>
          )}

          {/* Train stations layer */}
          {isStationsLayerActive && stationsGeoJson.features.length > 0 && (
            <Source id="gt-stations" type="geojson" data={stationsGeoJson}>
              <Layer
                id="gt-stations-dot"
                type="circle"
                paint={{
                  'circle-radius': 5,
                  'circle-color': '#D4653B',
                  'circle-stroke-width': 1.5,
                  'circle-stroke-color': 'rgba(250,248,245,0.8)',
                }}
              />
              <Layer
                id="gt-stations-label"
                type="symbol"
                layout={{
                  'text-field': ['get', 'name'],
                  'text-font': ['DIN Pro Medium', 'Arial Unicode MS Regular'],
                  'text-size': 10,
                  'text-offset': [0, 1.3],
                  'text-anchor': 'top',
                  'text-max-width': 10,
                  'text-allow-overlap': false,
                }}
                paint={{
                  'text-color': '#FAF8F5',
                  'text-halo-color': 'rgba(0,0,0,0.7)',
                  'text-halo-width': 1,
                }}
              />
            </Source>
          )}

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
                    'Approved', '#8B9080',
                    'Determined', '#8B9080',
                    'Refused', '#DC2626',
                    'Under Assessment', '#B0A08A',
                    'Pending', '#B0A08A',
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
                  'text-color': '#FAF8F5',
                  'text-halo-color': 'rgba(0,0,0,0.7)',
                  'text-halo-width': 0.8,
                  'text-opacity': spatialLayers.find((l) => l.id === 'das')?.opacity ?? 0.7,
                }}
              />
            </Source>
          )}

          {/* Measure drawing layers */}
          {measureGeoJson.features.length > 0 && (
            <Source id="gt-measure" type="geojson" data={measureGeoJson}>
              {measureMode === 'polygon' && (
                <Layer
                  id="gt-measure-fill"
                  type="fill"
                  paint={{ 'fill-color': '#2563EB', 'fill-opacity': 0.12 }}
                />
              )}
              <Layer
                id="gt-measure-line"
                type="line"
                paint={{ 'line-color': '#1D4ED8', 'line-width': 2.5, 'line-opacity': 0.9 }}
              />
            </Source>
          )}
          {measurePointsGeoJson.features.length > 0 && (
            <Source id="gt-measure-pts" type="geojson" data={measurePointsGeoJson}>
              <Layer
                id="gt-measure-dots"
                type="circle"
                paint={{ 'circle-radius': 5, 'circle-color': '#60A5FA', 'circle-stroke-width': 2, 'circle-stroke-color': '#1D4ED8' }}
              />
            </Source>
          )}
          {measureLabelsGeoJson.features.length > 0 && (
            <Source id="gt-measure-labels" type="geojson" data={measureLabelsGeoJson}>
              <Layer
                id="gt-measure-label-text"
                type="symbol"
                layout={{
                  'text-field': ['get', 'label'],
                  'text-font': ['DIN Pro Bold', 'Arial Unicode MS Bold'],
                  'text-size': ['case', ['get', 'isArea'], 13, 11],
                  'text-allow-overlap': true,
                  'text-ignore-placement': true,
                }}
                paint={{
                  'text-color': '#FAF8F5',
                  'text-halo-color': 'rgba(0,0,0,0.7)',
                  'text-halo-width': 1.5,
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

        {/* Measure tools */}
        <MeasureTools
          mode={measureMode}
          onModeChange={setMeasureModeAndReset}
          distance={measureDistance}
          area={measureArea}
          onClear={handleClearMeasure}
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

      <div
        className={styles.dragHandle}
        onPointerDown={handleDragStart}
        onPointerMove={handleDragMove}
        onPointerUp={handleDragEnd}
        onPointerCancel={handleDragEnd}
      >
        <div className={styles.dragHandleBar} />
      </div>

      <div
        className={styles.panelWrapper}
        style={{ '--panel-ratio': panelRatio } as React.CSSProperties}
      >
        <ActivityPanel
          activity={activity}
          pins={pins}
          isLoading={isLoading}
          expandedProperty={expandedProperty}
          onExpandProperty={setExpandedProperty}
          onFlyTo={(lng, lat) => {
            mapRef.current?.flyTo({ center: [lng, lat], zoom: 17, duration: 1200 });
          }}
        />
      </div>
    </div>
  );
}
