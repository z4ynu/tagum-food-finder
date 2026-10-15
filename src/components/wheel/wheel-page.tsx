"use client";

import {
  ArrowDownIcon,
  ArrowSquareOutIcon,
  ArrowUpIcon,
  ForkKnifeIcon,
  InfoIcon,
  MinusIcon,
  NavigationArrowIcon,
  PlusIcon,
  SpinnerGapIcon,
} from "@phosphor-icons/react";
import { useRouter } from "next/navigation";
import type { CSSProperties, FormEvent } from "react";
import { useEffect, useMemo, useRef, useState } from "react";

import { saveWheelEntriesAction } from "@/app/actions/wheel-lists";
import { MascotMark } from "@/components/brand/mascot-mark";
import { DiscoveryNavigation } from "@/components/discovery/discovery-navigation";
import type { DiscoveryPlace } from "@/modules/discovery/model";
import { findPlaceByProfileSlug } from "@/modules/discovery/place-profile-path";
import {
  defaultWheelEntries,
  type WheelEntry,
  wheelEntryDestination,
} from "@/modules/wheel/catalog-wheel-entries";
import {
  MAX_WHEEL_ENTRIES,
  wheelEntriesFromPersistence,
  wheelEntryMutations,
} from "@/modules/wheel/wheel-persistence";
import { nextWheelRotation, wheelIndexFromUint32 } from "@/modules/wheel/wheel-selection";

import styles from "./wheel.module.css";

const STORAGE_KEY = "tagum-food-finder.anonymous-wheel.v1";
const WHEEL_COLORS = ["#ffffff", "#dcefdc", "#a5d6a7", "#4caf50", "#256628"];

type WheelPageProps = Readonly<{
  catalogStatus: "live" | "unavailable";
  initialEntries: readonly WheelEntry[];
  persistence:
    | Readonly<{ mode: "local" }>
    | Readonly<{
        dataStatus: "ready" | "unavailable";
        listId: string | null;
        listName: string | null;
        mode: "account";
      }>;
  places: readonly DiscoveryPlace[];
}>;

function isWheelEntry(value: unknown): value is WheelEntry {
  if (!value || typeof value !== "object") {
    return false;
  }
  const entry = value as Partial<WheelEntry>;
  return (
    typeof entry.id === "string" &&
    typeof entry.label === "string" &&
    entry.label.trim().length > 0 &&
    entry.label.length <= 80 &&
    (entry.placeSlug === null || typeof entry.placeSlug === "string")
  );
}

function readStoredEntries(defaultEntries: readonly WheelEntry[]) {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      return [...defaultEntries];
    }
    const parsed: unknown = JSON.parse(stored);
    return Array.isArray(parsed)
      ? parsed.filter(isWheelEntry).slice(0, MAX_WHEEL_ENTRIES)
      : [...defaultEntries];
  } catch {
    return [...defaultEntries];
  }
}

function secureWheelIndex(entryCount: number) {
  const random = new Uint32Array(1);
  while (true) {
    window.crypto.getRandomValues(random);
    const index = wheelIndexFromUint32(entryCount, random[0]);
    if (index !== null) {
      return index;
    }
  }
}

function wheelBackground(entryCount: number) {
  if (entryCount === 0) {
    return "var(--surface-muted)";
  }
  const size = 100 / entryCount;
  const gap = Math.min(0.18, size * 0.08);
  const stops = Array.from({ length: entryCount }, (_, index) => {
    const start = (index * size).toFixed(4);
    const colorStart = (index * size + gap).toFixed(4);
    const colorEnd = ((index + 1) * size - gap).toFixed(4);
    const end = ((index + 1) * size).toFixed(4);
    const color = WHEEL_COLORS[index % WHEEL_COLORS.length];
    return `#ffffff ${start}% ${colorStart}%, ${color} ${colorStart}% ${colorEnd}%, #ffffff ${colorEnd}% ${end}%`;
  });
  return `conic-gradient(from 0deg, ${stops.join(", ")})`;
}

