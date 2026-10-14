"use client";

import { CrosshairIcon, MinusIcon, PlusIcon, WarningIcon } from "@phosphor-icons/react";
import type { GeoJSONSource, Map as MapLibreMap, MapLayerMouseEvent } from "maplibre-gl";
import { Map as MapLibre, NavigationControl, setWorkerUrl } from "maplibre-gl";
import { useEffect, useMemo, useRef, useState } from "react";

import type { Coordinates, RankedPlace } from "@/modules/discovery/model";

import styles from "./discovery.module.css";

const DEVELOPMENT_STYLE_URL = "https://tiles.openfreemap.org/styles/positron";
setWorkerUrl("/maplibre-gl-worker.mjs");

type DiscoveryMapProps = Readonly<{
  location: Coordinates;
  onSelect: (placeId: string) => void;
  results: readonly RankedPlace[];
  selectedPlaceId: string | null;
}>;

function placesGeoJson(results: readonly RankedPlace[], selectedPlaceId: string | null) {
  return {
    features: results.map((result) => ({
      geometry: {
        coordinates: [result.place.coordinates.longitude, result.place.coordinates.latitude],
        type: "Point" as const,
      },
      properties: {
        id: result.place.id,
        matchState: result.matchState,
        name: result.place.name,
        selected: result.place.id === selectedPlaceId,
      },
      type: "Feature" as const,
    })),
    type: "FeatureCollection" as const,
  };
}

function locationGeoJson(location: Coordinates) {
  return {
    features: [
      {
        geometry: {
          coordinates: [location.longitude, location.latitude],
          type: "Point" as const,
        },
        properties: {},
        type: "Feature" as const,
      },
    ],
    type: "FeatureCollection" as const,
  };
}

