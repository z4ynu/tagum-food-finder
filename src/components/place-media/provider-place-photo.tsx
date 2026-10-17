"use client";

import type { ReactNode } from "react";
import { useEffect, useRef, useState } from "react";

import styles from "./provider-place-photo.module.css";

type ProviderAttribution = Readonly<{
  displayName: string;
  uri: string | null;
}>;

type ProviderMedia = Readonly<{
  altText: string;
  attributions: readonly ProviderAttribution[];
  googleMapsUrl: string;
  height: number | null;
  url: string;
  width: number | null;
}>;

type ProviderPlacePhotoProps = Readonly<{
  className: string;
  failedFallback?: ReactNode;
  fallback: ReactNode;
  imageClassName?: string;
  linkedAttribution?: boolean;
  placeId: string;
}>;

function normalizeProviderMedia(value: unknown): ProviderMedia | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const response = value as Readonly<Record<string, unknown>>;
  if (response.available !== true || !response.media || typeof response.media !== "object") {
    return null;
  }
  const media = response.media as Readonly<Record<string, unknown>>;
  if (
    typeof media.altText !== "string" ||
    typeof media.googleMapsUrl !== "string" ||
    !media.googleMapsUrl.startsWith("https://www.google.com/") ||
    typeof media.url !== "string" ||
    !media.url.startsWith("/api/google-places/photo?")
  ) {
    return null;
  }
  const attributions = Array.isArray(media.attributions)
    ? media.attributions.flatMap((entry) => {
        if (!entry || typeof entry !== "object" || Array.isArray(entry)) return [];
        const attribution = entry as Readonly<Record<string, unknown>>;
        if (typeof attribution.displayName !== "string") return [];
        const uri =
          typeof attribution.uri === "string" && attribution.uri.startsWith("https://")
            ? attribution.uri
            : null;
        return [{ displayName: attribution.displayName, uri }];
      })
    : [];

  return {
    altText: media.altText,
    attributions,
    googleMapsUrl: media.googleMapsUrl,
    height: typeof media.height === "number" ? media.height : null,
    url: media.url,
    width: typeof media.width === "number" ? media.width : null,
  };
}

function Attribution({ linked, media }: Readonly<{ linked: boolean; media: ProviderMedia }>) {
  const author = media.attributions[0];
  const text = author ? `Photo: ${author.displayName} / Google` : "Photo: Google";
  const destination = author?.uri ?? media.googleMapsUrl;

  return linked ? (
    <a className={styles.attribution} href={destination} rel="noreferrer" target="_blank">
      {text}
    </a>
  ) : (
    <span className={styles.attribution}>{text}</span>
  );
}

export function ProviderPlacePhoto({
  className,
  failedFallback,
  fallback,
  imageClassName,
  linkedAttribution = false,
  placeId,
}: ProviderPlacePhotoProps) {
  const containerRef = useRef<HTMLSpanElement>(null);
  const [visible, setVisible] = useState(false);
  const [media, setMedia] = useState<ProviderMedia | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const element = containerRef.current;
    if (!element || visible) return;
    if (!("IntersectionObserver" in window)) {
      setVisible(true);
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: "240px" },
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, [visible]);

  useEffect(() => {
    if (!visible || media || failed) return;
    const controller = new AbortController();
    fetch(`/api/places/${encodeURIComponent(placeId)}/google-media`, {
      cache: "no-store",
      headers: { Accept: "application/json" },
      signal: controller.signal,
    })
      .then(async (response) => {
        if (!response.ok) return null;
        return normalizeProviderMedia(await response.json());
      })
      .then((nextMedia) => {
        if (nextMedia) setMedia(nextMedia);
        else setFailed(true);
      })
      .catch((error: unknown) => {
        if (!(error instanceof DOMException && error.name === "AbortError")) setFailed(true);
      });
    return () => controller.abort();
  }, [failed, media, placeId, visible]);

  return (
    <span className={className} ref={containerRef}>
      {media && !failed ? (
        <>
          {/* biome-ignore lint/performance/noImgElement: Google photo content must bypass persistent image optimization caches. */}
          <img
            alt={media.altText}
            className={`${styles.image} ${imageClassName ?? ""}`.trim()}
            height={media.height ?? undefined}
            loading="lazy"
            onError={() => setFailed(true)}
            src={media.url}
            width={media.width ?? undefined}
          />
          <Attribution linked={linkedAttribution} media={media} />
        </>
      ) : failed && failedFallback ? (
        failedFallback
      ) : (
        fallback
      )}
    </span>
  );
}
