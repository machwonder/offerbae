
"use client";

import { useEffect } from 'react';
import { redirect } from 'next/navigation';

export default function DeprecatedCouponsPage() {
  useEffect(() => {
    redirect('/admin/coupons');
  }, []);

  return null;
}
