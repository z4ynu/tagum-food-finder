const PROVIDER_LABELS = {
  email: "Personal email",
  facebook: "Facebook",
  google: "Google",
} as const;

export function accountProviderLabel(provider: unknown): string {
  if (typeof provider !== "string") {
    return PROVIDER_LABELS.email;
  }

  return PROVIDER_LABELS[provider as keyof typeof PROVIDER_LABELS] ?? PROVIDER_LABELS.email;
}

export function accountEmailLabel(email: unknown): string {
  if (typeof email !== "string" || !email.trim()) {
    return "Email unavailable";
  }

  return email.trim();
}
