/**
 * Next.js runs this once when the server process boots, before it serves any
 * request — the only place a misconfigured production deploy can be stopped
 * rather than discovered by a user.
 */
export async function register() {
  // Skip the edge runtime: middleware has no access to the server-only vars.
  if (process.env.NEXT_RUNTIME !== 'nodejs') return;

  const { assertProductionEnv } = await import('./lib/env-guard');
  assertProductionEnv();
}
