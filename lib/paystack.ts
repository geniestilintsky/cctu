import crypto from 'crypto';

/**
 * Paystack integration (cards + MTN/Vodafone/AirtelTigo Mobile Money).
 *
 * With PAYSTACK_SECRET_KEY set, initialize() calls the real API and the user is
 * redirected to Paystack's checkout. Without a key the module runs in *sandbox*
 * mode: it returns a local URL that resolves the payment through the same
 * webhook handler, so the entire purchase/subscription flow is testable offline.
 */

const API = 'https://api.paystack.co';

export function isLive() {
  return Boolean(process.env.PAYSTACK_SECRET_KEY);
}

export type InitOptions = {
  email: string;
  /** Major units (GHS). Converted to pesewas for Paystack. */
  amount: number;
  reference: string;
  callbackUrl: string;
  metadata?: Record<string, unknown>;
};

export async function initializeTransaction(opts: InitOptions): Promise<{
  authorizationUrl: string;
  reference: string;
  sandbox: boolean;
}> {
  if (!isLive()) {
    const url = new URL(
      '/checkout/sandbox',
      process.env.NEXTAUTH_URL || 'http://localhost:3000'
    );
    url.searchParams.set('reference', opts.reference);
    return { authorizationUrl: url.toString(), reference: opts.reference, sandbox: true };
  }

  const res = await fetch(`${API}/transaction/initialize`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email: opts.email,
      amount: Math.round(opts.amount * 100),
      currency: 'GHS',
      reference: opts.reference,
      callback_url: opts.callbackUrl,
      channels: ['card', 'mobile_money', 'bank_transfer'],
      metadata: opts.metadata,
    }),
  });

  const json = await res.json();
  if (!res.ok || !json.status) {
    throw new Error(json?.message || 'Paystack initialisation failed');
  }
  return {
    authorizationUrl: json.data.authorization_url,
    reference: json.data.reference,
    sandbox: false,
  };
}

export async function verifyTransaction(reference: string) {
  if (!isLive()) {
    return { status: 'success' as const, amount: null, raw: { sandbox: true } };
  }
  const res = await fetch(`${API}/transaction/verify/${encodeURIComponent(reference)}`, {
    headers: { Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}` },
    cache: 'no-store',
  });
  const json = await res.json();
  if (!res.ok || !json.status) throw new Error(json?.message || 'Verification failed');
  return {
    status: json.data.status as 'success' | 'failed' | 'abandoned',
    amount: json.data.amount / 100,
    raw: json.data,
  };
}

/** Paystack signs webhooks with HMAC-SHA512 of the raw body using the secret key. */
export function verifyWebhookSignature(rawBody: string, signature: string | null) {
  const secret =
    process.env.PAYSTACK_WEBHOOK_SECRET || process.env.PAYSTACK_SECRET_KEY;
  if (!secret) return true; // sandbox mode
  if (!signature) return false;
  const hash = crypto.createHmac('sha512', secret).update(rawBody).digest('hex');
  return hash === signature;
}

export function newReference(prefix: 'mat' | 'sub') {
  return `${prefix}_${Date.now().toString(36)}_${crypto.randomBytes(5).toString('hex')}`;
}
