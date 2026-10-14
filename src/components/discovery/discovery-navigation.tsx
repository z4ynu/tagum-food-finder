import {
  BookmarkSimpleIcon,
  CompassIcon,
  LeafIcon,
  MapPinIcon,
  UserCircleIcon,
} from "@phosphor-icons/react";
import Link from "next/link";

import styles from "./discovery.module.css";

const ITEMS = [
  { href: "/#discovery-results", icon: MapPinIcon, label: "Discover" },
  { href: null, icon: BookmarkSimpleIcon, label: "Saved" },
  { href: "/wheel", icon: CompassIcon, label: "Wheel" },
  { href: null, icon: UserCircleIcon, label: "Account" },
] as const;

type NavigationDestination = (typeof ITEMS)[number]["label"];

export function DiscoveryNavigation({
  activeDestination = "Discover",
}: Readonly<{ activeDestination?: NavigationDestination }>) {
  return (
    <nav className={styles.navigation} aria-label="Primary navigation">
      <Link className={styles.brand} href="/#discovery-results" aria-label="Asa Ta Mangaon? home">
        <span className={styles.brandMark} aria-hidden="true">
          <LeafIcon weight="fill" />
        </span>
        <span className={styles.brandText}>
          <strong>Asa Ta Mangaon?</strong>
          <small>Tagum Food Finder</small>
        </span>
      </Link>

      <div className={styles.navItems}>
        {ITEMS.map(({ href, icon: Icon, label }) =>
          href ? (
            <Link
              aria-current={label === activeDestination ? "page" : undefined}
              className={label === activeDestination ? styles.navItemSelected : styles.navItem}
              href={href}
              key={label}
            >
              <Icon aria-hidden="true" weight={label === activeDestination ? "fill" : "regular"} />
              <span>{label}</span>
            </Link>
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
