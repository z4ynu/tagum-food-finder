export type AuthenticatedUserResult = Readonly<{
  data: Readonly<{ user: Readonly<{ id: string }> | null }>;
  error: unknown | null;
}>;

export class AuthenticationRequiredError extends Error {
  constructor() {
    super("Authentication is required.");
    this.name = "AuthenticationRequiredError";
  }
}

export function requireAuthenticatedUserId(result: AuthenticatedUserResult): string {
  if (result.error || !result.data.user?.id) {
    throw new AuthenticationRequiredError();
  }

  return result.data.user.id;
}
