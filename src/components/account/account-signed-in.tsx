"use client";

import {
  BookmarkSimpleIcon,
  CaretRightIcon,
  CompassIcon,
  DevicesIcon,
  DownloadSimpleIcon,
  FileTextIcon,
  InfoIcon,
  ListBulletsIcon,
  MapPinIcon,
  PencilSimpleIcon,
  ShieldCheckIcon,
  SignOutIcon,
  SpinnerGapIcon,
  TrashIcon,
  UserCircleIcon,
  XIcon,
} from "@phosphor-icons/react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import { MascotMark } from "@/components/brand/mascot-mark";
import { DiscoveryNavigation } from "@/components/discovery/discovery-navigation";
import { createBrowserSupabaseClient } from "@/platform/supabase/browser";

import styles from "./account-signed-in.module.css";

type DialogKind = "delete" | "export" | "privacy" | "sessions" | "updates";

type AccountSignedInProps = Readonly<{
  email: string;
  preview?: boolean;
  provider: string;
  returnTo: string;
}>;

const ACCOUNT_ROWS = [
  {
    description: "Manage what you keep",
    href: "/saved",
    icon: BookmarkSimpleIcon,
    label: "Saved places and lists",
  },
  {
    description: "Track review status",
    dialog: "updates",
    icon: FileTextIcon,
    label: "Your submitted updates",
  },
  {
    description: "Request a private export",
    dialog: "export",
    icon: DownloadSimpleIcon,
    label: "Download your data",
  },
] as const;

