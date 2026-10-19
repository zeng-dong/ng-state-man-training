/**
 * Each "system" lives at its own origin. MSW intercepts the made-up ones, so nothing leaves the
 * browser (and nothing enforces CORS, which real ones would). `api` is real (src/Backend): what
 * remembers is real, so holds and prefs live there, and requests to it pass through.
 */
export const origins = {
  catalog: 'https://catalog.hypertheory-labs.dev',
  circulation: 'https://circulation.hypertheory-labs.dev',
  branches: 'https://branches.hypertheory-labs.dev',
  reviews: 'https://reviews.hypertheory-labs.dev',
  api: 'http://localhost:5261',
} as const;
