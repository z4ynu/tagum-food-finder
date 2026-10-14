"use client";

import {
  ArrowCounterClockwiseIcon,
  ArrowRightIcon,
  BookmarkSimpleIcon,
  BowlFoodIcon,
  CoffeeIcon,
  CompassIcon,
  DotsThreeVerticalIcon,
  ForkKnifeIcon,
  InfoIcon,
  ListBulletsIcon,
  MapPinIcon,
  NavigationArrowIcon,
  PencilSimpleIcon,
  PlusIcon,
  TrashIcon,
  UserCircleIcon,
  XIcon,
} from "@phosphor-icons/react";
import Link from "next/link";
import type { FormEvent } from "react";
import { useEffect, useMemo, useRef, useState } from "react";

import { MascotMark } from "@/components/brand/mascot-mark";
import { DiscoveryNavigation } from "@/components/discovery/discovery-navigation";
import { googleMapsDirectionsUrl } from "@/modules/discovery/external-navigation";
import type { DiscoveryPlace } from "@/modules/discovery/model";
import { placeProfilePath, placeProfileSlug } from "@/modules/discovery/place-profile-path";
import { PROTOTYPE_PLACES } from "@/modules/discovery/prototype-places";

import styles from "./saved.module.css";

type SavedPlace = Readonly<{
  distanceLabel: string;
  icon: typeof ForkKnifeIcon;
  place: DiscoveryPlace;
}>;

type WheelList = Readonly<{
  id: string;
  name: string;
  placeCount: number;
  placeSlug: string;
}>;

type MobileView = "places" | "wheels";
type ListDialog = Readonly<{ mode: "create" }> | Readonly<{ listId: string; mode: "rename" }>;

const SAVED_PLACE_FIXTURES = [
  { distanceLabel: "0.8 km", icon: ForkKnifeIcon, name: "Big Fat Tummy" },
  { distanceLabel: "1.4 km", icon: CoffeeIcon, name: "The Turq Cafe" },
  { distanceLabel: "2.1 km", icon: BowlFoodIcon, name: "Sarah's Delicious Mami" },
] as const;

const INITIAL_WHEEL_LISTS: readonly WheelList[] = [
  {
    id: "friday-food-trip",
    name: "Friday food trip",
    placeCount: 5,
    placeSlug: "big-fat-tummy-1266659558",
  },
  {
    id: "date-night-picks",
    name: "Date night picks",
    placeCount: 4,
    placeSlug: "the-turq-cafe-11359696569",
  },
];

function prototypeSavedPlaces(): SavedPlace[] {
  return SAVED_PLACE_FIXTURES.map(({ distanceLabel, icon, name }) => {
    const place = PROTOTYPE_PLACES.find((candidate) => candidate.name === name);
    if (!place) {
      throw new Error(`Missing prototype place: ${name}`);
    }
    return { distanceLabel, icon, place };
  });
}