export function WheelPage({ catalogStatus, initialEntries, persistence, places }: WheelPageProps) {
  const router = useRouter();
  const defaultEntries = useMemo(() => defaultWheelEntries(places), [places]);
  const [entries, setEntries] = useState<WheelEntry[]>(
    persistence.mode === "account" ? [...initialEntries] : [...defaultEntries],
  );
  const [activeListId, setActiveListId] = useState(
    persistence.mode === "account" ? persistence.listId : null,
  );
  const [draftLabel, setDraftLabel] = useState("");
  const [hydrated, setHydrated] = useState(false);
  const [isSpinning, setIsSpinning] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [saveStatus, setSaveStatus] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);
  const initializationRef = useRef(false);
  const spinTimer = useRef<number | null>(null);

  useEffect(() => {
    if (initializationRef.current) {
      return;
    }
    initializationRef.current = true;

    const startingEntries =
      persistence.mode === "local" ? readStoredEntries(defaultEntries) : [...initialEntries];
    const requestedSlug = new URLSearchParams(window.location.search).get("place");
    const requestedPlace = requestedSlug ? findPlaceByProfileSlug(places, requestedSlug) : null;
    let requestedPlaceAdded = false;

    if (
      requestedPlace &&
      startingEntries.length < MAX_WHEEL_ENTRIES &&
      !startingEntries.some((entry) => entry.placeSlug === requestedSlug)
    ) {
      startingEntries.push({
        id: requestedPlace.id,
        label: requestedPlace.name,
        placeSlug: requestedSlug,
      });
      requestedPlaceAdded = true;
    }

    const nextEntries = startingEntries.slice(0, MAX_WHEEL_ENTRIES);
    setEntries(nextEntries);
    setHydrated(true);

    if (persistence.mode === "account" && requestedPlaceAdded) {
      setIsSaving(true);
      void saveWheelEntriesAction({
        entries: wheelEntryMutations(nextEntries, places),
        listId: persistence.listId,
      }).then((result) => {
        setIsSaving(false);
        if (result.status !== "ok") {
          if (result.status === "authentication-required") {
            router.push("/account?returnTo=%2Fwheel");
          } else {
            setEntries([...initialEntries]);
            setSaveStatus("Could not add that place to your wheel. Please try again.");
          }
          return;
        }
        setActiveListId(result.data.listId);
        setEntries(wheelEntriesFromPersistence(result.data.entries, places));
        setSaveStatus("Wheel saved to your account.");
      });
    }
  }, [defaultEntries, initialEntries, persistence, places, router]);

  useEffect(() => {
    if (hydrated && persistence.mode === "local") {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
    }
  }, [entries, hydrated, persistence.mode]);

  useEffect(
    () => () => {
      if (spinTimer.current !== null) {
        window.clearTimeout(spinTimer.current);
      }
    },
    [],
  );

  const selectedEntry = entries.find((entry) => entry.id === selectedId) ?? null;
  const displayLabels = entries.length <= 12;
  const background = useMemo(() => wheelBackground(entries.length), [entries.length]);

  const persistEntries = async (nextEntries: WheelEntry[], previousEntries: WheelEntry[]) => {
    setEntries(nextEntries);
    if (persistence.mode === "local") {
      return true;
    }

    setIsSaving(true);
    setSaveStatus("");
    const result = await saveWheelEntriesAction({
      entries: wheelEntryMutations(nextEntries, places),
      listId: activeListId,
    });
    setIsSaving(false);
    if (result.status !== "ok") {
      setEntries(previousEntries);
      if (result.status === "authentication-required") {
        router.push("/account?returnTo=%2Fwheel");
      } else {
        setSaveStatus("Could not save your wheel. Your last change was restored.");
      }
      return false;
    }

    setActiveListId(result.data.listId);
    setEntries(wheelEntriesFromPersistence(result.data.entries, places));
    setSaveStatus("Wheel saved to your account.");
    return true;
  };

  const addEntry = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const label = draftLabel.trim();
    if (!label || entries.length >= MAX_WHEEL_ENTRIES || isSaving) {
      return;
    }
    const previousEntries = entries;
    const nextEntries = [
      ...entries,
      { id: window.crypto.randomUUID(), label: label.slice(0, 80), placeSlug: null },
    ];
    setDraftLabel("");
    setShowResult(false);
    await persistEntries(nextEntries, previousEntries);
  };

  const removeEntry = async (entryId: string) => {
    if (isSaving) {
      return;
    }
    const previousEntries = entries;
    const nextEntries = entries.filter((entry) => entry.id !== entryId);
    if (selectedId === entryId) {
      setSelectedId(null);
      setShowResult(false);
    }
    await persistEntries(nextEntries, previousEntries);
  };

  const moveEntry = async (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= entries.length || isSaving) {
      return;
    }
    const previousEntries = entries;
    const nextEntries = [...entries];
    [nextEntries[index], nextEntries[target]] = [nextEntries[target], nextEntries[index]];
    setShowResult(false);
    await persistEntries(nextEntries, previousEntries);
  };

  const spin = () => {
    if (entries.length < 2 || isSpinning) {
      return;
    }
    const selectedIndex = secureWheelIndex(entries.length);
    const selected = entries[selectedIndex];
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    setSelectedId(selected.id);
    setShowResult(false);
    setIsSpinning(true);
    setRotation((current) =>
      nextWheelRotation(current, selectedIndex, entries.length, reduceMotion ? 1 : 5),
    );

    spinTimer.current = window.setTimeout(
      () => {
        setIsSpinning(false);
        setShowResult(true);
      },
      reduceMotion ? 350 : 2800,
    );
  };

  return (
    <main className={styles.wheelShell}>
      <DiscoveryNavigation activeDestination="Wheel" accountReturnTo="/wheel" />

      <div className={styles.wheelPage}>
        <header className={styles.pageHeader}>
          <h1>Spin the wheel</h1>
          <p>Can&apos;t decide? Let the wheel choose.</p>
        </header>

        <div className={styles.wheelLayout}>
          <section className={styles.entriesPanel} aria-labelledby="wheel-entries-heading">
            <h2 id="wheel-entries-heading">Your places</h2>

            {entries.length > 0 ? (
              <ol className={styles.entryList}>
                {entries.map((entry, index) => (
                  <li key={entry.id}>
                    <ForkKnifeIcon aria-hidden="true" className={styles.entryIcon} />
                    <span className={styles.entryLabel} title={entry.label}>
                      {entry.label}
                    </span>
                    <div className={styles.orderActions}>
                      <button
                        aria-label={`Move ${entry.label} up`}
                        disabled={index === 0 || isSpinning || isSaving}
                        onClick={() => moveEntry(index, -1)}
                        type="button"
                      >
                        <ArrowUpIcon aria-hidden="true" className={styles.orderIcon} />
                      </button>
                      <button
                        aria-label={`Move ${entry.label} down`}
                        disabled={index === entries.length - 1 || isSpinning || isSaving}
                        onClick={() => moveEntry(index, 1)}
                        type="button"
                      >
                        <ArrowDownIcon aria-hidden="true" className={styles.orderIcon} />
                      </button>
                      <button
                        aria-label={`Remove ${entry.label}`}
                        disabled={isSpinning || isSaving}
                        onClick={() => removeEntry(entry.id)}
                        type="button"
                      >
                        <MinusIcon aria-hidden="true" className={styles.orderIcon} />
                      </button>
                    </div>
                  </li>
                ))}
              </ol>
            ) : (
              <div className={styles.emptyEntries}>
                <ForkKnifeIcon aria-hidden="true" className={styles.emptyIcon} />
                <strong>Add places to start</strong>
                <span className={styles.emptyCopy}>
                  {persistence.mode === "account"
                    ? "Add a place to create your private account wheel."
                    : "Your choices stay on this device."}
                </span>
              </div>
            )}

            <form className={styles.addPlaceForm} onSubmit={addEntry}>
              <label htmlFor="wheel-place">Add another place</label>
              <div>
                <input
                  disabled={entries.length >= MAX_WHEEL_ENTRIES || isSpinning || isSaving}
                  id="wheel-place"
                  maxLength={80}
                  onChange={(event) => setDraftLabel(event.target.value)}
                  placeholder="Type a food place"
                  value={draftLabel}
                />
                <button disabled={!draftLabel.trim() || isSpinning || isSaving} type="submit">
                  <PlusIcon aria-hidden="true" />
                  Add
                </button>
              </div>
              {entries.length >= MAX_WHEEL_ENTRIES ? (
                <p>This wheel has reached its 50-place limit.</p>
              ) : null}
            </form>

            <p aria-live="polite" className={styles.deviceNote}>
              <InfoIcon aria-hidden="true" className={styles.deviceNoteIcon} weight="fill" />
              {isSaving
                ? "Saving wheel to your account…"
                : saveStatus ||
                  (persistence.mode === "account"
                    ? persistence.dataStatus === "unavailable"
                      ? "Your account wheel is temporarily unavailable."
                      : `Changes sync to ${persistence.listName ?? "My wheel"} in your private account.`
                    : catalogStatus === "live"
                      ? "One phone controls this wheel."
                      : "Live places are unavailable, but choices saved on this device still work.")}
            </p>
          </section>

          <section className={styles.wheelStage} aria-labelledby="wheel-stage-heading">
            <h2 className={styles.visuallyHidden} id="wheel-stage-heading">
              Equal-chance place wheel
            </h2>
            <div className={`${styles.wheelFrame} ${showResult ? styles.wheelFrameResult : ""}`}>
              <div className={styles.wheelPointer} aria-hidden="true" />
              <div
                aria-label={`${entries.length} equal wheel segments`}
                className={styles.wheel}
                role="img"
                style={{ background, transform: `rotate(${rotation}deg)` }}
              >
                {displayLabels
                  ? entries.map((entry, index) => {
                      const angle = (index + 0.5) * (360 / entries.length);
                      const labelStyle = { "--label-angle": `${angle}deg` } as CSSProperties;
                      return (
                        <span
                          className={styles.wheelLabel}
                          key={entry.id}
                          style={labelStyle}
                          title={entry.label}
                        >
                          <b className={styles.wheelLabelText}>{entry.label}</b>
                        </span>
                      );
                    })
                  : null}
                <div className={styles.wheelHub} aria-hidden="true">
                  <MascotMark className={styles.wheelHubIcon} />
                </div>
              </div>
            </div>

            <p className={styles.chanceLabel}>
              {entries.length} {entries.length === 1 ? "place" : "places"}{" "}
              <span className={styles.chanceSeparator}>·</span> Equal chance
            </p>

            {showResult && selectedEntry ? (
              <div className={styles.resultCard} role="status">
                <span className={styles.resultEyebrow}>The wheel chose</span>
                <strong>{selectedEntry.label}</strong>
                <div>
                  <a
                    href={wheelEntryDestination(selectedEntry, places)}
                    rel="noreferrer"
                    target="_blank"
                  >
                    <NavigationArrowIcon
                      aria-hidden="true"
                      className={styles.resultIcon}
                      weight="fill"
                    />
                    Directions
                    <ArrowSquareOutIcon aria-hidden="true" className={styles.resultIcon} />
                  </a>
                  <button
                    disabled={isSaving}
                    onClick={() => removeEntry(selectedEntry.id)}
                    type="button"
                  >
                    <MinusIcon aria-hidden="true" className={styles.resultIcon} />
                    Remove
                  </button>
                </div>
              </div>
            ) : null}

            <button
              className={styles.spinButton}
              disabled={entries.length < 2 || isSpinning || isSaving}
              onClick={spin}
              type="button"
            >
              {isSpinning ? (
                <SpinnerGapIcon aria-hidden="true" className={styles.spinIcon} />
              ) : (
                <NavigationArrowIcon
                  aria-hidden="true"
                  className={styles.spinButtonIcon}
                  weight="fill"
                />
              )}
              {isSpinning ? "Choosing" : showResult ? "Spin again" : "Spin the wheel"}
            </button>

            {entries.length === 1 ? (
              <p className={styles.spinHelp}>Add one more place to spin.</p>
            ) : null}
          </section>
        </div>
      </div>
    </main>
  );
}