export function DiscoveryMap({ location, onSelect, results, selectedPlaceId }: DiscoveryMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const onSelectRef = useRef(onSelect);
  const [mapState, setMapState] = useState<"loading" | "ready" | "error">("loading");
  const places = useMemo(() => placesGeoJson(results, selectedPlaceId), [results, selectedPlaceId]);
  const userLocation = useMemo(() => locationGeoJson(location), [location]);
  const initialLocationRef = useRef(location);
  const initialPlacesRef = useRef(places);
  const initialUserLocationRef = useRef(userLocation);

  useEffect(() => {
    onSelectRef.current = onSelect;
  }, [onSelect]);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) {
      return;
    }

    const map = new MapLibre({
      attributionControl: false,
      center: [initialLocationRef.current.longitude, initialLocationRef.current.latitude],
      container: containerRef.current,
      maxZoom: 18,
      minZoom: 10,
      style: DEVELOPMENT_STYLE_URL,
      zoom: 13.3,
    });
    mapRef.current = map;
    map.addControl(new NavigationControl({ showCompass: false, showZoom: false }), "top-right");

    const loadTimeout = window.setTimeout(() => {
      if (!map.loaded()) {
        setMapState("error");
      }
    }, 12_000);

    map.on("load", () => {
      window.clearTimeout(loadTimeout);
      setMapState("ready");

      map.addSource("places", {
        cluster: true,
        clusterMaxZoom: 15,
        clusterRadius: 48,
        data: initialPlacesRef.current,
        type: "geojson",
      });
      map.addSource("user-location", { data: initialUserLocationRef.current, type: "geojson" });

      map.addLayer({
        id: "place-clusters",
        paint: {
          "circle-color": "#4CAF50",
          "circle-radius": ["step", ["get", "point_count"], 20, 10, 24, 25, 30],
          "circle-stroke-color": "#FFFFFF",
          "circle-stroke-width": 3,
        },
        source: "places",
        type: "circle",
        filter: ["has", "point_count"],
      });
      map.addLayer({
        id: "cluster-count",
        layout: {
          "text-field": ["get", "point_count_abbreviated"],
          "text-size": 14,
        },
        paint: { "text-color": "#1F2D1F" },
        source: "places",
        type: "symbol",
        filter: ["has", "point_count"],
      });
      map.addLayer({
        id: "selected-place-halo",
        paint: {
          "circle-color": "#FFFFFF",
          "circle-radius": 19,
          "circle-stroke-color": "#1F2D1F",
          "circle-stroke-width": 4,
        },
        source: "places",
        type: "circle",
        filter: ["all", ["!", ["has", "point_count"]], ["==", ["get", "selected"], true]],
      });
      map.addLayer({
        id: "place-points",
        paint: {
          "circle-color": ["match", ["get", "matchState"], "unknown", "#A5D6A7", "#2E7D32"],
          "circle-radius": ["case", ["==", ["get", "selected"], true], 13, 10],
          "circle-stroke-color": "#FFFFFF",
          "circle-stroke-width": 3,
        },
        source: "places",
        type: "circle",
        filter: ["!", ["has", "point_count"]],
      });
      map.addLayer({
        id: "user-accuracy",
        paint: {
          "circle-color": "#2F80ED",
          "circle-opacity": 0.14,
          "circle-radius": 30,
          "circle-stroke-width": 0,
        },
        source: "user-location",
        type: "circle",
      });
      map.addLayer({
        id: "user-point",
        paint: {
          "circle-color": "#2F80ED",
          "circle-radius": 8,
          "circle-stroke-color": "#FFFFFF",
          "circle-stroke-width": 3,
        },
        source: "user-location",
        type: "circle",
      });

      map.on("click", "place-points", (event: MapLayerMouseEvent) => {
        const id = event.features?.[0]?.properties?.id;
        if (typeof id === "string") {
          onSelectRef.current(id);
        }
      });
      map.on("click", "place-clusters", async (event: MapLayerMouseEvent) => {
        const feature = event.features?.[0];
        const clusterId = feature?.properties?.cluster_id;
        const source = map.getSource("places") as GeoJSONSource | undefined;
        if (!feature || typeof clusterId !== "number" || !source) {
          return;
        }
        const zoom = await source.getClusterExpansionZoom(clusterId);
        if (feature.geometry.type !== "Point") {
          return;
        }
        const coordinates = feature.geometry.coordinates;
        map.easeTo({ center: [coordinates[0], coordinates[1]], duration: 350, zoom });
      });

      for (const layer of ["place-points", "place-clusters"]) {
        map.on("mouseenter", layer, () => {
          map.getCanvas().style.cursor = "pointer";
        });
        map.on("mouseleave", layer, () => {
          map.getCanvas().style.cursor = "";
        });
      }
    });

    map.on("error", () => {
      if (!map.loaded()) {
        setMapState("error");
      }
    });

    return () => {
      window.clearTimeout(loadTimeout);
      map.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map?.isStyleLoaded()) {
      return;
    }
    (map.getSource("places") as GeoJSONSource | undefined)?.setData(places);
  }, [places]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map?.isStyleLoaded()) {
      return;
    }
    (map.getSource("user-location") as GeoJSONSource | undefined)?.setData(userLocation);
  }, [userLocation]);

  useEffect(() => {
    const map = mapRef.current;
    const selected = results.find((result) => result.place.id === selectedPlaceId);
    if (!map || !selected || mapState !== "ready") {
      return;
    }
    map.easeTo({
      center: [selected.place.coordinates.longitude, selected.place.coordinates.latitude],
      duration: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : 350,
    });
  }, [mapState, results, selectedPlaceId]);

  const recenter = () => {
    mapRef.current?.easeTo({
      center: [location.longitude, location.latitude],
      duration: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : 350,
      zoom: 13.3,
    });
  };

  return (
    <section className={styles.mapRegion} aria-label="Food places map">
      <div className={styles.mapCanvas} ref={containerRef} />

      {mapState === "loading" ? <div className={styles.mapLoading}>Loading map</div> : null}
      {mapState === "error" ? (
        <div className={styles.mapError} role="status">
          <WarningIcon aria-hidden="true" />
          <strong>The map is unavailable</strong>
          <span>The nearby list still works. Check your connection to restore map tiles.</span>
        </div>
      ) : null}

      <div className={styles.mapControls}>
        <button aria-label="Return to selected location" onClick={recenter} type="button">
          <CrosshairIcon aria-hidden="true" weight="bold" />
        </button>
        <button aria-label="Zoom in" onClick={() => mapRef.current?.zoomIn()} type="button">
          <PlusIcon aria-hidden="true" weight="bold" />
        </button>
        <button aria-label="Zoom out" onClick={() => mapRef.current?.zoomOut()} type="button">
          <MinusIcon aria-hidden="true" weight="bold" />
        </button>
      </div>

      <div className={styles.mapAttribution}>
        <a href="https://openfreemap.org/" rel="noreferrer" target="_blank">
          OpenFreeMap
        </a>
        <span aria-hidden="true">©</span>
        <a href="https://openmaptiles.org/" rel="noreferrer" target="_blank">
          OpenMapTiles
        </a>
        <span>Data from</span>
        <a href="https://www.openstreetmap.org/copyright" rel="noreferrer" target="_blank">
          OpenStreetMap
        </a>
      </div>
    </section>
  );
}
