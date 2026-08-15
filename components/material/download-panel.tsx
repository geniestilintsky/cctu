'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Download, Lock, LogIn, CheckCircle2 } from 'lucide-react';
import AffiliateCard, { AffiliateOffer } from './affiliate-card';
import { formatMoney } from '@/lib/utils';

export default function DownloadPanel({
  materialId,
  fileUrl,
  isFree,
  price,
  access,
  offers,
}: {
  materialId: string;
  fileUrl: string;
  isFree: boolean;
  price: number | string | null;
  access: 'FREE' | 'PURCHASED' | 'SUBSCRIPTION' | 'STAFF' | 'LOGIN_REQUIRED' | 'PAYMENT_REQUIRED';
  offers: AffiliateOffer[];
}) {
  const [downloaded, setDownloaded] = useState(false);
  const canDownload = !['LOGIN_REQUIRED', 'PAYMENT_REQUIRED'].includes(access);

  return (
    <div className="space-y-4">
      {canDownload ? (
        <a
          href={fileUrl}
          download
          onClick={() => setDownloaded(true)}
          className="btn-primary w-full"
        >
          <Download className="h-4 w-4" />
          Download {isFree ? '— free' : ''}
        </a>
      ) : access === 'LOGIN_REQUIRED' ? (
        <Link
          href={`/auth/sign-in?callbackUrl=${encodeURIComponent(`/material/${materialId}`)}`}
          className="btn-primary w-full"
        >
          <LogIn className="h-4 w-4" />
          Sign in to unlock — {formatMoney(price)}
        </Link>
      ) : (
        <Link href={`/checkout?material=${materialId}`} className="btn-gold w-full">
          <Lock className="h-4 w-4" />
          Unlock for {formatMoney(price)}
        </Link>
      )}

      {access === 'PURCHASED' && (
        <p className="flex items-center gap-1.5 text-xs font-medium text-emerald-700">
          <CheckCircle2 className="h-3.5 w-3.5" /> You purchased this material
        </p>
      )}
      {access === 'SUBSCRIPTION' && (
        <p className="flex items-center gap-1.5 text-xs font-medium text-emerald-700">
          <CheckCircle2 className="h-3.5 w-3.5" /> Included in your Semester Pass
        </p>
      )}
      {access === 'PAYMENT_REQUIRED' && (
        <p className="text-center text-xs text-ink-500">
          or{' '}
          <Link href="/pricing" className="font-medium text-brand-700 hover:underline">
            get a Semester Pass
          </Link>{' '}
          for unlimited access
        </p>
      )}

      {downloaded && offers.length > 0 && (
        <div className="animate-fade-up space-y-2 border-t border-ink-100 pt-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-ink-500">
            Next step
          </p>
          {offers.map((offer) => (
            <AffiliateCard key={offer.id} offer={offer} />
          ))}
        </div>
      )}
    </div>
  );
}
