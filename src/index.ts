export { HttpCore } from "./http";
export type { ClientOptions } from "./http"; // or ./config if that's where it lives

// Resource clients
export { SessionsClient } from "./resources/sessions";
export { LocationsClient } from "./resources/locations";
export { VerificationsClient } from "./resources/verifications";

// Error type
export { ApiError } from "./error";

// Commonly used types from the generated map (optional but nice)
export type {
  CreateSessionBody,
  EmailVerificationPost,
  PublicLocation,
  PrivateLocation,
  AccessToken
} from "./generated/map";