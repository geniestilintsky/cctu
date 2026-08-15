import Link from 'next/link';
import { PLATFORM, UPLOAD_VERIFIED_POINTS } from '@/lib/config';
import { PageHeader, Callout } from '@/components/ui/primitives';

export const metadata = {
  title: 'Content & academic policy',
  description:
    'Upload rules, copyright takedown process, points and grade-boost policy, and how personal data is handled.',
};

const SECTIONS = [
  {
    id: 'uploads',
    title: 'What may be uploaded',
    body: [
      'Upload only material you have the right to share: your own notes and solutions, materials a lecturer has released to the class, or past examination papers the department has made public.',
      'Do not upload commercial textbooks, publisher solution manuals, or anyone else’s thesis without written permission. Do not upload live examination content.',
      'Lecturer and teaching-assistant uploads publish immediately. Student uploads are reviewed by the platform administrator before they appear, and a reason is sent back if one is rejected.',
    ],
  },
  {
    id: 'takedown',
    title: 'Reporting content & takedowns',
    body: [
      'Every material page carries a “Report this content” link. Reports go straight to the platform administrator and identify the material, the reason and, optionally, your contact details.',
      'Rights-holders may also write to the support address below. Where a claim is credible the material is unpublished while it is investigated.',
      'Liability for uploaded content, and the final takedown authority, rest with the university under the agreement governing this platform.',
    ],
  },
  {
    id: 'points',
    title: 'Points and grade boosts',
    body: [
      `Students earn ${UPLOAD_VERIFIED_POINTS} points when an upload is verified. A lecturer or teaching assistant may also award points after a student purchases a paid material for their course. Neither is automatic.`,
      'Points are a record of contribution. They are not a grade and this platform never changes a grade.',
      'A student may ask the lecturer of a specific course to consider their points. The lecturer approves or rejects each request individually, and any adjustment they choose to make is applied by them, in the university’s own systems, under the academic policy in force.',
      'The maximum permitted effect of any boost must be set and approved by the academic board before this feature is used in a live semester. The platform recommends a cap in the region of 2–3%.',
    ],
  },
  {
    id: 'privacy',
    title: 'Personal data',
    body: [
      'We store your name, email, optional phone number and optional index number. The index number is only requested when you want to redeem points, because your lecturer needs it to identify you.',
      'Email addresses and phone numbers are used to send account emails, receipts and the course announcements you have subscribed to. You can unsubscribe from any course or lecturer at any time from your dashboard.',
      'Card details are never seen or stored by this platform — payments are handled entirely by Paystack.',
    ],
  },
  {
    id: 'refunds',
    title: 'Payments and refunds',
    body: [
      'A one-time unlock gives you permanent access to that material from your dashboard. A Semester Pass unlocks every paid material for its stated duration and does not renew silently.',
      'If a paid material is materially not what it claims to be — wrong course, unreadable, or duplicated — report it and the purchase will be refunded or credited.',
    ],
  },
];

export default function PolicyPage() {
  return (
    <div className="container-page max-w-3xl py-14">
      <PageHeader
        title="Content & academic policy"
        description={`How ${PLATFORM.name} handles uploads, copyright, points and personal data.`}
      />

      <Callout tone="warn" title="Draft pending university sign-off">
        This policy is written to be adopted by {PLATFORM.university}. The points
        cap, upload-liability position and revenue terms all need formal approval
        before launch.
      </Callout>

      <nav className="mt-8 flex flex-wrap gap-2">
        {SECTIONS.map((s) => (
          <a
            key={s.id}
            href={`#${s.id}`}
            className="rounded-lg border border-ink-200 px-3 py-1.5 text-xs font-medium text-ink-600 hover:border-brand-300 hover:bg-brand-50 hover:text-brand-700"
          >
            {s.title}
          </a>
        ))}
      </nav>

      <div className="mt-10 space-y-12">
        {SECTIONS.map((s) => (
          <section key={s.id} id={s.id} className="scroll-mt-24">
            <h2 className="font-display text-xl font-semibold text-ink-900">
              {s.title}
            </h2>
            <div className="mt-3 space-y-3">
              {s.body.map((p, i) => (
                <p key={i} className="leading-relaxed text-ink-700">
                  {p}
                </p>
              ))}
            </div>
          </section>
        ))}
      </div>

      <div className="mt-14 rounded-xl border border-ink-200 bg-ink-50 p-5 text-sm text-ink-600">
        <p className="font-medium text-ink-900">Contact</p>
        <p className="mt-1">
          Rights claims, corrections and account questions:{' '}
          <a
            href={`mailto:${PLATFORM.supportEmail}`}
            className="font-medium text-brand-700 hover:underline"
          >
            {PLATFORM.supportEmail}
          </a>
        </p>
        <Link
          href="/browse"
          className="mt-3 inline-block font-medium text-brand-700 hover:underline"
        >
          ← Back to the library
        </Link>
      </div>
    </div>
  );
}
