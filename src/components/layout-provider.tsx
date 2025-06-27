
'use client';

import * as React from 'react';
import { usePathname } from 'next/navigation';
import { AdminHeader } from '@/components/admin-header';
import { SiteHeader } from '@/components/site-header';

export function LayoutProvider({
  children,
  footer
}: {
  children: React.ReactNode;
  footer: React.ReactNode;
}) {
  const pathname = usePathname();
  const isAdminPage = pathname.startsWith('/admin');
  const HeaderComponent = isAdminPage ? AdminHeader : SiteHeader;

  React.useEffect(() => {
    // Apply the theme class to the html element
    if (isAdminPage) {
      document.documentElement.classList.add('theme-admin');
    } else {
      document.documentElement.classList.remove('theme-admin');
    }

  }, [isAdminPage]);

  return (
    <div className="relative flex min-h-screen flex-col">
      <HeaderComponent />
      <main className="flex-1">{children}</main>
      {!isAdminPage && footer}
    </div>
  );
}
