"use client";

import { CrosshairIcon, WarningIcon } from "@phosphor-icons/react";
import type { Map as MapLibreMap } from "maplibre-gl";
import { Map as MapLibre, setWorkerUrl } from "maplibre-gl";
import { useEffect, useRef, useState } from "react";

import type { Coordinates } from "@/modules/discovery/model";

import styles from "./profile.module.css";

const DEVELOPMENT_STYLE_URL = "https://tiles.openfreemap.org/styles/positron";
setWorkerUrl("/maplibre-gl-worker.mjs");

export function PlaceMap({ coordinates }: Readonly<{ coordinates: Coordinates }>) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const initialCoordinates = useRef(coordinates);
  const [mapState, setMapState] = useState<"loading" | "ready" | "error">("loading");

  useEffect(() => {
    if (!containerRef.current || mapRef.current) {
      return;
    }

    const center: [number, number] = [
      initialCoordinates.current.longitude,
      initialCoordinates.current.latitude,
    ];
    const map = new MapLibre({
      attributionControl: false,
      center,
      container: containerRef.current,
      maxZoom: 18,
      minZoom: 10,
      scrollZoom: false,
      style: DEVELOPMENT_STYLE_URL,
      zoom: 14.2,
    });
    mapRef.current = map;

    const loadTimeout = window.setTimeout(() => {
      if (!map.loaded()) {
        setMapState("error");
      }
    }, 12_000);

    map.on("load", () => {
      window.clearTimeout(loadTimeout);
      setMapState("ready");
      map.addSource("profile-place", {
        data: {
          features: [
            {
              geometry: { coordinates: center, type: "Point" },
              properties: {},
              type: "Feature",
            },
          ],
          type: "FeatureCollection",
        },
        type: "geojson",
      });
      map.addLayer({
        id: "profile-place-halo",
        paint: {
          "circle-color": "#FFFFFF",
          "circle-radius": 16,
          "circle-stroke-color": "#1F2D1F",
          "circle-stroke-width": 4,
        },
        source: "profile-place",
        type: "circle",
      });
      map.addLayer({
        id: "profile-place-point",
        paint: {
          "circle-color": "#2E7D32",
          "circle-radius": 10,
          "circle-stroke-color": "#FFFFFF",
          "circle-stroke-width": 3,
        },
        source: "profile-place",
        type: "circle",
      });
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

  const recenter = () => {
    mapRef.current?.easeTo({
      center: [coordinates.longitude, coordinates.latitude],
      duration: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : 300,
      zoom: 14.2,
    });
  };

  return (
    <div className={styles.profileMap}>
      <div className={styles.profileMapCanvas} ref={containerRef} />
      {mapState === "loading" ? <div className={styles.profileMapLoading}>Loading map</div> : null}
      {mapState === "error" ? (
        <div className={styles.profileMapError} role="status">
          <WarningIcon aria-hidden="true" className={styles.mapErrorIcon} />
          <span>Map unavailable. The address and directions links still work.</span>
        </div>
      ) : null}
      <button aria-label="Return to this place" onClick={recenter} type="button">
        <CrosshairIcon aria-hidden="true" weight="bold" />
      </button>
      <div className={styles.profileAttribution}>
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
    </div>
  );
}
