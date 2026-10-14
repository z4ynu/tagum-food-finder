import { BookmarkSimpleIcon, CompassIcon, MapPinIcon, UserCircleIcon } from "@phosphor-icons/react";

import styles from "./discovery.module.css";

const ITEMS = [
  { icon: MapPinIcon, label: "Discover", selected: true },
  { icon: BookmarkSimpleIcon, label: "Saved", selected: false },
  { icon: CompassIcon, label: "Wheel", selected: false },
  { icon: UserCircleIcon, label: "Account", selected: false },
] as const;

export function DiscoveryNavigation() {
  return (
    <nav className={styles.navigation} aria-label="Primary navigation">
      <a className={styles.brand} href="#discovery-results" aria-label="Asa Ta Mangaon? home">
        <span className={styles.brandMark} aria-hidden="true">
          <MapPinIcon weight="fill" />
        </span>
        <span className={styles.brandText}>
          <strong>Asa Ta Mangaon?</strong>
          <small>Tagum Food Finder</small>
        </span>
      </a>

      <div className={styles.navItems}>
        {ITEMS.map(({ icon: Icon, label, selected }) =>
          selected ? (
            <a className={styles.navItemSelected} href="#discovery-results" key={label}>
              <Icon aria-hidden="true" weight="fill" />
              <span>{label}</span>
            </a>
          ) : (
            <button
              className={styles.navItem}
              disabled
              key={label}
              title={`${label} will be added in a later phase`}
              type="button"
            >
              <Icon aria-hidden="true" />
              <span>{label}</span>
            </button>
          ),
        )}
      </div>
    </nav>
  );
}
