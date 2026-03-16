import { useState, useRef, useEffect, useCallback } from "react";
import type { MeasureMode } from "../components/map/MeasureTools";

function haversineDist(a: [number, number], b: [number, number]): number {
  const R = 6371000;
  const dLat = ((b[1] - a[1]) * Math.PI) / 180;
  const dLon = ((b[0] - a[0]) * Math.PI) / 180;
  const lat1 = (a[1] * Math.PI) / 180;
  const lat2 = (b[1] * Math.PI) / 180;
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

function fmtDist(m: number): string {
  if (m < 1000) return `${Math.round(m)} m`;
  return `${(m / 1000).toFixed(2)} km`;
}

function fmtArea(sqm: number): string {
  if (sqm < 10_000) return `${Math.round(sqm).toLocaleString()} m\u00B2`;
  return `${(sqm / 10_000).toFixed(2)} ha`;
}

function computeSegmentLabels(
  allSegs: [number, number][],
  livePoints: [number, number][],
  measureArea: number | null,
): GeoJSON.Feature[] {
  const labels: GeoJSON.Feature[] = [];
  for (let i = 1; i < allSegs.length; i++) {
    const a = allSegs[i - 1];
    const b = allSegs[i];
    if (!a || !b) continue;
    const d = haversineDist(a, b);
    labels.push({
      type: "Feature",
      properties: { label: fmtDist(d) },
      geometry: {
        type: "Point",
        coordinates: [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2],
      },
    });
  }
  if (measureArea && livePoints.length >= 3) {
    const cx = livePoints.reduce((s, p) => s + p[0], 0) / livePoints.length;
    const cy = livePoints.reduce((s, p) => s + p[1], 0) / livePoints.length;
    labels.push({
      type: "Feature",
      properties: { label: fmtArea(measureArea), isArea: true },
      geometry: { type: "Point", coordinates: [cx, cy] },
    });
  }
  return labels;
}

function computePolygonArea(
  livePoints: [number, number][],
  firstPoint: [number, number],
): number {
  const signedArea = livePoints.reduce((sum, pt, i) => {
    const nextIdx = (i + 1) % livePoints.length;
    const next = livePoints[nextIdx];
    if (!next) return sum;
    return sum + (pt[0] * next[1] - next[0] * pt[1]);
  }, 0);
  return (
    (Math.abs(signedArea) / 2) *
    111320 *
    111320 *
    Math.cos((firstPoint[1] * Math.PI) / 180)
  );
}

export interface UseMapMeasureReturn {
  measureMode: MeasureMode;
  measurePoints: [number, number][];
  cursorPos: [number, number] | null;
  measureFinished: boolean;
  measureDistance: number | null;
  measureArea: number | null;
  measureGeoJson: GeoJSON.FeatureCollection;
  measurePointsGeoJson: GeoJSON.FeatureCollection;
  measureLabelsGeoJson: GeoJSON.FeatureCollection;
  setMeasureMode: (mode: MeasureMode) => void;
  setMeasureModeAndReset: (mode: MeasureMode) => void;
  setCursorPos: (pos: [number, number] | null) => void;
  addMeasurePoint: (lng: number, lat: number) => void;
  finishMeasure: () => void;
  clearMeasure: () => void;
  isMeasuring: boolean;
}

export function useMapMeasure(): UseMapMeasureReturn {
  const [measureMode, setMeasureMode] = useState<MeasureMode>("none");
  const [measurePoints, setMeasurePoints] = useState<[number, number][]>([]);
  const [cursorPos, setCursorPos] = useState<[number, number] | null>(null);
  const [measureFinished, setMeasureFinished] = useState(false);
  const lastClickTimeRef = useRef(0);

  const livePoints =
    cursorPos &&
    measureMode !== "none" &&
    !measureFinished &&
    measurePoints.length > 0
      ? [...measurePoints, cursorPos]
      : measurePoints;

  const firstPoint = livePoints[0];
  const allSegs =
    measureMode === "polygon" && livePoints.length >= 3 && firstPoint
      ? [...livePoints, firstPoint]
      : livePoints;

  const measureArea =
    measureMode === "polygon" && livePoints.length >= 3 && firstPoint
      ? computePolygonArea(livePoints, firstPoint)
      : null;

  let totalDist = 0;
  for (let i = 1; i < allSegs.length; i++) {
    const a = allSegs[i - 1];
    const b = allSegs[i];
    if (!a || !b) continue;
    totalDist += haversineDist(a, b);
  }
  const measureDistance = totalDist > 0 ? totalDist : null;

  const segmentLabels = computeSegmentLabels(allSegs, livePoints, measureArea);

  const measureGeoJson: GeoJSON.FeatureCollection = {
    type: "FeatureCollection",
    features:
      livePoints.length >= 2
        ? [
            {
              type: "Feature",
              properties: {},
              geometry:
                measureMode === "polygon" &&
                livePoints.length >= 3 &&
                firstPoint
                  ? {
                      type: "Polygon",
                      coordinates: [[...livePoints, firstPoint]],
                    }
                  : { type: "LineString", coordinates: livePoints },
            },
          ]
        : [],
  };

  const measurePointsGeoJson: GeoJSON.FeatureCollection = {
    type: "FeatureCollection",
    features: measurePoints.map((pt, i) => ({
      type: "Feature" as const,
      properties: { index: i },
      geometry: { type: "Point" as const, coordinates: pt },
    })),
  };

  const measureLabelsGeoJson: GeoJSON.FeatureCollection = {
    type: "FeatureCollection",
    features: segmentLabels,
  };

  const addMeasurePoint = useCallback((lng: number, lat: number) => {
    const now = Date.now();
    const timeSinceLast = now - lastClickTimeRef.current;
    lastClickTimeRef.current = now;

    setMeasurePoints((prev) => {
      if (timeSinceLast < 350 && prev.length >= 2) {
        setCursorPos(null);
        setMeasureFinished(true);
        return prev;
      }
      return [...prev, [lng, lat]];
    });
  }, []);

  const finishMeasure = useCallback(() => {
    setMeasurePoints((prev) => prev.slice(0, -1));
    setCursorPos(null);
    setMeasureFinished(true);
  }, []);

  const clearMeasure = useCallback(() => {
    setMeasurePoints([]);
    setCursorPos(null);
    setMeasureFinished(false);
    setMeasureMode("none");
  }, []);

  const setMeasureModeAndReset = useCallback((mode: MeasureMode) => {
    setMeasurePoints([]);
    setCursorPos(null);
    setMeasureFinished(false);
    setMeasureMode(mode);
  }, []);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && measureMode !== "none") {
        clearMeasure();
      }
    }
    globalThis.addEventListener("keydown", handleKeyDown);
    return () => globalThis.removeEventListener("keydown", handleKeyDown);
  }, [measureMode, clearMeasure]);

  const isMeasuring = measureMode !== "none" && !measureFinished;

  return {
    measureMode,
    measurePoints,
    cursorPos,
    measureFinished,
    measureDistance,
    measureArea,
    measureGeoJson,
    measurePointsGeoJson,
    measureLabelsGeoJson,
    setMeasureMode,
    setCursorPos,
    addMeasurePoint,
    finishMeasure,
    clearMeasure,
    setMeasureModeAndReset,
    isMeasuring,
  };
}