export function AccountSignedIn({
  email,
  preview = false,
  provider,
  returnTo,
}: AccountSignedInProps) {
  const [dialog, setDialog] = useState<DialogKind | null>(null);
  const [online, setOnline] = useState(true);
  const [signOutBusy, setSignOutBusy] = useState<"all" | "current" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
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

    closeButtonRef.current?.focus();
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

  const openDialog = (kind: DialogKind) => {
    dialogTriggerRef.current =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;
    setDialog(kind);
  };

  const signOut = async (scope: "all" | "current") => {
    if (!online) {
      setError("You are offline. Reconnect before signing out.");
      return;
    }

    setSignOutBusy(scope);
    setError(null);

    if (preview) {
      window.location.assign(`/account?returnTo=${encodeURIComponent(returnTo)}`);
      return;
    }

    try {
      const supabase = createBrowserSupabaseClient();
      const { error: signOutError } = await supabase.auth.signOut({
        scope: scope === "all" ? "global" : "local",
      });

      if (signOutError) {
        setError("We could not complete sign-out. Please try again.");
        setSignOutBusy(null);
        return;
      }

      window.location.assign(`/account?returnTo=${encodeURIComponent(returnTo)}`);
    } catch {
      setError("Account access is not connected in this preview yet.");
      setSignOutBusy(null);
    }
  };

  const activity = preview
    ? [
        { icon: BookmarkSimpleIcon, label: "Saved places", value: 3 },
        { icon: ListBulletsIcon, label: "Wheel lists", value: 2 },
        { icon: PencilSimpleIcon, label: "Updates", value: 0 },
      ]
    : [
        { icon: BookmarkSimpleIcon, label: "Saved places", value: 0 },
        { icon: ListBulletsIcon, label: "Wheel lists", value: 0 },
        { icon: PencilSimpleIcon, label: "Updates", value: 0 },
      ];

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
          <Link href="/saved">
            <BookmarkSimpleIcon aria-hidden="true" />
            Saved
          </Link>
          <Link href="/wheel">
            <CompassIcon aria-hidden="true" />
            Wheel
          </Link>
          <Link aria-current="page" className={styles.desktopNavActive} href="/account">
            <UserCircleIcon aria-hidden="true" weight="fill" />
            Account
          </Link>
        </nav>
      </header>

      {!online ? (
        <div className={styles.offlineBanner} role="status">
          <InfoIcon aria-hidden="true" weight="fill" />
          You are offline. Account changes need a connection.
        </div>
      ) : null}

      <div className={styles.page}>
        <header className={styles.pageHeader}>
          <div>
            <h1>Account</h1>
            <p>Manage your saved food finds, privacy, and access.</p>
          </div>
          <MascotMark className={styles.mobileMascot} priority />
        </header>

        {error ? (
          <p className={styles.errorMessage} role="alert">
            {error}
          </p>
        ) : null}

        <div className={styles.accountLayout}>
          <section aria-labelledby="identity-title" className={styles.identityPanel}>
            <h2 className={styles.srOnly} id="identity-title">
              Account identity
            </h2>
            <div className={styles.identity}>
              <span aria-hidden="true" className={styles.identityIcon}>
                <UserCircleIcon />
              </span>
              <div>
                <strong>{email}</strong>
                <span>Signed in with {provider}</span>
                {preview ? <small>Local signed-in preview</small> : null}
              </div>
            </div>

            <ul aria-label="Account activity" className={styles.activitySummary}>
              {activity.map(({ icon: Icon, label, value }) => (
                <li key={label}>
                  <Icon aria-hidden="true" />
                  <strong>{value}</strong>
                  <span>{label}</span>
                </li>
              ))}
            </ul>

            {preview ? (
              <p className={styles.previewNote}>
                <InfoIcon aria-hidden="true" weight="fill" />
                Preview counts are sample data and are not synced.
              </p>
            ) : null}

            <button
              className={styles.signOutButton}
              disabled={signOutBusy !== null}
              onClick={() => signOut("current")}
              type="button"
            >
              {signOutBusy === "current" ? (
                <SpinnerGapIcon aria-hidden="true" className={styles.spinner} />
              ) : (
                <SignOutIcon aria-hidden="true" />
              )}
              {signOutBusy === "current" ? "Signing out" : "Sign out"}
            </button>
          </section>

          <section aria-labelledby="account-settings-title" className={styles.settingsPanel}>
            <h2 id="account-settings-title">Your account</h2>
            <div className={styles.settingList}>
              {ACCOUNT_ROWS.map(({ description, icon: Icon, label, ...destination }) => {
                const content = (
                  <>
                    <span aria-hidden="true" className={styles.rowIcon}>
                      <Icon />
                    </span>
                    <span className={styles.rowCopy}>
                      <strong>{label}</strong>
                      <small>{description}</small>
                    </span>
                    <CaretRightIcon aria-hidden="true" className={styles.rowCaret} />
                  </>
                );

                return "href" in destination ? (
                  <Link className={styles.settingRow} href={destination.href} key={label}>
                    {content}
                  </Link>
                ) : (
                  <button
                    className={styles.settingRow}
                    key={label}
                    onClick={() => openDialog(destination.dialog)}
                    type="button"
                  >
                    {content}
                  </button>
                );
              })}
            </div>

            <div className={styles.sectionDivider} />
            <h2>Privacy and access</h2>
            <div className={styles.settingList}>
              <button
                className={styles.settingRow}
                onClick={() => openDialog("privacy")}
                type="button"
              >
                <span aria-hidden="true" className={styles.rowIcon}>
                  <ShieldCheckIcon />
                </span>
                <span className={styles.rowCopy}>
                  <strong>Privacy notice</strong>
                </span>
                <CaretRightIcon aria-hidden="true" className={styles.rowCaret} />
              </button>
              <button
                className={styles.settingRow}
                onClick={() => openDialog("sessions")}
                type="button"
              >
                <span aria-hidden="true" className={styles.rowIcon}>
                  <DevicesIcon />
                </span>
                <span className={styles.rowCopy}>
                  <strong>Sign out of all devices</strong>
                </span>
                <CaretRightIcon aria-hidden="true" className={styles.rowCaret} />
              </button>
            </div>

            <button className={styles.deleteRow} onClick={() => openDialog("delete")} type="button">
              <span aria-hidden="true" className={styles.deleteIcon}>
                <TrashIcon />
              </span>
              <span>Delete account</span>
              <CaretRightIcon aria-hidden="true" />
            </button>
          </section>
        </div>
      </div>

      <div className={styles.mobileNavigation}>
        <DiscoveryNavigation activeDestination="Account" accountReturnTo={returnTo} />
      </div>

      {dialog ? (
        <div className={styles.dialogBackdrop} role="presentation">
          <section
            aria-labelledby="account-dialog-title"
            aria-modal="true"
            className={styles.dialog}
            role="dialog"
          >
            <button
              aria-label="Close"
              className={styles.dialogClose}
              onClick={() => setDialog(null)}
              ref={closeButtonRef}
              type="button"
            >
              <XIcon aria-hidden="true" />
            </button>
            <DialogContent
              busy={signOutBusy === "all"}
              dialog={dialog}
              onClose={() => setDialog(null)}
              onSignOutAll={() => signOut("all")}
            />
          </section>
        </div>
      ) : null}
    </main>
  );
}

