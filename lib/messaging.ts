import { PLATFORM } from './config';

/**
 * Channel-agnostic outbound messaging.
 *
 * Announcements/notifications are handed to every *enabled* channel. Email is
 * live today (Resend, or console in dev). WhatsApp is Phase 2 — the channel
 * below is already wired into the fan-out, so enabling it is a matter of
 * providing credentials, with no change to the Announcement model or callers.
 */

export type Recipient = {
  name?: string | null;
  email?: string | null;
  phone?: string | null;
};

export type Message = {
  subject: string;
  html: string;
  text: string;
};

export interface MessageChannel {
  readonly name: string;
  enabled(): boolean;
  send(recipient: Recipient, message: Message): Promise<boolean>;
}

const emailChannel: MessageChannel = {
  name: 'email',
  enabled: () => true, // falls back to console logging without an API key
  async send(recipient, message) {
    if (!recipient.email) return false;
    const from = process.env.EMAIL_FROM || `${PLATFORM.name} <no-reply@localhost>`;

    if (!process.env.RESEND_API_KEY) {
      console.info(
        `\n[email:dev] to=${recipient.email}\n  subject: ${message.subject}\n  ${message.text.slice(0, 400)}\n`
      );
      return true;
    }

    try {
      const { Resend } = await import('resend');
      const resend = new Resend(process.env.RESEND_API_KEY);
      await resend.emails.send({
        from,
        to: recipient.email,
        subject: message.subject,
        html: message.html,
        text: message.text,
      });
      return true;
    } catch (err) {
      console.error('[email] send failed', err);
      return false;
    }
  },
};

const whatsappChannel: MessageChannel = {
  name: 'whatsapp',
  // Phase 2 — flip on by setting WHATSAPP_TOKEN + WHATSAPP_PHONE_ID.
  enabled: () =>
    Boolean(process.env.WHATSAPP_TOKEN && process.env.WHATSAPP_PHONE_ID),
  async send(recipient, message) {
    if (!recipient.phone) return false;
    try {
      const res = await fetch(
        `https://graph.facebook.com/v20.0/${process.env.WHATSAPP_PHONE_ID}/messages`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            messaging_product: 'whatsapp',
            to: recipient.phone,
            type: 'text',
            text: { body: `${message.subject}\n\n${message.text}` },
          }),
        }
      );
      return res.ok;
    } catch (err) {
      console.error('[whatsapp] send failed', err);
      return false;
    }
  },
};

export const channels: MessageChannel[] = [emailChannel, whatsappChannel];

export async function dispatch(recipients: Recipient[], message: Message) {
  const active = channels.filter((c) => c.enabled());
  const results = await Promise.all(
    recipients.map(async (recipient) => {
      const sent = await Promise.all(
        active.map((c) => c.send(recipient, message).catch(() => false))
      );
      return sent.some(Boolean);
    })
  );
  return { delivered: results.filter(Boolean).length, total: recipients.length };
}

export async function sendToOne(recipient: Recipient, message: Message) {
  return dispatch([recipient], message);
}

/** Minimal branded email shell — inline styles only, for mail-client safety. */
export function renderEmail(opts: {
  heading: string;
  body: string;
  ctaLabel?: string;
  ctaUrl?: string;
  footnote?: string;
}) {
  const base = process.env.NEXTAUTH_URL || 'http://localhost:3000';
  const cta =
    opts.ctaLabel && opts.ctaUrl
      ? `<p style="margin:28px 0 8px"><a href="${
          opts.ctaUrl.startsWith('http') ? opts.ctaUrl : base + opts.ctaUrl
        }" style="background:#1580DE;color:#fff;text-decoration:none;padding:12px 22px;border-radius:8px;font-weight:600;display:inline-block">${
          opts.ctaLabel
        }</a></p>`
      : '';
  return `<!doctype html><html><body style="margin:0;background:#F7F8FA;font-family:Segoe UI,Helvetica,Arial,sans-serif;color:#171C28">
  <div style="max-width:560px;margin:0 auto;padding:32px 20px">
    <div style="border-top:4px solid #FFC907;background:#fff;border-radius:12px;padding:28px;box-shadow:0 1px 3px rgba(0,0,0,.06)">
      <p style="margin:0 0 4px;font-size:12px;letter-spacing:.08em;text-transform:uppercase;color:#6B7688">${PLATFORM.name}</p>
      <h1 style="margin:0 0 16px;font-size:20px;line-height:1.3">${opts.heading}</h1>
      <div style="font-size:15px;line-height:1.6;color:#41495A">${opts.body}</div>
      ${cta}
    </div>
    <p style="font-size:12px;color:#8F99AC;text-align:center;margin-top:20px">
      ${opts.footnote || `${PLATFORM.university} · ${PLATFORM.name}`}
    </p>
  </div></body></html>`;
}