export function SavedPage() {
  const initialPlaces = useMemo(prototypeSavedPlaces, []);
  const [savedPlaces, setSavedPlaces] = useState(initialPlaces);
  const [wheelLists, setWheelLists] = useState<WheelList[]>([...INITIAL_WHEEL_LISTS]);
  const [mobileView, setMobileView] = useState<MobileView>("places");
  const [removedPlace, setRemovedPlace] = useState<{ item: SavedPlace; index: number } | null>(
    null,
  );
  const [dialog, setDialog] = useState<ListDialog | null>(null);
  const [draftName, setDraftName] = useState("");
  const [online, setOnline] = useState(true);
  const dialogInputRef = useRef<HTMLInputElement>(null);
  const dialogTriggerRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
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
    if (!dialog) {
      return;
    }

    dialogInputRef.current?.focus();
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setDialog(null);
      }
    };
    window.addEventListener("keydown", closeOnEscape);

    return () => {
      window.removeEventListener("keydown", closeOnEscape);
      dialogTriggerRef.current?.focus();
    };
  }, [dialog]);

  const removePlace = (placeId: string) => {
    const index = savedPlaces.findIndex(({ place }) => place.id === placeId);
    if (index < 0) {
      return;
    }
    setRemovedPlace({ index, item: savedPlaces[index] });
    setSavedPlaces((current) => current.filter(({ place }) => place.id !== placeId));
  };

  const undoRemove = () => {
    if (!removedPlace) {
      return;
    }
    setSavedPlaces((current) => {
      const restored = [...current];
      restored.splice(removedPlace.index, 0, removedPlace.item);
      return restored;
    });
    setRemovedPlace(null);
  };

  const openCreateDialog = () => {
    dialogTriggerRef.current =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;
    setDraftName("");
    setDialog({ mode: "create" });
  };

  const openRenameDialog = (list: WheelList) => {
    dialogTriggerRef.current =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;
    setDraftName(list.name);
    setDialog({ listId: list.id, mode: "rename" });
  };

  const saveList = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const name = draftName.trim();
    if (!name || !dialog) {
      return;
    }

    if (dialog.mode === "create") {
      setWheelLists((current) => [
        ...current,
        {
          id: window.crypto.randomUUID(),
          name: name.slice(0, 40),
          placeCount: 0,
          placeSlug: placeProfileSlug(PROTOTYPE_PLACES[0]),
        },
      ]);
    } else {
      setWheelLists((current) =>
        current.map((list) =>
          list.id === dialog.listId ? { ...list, name: name.slice(0, 40) } : list,
        ),
      );
    }
    setDialog(null);
    setDraftName("");
  };

  const deleteList = (listId: string) => {
    setWheelLists((current) => current.filter((list) => list.id !== listId));
  };

  return (
    <main className={styles.shell}>
      <header className={styles.desktopHeader}>
        <Link className={styles.headerBrand} href="/#discovery-results">
          <MascotMark priority />
          <span>
            <strong>Asa Ta Mangaon?</strong>
            <small>Tagum Food Finder</small>
          </span>
        </Link>
        <nav aria-label="Primary navigation" className={styles.desktopNav}>
          <Link href="/#discovery-results">
            <MapPinIcon aria-hidden="true" />
            Discover
          </Link>
          <Link aria-current="page" className={styles.desktopNavActive} href="/saved">
            <BookmarkSimpleIcon aria-hidden="true" weight="fill" />
            Saved
          </Link>
          <Link href="/wheel">
            <CompassIcon aria-hidden="true" />
            Wheel
          </Link>
          <Link href="/account?returnTo=%2Fsaved">
            <UserCircleIcon aria-hidden="true" />
            Account
          </Link>
        </nav>
      </header>

      {!online ? (
        <div className={styles.offlineBanner} role="status">
          <InfoIcon aria-hidden="true" weight="fill" />
          You are offline. Showing the last available prototype content.
        </div>
      ) : null}

      <div className={styles.page}>
        <header className={styles.pageHeader}>
          <div>
            <h1>Saved</h1>
            <p>Your places and wheel lists, ready when you are.</p>
          </div>
          <Link
            aria-label="Open account"
            className={styles.accountShortcut}
            href="/account?returnTo=%2Fsaved"
          >
            <MascotMark priority />
          </Link>
        </header>

        <div aria-label="Saved content" className={styles.mobileTabs} role="tablist">
          <button
            aria-selected={mobileView === "places"}
            className={mobileView === "places" ? styles.mobileTabActive : styles.mobileTab}
            onClick={() => setMobileView("places")}
            role="tab"
            type="button"
          >
            <BookmarkSimpleIcon
              aria-hidden="true"
              weight={mobileView === "places" ? "fill" : "regular"}
            />
            Places ({savedPlaces.length})
          </button>
          <button
            aria-selected={mobileView === "wheels"}
            className={mobileView === "wheels" ? styles.mobileTabActive : styles.mobileTab}
            onClick={() => setMobileView("wheels")}
            role="tab"
            type="button"
          >
            <ListBulletsIcon aria-hidden="true" />
            Wheel lists ({wheelLists.length})
          </button>
        </div>

        <div className={styles.library}>
          <section
            aria-labelledby="saved-places-title"
            className={`${styles.placesSection} ${mobileView === "places" ? styles.mobileVisible : styles.mobileHidden}`}
          >
            <div className={styles.sectionHeading}>
              <h2 id="saved-places-title">
                Saved places <span className={styles.sectionCount}>({savedPlaces.length})</span>
              </h2>
            </div>

            {savedPlaces.length > 0 ? (
              <ul className={styles.placeList}>
                {savedPlaces.map(({ distanceLabel, icon: Icon, place }) => (
                  <li key={place.id}>
                    <Link
                      aria-label={`Open ${place.name}`}
                      className={styles.placeIllustration}
                      href={placeProfilePath(place)}
                    >
                      <Icon aria-hidden="true" />
                    </Link>
                    <div className={styles.placeDetails}>
                      <Link href={placeProfilePath(place)}>{place.name}</Link>
                      <p>
                        {place.category} <span aria-hidden="true">·</span> {distanceLabel}
                      </p>
                      <a
                        className={styles.directionsAction}
                        href={googleMapsDirectionsUrl(place.coordinates)}
                        rel="noreferrer"
                        target="_blank"
                      >
                        <NavigationArrowIcon aria-hidden="true" weight="fill" />
                        Directions
                      </a>
                    </div>
                    <div className={styles.placeActions}>
                      <BookmarkSimpleIcon aria-label="Saved" weight="fill" />
                      <details>
                        <summary aria-label={`More actions for ${place.name}`}>
                          <DotsThreeVerticalIcon aria-hidden="true" weight="bold" />
                        </summary>
                        <div className={styles.menuPopover}>
                          <button
                            className={styles.menuAction}
                            onClick={() => removePlace(place.id)}
                            type="button"
                          >
                            <TrashIcon aria-hidden="true" className={styles.menuActionIcon} />
                            Remove from Saved
                          </button>
                        </div>
                      </details>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <div className={styles.emptyState}>
                <BookmarkSimpleIcon aria-hidden="true" className={styles.emptyIcon} />
                <h3>No saved places yet</h3>
                <p>Save a place from its details page and it will appear here.</p>
                <Link className={styles.emptyAction} href="/#discovery-results">
                  Find places
                </Link>
              </div>
            )}

            {mobileView === "places" && wheelLists.length > 0 ? (
              <div className={styles.mobileWheelPreview}>
                <h2>Wheel lists</h2>
                <button
                  className={styles.previewButton}
                  onClick={() => setMobileView("wheels")}
                  type="button"
                >
                  <span className={styles.listIcon} aria-hidden="true">
                    <ListBulletsIcon className={styles.listIconSvg} />
                  </span>
                  <span>
                    <strong>{wheelLists[0].name}</strong>
                    <small>{wheelLists[0].placeCount} places</small>
                  </span>
                  <ArrowRightIcon aria-hidden="true" className={styles.previewArrow} />
                </button>
              </div>
            ) : null}
          </section>

          <section
            aria-labelledby="wheel-lists-title"
            className={`${styles.wheelsSection} ${mobileView === "wheels" ? styles.mobileVisible : styles.mobileHidden}`}
          >
            <div className={styles.sectionHeading}>
              <h2 id="wheel-lists-title">
                Wheel lists <span className={styles.sectionCount}>({wheelLists.length})</span>
              </h2>
              <button className={styles.newListButton} onClick={openCreateDialog} type="button">
                <PlusIcon aria-hidden="true" className={styles.newListIcon} />
                New list
              </button>
            </div>

            {wheelLists.length > 0 ? (
              <ul className={styles.wheelList}>
                {wheelLists.map((list) => (
                  <li key={list.id}>
                    <span className={styles.listIcon} aria-hidden="true">
                      <ListBulletsIcon className={styles.listIconSvg} />
                    </span>
                    <div className={styles.listDetails}>
                      <strong>{list.name}</strong>
                      <small>{list.placeCount} places</small>
                      <Link href={`/wheel?place=${encodeURIComponent(list.placeSlug)}`}>
                        <CompassIcon aria-hidden="true" className={styles.openWheelIcon} />
                        Open wheel
                      </Link>
                    </div>
                    <details className={styles.listMenu}>
                      <summary aria-label={`More actions for ${list.name}`}>
                        <DotsThreeVerticalIcon aria-hidden="true" weight="bold" />
                      </summary>
                      <div className={`${styles.menuPopover} ${styles.listMenuPopover}`}>
                        <button
                          className={styles.menuAction}
                          onClick={() => openRenameDialog(list)}
                          type="button"
                        >
                          <PencilSimpleIcon aria-hidden="true" className={styles.menuActionIcon} />
                          Rename
                        </button>
                        <button
                          className={styles.menuAction}
                          onClick={() => deleteList(list.id)}
                          type="button"
                        >
                          <TrashIcon aria-hidden="true" className={styles.menuActionIcon} />
                          Delete
                        </button>
                      </div>
                    </details>
                  </li>
                ))}
              </ul>
            ) : (
              <div className={styles.emptyState}>
                <ListBulletsIcon aria-hidden="true" className={styles.emptyIcon} />
                <h3>No wheel lists yet</h3>
                <p>Create a list when you want to keep a set of choices together.</p>
                <button className={styles.emptyAction} onClick={openCreateDialog} type="button">
                  Create a wheel list
                </button>
              </div>
            )}

            <p className={styles.prototypeNote}>
              <InfoIcon aria-hidden="true" className={styles.prototypeIcon} weight="fill" />
              Prototype changes stay in this session. Cloud sync starts after Supabase is connected.
            </p>
          </section>
        </div>
      </div>

      <div className={styles.mobileNavigation}>
        <DiscoveryNavigation activeDestination="Saved" accountReturnTo="/saved" />
      </div>

      {removedPlace ? (
        <div aria-live="polite" className={styles.undoToast} role="status">
          <span className={styles.undoText}>{removedPlace.item.place.name} removed</span>
          <button className={styles.undoButton} onClick={undoRemove} type="button">
            <ArrowCounterClockwiseIcon aria-hidden="true" className={styles.undoIcon} />
            Undo
          </button>
          <button
            aria-label="Dismiss"
            className={styles.undoButton}
            onClick={() => setRemovedPlace(null)}
            type="button"
          >
            <XIcon aria-hidden="true" className={styles.undoIcon} />
          </button>
        </div>
      ) : null}

      {dialog ? (
        <div className={styles.dialogBackdrop} role="presentation">
          <section
            aria-labelledby="list-dialog-title"
            aria-modal="true"
            className={styles.dialog}
            role="dialog"
          >
            <button
              aria-label="Close"
              className={styles.dialogClose}
              onClick={() => setDialog(null)}
              type="button"
            >
              <XIcon aria-hidden="true" className={styles.dialogCloseIcon} />
            </button>
            <h2 id="list-dialog-title">
              {dialog.mode === "create" ? "New wheel list" : "Rename wheel list"}
            </h2>
            <p>Give this private list a name you will recognize later.</p>
            <form onSubmit={saveList}>
              <label htmlFor="wheel-list-name">List name</label>
              <input
                id="wheel-list-name"
                maxLength={40}
                onChange={(event) => setDraftName(event.target.value)}
                placeholder="Example: Sunday lunch"
                ref={dialogInputRef}
                required
                value={draftName}
              />
              <div>
                <button onClick={() => setDialog(null)} type="button">
                  Cancel
                </button>
                <button disabled={!draftName.trim()} type="submit">
                  {dialog.mode === "create" ? "Create list" : "Save name"}
                </button>
              </div>
            </form>
          </section>
        </div>
      ) : null}
    </main>
  );
}