function DialogContent({
  busy,
  dialog,
  onClose,
  onSignOutAll,
}: Readonly<{
  busy: boolean;
  dialog: DialogKind;
  onClose: () => void;
  onSignOutAll: () => void;
}>) {
  if (dialog === "updates") {
    return (
      <>
        <FileTextIcon aria-hidden="true" className={styles.dialogHeroIcon} />
        <h2 id="account-dialog-title">No submitted updates yet</h2>
        <p>When community corrections are available, you can track their review status here.</p>
        <button className={styles.dialogPrimary} onClick={onClose} type="button">
          Got it
        </button>
      </>
    );
  }

  if (dialog === "export") {
    return (
      <>
        <DownloadSimpleIcon aria-hidden="true" className={styles.dialogHeroIcon} />
        <h2 id="account-dialog-title">Download your data</h2>
        <p>
          A private export will require recent authentication. Export processing is not connected in
          this prototype, so no request has been created.
        </p>
        <button className={styles.dialogPrimary} onClick={onClose} type="button">
          Got it
        </button>
      </>
    );
  }

  if (dialog === "privacy") {
    return (
      <>
        <ShieldCheckIcon aria-hidden="true" className={styles.dialogHeroIcon} />
        <h2 id="account-dialog-title">Account privacy</h2>
        <p>
          Your account supports saved places, wheel lists, and update submissions. Precise location
          and discovery history are not attached to it.
        </p>
        <button className={styles.dialogPrimary} onClick={onClose} type="button">
          Got it
        </button>
      </>
    );
  }

  if (dialog === "sessions") {
    return (
      <>
        <DevicesIcon aria-hidden="true" className={styles.dialogHeroIcon} />
        <h2 id="account-dialog-title">Sign out of all devices?</h2>
        <p>You will need to sign in again on this device and anywhere else your account is open.</p>
        <div className={styles.dialogActions}>
          <button
            className={styles.dialogSecondary}
            disabled={busy}
            onClick={onClose}
            type="button"
          >
            Cancel
          </button>
          <button
            className={styles.dialogPrimary}
            disabled={busy}
            onClick={onSignOutAll}
            type="button"
          >
            {busy ? <SpinnerGapIcon aria-hidden="true" className={styles.spinner} /> : null}
            {busy ? "Signing out" : "Sign out everywhere"}
          </button>
        </div>
      </>
    );
  }

  return (
    <>
      <TrashIcon aria-hidden="true" className={`${styles.dialogHeroIcon} ${styles.dangerIcon}`} />
      <h2 id="account-dialog-title">Delete your account</h2>
      <p>
        Deletion will require recent authentication and a final confirmation. Secure deletion is not
        connected in this prototype, so no account data can be removed here yet.
      </p>
      <button className={styles.dialogPrimary} onClick={onClose} type="button">
        Keep my account
      </button>
    </>
  );
}
