"use client";

import {
  ArrowLeftIcon,
  ArrowRightIcon,
  BookmarkSimpleIcon,
  BuildingsIcon,
  CaretRightIcon,
  CheckCircleIcon,
  ClockIcon,
  CompassIcon,
  CopySimpleIcon,
  ForkKnifeIcon,
  ImageSquareIcon,
  InfoIcon,
  LockKeyIcon,
  MapPinIcon,
  MinusCircleIcon,
  PhoneIcon,
  ReceiptIcon,
  StorefrontIcon,
  TrashIcon,
  UploadSimpleIcon,
  UserCircleIcon,
  UsersThreeIcon,
  XCircleIcon,
} from "@phosphor-icons/react";
import Link from "next/link";
import type { ChangeEvent, FormEvent } from "react";
import { useEffect, useRef, useState } from "react";

import { MascotMark } from "@/components/brand/mascot-mark";
import {
  CORRECTION_ISSUES,
  type CorrectionIssueKey,
  MAX_EVIDENCE_FILES,
  correctionRequiresEvidence,
  evidenceFileError,
  findCorrectionIssue,
} from "@/modules/community-corrections/correction-options";
import type { DiscoveryPlace } from "@/modules/discovery/model";
import { placeProfilePath } from "@/modules/discovery/place-profile-path";

import styles from "./suggest-update.module.css";

type Step = 1 | 2 | 3 | 4;

const STEPS = ["Issue type", "Correct details", "Evidence", "Review"] as const;
const PRIMARY_ISSUES = CORRECTION_ISSUES.slice(0, 7);
const ADDITIONAL_ISSUES = CORRECTION_ISSUES.slice(7);

const ISSUE_ICONS = {
  contact_information: PhoneIcon,
  duplicate_place: CopySimpleIcon,
  food_cuisine: ForkKnifeIcon,
  moved_location: MapPinIcon,
  occasion: UsersThreeIcon,
  opening_hours: ClockIcon,
  permanent_closure: XCircleIcon,
  photo_menu: ImageSquareIcon,
  price_menu: ReceiptIcon,
  temporary_closure: MinusCircleIcon,
} as const;

type SuggestUpdateFlowProps = Readonly<{
  place: DiscoveryPlace;
  preview?: boolean;
}>;

