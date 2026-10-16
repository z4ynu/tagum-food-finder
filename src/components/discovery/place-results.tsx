"use client";

import {
  ArrowSquareOutIcon,
  ForkKnifeIcon,
  InfoIcon,
  MapPinIcon,
  NavigationArrowIcon,
} from "@phosphor-icons/react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

import { MascotMark } from "@/components/brand/mascot-mark";
import { formatDistance } from "@/modules/discovery/distance";
import {
  googleMapsDirectionsUrl,
  wazeDirectionsUrl,
} from "@/modules/discovery/external-navigation";
import type { RankedPlace } from "@/modules/discovery/model";
import { placeProfilePath } from "@/modules/discovery/place-profile-path";

import styles from "./discovery.module.css";

type PlaceResultsProps = Readonly<{
  activeFilters: boolean;
  catalogUnavailable?: boolean;
  onSelect: (placeId: string) => void;
  results: readonly RankedPlace[];
  selectedPlaceId: string | null;
}>;

function EvidenceLabel({ result }: Readonly<{ result: RankedPlace }>) {
  if (result.matchState === "probable") {
    return (
      <span className={styles.probableLabel}>
        <InfoIcon aria-hidden="true" weight="fill" />
        Source-supported match
      </span>
    );
  }

  return (
    <span className={styles.unknownLabel}>
      <InfoIcon aria-hidden="true" weight="fill" />
      Price information unavailable
    </span>
  );
}

function DirectionsMenu({ result }: Readonly<{ result: RankedPlace }>) {
  return (
    <details className={styles.directionsMenu}>
      <summary>
        <NavigationArrowIcon aria-hidden="true" weight="fill" />
        Get directions
      </summary>
      <div className={styles.directionsOptions}>
        <a
          href={googleMapsDirectionsUrl(result.place.coordinates)}
          rel="noreferrer"
          target="_blank"
        >
          Google Maps
          <ArrowSquareOutIcon aria-hidden="true" />
        </a>
        <a href={wazeDirectionsUrl(result.place.coordinates)} rel="noreferrer" target="_blank">
          Waze
          <ArrowSquareOutIcon aria-hidden="true" />
        </a>
      </div>
    </details>
  );
}

function PlaceMediaPreview({ result }: Readonly<{ result: RankedPlace }>) {
  const [state, setState] = useState<"loading" | "ready" | "failed">("loading");
  const media = result.place.media;

  if (!media || state === "failed") {
    return (
      <span className={styles.placeMediaFallback}>
        <MascotMark />
        <small>{state === "failed" ? "Photo could not load" : "Photo not available"}</small>
      </span>
    );
  }

  return (
    <span className={styles.placeMedia}>
      <Image
        alt={media.altText}
        className={state === "loading" ? styles.placeMediaImageLoading : styles.placeMediaImage}
        fill
        onError={() => setState("failed")}
        onLoad={() => setState("ready")}
        sizes="(min-width: 1024px) 144px, 104px"
        src={media.url}
      />
    </span>
  );
}

function PlaceRow({
  result,
  selected,
  onSelect,
}: Readonly<{
  onSelect: () => void;
  result: RankedPlace;
  selected: boolean;
}>) {
  return (
    <article className={selected ? styles.placeRowSelected : styles.placeRow}>
      <button
        aria-label={`Show ${result.place.name} on the map`}
        aria-pressed={selected}
        className={styles.placeSelect}
        onClick={onSelect}
        type="button"
      >
        <PlaceMediaPreview result={result} />
        <span className={styles.placeCopy}>
          <span className={styles.placeName}>{result.place.name}</span>
          <span className={styles.placeMeta}>
            {result.place.category} <span aria-hidden="true">·</span>{" "}
            {formatDistance(result.distanceKilometers)}
          </span>
          <EvidenceLabel result={result} />
        </span>
      </button>

      {!result.place.media ? (
        <Link
          className={styles.mediaSuggestion}
          href={`${placeProfilePath(result.place)}/suggest-update`}
        >
          <ForkKnifeIcon aria-hidden="true" weight="fill" />
          Know this place? Suggest a photo
        </Link>
      ) : null}

      {selected ? (
        <div className={styles.selectedActions}>
          <Link className={styles.profileLink} href={placeProfilePath(result.place)}>
            View details
          </Link>
          <DirectionsMenu result={result} />
        </div>
      ) : null}
    </article>
  );
}

export function PlaceResults({
  activeFilters,
  catalogUnavailable = false,
  onSelect,
  results,
  selectedPlaceId,
}: PlaceResultsProps) {
  const directResults = activeFilters
    ? results.filter(
        (result) => result.matchState === "confirmed" || result.matchState === "probable",
      )
    : results;
  const unknownResults = activeFilters
    ? results.filter((result) => result.matchState === "unknown")
    : [];

  if (results.length === 0) {
    return (
      <div className={styles.emptyState}>
        <MapPinIcon aria-hidden="true" />
        <h2>
          {catalogUnavailable
            ? "Places are temporarily unavailable"
            : "No places match that search"}
        </h2>
        <p>
          {catalogUnavailable
            ? "We could not reach the live catalog. Check your connection and try again shortly."
            : "Try a shorter place name or clear one filter. Your selections have not been removed."}
        </p>
      </div>
    );
  }

  return (
    <div className={styles.resultGroups}>
      {directResults.length > 0 ? (
        <section aria-label={activeFilters ? "Matches" : "Nearby places"}>
          {activeFilters ? (
            <div className={styles.groupHeading}>
              <h2>Best available matches</h2>
              <span>{directResults.length}</span>
            </div>
          ) : null}
          <div className={styles.resultList}>
            {directResults.map((result) => (
              <PlaceRow
                key={result.place.id}
                onSelect={() => onSelect(result.place.id)}
                result={result}
                selected={selectedPlaceId === result.place.id}
              />
            ))}
          </div>
        </section>
      ) : activeFilters ? (
        <div className={styles.constraintNote}>
          <strong>No confirmed matches yet.</strong>
          <span>One or more selected details are unavailable in the current catalog.</span>
        </div>
      ) : null}

      {unknownResults.length > 0 ? (
        <section aria-labelledby="unknown-results-heading" className={styles.unknownGroup}>
          <div className={styles.groupHeading}>
            <h2 id="unknown-results-heading">More nearby, details unknown</h2>
            <span>{unknownResults.length}</span>
          </div>
          <p>
            These places may still fit. The information needed to confirm your filters is missing.
          </p>
          <div className={styles.resultList}>
            {unknownResults.map((result) => (
              <PlaceRow
                key={result.place.id}
                onSelect={() => onSelect(result.place.id)}
                result={result}
                selected={selectedPlaceId === result.place.id}
              />
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
