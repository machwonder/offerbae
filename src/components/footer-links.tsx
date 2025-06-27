'use client';

import { useModal } from '@/hooks/use-modal';

export function FooterLinks() {
  const { onOpen } = useModal();

  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-foreground">Legal</h3>
      <ul className="space-y-2 text-sm">
        <li>
          <button
            onClick={() => onOpen('privacyPolicy')}
            className="text-muted-foreground hover:text-primary hover:underline"
          >
            Privacy Policy
          </button>
        </li>
        <li>
          <button
            onClick={() => onOpen('termsOfService')}
            className="text-muted-foreground hover:text-primary hover:underline"
          >
            Terms of Service
          </button>
        </li>
      </ul>
    </div>
  );
}
