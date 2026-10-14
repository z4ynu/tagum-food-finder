"use client";

import {
  CaretDownIcon,
  CaretUpIcon,
  CrosshairIcon,
  FunnelSimpleIcon,
  MagnifyingGlassIcon,
  MapPinIcon,
  WifiSlashIcon,
  XIcon,
} from "@phosphor-icons/react";
import dynamic from "next/dynamic";
import { useCallback, useEffect, useMemo, useState } from "react";

import { rankPlaces } from "@/modules/discovery/filter-places";
import type { Coordinates, DiscoveryFilters } from "@/modules/discovery/model";
import {
  MANUAL_LOCATIONS,
  PROTOTYPE_PLACES,
  TAGUM_CITY_CENTER,
} from "@/modules/discovery/prototype-places";

import { DiscoveryNavigation } from "./discovery-navigation";
import styles from "./discovery.module.css";
import { FiltersSheet } from "./filters-sheet";
import { LocationDialog } from "./location-dialog";
import { PlaceResults } from "./place-results";

const DiscoveryMap = dynamic(
  () => import("./discovery-map").then((module) => module.DiscoveryMap),
  {
    loading: () => <div className={styles.mapPlaceholder}>Preparing the map</div>,
    ssr: false,
  },
);

const DEFAULT_FILTERS: DiscoveryFilters = {
  budgetMaximumPhp: null,
  craving: null,
  occasion: null,
  query: "",
};

type SheetPosition = "collapsed" | "half" | "full";

function hasStructuredFilters(filters: DiscoveryFilters) {
  return filters.budgetMaximumPhp !== null || filters.craving !== null || filters.occasion !== null;
}

function activeFilterLabels(filters: DiscoveryFilters) {
  return [
    filters.budgetMaximumPhp === null ? null : `Up to ₱${filters.budgetMaximumPhp}`,
    filters.craving,
    filters.occasion,
  ].filter((label): label is string => label !== null);
}

