
"use client";

import Image from 'next/image';
import Link from 'next/link';
import type { AdvertiserDetails } from '@/lib/types';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { getLogoUrl, slugify } from '@/lib/utils';
import { Store } from 'lucide-react';

interface BrandCardProps {
    brand: AdvertiserDetails;
}

export default function BrandCard({ brand }: BrandCardProps) {
    const logoUrl = getLogoUrl(brand.url);
    const brandPageUrl = `/brand/${brand.id}-${slugify(brand.name)}`;

    return (
        <Link href={brandPageUrl} className="group block h-full">
            <Card className="transition-all hover:shadow-lg hover:-translate-y-1 h-full flex flex-col">
                <CardContent className="p-4 flex items-center gap-4 flex-grow">
                    <div className="relative w-16 h-16 flex-shrink-0 flex items-center justify-center bg-white border rounded-lg p-1">
                        {logoUrl ? (
                            <Image
                                src={logoUrl}
                                alt={`${brand.name} Logo`}
                                fill
                                sizes="64px"
                                className="object-contain"
                            />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center bg-muted rounded-lg">
                                <Store className="h-8 w-8 text-muted-foreground" />
                            </div>
                        )}
                    </div>
                    <div className="flex flex-col items-start gap-2">
                        <h3 className="font-bold text-base text-foreground">{brand.name}</h3>
                         {brand.categories && brand.categories.length > 0 && (
                            <div className="flex flex-wrap gap-1 justify-start">
                                {brand.categories.slice(0, 3).map(category => (
                                    <Badge key={category} variant="secondary">{category}</Badge>
                                ))}
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>
        </Link>
    );
}