function formatBytes(bytes: number) {
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function SuggestUpdateFlow({ place, preview = false }: SuggestUpdateFlowProps) {
  const [step, setStep] = useState<Step>(1);
  const [selectedIssue, setSelectedIssue] = useState<CorrectionIssueKey | null>("price_menu");
  const [showAdditional, setShowAdditional] = useState(false);
  const [details, setDetails] = useState("");
  const [priceMinimum, setPriceMinimum] = useState("");
  const [priceMaximum, setPriceMaximum] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [rightsConfirmed, setRightsConfirmed] = useState(false);
  const [online, setOnline] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submissionNotice, setSubmissionNotice] = useState<string | null>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);

  const profilePath = placeProfilePath(place);
  const issue = findCorrectionIssue(selectedIssue);

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
    if (step > 0) {
      headingRef.current?.focus();
      const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      window.scrollTo({ behavior: reducedMotion ? "auto" : "smooth", top: 0 });
    }
  }, [step]);

  const chooseIssue = (key: CorrectionIssueKey) => {
    if (selectedIssue !== key) {
      setDetails("");
      setPriceMinimum("");
      setPriceMaximum("");
      setFiles([]);
      setRightsConfirmed(false);
    }
    setSelectedIssue(key);
    setError(null);
  };

  const validateDetails = () => {
    if (selectedIssue === "price_menu") {
      const minimum = Number(priceMinimum);
      const maximum = Number(priceMaximum);
      if (!priceMinimum && !priceMaximum) {
        return "Enter at least one expected price per person.";
      }
      if ((priceMinimum && minimum <= 0) || (priceMaximum && maximum <= 0)) {
        return "Prices must be greater than zero.";
      }
      if (priceMinimum && priceMaximum && maximum < minimum) {
        return "The maximum price must be equal to or higher than the minimum price.";
      }
      return null;
    }

    if (details.trim().length < 5) {
      return "Add enough corrected information for a reviewer to understand the change.";
    }

    return null;
  };

  const advance = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setSubmissionNotice(null);

    if (step === 1) {
      if (!selectedIssue) {
        setError("Choose what needs updating.");
        return;
      }
      setStep(2);
      return;
    }

    if (step === 2) {
      const detailError = validateDetails();
      if (detailError) {
        setError(detailError);
        return;
      }
      setStep(3);
      return;
    }

    if (step === 3) {
      if (correctionRequiresEvidence(selectedIssue) && files.length === 0) {
        setError("Add at least one evidence image for this type of update.");
        return;
      }
      if (files.length > 0 && !rightsConfirmed) {
        setError("Confirm that you are allowed to share these images.");
        return;
      }
      setStep(4);
      return;
    }

    if (!online) {
      setError("You are offline. Reconnect before submitting this update.");
      return;
    }

    setSubmissionNotice(
      "Submission storage is not connected in this prototype. Nothing was sent and your public place data was not changed.",
    );
  };

  const goBack = () => {
    setError(null);
    setSubmissionNotice(null);
    setStep((current) => Math.max(1, current - 1) as Step);
  };

  const addEvidence = (event: ChangeEvent<HTMLInputElement>) => {
    const incoming = Array.from(event.target.files ?? []);
    event.target.value = "";
    setError(null);

    if (files.length + incoming.length > MAX_EVIDENCE_FILES) {
      setError(`Add no more than ${MAX_EVIDENCE_FILES} images.`);
      return;
    }

    const duplicate = incoming.find((candidate) =>
      files.some(
        (current) =>
          current.name === candidate.name &&
          current.size === candidate.size &&
          current.lastModified === candidate.lastModified,
      ),
    );
    if (duplicate) {
      setError(`${duplicate.name} is already attached.`);
      return;
    }

    for (const file of incoming) {
      const fileError = evidenceFileError(file);
      if (fileError) {
        setError(fileError);
        return;
      }
    }

    setFiles((current) => [...current, ...incoming]);
    setRightsConfirmed(false);
  };

  const removeEvidence = (index: number) => {
    setFiles((current) => current.filter((_, fileIndex) => fileIndex !== index));
    setRightsConfirmed(false);
  };

  return (
    <main className={styles.shell}>
      <DesktopHeader />

      {!online ? (
        <div className={styles.offlineBanner} role="status">
          <InfoIcon aria-hidden="true" weight="fill" />
          You are offline. You can review this form, but submitting needs a connection.
        </div>
      ) : null}

      <header className={styles.mobileHeader}>
        {step === 1 ? (
          <Link aria-label="Back to place details" href={profilePath}>
            <ArrowLeftIcon aria-hidden="true" />
          </Link>
        ) : (
          <button aria-label="Previous step" onClick={goBack} type="button">
            <ArrowLeftIcon aria-hidden="true" />
          </button>
        )}
        <strong>Suggest an update</strong>
        <MascotMark priority />
      </header>

      <div className={styles.page}>
        <Link className={styles.backToPlace} href={profilePath}>
          <ArrowLeftIcon aria-hidden="true" />
          Back to place details
        </Link>

        <div className={styles.layout}>
          <aside className={styles.contextPanel} aria-label="Place and progress">
            <div className={styles.placeSummary}>
              <span aria-hidden="true" className={styles.placeIcon}>
                <StorefrontIcon />
              </span>
              <div>
                <strong>{place.name}</strong>
                <span>{place.category} · Tagum City</span>
              </div>
            </div>

            <div className={styles.reviewNote}>
              <InfoIcon aria-hidden="true" weight="fill" />
              Updates are reviewed before they appear publicly.
            </div>

            {preview ? <p className={styles.previewLabel}>Local signed-in preview</p> : null}

            <ol className={styles.stepRail}>
              {STEPS.map((label, index) => {
                const number = (index + 1) as Step;
                return (
                  <li
                    aria-current={number === step ? "step" : undefined}
                    className={number === step ? styles.stepActive : styles.stepItem}
                    key={label}
                  >
                    <span>{number < step ? <CheckCircleIcon weight="fill" /> : number}</span>
                    {label}
                  </li>
                );
              })}
            </ol>
          </aside>

          <section className={styles.formPanel}>
            <div className={styles.mobilePlaceSummary}>
              <StorefrontIcon aria-hidden="true" className={styles.mobilePlaceIcon} />
              <div>
                <strong>{place.name}</strong>
                <span>{place.category} · Tagum City</span>
              </div>
            </div>

            <div className={styles.mobileProgress}>
              <span>Step {step} of 4</span>
              <div aria-hidden="true">
                {STEPS.map((label, index) => (
                  <i className={index + 1 <= step ? styles.segmentActive : undefined} key={label} />
                ))}
              </div>
            </div>

            <form onSubmit={advance}>
              <StepContent
                details={details}
                files={files}
                issue={issue}
                onAddEvidence={addEvidence}
                onChooseIssue={chooseIssue}
                onDetailsChange={setDetails}
                onPriceMaximumChange={setPriceMaximum}
                onPriceMinimumChange={setPriceMinimum}
                onRemoveEvidence={removeEvidence}
                onRightsChange={setRightsConfirmed}
                onShowAdditional={() => setShowAdditional(true)}
                priceMaximum={priceMaximum}
                priceMinimum={priceMinimum}
                rightsConfirmed={rightsConfirmed}
                selectedIssue={selectedIssue}
                showAdditional={showAdditional}
                step={step}
                titleRef={headingRef}
              />

              {error ? (
                <p className={styles.errorMessage} role="alert">
                  {error}
                </p>
              ) : null}

              {submissionNotice ? (
                <div className={styles.submissionNotice} role="status">
                  <InfoIcon
                    aria-hidden="true"
                    className={styles.submissionNoticeIcon}
                    weight="fill"
                  />
                  <div>
                    <strong>Prototype only</strong>
                    <p>{submissionNotice}</p>
                    <Link href={profilePath}>Return to place details</Link>
                  </div>
                </div>
              ) : null}

              <div className={styles.formActions}>
                {step > 1 ? (
                  <button className={styles.secondaryButton} onClick={goBack} type="button">
                    Back
                  </button>
                ) : (
                  <Link className={styles.cancelLink} href={profilePath}>
                    Cancel
                  </Link>
                )}
                <button className={styles.primaryButton} type="submit">
                  {step === 4 ? "Submit update" : "Continue"}
                  <ArrowRightIcon aria-hidden="true" className={styles.primaryButtonIcon} />
                </button>
              </div>

              <p className={styles.privacyLine}>
                <LockKeyIcon aria-hidden="true" className={styles.privacyIcon} />
                Your update stays private while it is reviewed.
              </p>
            </form>
          </section>
        </div>
      </div>
    </main>
  );
}

