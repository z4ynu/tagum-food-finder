import { EnvironmentConfigurationError } from "./public-env";

export type AppEnvironment = "local" | "production" | "staging";

export type DeploymentIdentity = Readonly<{
  environment: AppEnvironment;
  supabaseProjectRef: string;
}>;

type DeploymentEnvironment = Readonly<{
  APP_ENVIRONMENT?: string;
  SUPABASE_PROJECT_REF?: string;
  supabaseUrl: string;
}>;

const hostedProjectRefPattern = /^[a-z0-9]{20}$/;

function parseEnvironment(value: string | undefined): AppEnvironment {
  if (value === "local" || value === "staging" || value === "production") {
    return value;
  }

  throw new EnvironmentConfigurationError("APP_ENVIRONMENT must be local, staging, or production.");
}

export function parseDeploymentIdentity(environment: DeploymentEnvironment): DeploymentIdentity {
  const appEnvironment = parseEnvironment(environment.APP_ENVIRONMENT?.trim());
  const projectRef = environment.SUPABASE_PROJECT_REF?.trim();

  if (!projectRef) {
    throw new EnvironmentConfigurationError("SUPABASE_PROJECT_REF is required on the server.");
  }

  const url = new URL(environment.supabaseUrl);
  const isLocalHost = ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname);

  if (appEnvironment === "local") {
    if (!isLocalHost || projectRef !== "local") {
      throw new EnvironmentConfigurationError(
        "The local environment must use a localhost Supabase URL and the local project reference.",
      );
    }
  } else {
    if (!hostedProjectRefPattern.test(projectRef)) {
      throw new EnvironmentConfigurationError(
        "Hosted SUPABASE_PROJECT_REF must be the 20-character project reference.",
      );
    }

    if (url.hostname !== `${projectRef}.supabase.co`) {
      throw new EnvironmentConfigurationError(
        "SUPABASE_PROJECT_REF does not match NEXT_PUBLIC_SUPABASE_URL.",
      );
    }
  }

  return {
    environment: appEnvironment,
    supabaseProjectRef: projectRef,
  };
}
