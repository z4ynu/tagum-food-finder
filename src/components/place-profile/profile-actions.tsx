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
import { useRouter } from "next/navigation";
import { useState } from "react";

import { setFavoriteAction } from "@/app/actions/saved-library";
import {
  googleMapsDirectionsUrl,
  wazeDirectionsUrl,
} from "@/modules/discovery/external-navigation";
import type { DiscoveryPlace } from "@/modules/discovery/model";
import { placeProfileSlug } from "@/modules/discovery/place-profile-path";

import styles from "./profile.module.css";

type ProfileActionsProps = Readonly<{
  initiallySaved: boolean;
  place: DiscoveryPlace;
}>;

export function ProfileActions({ initiallySaved, place }: ProfileActionsProps) {
  const router = useRouter();
  const [shareStatus, setShareStatus] = useState("");
  const [saveStatus, setSaveStatus] = useState("");
  const [saved, setSaved] = useState(initiallySaved);
  const [saving, setSaving] = useState(false);
  const profileSlug = placeProfileSlug(place);
  const profilePath = `/places/${profileSlug}`;
  const suggestUpdateHref = `/places/${profileSlug}/suggest-update${
    process.env.NODE_ENV === "production" ? "" : "?preview=signed-in"
  }`;

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

  const toggleSaved = async () => {
    const nextSaved = !saved;
    setSaving(true);
    setSaveStatus("");
    setSaved(nextSaved);

    const result = await setFavoriteAction({
      placeId: place.id,
      placeSlug: profileSlug,
      saved: nextSaved,
    });
    setSaving(false);

    if (result.status === "authentication-required") {
      setSaved(saved);
      router.push(`/account?returnTo=${encodeURIComponent(profilePath)}`);
      return;
    }
    if (result.status === "error") {
      setSaved(saved);
      setSaveStatus("Could not update Saved. Please try again.");
      return;
    }

    setSaveStatus(nextSaved ? "Saved to your account" : "Removed from Saved");
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
        <button aria-pressed={saved} disabled={saving} onClick={toggleSaved} type="button">
          <BookmarkSimpleIcon
            aria-hidden="true"
            className={styles.actionIcon}
            weight={saved ? "fill" : "regular"}
          />
          {saving ? "Saving…" : saved ? "Saved" : "Save"}
        </button>
        <button onClick={share} type="button">
          <ShareNetworkIcon aria-hidden="true" className={styles.actionIcon} />
          Share
        </button>
      </div>

      <Link
        className={styles.wideSecondaryAction}
        href={`/wheel?place=${encodeURIComponent(profileSlug)}`}
      >
        <CompassIcon aria-hidden="true" className={styles.actionIcon} />
        Add to wheel
      </Link>

      <Link className={styles.suggestAction} href={suggestUpdateHref}>
        <PencilSimpleIcon aria-hidden="true" className={styles.actionIcon} />
        <span>Suggest an update</span>
      </Link>

      <p aria-live="polite" className={styles.shareStatus}>
        {saveStatus || shareStatus}
      </p>
    </div>
  );
}
