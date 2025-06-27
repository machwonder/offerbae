"use client";

import type { AdvertiserDetails, RakutenApiResponse } from '@/lib/types';
import BrandCard from './brand-card';

interface BrandListProps {
    initialData: RakutenApiResponse;
}

export default function BrandList({ initialData }: BrandListProps) {
    return (
        <div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {initialData.advertisers.map(brand => (
                    <BrandCard key={brand.id} brand={brand} />
                ))}
            </div>
        </div>
    );
}
