export { HttpCore } from "./http.js";
export type { ClientOptions } from "./http"; // or ./config if that's where it lives

// Resource clients
export { SessionsClient } from "./resources/sessions.js";
export { LocationsClient } from "./resources/locations.js";
export { VerificationsClient } from "./resources/verifications.js";

// Error type
export { ApiError } from "./error.js";

// Commonly used types from the generated map (optional but nice)
export type {
  CreateSessionBody,
  EmailVerificationPost,
  PublicLocation,
  PrivateLocation,
  AccessToken
} from "./generated/map.js";