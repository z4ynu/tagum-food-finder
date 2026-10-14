import type { Metadata } from "next";

import { AccountSignIn } from "@/components/account/account-sign-in";
import { AccountSignedIn } from "@/components/account/account-signed-in";
import { accountEmailLabel, accountProviderLabel } from "@/platform/auth/account-identity";
import { safeAuthReturnPath } from "@/platform/auth/return-path";
import { createServerSupabaseClient } from "@/platform/supabase/server";

export const metadata: Metadata = {
  title: "Account | Asa Ta Mangaon?",
  description: "Manage saved food places, wheel lists, privacy, and account access.",
};

type AccountPageProps = Readonly<{
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}>;

function firstValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

async function authenticatedAccount() {
  try {
    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase.auth.getUser();

    if (error || !data.user) {
      return null;
    }

    return {
      email: accountEmailLabel(data.user.email),
      provider: accountProviderLabel(data.user.app_metadata.provider),
    };
  } catch {
    return null;
  }
}

export default async function AccountPage({ searchParams }: AccountPageProps) {
  const parameters = await searchParams;
  const returnTo = safeAuthReturnPath(firstValue(parameters.returnTo));
  const initialError = firstValue(parameters.error) === "signin_failed";
  const previewSignedIn =
    process.env.NODE_ENV !== "production" && firstValue(parameters.preview) === "signed-in";

  if (previewSignedIn) {
    return (
      <AccountSignedIn email="juan@example.com" preview provider="Google" returnTo={returnTo} />
    );
  }

  const account = await authenticatedAccount();

  if (account) {
    return <AccountSignedIn {...account} returnTo={returnTo} />;
  }

  return <AccountSignIn initialError={initialError} returnTo={returnTo} />;
}
