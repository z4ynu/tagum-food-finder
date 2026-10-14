import { CheckIcon, XIcon } from "@phosphor-icons/react";
import { useEffect, useRef, useState } from "react";

import type { DiscoveryFilters } from "@/modules/discovery/model";

import styles from "./discovery.module.css";

const BUDGET_OPTIONS = [
  { label: "Any budget", value: null },
  { label: "Up to ₱150", value: 150 },
  { label: "Up to ₱300", value: 300 },
  { label: "Up to ₱500", value: 500 },
] as const;

const CRAVING_OPTIONS = ["Pizza", "Coffee", "Chicken", "Desserts"] as const;
const OCCASION_OPTIONS = ["Date night", "Barkada hangout", "Family meal", "Solo meal"] as const;

type FiltersSheetProps = Readonly<{
  filters: DiscoveryFilters;
  getPreviewCount: (filters: DiscoveryFilters) => number;
  onApply: (filters: DiscoveryFilters) => void;
  onClose: () => void;
  open: boolean;
}>;

export function FiltersSheet({
  filters,
  getPreviewCount,
  onApply,
  onClose,
  open,
}: FiltersSheetProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [draft, setDraft] = useState(filters);
  const previewCount = getPreviewCount(draft);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) {
      return;
    }

    if (open && !dialog.open) {
      setDraft(filters);
      dialog.showModal();
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [filters, open]);

  return (
    <dialog
      aria-labelledby="filters-title"
      className={styles.filtersDialog}
      onCancel={onClose}
      onClose={onClose}
      ref={dialogRef}
    >
      <form
        className={styles.filtersForm}
        onSubmit={(event) => {
          event.preventDefault();
          onApply(draft);
          onClose();
        }}
      >
        <header className={styles.filtersHeader}>
          <div>
            <h2 id="filters-title">Filter places</h2>
            <p>Unknown details stay available as a separate group.</p>
          </div>
          <button
            aria-label="Close filters"
            className={styles.iconButton}
            onClick={onClose}
            type="button"
          >
            <XIcon aria-hidden="true" />
          </button>
        </header>

        <fieldset className={styles.filterGroup}>
          <legend>Budget per person</legend>
          <p>Food and drink. Places without verified prices stay in the unknown group.</p>
          <div className={styles.optionGrid}>
            {BUDGET_OPTIONS.map((option) => {
              const selected = draft.budgetMaximumPhp === option.value;
              return (
                <button
                  aria-pressed={selected}
                  className={selected ? styles.optionSelected : styles.option}
                  key={option.label}
                  onClick={() => setDraft({ ...draft, budgetMaximumPhp: option.value })}
                  type="button"
                >
                  {selected ? <CheckIcon aria-hidden="true" weight="bold" /> : null}
                  {option.label}
                </button>
              );
            })}
          </div>
        </fieldset>

        <fieldset className={styles.filterGroup}>
          <legend>Craving</legend>
          <div className={styles.optionGrid}>
            {CRAVING_OPTIONS.map((option) => {
              const selected = draft.craving === option;
              return (
                <button
                  aria-pressed={selected}
                  className={selected ? styles.optionSelected : styles.option}
                  key={option}
                  onClick={() => setDraft({ ...draft, craving: selected ? null : option })}
                  type="button"
                >
                  {selected ? <CheckIcon aria-hidden="true" weight="bold" /> : null}
                  {option}
                </button>
              );
            })}
          </div>
        </fieldset>

        <fieldset className={styles.filterGroup}>
          <legend>Occasion</legend>
          <div className={styles.optionGrid}>
            {OCCASION_OPTIONS.map((option) => {
              const selected = draft.occasion === option;
              return (
                <button
                  aria-pressed={selected}
                  className={selected ? styles.optionSelected : styles.option}
                  key={option}
                  onClick={() => setDraft({ ...draft, occasion: selected ? null : option })}
                  type="button"
                >
                  {selected ? <CheckIcon aria-hidden="true" weight="bold" /> : null}
                  {option}
                </button>
              );
            })}
          </div>
        </fieldset>

        <footer className={styles.filtersFooter}>
          <button
            className={styles.clearButton}
            onClick={() =>
              setDraft({
                budgetMaximumPhp: null,
                craving: null,
                occasion: null,
                query: draft.query,
              })
            }
            type="button"
          >
            Clear filters
          </button>
          <button className={styles.primaryButton} type="submit">
            Show {previewCount} {previewCount === 1 ? "place" : "places"}
          </button>
        </footer>
      </form>
    </dialog>
  );
}
