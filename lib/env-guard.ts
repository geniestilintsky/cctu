/**
 * Startup environment guard.
 *
 * The integrations in this app deliberately degrade to local stand-ins when
 * their keys are missing (see README) — which is right for development and
 * dangerous in production. With no Paystack key the app serves a *simulated*
 * checkout and accepts unsigned webhooks, so a keyless production deploy gives
 * every paid material away for free.
 *
 * Nothing in the code prevented that deploy, so this runs at boot: fatal
 * problems throw and stop the server starting. Failing to start is the point —
 * it is strictly better than silently serving a broken payment wall.
 */

type Problem = { key: string; detail: string };

const DEV_SECRET_PLACEHOLDER =
  'dev-only-secret-please-replace-with-openssl-rand-base64-32';

export function collectEnvProblems(env: NodeJS.ProcessEnv = process.env) {
  const fatal: Problem[] = [];
  const warnings: Problem[] = [];

  if (!env.PAYSTACK_SECRET_KEY) {
    fatal.push({
      key: 'PAYSTACK_SECRET_KEY',
      detail:
        'missing — checkout would fall back to the simulated sandbox and the webhook would accept unsigned requests, unlocking paid material for free.',
    });
  } else if (env.PAYSTACK_SECRET_KEY.startsWith('sk_test_')) {
    warnings.push({
      key: 'PAYSTACK_SECRET_KEY',
      detail:
        'is a TEST key. Paystack test cards cost nothing, so paid material is effectively free. Use a live key for real traffic.',
    });
  }

  if (!env.NEXTAUTH_SECRET) {
    fatal.push({
      key: 'NEXTAUTH_SECRET',
      detail: 'missing — session tokens cannot be signed.',
    });
  } else if (env.NEXTAUTH_SECRET === DEV_SECRET_PLACEHOLDER) {
    fatal.push({
      key: 'NEXTAUTH_SECRET',
      detail:
        'is still the development placeholder. Anyone who has read this repository can forge a SUPER_ADMIN session. Generate one with: openssl rand -base64 32',
    });
  }

  if (!env.NEXTAUTH_URL) {
    fatal.push({ key: 'NEXTAUTH_URL', detail: 'missing — payment callbacks would resolve to the wrong host.' });
  } else if (!env.NEXTAUTH_URL.startsWith('https://')) {
    fatal.push({
      key: 'NEXTAUTH_URL',
      detail: `is "${env.NEXTAUTH_URL}" — production must be https, or session cookies are sent in the clear.`,
    });
  }

  // Warnings: real problems, but the app still functions correctly.
  const r2Configured =
    env.R2_ACCOUNT_ID && env.R2_ACCESS_KEY_ID && env.R2_SECRET_ACCESS_KEY && env.R2_BUCKET;
  if (!r2Configured) {
    warnings.push({
      key: 'R2_*',
      detail:
        'not configured — uploads are written to local disk, which is lost on redeploy and invisible to other instances.',
    });
  }

  if (!env.RESEND_API_KEY) {
    warnings.push({
      key: 'RESEND_API_KEY',
      detail: 'not configured — receipts and notifications are only printed to the server log.',
    });
  }

  return { fatal, warnings };
}

/** Throws in production when a fatal misconfiguration is present. */
export function assertProductionEnv(env: NodeJS.ProcessEnv = process.env) {
  if (env.NODE_ENV !== 'production') return;

  const { fatal, warnings } = collectEnvProblems(env);

  for (const w of warnings) {
    console.warn(`[env] warning: ${w.key} ${w.detail}`);
  }

  if (fatal.length > 0) {
    const lines = fatal.map((f) => `  - ${f.key} ${f.detail}`).join('\n');
    throw new Error(
      `Refusing to start in production — ${fatal.length} unsafe environment setting(s):\n${lines}\n` +
        'Fix these in the deployment environment, then redeploy.'
    );
  }
}