export function DiscoveryShell() {
  const [filters, setFilters] = useState<DiscoveryFilters>(DEFAULT_FILTERS);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [location, setLocation] = useState<Coordinates>(TAGUM_CITY_CENTER);
  const [locationBusy, setLocationBusy] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [locationLabel, setLocationLabel] = useState("Tagum City center");
  const [locationOpen, setLocationOpen] = useState(false);
  const [online, setOnline] = useState(true);
  const [selectedPlaceId, setSelectedPlaceId] = useState<string | null>(null);
  const [sheetPosition, setSheetPosition] = useState<SheetPosition>("half");

  const results = useMemo(
    () => rankPlaces(PROTOTYPE_PLACES, location, filters),
    [filters, location],
  );
  const selectedPlace = results.find((result) => result.place.id === selectedPlaceId) ?? results[0];
  const filterLabels = activeFilterLabels(filters);
  const structuredFiltersActive = hasStructuredFilters(filters);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    if (window.localStorage.getItem("tagum-food-finder.location-intro-seen") !== "true") {
      setLocationOpen(true);
    }

    const updateOnlineState = () => setOnline(window.navigator.onLine);
    updateOnlineState();
    window.addEventListener("online", updateOnlineState);
    window.addEventListener("offline", updateOnlineState);
    return () => {
      window.removeEventListener("online", updateOnlineState);
      window.removeEventListener("offline", updateOnlineState);
    };
  }, []);

  useEffect(() => {
    if (results.length === 0) {
      setSelectedPlaceId(null);
      return;
    }
    if (!results.some((result) => result.place.id === selectedPlaceId)) {
      setSelectedPlaceId(results[0].place.id);
    }
  }, [results, selectedPlaceId]);

  const closeLocation = useCallback(() => {
    window.localStorage.setItem("tagum-food-finder.location-intro-seen", "true");
    setLocationOpen(false);
    setLocationBusy(false);
  }, []);

  const chooseManualLocation = useCallback(
    (index: number) => {
      const next = MANUAL_LOCATIONS[index];
      if (!next) {
        return;
      }
      setLocation(next.coordinates);
      setLocationLabel(next.label);
      setLocationError(null);
      closeLocation();
    },
    [closeLocation],
  );

  const requestLocation = useCallback(() => {
    setLocationError(null);
    if (!("geolocation" in navigator)) {
      setLocationError("Live location is not available on this device. Choose an area instead.");
      return;
    }

    setLocationBusy(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
        setLocationLabel("Current location");
        setLocationError(null);
        closeLocation();
      },
      (error) => {
        const message =
          error.code === error.PERMISSION_DENIED
            ? "Location permission was not granted. Choose an area instead."
            : "We could not get a reliable location. Choose an area or try again.";
        setLocationError(message);
        setLocationBusy(false);
      },
      { enableHighAccuracy: true, maximumAge: 60_000, timeout: 10_000 },
    );
  }, [closeLocation]);

  const removeFilter = (label: string) => {
    if (label === filters.craving) {
      setFilters({ ...filters, craving: null });
    } else if (label === filters.occasion) {
      setFilters({ ...filters, occasion: null });
    } else {
      setFilters({ ...filters, budgetMaximumPhp: null });
    }
  };

  const cycleSheet = () => {
    setSheetPosition((current) => {
      if (current === "collapsed") {
        return "half";
      }
      if (current === "half") {
        return "full";
      }
      return "collapsed";
    });
  };

  const previewCount = useCallback(
    (draft: DiscoveryFilters) => rankPlaces(PROTOTYPE_PLACES, location, draft).length,
    [location],
  );

  return (
    <main className={styles.shell}>
      {!online ? (
        <div className={styles.offlineBanner} role="status">
          <WifiSlashIcon aria-hidden="true" weight="bold" />
          You are offline. Cached place details may be outdated, and fresh map tiles may be
          unavailable.
        </div>
      ) : null}

      <DiscoveryNavigation />

      <div className={styles.workspace}>
        <aside
          className={`${styles.resultsPanel} ${styles[`sheet-${sheetPosition}`]}`}
          id="discovery-results"
        >
          <div className={styles.sheetHandle} aria-hidden="true" />
          <header className={styles.resultsHeader}>
            <div className={styles.headingRow}>
              <div>
                <p className={styles.mobileBrand}>Asa Ta Mangaon?</p>
                <h1>Nearby places</h1>
                <p>Closest to your selected location</p>
              </div>
              <button
                aria-label={`${sheetPosition === "full" ? "Collapse" : "Expand"} nearby results`}
                className={styles.sheetToggle}
                onClick={cycleSheet}
                type="button"
              >
                {sheetPosition === "full" ? (
                  <CaretDownIcon aria-hidden="true" weight="bold" />
                ) : (
                  <CaretUpIcon aria-hidden="true" weight="bold" />
                )}
              </button>
            </div>

            <div className={styles.searchRow}>
              <label className={styles.searchField}>
                <span className="sr-only">Search food places</span>
                <MagnifyingGlassIcon aria-hidden="true" />
                <input
                  onChange={(event) => setFilters({ ...filters, query: event.target.value })}
                  placeholder="Search food places"
                  type="search"
                  value={filters.query}
                />
              </label>
              <button
                className={styles.filtersButton}
                onClick={() => setFiltersOpen(true)}
                type="button"
              >
                <FunnelSimpleIcon aria-hidden="true" weight="bold" />
                Filters
                {filterLabels.length > 0 ? <span>{filterLabels.length}</span> : null}
              </button>
            </div>

            <button
              className={styles.locationButton}
              onClick={() => setLocationOpen(true)}
              type="button"
            >
              <CrosshairIcon aria-hidden="true" weight="bold" />
              <span>
                <strong>{locationLabel}</strong>
                <small>Change location</small>
              </span>
            </button>

            {filterLabels.length > 0 ? (
              <fieldset className={styles.activeFilters}>
                <legend className="sr-only">Active filters</legend>
                {filterLabels.map((label) => (
                  <button key={label} onClick={() => removeFilter(label)} type="button">
                    {label}
                    <XIcon aria-hidden="true" weight="bold" />
                  </button>
                ))}
              </fieldset>
            ) : null}

            <div className={styles.catalogNotice}>
              <MapPinIcon aria-hidden="true" weight="fill" />
              <span>
                Prototype catalog from approved OSM records. Coverage and place details are
                incomplete.
              </span>
            </div>
          </header>

          <div className={styles.resultsScroll}>
            <PlaceResults
              activeFilters={structuredFiltersActive}
              onSelect={setSelectedPlaceId}
              results={results}
              selectedPlaceId={selectedPlace?.place.id ?? null}
            />
          </div>
        </aside>

        <DiscoveryMap
          location={location}
          onSelect={setSelectedPlaceId}
          results={results}
          selectedPlaceId={selectedPlace?.place.id ?? null}
        />
      </div>

      <FiltersSheet
        filters={filters}
        getPreviewCount={previewCount}
        onApply={setFilters}
        onClose={() => setFiltersOpen(false)}
        open={filtersOpen}
      />
      <LocationDialog
        busy={locationBusy}
        error={locationError}
        onChooseManual={chooseManualLocation}
        onClose={closeLocation}
        onUseLocation={requestLocation}
        open={locationOpen}
      />
    </main>
  );
}
