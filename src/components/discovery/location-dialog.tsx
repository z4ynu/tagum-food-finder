import { CrosshairIcon, XIcon } from "@phosphor-icons/react";
import { useEffect, useRef } from "react";

import { MascotMark } from "@/components/brand/mascot-mark";
import { MANUAL_LOCATIONS } from "@/modules/discovery/prototype-places";

import styles from "./discovery.module.css";

type LocationDialogProps = Readonly<{
  busy: boolean;
  error: string | null;
  onChooseManual: (index: number) => void;
  onClose: () => void;
  onUseLocation: () => void;
  open: boolean;
}>;

export function LocationDialog({
  busy,
  error,
  onChooseManual,
  onClose,
  onUseLocation,
  open,
}: LocationDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) {
      return;
    }
    if (open && !dialog.open) {
      dialog.showModal();
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

  return (
    <dialog
      aria-labelledby="location-title"
      className={styles.locationDialog}
      onCancel={onClose}
      onClose={onClose}
      ref={dialogRef}
    >
      <div className={styles.locationContent}>
        <button
          aria-label="Close location options"
          className={styles.dialogClose}
          onClick={onClose}
          type="button"
        >
          <XIcon aria-hidden="true" />
        </button>
        <span className={styles.locationIllustration} aria-hidden="true">
          <MascotMark priority />
        </span>
        <div>
          <p className={styles.dialogBrand}>Asa Ta Mangaon?</p>
          <h2 id="location-title">Find food near you</h2>
          <p className={styles.locationDescription}>
            Your live location helps sort nearby places. It is used for this session and is not
            stored as location history.
          </p>
        </div>

        {error ? <p className={styles.locationError}>{error}</p> : null}

        <button
          className={styles.primaryButton}
          disabled={busy}
          onClick={onUseLocation}
          type="button"
        >
          <CrosshairIcon aria-hidden="true" weight="bold" />
          {busy ? "Getting location" : "Use my location"}
        </button>

        <div className={styles.manualLocation}>
          <label htmlFor="manual-location">Or choose an area</label>
          <select
            defaultValue=""
            id="manual-location"
            onChange={(event) => {
              if (event.target.value) {
                onChooseManual(Number(event.target.value));
              }
            }}
          >
            <option disabled value="">
              Select an area
            </option>
            {MANUAL_LOCATIONS.map((location, index) => (
              <option key={location.label} value={index}>
                {location.label}
              </option>
            ))}
          </select>
          <p>Area positions are approximate and can be changed at any time.</p>
        </div>
      </div>
    </dialog>
  );
}