type StepContentProps = Readonly<{
  details: string;
  files: readonly File[];
  issue: ReturnType<typeof findCorrectionIssue>;
  onAddEvidence: (event: ChangeEvent<HTMLInputElement>) => void;
  onChooseIssue: (key: CorrectionIssueKey) => void;
  onDetailsChange: (value: string) => void;
  onPriceMaximumChange: (value: string) => void;
  onPriceMinimumChange: (value: string) => void;
  onRemoveEvidence: (index: number) => void;
  onRightsChange: (checked: boolean) => void;
  onShowAdditional: () => void;
  priceMaximum: string;
  priceMinimum: string;
  rightsConfirmed: boolean;
  selectedIssue: CorrectionIssueKey | null;
  showAdditional: boolean;
  step: Step;
  titleRef: React.RefObject<HTMLHeadingElement | null>;
}>;

function StepContent(props: StepContentProps) {
  if (props.step === 1) {
    return <IssueStep {...props} />;
  }
  if (props.step === 2) {
    return <DetailsStep {...props} />;
  }
  if (props.step === 3) {
    return <EvidenceStep {...props} />;
  }
  return <ReviewStep {...props} />;
}

function StepHeading({
  children,
  description,
  titleRef,
}: Readonly<{
  children: React.ReactNode;
  description: string;
  titleRef: React.RefObject<HTMLHeadingElement | null>;
}>) {
  return (
    <header className={styles.stepHeading}>
      <p>Suggest an update</p>
      <h1 ref={titleRef} tabIndex={-1}>
        {children}
      </h1>
      <span>{description}</span>
    </header>
  );
}

