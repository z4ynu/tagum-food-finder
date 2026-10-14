"use client";

import {
  ArrowLeftIcon,
  BookmarkSimpleIcon,
  EnvelopeSimpleIcon,
  FacebookLogoIcon,
  GoogleLogoIcon,
  ListBulletsIcon,
  PencilSimpleIcon,
  ShieldCheckIcon,
  SpinnerGapIcon,
  XIcon,
} from "@phosphor-icons/react";
import Link from "next/link";
import type { FormEvent } from "react";
import { useEffect, useState } from "react";

import { MascotMark } from "@/components/brand/mascot-mark";
import { DiscoveryNavigation } from "@/components/discovery/discovery-navigation";
import { createBrowserSupabaseClient } from "@/platform/supabase/browser";

import styles from "./account.module.css";

type OAuthProvider = "facebook" | "google";
type Notice = "privacy" | "terms";

type AccountSignInProps = Readonly<{
  initialError: boolean;
  returnTo: string;
}>;

const PROVIDERS = [
  { icon: GoogleLogoIcon, label: "Continue with Google", provider: "google" },
  { icon: FacebookLogoIcon, label: "Continue with Facebook", provider: "facebook" },
] as const;

const BENEFITS = [
  { icon: BookmarkSimpleIcon, label: "Save favorite places" },
  { icon: ListBulletsIcon, label: "Keep your wheel lists" },
  { icon: PencilSimpleIcon, label: "Submit and track updates" },
] as const;

function callbackUrl(returnTo: string) {
  const callback = new URL("/auth/callback", window.location.origin);
  callback.searchParams.set("next", returnTo);
  return callback.toString();
}

function configurationMessage(error: unknown) {
  if (error instanceof Error && error.name === "EnvironmentConfigurationError") {
    return "Sign-in is not connected in this local preview yet.";
  }

  return "We could not start sign-in. Please try again.";
}

