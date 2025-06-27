"use client";

import CouponTracker from '@/components/coupon-tracker';
import { useModal } from '@/hooks/use-modal';
import { useSearchParams, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import type { Coupon } from '@/lib/types';


export default function CouponsPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { onOpen } = useModal();

  useEffect(() => {
    const couponData = searchParams.get('couponData');
    if (couponData) {
      try {
        const parsedCoupon: Coupon = JSON.parse(decodeURIComponent(couponData));
        if (parsedCoupon) {
          // Open the modal once on page load
          onOpen('coupon', { coupon: parsedCoupon });

          // Clean up the URL using the Next.js router to prevent loops
          const current = new URLSearchParams(Array.from(searchParams.entries()));
          current.delete('couponData');
          const search = current.toString();
          const query = search ? `?${search}` : "";
          router.replace(`${window.location.pathname}${query}`);
        }
      } catch (error) {
        console.error("Failed to parse coupon data from URL", error);
      }
    }
  }, [searchParams, onOpen, router]);

  return (
    <div className="p-4 md:p-8">
      <header className="text-left mb-8">
        <h1 className="text-xl font-bold font-headline text-primary">Rakuten Coupon Tracker</h1>
        <p className="text-base text-muted-foreground mt-2">
          Search and view available coupon data from advertisers.
        </p>
      </header>
      <CouponTracker />
    </div>
  );
}
