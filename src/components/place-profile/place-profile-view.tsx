"use client";

import {
  ArrowLeftIcon,
  ClockIcon,
  CoinsIcon,
  ImageSquareIcon,
  InfoIcon,
  LeafIcon,
} from "@phosphor-icons/react";
import dynamic from "next/dynamic";
import Link from "next/link";

import { DiscoveryNavigation } from "@/components/discovery/discovery-navigation";
import type { DiscoveryPlace } from "@/modules/discovery/model";
import { placeProfileSlug } from "@/modules/discovery/place-profile-path";

import { ProfileActions } from "./profile-actions";
import styles from "./profile.module.css";

const PlaceMap = dynamic(() => import("./place-map").then((module) => module.PlaceMap), {
  loading: () => <div className={styles.profileMapPlaceholder}>Preparing the map</div>,
  ssr: false,
});

type PlaceProfileViewProps = Readonly<{
  distanceLabel: string;
  place: DiscoveryPlace;
}>;

export function PlaceProfileView({ distanceLabel, place }: PlaceProfileViewProps) {
  const address = place.address
    ? `${place.address}, Tagum City, Davao del Norte`
    : "Tagum City, Davao del Norte";

  return (
    <main className={styles.profileShell}>
      <div className={styles.desktopNavigation}>
        <DiscoveryNavigation accountReturnTo={`/places/${placeProfileSlug(place)}`} />
      </div>

      <article className={styles.profilePage}>
        <header className={styles.profileHeader}>
          <Link href="/#discovery-results">
            <ArrowLeftIcon aria-hidden="true" className={styles.profileHeaderIcon} />
            Back to nearby places
          </Link>
          <h1>Place details</h1>
        </header>

        <div className={styles.profileGrid}>
          <div className={styles.identityColumn}>
            <div className={styles.mediaPlaceholder}>
              <ImageSquareIcon aria-hidden="true" />
              <span>No photo available</span>
            </div>

            <section className={styles.placeIdentity} aria-labelledby="place-name">
              <h2 id="place-name">{place.name}</h2>
              <p>
                {place.category} <span aria-hidden="true">·</span> {distanceLabel}
              </p>
            </section>

            <div className={styles.sourceState}>
              <InfoIcon aria-hidden="true" weight="fill" />
              <span>Information may be incomplete</span>
            </div>

            <dl className={styles.detailRows}>
              <div>
                <dt>
                  <CoinsIcon aria-hidden="true" className={styles.detailIcon} />
                  Price
                </dt>
                <dd>Price information unavailable</dd>
              </div>
              <div>
                <dt>
                  <ClockIcon aria-hidden="true" className={styles.detailIcon} />
                  Hours
                </dt>
                <dd>Hours not confirmed</dd>
              </div>
              <div>
                <dt>
                  <LeafIcon aria-hidden="true" className={styles.detailIcon} />
                  Dietary information
                </dt>
                <dd>Dietary information not verified</dd>
              </div>
            </dl>
          </div>

          <aside className={styles.locationColumn} aria-labelledby="location-heading">
            <div className={styles.locationHeading}>
              <h2 id="location-heading">Location</h2>
              <p>{address}</p>
            </div>
            <PlaceMap coordinates={place.coordinates} />
            <ProfileActions place={place} />
            <p className={styles.sourceNote}>Place source: {place.sourceLabel}</p>
          </aside>
        </div>
      </article>
    </main>
  );
}
