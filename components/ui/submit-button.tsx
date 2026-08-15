'use client';

import { useFormStatus } from 'react-dom';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * The label swap is blurred rather than snapped. Without it you see two
 * distinct strings cross-fading; the blur blends them into one transformation.
 * The spinner runs fast (0.7s) — a quicker spinner reads as a quicker app.
 */
export default function SubmitButton({
  children,
  className = 'btn-primary',
  pendingLabel,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { pendingLabel?: string }) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending || props.disabled}
      aria-busy={pending}
      className={cn(className, 'disabled:opacity-70')}
      {...props}
    >
      <span
        className={cn(
          'inline-flex items-center gap-2 transition-[filter,opacity] duration-200 ease-out',
          pending && 'opacity-90 [filter:blur(0.4px)]'
        )}
      >
        {pending && (
          <Loader2
            className="h-4 w-4 animate-spin [animation-duration:0.7s]"
            aria-hidden
          />
        )}
        {pending ? pendingLabel ?? children : children}
      </span>
    </button>
  );
}
