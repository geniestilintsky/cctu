'use client';

import { Sparkles, ExternalLink } from 'lucide-react';
import { trackAffiliateClick } from '@/app/actions/material-actions';

export type AffiliateOffer = {
  id: string;
  label: string;
  description: string | null;
  targetUrl: string;
};

/**
 * Contextual affiliate placement (§5.6). Shown after a download, or on the
 * material page for the "material-page" placement. Clicks are counted
 * server-side; conversions arrive via /api/affiliate/postback.
 */
export default function AffiliateCard({
  offer,
  tone = 'default',
}: {
  offer: AffiliateOffer;
  tone?: 'default' | 'inline';
}) {
  return (
    <a
      href={offer.targetUrl}
      target="_blank"
      rel="noopener noreferrer sponsored"
      onClick={() => {
        void trackAffiliateClick(offer.id);
      }}
      className={
        tone === 'inline'
          ? 'group flex items-start gap-3 rounded-lg border border-ink-200 bg-white p-3 transition-colors hover:border-brand-300 hover:bg-brand-50/40'
          : 'group flex items-start gap-3 rounded-xl border border-gold-300 bg-gold-50 p-4 transition-colors hover:border-gold-400 hover:bg-gold-100'
      }
    >
      <span className="mt-0.5 rounded-lg bg-white p-1.5 text-gold-600 shadow-sm">
        <Sparkles className="h-4 w-4" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-1.5 font-medium text-ink-900">
          {offer.label}
          <ExternalLink className="h-3.5 w-3.5 text-ink-400 transition-transform group-hover:translate-x-0.5" />
        </span>
        {offer.description && (
          <span className="mt-0.5 block text-sm text-ink-600">
            {offer.description}
          </span>
        )}
        <span className="mt-1 block text-[11px] uppercase tracking-wide text-ink-400">
          Sponsored
        </span>
      </span>
    </a>
  );
}