export function AccountSignIn({ initialError, returnTo }: AccountSignInProps) {
  const [email, setEmail] = useState("");
  const [emailBusy, setEmailBusy] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [error, setError] = useState<string | null>(
    initialError ? "That sign-in link could not be completed. Please try again." : null,
  );
  const [notice, setNotice] = useState<Notice | null>(null);
  const [online, setOnline] = useState(true);
  const [providerBusy, setProviderBusy] = useState<OAuthProvider | null>(null);

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

  const busy = emailBusy || providerBusy !== null;

  const requestMagicLink = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const normalizedEmail = email.trim();

    if (!normalizedEmail) {
      setError("Enter your personal email address.");
      return;
    }

    if (!online) {
      setError("You are offline. Reconnect before requesting a sign-in link.");
      return;
    }

    setEmailBusy(true);
    setError(null);

    try {
      const supabase = createBrowserSupabaseClient();
      const { error: signInError } = await supabase.auth.signInWithOtp({
        email: normalizedEmail,
        options: {
          emailRedirectTo: callbackUrl(returnTo),
          shouldCreateUser: true,
        },
      });

      if (signInError) {
        setError("We could not send the sign-in link. Please wait a moment and try again.");
        return;
      }

      setEmailSent(true);
    } catch (signInError) {
      setError(configurationMessage(signInError));
    } finally {
      setEmailBusy(false);
    }
  };

  const startProviderSignIn = async (provider: OAuthProvider) => {
    if (!online) {
      setError("You are offline. Reconnect before continuing with a provider.");
      return;
    }

    setProviderBusy(provider);
    setError(null);

    try {
      const supabase = createBrowserSupabaseClient();
      const { error: signInError } = await supabase.auth.signInWithOAuth({
        options: { redirectTo: callbackUrl(returnTo) },
        provider,
      });

      if (signInError) {
        setError(`We could not continue with ${provider === "google" ? "Google" : "Facebook"}.`);
        setProviderBusy(null);
      }
    } catch (signInError) {
      setError(configurationMessage(signInError));
      setProviderBusy(null);
    }
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
        <Link className={styles.backLink} href={returnTo}>
          <ArrowLeftIcon aria-hidden="true" />
          Back to discovery
        </Link>
      </header>

      <header className={styles.mobileHeader}>
        <Link aria-label="Go back" href={returnTo}>
          <ArrowLeftIcon aria-hidden="true" />
        </Link>
        <strong>Account</strong>
        <span aria-hidden="true" />
      </header>

      <div className={styles.page}>
        <h1>Account</h1>

        <div className={styles.layout}>
          <section className={styles.introduction} aria-labelledby="account-benefits-title">
            <div className={styles.mascotField} aria-hidden="true">
              <MascotMark priority />
            </div>
            <h2 id="account-benefits-title">Save your food finds</h2>
            <p>Sign in to keep favorites, wheel lists, and updates across devices.</p>

            <ul className={styles.benefits}>
              {BENEFITS.map(({ icon: Icon, label }) => (
                <li key={label}>
                  <span aria-hidden="true" className={styles.benefitIcon}>
                    <Icon />
                  </span>
                  {label}
                </li>
              ))}
            </ul>

            <div className={styles.privacyNote}>
              <ShieldCheckIcon aria-hidden="true" />
              <span className={styles.privacyCopy}>
                We don&apos;t link your location or discovery history to your account.
              </span>
            </div>
          </section>

          <section className={styles.signInCard} aria-labelledby="sign-in-title">
            <h2 id="sign-in-title">Sign in or create an account</h2>

            {!online ? (
              <p className={styles.offlineMessage} role="status">
                You are offline. Reconnect to sign in.
              </p>
            ) : null}

            {emailSent ? (
              <div className={styles.emailConfirmation} role="status">
                <span aria-hidden="true" className={styles.confirmationIcon}>
                  <EnvelopeSimpleIcon weight="bold" />
                </span>
                <div>
                  <strong>Check your email</strong>
                  <p>
                    If the address can receive mail, a one-time sign-in link is on its way. It
                    expires in 10 minutes.
                  </p>
                  <button onClick={() => setEmailSent(false)} type="button">
                    Use a different email
                  </button>
                </div>
              </div>
            ) : (
              <form className={styles.emailForm} onSubmit={requestMagicLink}>
                <label htmlFor="account-email">Personal email</label>
                <input
                  autoComplete="email"
                  disabled={busy}
                  id="account-email"
                  inputMode="email"
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="you@example.com"
                  required
                  type="email"
                  value={email}
                />
                <button disabled={busy || !online} type="submit">
                  {emailBusy ? (
                    <SpinnerGapIcon aria-hidden="true" className={styles.spinner} />
                  ) : (
                    <EnvelopeSimpleIcon aria-hidden="true" />
                  )}
                  {emailBusy ? "Sending link" : "Email me a sign-in link"}
                </button>
                <small>No password needed. The link expires in 10 minutes.</small>
              </form>
            )}

            <div className={styles.divider}>
              <span>or continue with</span>
            </div>

            <div className={styles.providers}>
              {PROVIDERS.map(({ icon: Icon, label, provider }) => (
                <button
                  disabled={busy || !online}
                  key={provider}
                  onClick={() => startProviderSignIn(provider)}
                  type="button"
                >
                  {providerBusy === provider ? (
                    <SpinnerGapIcon aria-hidden="true" className={styles.spinner} />
                  ) : (
                    <Icon aria-hidden="true" weight="bold" />
                  )}
                  {providerBusy === provider ? "Opening provider" : label}
                </button>
              ))}
            </div>

            <p className={styles.providerNote}>
              Using a different sign-in option may create a separate account.
            </p>

            {error ? (
              <p className={styles.errorMessage} role="alert">
                {error}
              </p>
            ) : null}

            <div className={styles.legalLinks}>
              <button onClick={() => setNotice("privacy")} type="button">
                Privacy notice
              </button>
              <span aria-hidden="true">|</span>
              <button onClick={() => setNotice("terms")} type="button">
                Terms
              </button>
            </div>
          </section>
        </div>
      </div>

      <div className={styles.mobileNavigation}>
        <DiscoveryNavigation activeDestination="Account" accountReturnTo={returnTo} />
      </div>

      {notice ? (
        <div className={styles.noticeBackdrop} role="presentation">
          <section
            aria-labelledby="account-notice-title"
            aria-modal="true"
            className={styles.noticeDialog}
            role="dialog"
          >
            <button
              aria-label="Close notice"
              className={styles.noticeClose}
              onClick={() => setNotice(null)}
              type="button"
            >
              <XIcon aria-hidden="true" />
            </button>
            <h2 id="account-notice-title">
              {notice === "privacy" ? "Account privacy" : "Beta terms status"}
            </h2>
            <p>
              {notice === "privacy"
                ? "Your account supports saved places, saved wheel lists, and update submissions. Precise location and discovery history are not attached to it. A complete privacy notice is required before external beta use."
                : "The private-beta terms are not published yet. Real accounts must not be opened to external users until the approved terms and privacy notice are available."}
            </p>
            <button className={styles.noticeAction} onClick={() => setNotice(null)} type="button">
              Got it
            </button>
          </section>
        </div>
      ) : null}
    </main>
  );
}