function IssueStep({
  onChooseIssue,
  onShowAdditional,
  selectedIssue,
  showAdditional,
  titleRef,
}: StepContentProps) {
  return (
    <>
      <StepHeading
        description="Choose one issue. You can review everything before sending."
        titleRef={titleRef}
      >
        What needs updating?
      </StepHeading>
      <fieldset className={styles.issueFieldset}>
        <legend className={styles.srOnly}>Correction issue</legend>
        <div className={styles.issueGrid}>
          {PRIMARY_ISSUES.map((issue) => (
            <IssueOption
              issue={issue}
              key={issue.key}
              onChoose={onChooseIssue}
              selected={selectedIssue === issue.key}
            />
          ))}
          {!showAdditional ? (
            <button className={styles.moreIssues} onClick={onShowAdditional} type="button">
              <BuildingsIcon aria-hidden="true" />
              <span>
                <strong>Something else</strong>
                <small>Duplicate, contact, photo, or menu details</small>
              </span>
              <CaretRightIcon aria-hidden="true" />
            </button>
          ) : (
            ADDITIONAL_ISSUES.map((issue) => (
              <IssueOption
                issue={issue}
                key={issue.key}
                onChoose={onChooseIssue}
                selected={selectedIssue === issue.key}
              />
            ))
          )}
        </div>
      </fieldset>
    </>
  );
}

function IssueOption({
  issue,
  onChoose,
  selected,
}: Readonly<{
  issue: (typeof CORRECTION_ISSUES)[number];
  onChoose: (key: CorrectionIssueKey) => void;
  selected: boolean;
}>) {
  const Icon = ISSUE_ICONS[issue.key];
  return (
    <label className={selected ? styles.issueSelected : styles.issueOption}>
      <input
        checked={selected}
        name="correction-issue"
        onChange={() => onChoose(issue.key)}
        type="radio"
        value={issue.key}
      />
      <Icon aria-hidden="true" />
      <span>
        <strong>{issue.label}</strong>
        <small>{issue.supportingText}</small>
      </span>
      {selected ? (
        <CheckCircleIcon aria-hidden="true" className={styles.selectedCheck} weight="fill" />
      ) : (
        <CaretRightIcon aria-hidden="true" className={styles.optionCaret} />
      )}
    </label>
  );
}

function DetailsStep({
  details,
  issue,
  onDetailsChange,
  onPriceMaximumChange,
  onPriceMinimumChange,
  priceMaximum,
  priceMinimum,
  titleRef,
}: StepContentProps) {
  return (
    <>
      <StepHeading
        description={issue?.supportingText ?? "Provide the corrected information."}
        titleRef={titleRef}
      >
        Add the correct details
      </StepHeading>
      <div className={styles.detailsFields}>
        <div className={styles.selectedIssueSummary}>
          <CheckCircleIcon aria-hidden="true" className={styles.summaryIcon} weight="fill" />
          <div>
            <span>Selected issue</span>
            <strong>{issue?.label}</strong>
          </div>
        </div>

        {issue?.key === "price_menu" ? (
          <>
            <fieldset className={styles.priceFields}>
              <legend>Expected price per person</legend>
              <label>
                Minimum price
                <span className={styles.priceInputWrap}>
                  <b aria-hidden="true">₱</b>
                  <input
                    inputMode="numeric"
                    min="1"
                    onChange={(event) => onPriceMinimumChange(event.target.value)}
                    placeholder="120"
                    type="number"
                    value={priceMinimum}
                  />
                </span>
              </label>
              <label>
                Maximum price
                <span className={styles.priceInputWrap}>
                  <b aria-hidden="true">₱</b>
                  <input
                    inputMode="numeric"
                    min="1"
                    onChange={(event) => onPriceMaximumChange(event.target.value)}
                    placeholder="180"
                    type="number"
                    value={priceMaximum}
                  />
                </span>
              </label>
            </fieldset>
            <label className={styles.textareaField}>
              Optional menu or price note
              <textarea
                onChange={(event) => onDetailsChange(event.target.value)}
                placeholder={issue.detailPlaceholder}
                rows={5}
                value={details}
              />
            </label>
          </>
        ) : (
          <label className={styles.textareaField}>
            {issue?.detailLabel}
            <textarea
              onChange={(event) => onDetailsChange(event.target.value)}
              placeholder={issue?.detailPlaceholder}
              required
              rows={7}
              value={details}
            />
          </label>
        )}
        <p className={styles.fieldHelp}>
          Add only details you can reasonably verify. A reviewer may ask for more information.
        </p>
      </div>
    </>
  );
}

