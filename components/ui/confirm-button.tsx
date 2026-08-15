'use client';

import { useFormStatus } from 'react-dom';
import { cn } from '@/lib/utils';

/** Submit button that asks for confirmation before firing a destructive action. */
export default function ConfirmButton({
  children,
  message,
  className = 'btn-outline btn-sm',
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { message: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending || props.disabled}
      className={cn(className)}
      onClick={(e) => {
        if (!window.confirm(message)) e.preventDefault();
      }}
      {...props}
    >
      {children}
    </button>
  );
}
