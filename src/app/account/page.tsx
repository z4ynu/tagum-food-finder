import type { Metadata } from "next";

import { AccountSignIn } from "@/components/account/account-sign-in";
import { safeAuthReturnPath } from "@/platform/auth/return-path";

export const metadata: Metadata = {
  title: "Account | Asa Ta Mangaon?",
  description: "Sign in to save favorite places, wheel lists, and community updates.",
};

type AccountPageProps = Readonly<{
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}>;

function firstValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function AccountPage({ searchParams }: AccountPageProps) {
  const parameters = await searchParams;
  const returnTo = safeAuthReturnPath(firstValue(parameters.returnTo));
  const initialError = firstValue(parameters.error) === "signin_failed";

  return <AccountSignIn initialError={initialError} returnTo={returnTo} />;
}
