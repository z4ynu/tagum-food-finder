"use client";

import {
  ArrowSquareOutIcon,
  BookmarkSimpleIcon,
  CompassIcon,
  NavigationArrowIcon,
  PencilSimpleIcon,
  ShareNetworkIcon,
} from "@phosphor-icons/react";
import Link from "next/link";
import { useState } from "react";

import {
  googleMapsDirectionsUrl,
  wazeDirectionsUrl,
} from "@/modules/discovery/external-navigation";
import type { DiscoveryPlace } from "@/modules/discovery/model";
import { placeProfileSlug } from "@/modules/discovery/place-profile-path";

import styles from "./profile.module.css";

export function ProfileActions({ place }: Readonly<{ place: DiscoveryPlace }>) {
  const [shareStatus, setShareStatus] = useState("");

  const share = async () => {
    const shareData = { title: place.name, url: window.location.href };
    try {
      if (navigator.share) {
        await navigator.share(shareData);
        return;
      }
      await navigator.clipboard.writeText(window.location.href);
      setShareStatus("Link copied");
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        return;
      }
      setShareStatus("Could not share this link");
    }
  };

  return (
    <div className={styles.actionStack}>
      <details className={styles.profileDirections}>
        <summary>
          <NavigationArrowIcon aria-hidden="true" className={styles.actionIcon} weight="fill" />
          Get directions
        </summary>
        <div className={styles.profileDirectionOptions}>
          <a href={googleMapsDirectionsUrl(place.coordinates)} rel="noreferrer" target="_blank">
            Google Maps
            <ArrowSquareOutIcon aria-hidden="true" />
          </a>
          <a href={wazeDirectionsUrl(place.coordinates)} rel="noreferrer" target="_blank">
            Waze
            <ArrowSquareOutIcon aria-hidden="true" />
          </a>
        </div>
      </details>

      <div className={styles.actionPair}>
        <button disabled title="Saving places will be added with accounts" type="button">
          <BookmarkSimpleIcon aria-hidden="true" className={styles.actionIcon} />
          Save
        </button>
        <button onClick={share} type="button">
          <ShareNetworkIcon aria-hidden="true" className={styles.actionIcon} />
          Share
        </button>
      </div>

      <Link
        className={styles.wideSecondaryAction}
        href={`/wheel?place=${encodeURIComponent(placeProfileSlug(place))}`}
      >
        <CompassIcon aria-hidden="true" className={styles.actionIcon} />
        Add to wheel
      </Link>

      <button
        className={styles.suggestAction}
        disabled
        title="Community updates will be added after accounts"
        type="button"
      >
        <PencilSimpleIcon aria-hidden="true" className={styles.actionIcon} />
        <span>Suggest an update</span>
      </button>

      <p aria-live="polite" className={styles.shareStatus}>
        {shareStatus}
      </p>
    </div>
  );
}