function EvidenceStep({
  files,
  issue,
  onAddEvidence,
  onRemoveEvidence,
  onRightsChange,
  rightsConfirmed,
  selectedIssue,
  titleRef,
}: StepContentProps) {
  const required = correctionRequiresEvidence(selectedIssue);
  return (
    <>
      <StepHeading
        description={
          required
            ? "This update needs at least one image that supports the correction."
            : "Images are optional, but they can help a reviewer verify the correction."
        }
        titleRef={titleRef}
      >
        Add evidence
      </StepHeading>
      <div className={styles.evidenceContent}>
        <div className={required ? styles.requirementRequired : styles.requirementOptional}>
          <InfoIcon aria-hidden="true" className={styles.summaryIcon} weight="fill" />
          <div>
            <strong>{required ? "Evidence required" : "Evidence optional"}</strong>
            <span>{issue?.label}</span>
          </div>
        </div>

        <label className={styles.uploadArea}>
          <UploadSimpleIcon aria-hidden="true" className={styles.uploadIcon} />
          <strong>Add evidence images</strong>
          <span className={styles.uploadCopy}>
            JPEG, PNG, or WebP · Up to 5 MB each · Maximum 5 images
          </span>
          <input
            accept="image/jpeg,image/png,image/webp"
            multiple
            onChange={onAddEvidence}
            type="file"
          />
        </label>

        {files.length > 0 ? (
          <ul className={styles.fileList}>
            {files.map((file, index) => (
              <li key={`${file.name}-${file.lastModified}-${file.size}`}>
                <ImageSquareIcon aria-hidden="true" />
                <span>
                  <strong>{file.name}</strong>
                  <small>{formatBytes(file.size)}</small>
                </span>
                <button
                  aria-label={`Remove ${file.name}`}
                  onClick={() => onRemoveEvidence(index)}
                  type="button"
                >
                  <TrashIcon aria-hidden="true" />
                </button>
              </li>
            ))}
          </ul>
        ) : null}

        {files.length > 0 ? (
          <label className={styles.rightsConfirmation}>
            <input
              checked={rightsConfirmed}
              onChange={(event) => onRightsChange(event.target.checked)}
              type="checkbox"
            />
            <span className={styles.rightsCopy}>
              <strong>I am allowed to share these images.</strong>
              <small>Attachments remain private and do not become public place photos.</small>
            </span>
          </label>
        ) : null}

        <p className={styles.fieldHelp}>
          Image metadata will be removed and files will be checked before a moderator can view them
          when secure uploads are connected.
        </p>
      </div>
    </>
  );
}

function ReviewStep({
  details,
  files,
  issue,
  priceMaximum,
  priceMinimum,
  titleRef,
}: StepContentProps) {
  const detailSummary =
    issue?.key === "price_menu"
      ? `${priceMinimum ? `₱${priceMinimum}` : "No minimum"} to ${
          priceMaximum ? `₱${priceMaximum}` : "No maximum"
        } per person${details.trim() ? `. ${details.trim()}` : ""}`
      : details.trim();

  return (
    <>
      <StepHeading
        description="Check the details below. A submission never changes public data automatically."
        titleRef={titleRef}
      >
        Review your update
      </StepHeading>
      <dl className={styles.reviewList}>
        <div>
          <dt>Issue</dt>
          <dd>{issue?.label}</dd>
        </div>
        <div>
          <dt>Corrected information</dt>
          <dd>{detailSummary}</dd>
        </div>
        <div>
          <dt>Evidence</dt>
          <dd>{files.length === 0 ? "No images added" : `${files.length} image(s) ready`}</dd>
        </div>
      </dl>
      <div className={styles.reviewAssurance}>
        <LockKeyIcon aria-hidden="true" className={styles.reviewAssuranceIcon} />
        <div>
          <strong>Private moderation</strong>
          <p>
            Your account is attached privately for follow-up. Approval, rejection, or requests for
            more information will be tracked under your account when the backend is connected.
          </p>
        </div>
      </div>
    </>
  );
}

function DesktopHeader() {
  return (
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
        <Link href="/saved">
          <BookmarkSimpleIcon aria-hidden="true" />
          Saved
        </Link>
        <Link href="/wheel">
          <CompassIcon aria-hidden="true" />
          Wheel
        </Link>
        <Link href="/account">
          <UserCircleIcon aria-hidden="true" />
          Account
        </Link>
      </nav>
    </header>
  );
}
